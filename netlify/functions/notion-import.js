// netlify/functions/notion-import.js
const {
  SUPABASE_URL, SUPABASE_SERVICE_ROLE,
  NOTION_TOKEN, NOTION_DB_MASTER,
  ADMIN_API_SECRET,
  ADMIN_ALLOWED_ORIGIN,       // CORS for admin
  ALLOWED_IMAGE_HOSTS         // optional allowlist for image hosts
} = process.env;

const CORS = {
  "Access-Control-Allow-Origin": ADMIN_ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-secret",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function json(status, body) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
}

const ALLOWED_IMG = (ALLOWED_IMAGE_HOSTS || "").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
function isSafeHttpUrl(u) {
  if (!u) return false;
  try {
    const url = new URL(String(u));
    if (!/^https?:$/.test(url.protocol)) return false;
    if (ALLOWED_IMG.length && !ALLOWED_IMG.includes(url.hostname.toLowerCase())) return false;
    return true;
  } catch { return false; }
}

/* -------------------- helpers -------------------- */
const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

const rt = (prop) =>
  (prop?.rich_text || prop?.title || [])
    .map((t) => t.plain_text)
    .join("")
    .trim();

const title = (prop) =>
  (prop?.title || []).map((t) => t.plain_text).join("").trim();

const sel = (prop) => prop?.select?.name || null;
const msel = (prop) => (prop?.multi_select || []).map((s) => s.name);
const chk = (prop) => !!prop?.checkbox;
const url = (prop) => prop?.url || null;
const fileFirstUrl = (prop) => {
  const f = (prop?.files || [])[0];
  if (!f) return null;
  if (f.type === "external") return f.external.url;
  if (f.type === "file") return f.file.url;
  return null;
};

// cached clients
let _sb, _notion;
async function sb() {
  if (_sb) return _sb;
  const { createClient } = await import("@supabase/supabase-js");
  _sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });
  return _sb;
}
async function notion() {
  if (_notion) return _notion;
  const { Client } = await import("@notionhq/client");
  _notion = new Client({ auth: NOTION_TOKEN });
  return _notion;
}

/** Admin guard: x-admin-secret atau Bearer is_admin */
async function requireAdmin(event) {
  const xadm = event.headers?.["x-admin-secret"] || event.headers?.["X-Admin-Secret"];
  if (xadm && ADMIN_API_SECRET && xadm === ADMIN_API_SECRET) return { via: "secret" };

  const s = await sb();
  const auth = event.headers?.authorization || event.headers?.Authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) throw new Error("forbidden");

  const { data: userData, error: uerr } = await s.auth.getUser(token);
  if (uerr || !userData?.user) throw new Error("invalid_token");

  const uid = userData.user.id;
  const { data: prof, error: perr } = await s.from("profiles").select("is_admin").eq("id", uid).maybeSingle();
  if (perr || !prof?.is_admin) throw new Error("forbidden");
  return { via: "bearer", uid };
}

// rate-limit ringan
const BUCKET = new Map();
function ratelimit(event, limit = 60, windowMs = 60_000) {
  const ip = event.headers?.["cf-connecting-ip"] || event.headers?.["x-forwarded-for"] || "0.0.0.0";
  const now = Date.now();
  const it = BUCKET.get(ip) ?? { c: 0, ts: now };
  if (now - it.ts > windowMs) { it.c = 0; it.ts = now; }
  it.c++; BUCKET.set(ip, it);
  if (it.c > limit) { const e = new Error("too_many_requests"); e.statusCode = 429; throw e; }
}

/** Ambil batch Notion (bukan semua) */
async function fetchNotionBatch(dbId, limit = 50, start_cursor) {
  const n = await notion();
  const res = await n.databases.query({
    database_id: dbId,
    page_size: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100),
    start_cursor,
  });
  return {
    results: res.results,
    nextCursor: res.has_more ? res.next_cursor : null,
  };
}

// ambil/auto-create kategori; dukung parent/child; idempotent saat race
async function getOrCreateCategory({ label, parentId = null }) {
  if (!label) return null;
  const s = await sb();
  const slug = slugify(label);

  let q = s.from("categories").select("id, slug, parent_id").eq("slug", slug);
  q = parentId ? q.eq("parent_id", parentId) : q.is("parent_id", null);

  const { data: rows, error } = await q.limit(1);
  if (error) throw error;
  if (rows?.length) return rows[0].id;

  try {
    const { data: ins } = await s
      .from("categories")
      .insert({ slug, label, parent_id: parentId || null, order_index: 0, is_active: true })
      .select()
      .single();
    return ins.id;
  } catch (e) {
    if (e.code === "23505") {
      const { data: again } = await s
        .from("categories")
        .select("id")
        .eq("slug", slug)
        [parentId ? "eq" : "is"]("parent_id", parentId || null)
        .maybeSingle();
      if (again?.id) return again.id;
    }
    throw e;
  }
}

function mapNotionRow(row) {
  const p = row.properties || {};

  // ID fallback ke page id agar legacy_id selalu ada (hindari duplikasi)
  const ID =
    rt(p["ID"]) ||
    title(p["ID"]) ||
    rt(p["Ai ID"]) ||
    row.id;

  const Question = rt(p["Question"]);
  const QuestionImageRaw =
    url(p["Question Image URL"]) || fileFirstUrl(p["Question Image"]);
  const QuestionImage = isSafeHttpUrl(QuestionImageRaw) ? QuestionImageRaw : null;

  const A = rt(p["Choice A"]);
  const B = rt(p["Choice B"]);
  const C = rt(p["Choice C"]);
  const D = rt(p["Choice D"]);

  const AiAraw = url(p["Choice Image A URL"]) || fileFirstUrl(p["Choice A Image"]);
  const AiBraw = url(p["Choice Image B URL"]) || fileFirstUrl(p["Choice B Image"]);
  const AiCraw = url(p["Choice Image C URL"]) || fileFirstUrl(p["Choice C Image"]);
  const AiDraw = url(p["Choice Image D URL"]) || fileFirstUrl(p["Choice D Image"]);
  const AiA = isSafeHttpUrl(AiAraw) ? AiAraw : null;
  const AiB = isSafeHttpUrl(AiBraw) ? AiBraw : null;
  const AiC = isSafeHttpUrl(AiCraw) ? AiCraw : null;
  const AiD = isSafeHttpUrl(AiDraw) ? AiDraw : null;

  const ExA = rt(p["Explanation A"]);
  const ExB = rt(p["Explanation B"]);
  const ExC = rt(p["Explanation C"]);
  const ExD = rt(p["Explanation D"]);

  const IcA = chk(p["isCorrect A"]);
  const IcB = chk(p["isCorrect B"]);
  const IcC = chk(p["isCorrect C"]);
  const IcD = chk(p["isCorrect D"]);

  const correctCount = [IcA, IcB, IcC, IcD].filter(Boolean).length;
  if (correctCount !== 1) {
    throw new Error(`[${row.id}] ${ID}: exactly one of isCorrect A/B/C/D must be checked`);
    // error membawa page_id → memudahkan n8n debug
  }
  const answer_key = IcA ? "A" : IcB ? "B" : IcC ? "C" : "D";
  const correctIdx = ({ A:0, B:1, C:2, D:3 })[answer_key];

  const Level = (sel(p["Level"]) || "").toLowerCase();
  const difficulty = ["easy", "medium", "hard"].includes(Level) ? Level : null;

  const Tags = (msel(p["Tags"]) || [])
    .map((t) => String(t).toLowerCase().trim())
    .filter(Boolean);

  const Source = rt(p["Source"]);

  // Aircraft: dukung select & multi-select → gabungkan dengan koma
  const AircraftSel  = sel(p["Aircraft"]) || sel(p["Ai"]);
  const AircraftMulti = msel(p["Aircraft"]);
  const Aircraft = (AircraftMulti && AircraftMulti.length
    ? AircraftMulti.join(",")
    : (AircraftSel || "")
  ).trim() || null;

  const Category = sel(p["Category"]);
  const Subcategory = sel(p["Subcategory"]); // opsional

  // optional Notion Status property (Draft/Published/Archived)
  const StatusRaw = sel(p["Status"]);
  const status = StatusRaw
    ? String(StatusRaw).toLowerCase()
      .replace("published","published")
      .replace("draft","draft")
      .replace("archived","archived")
    : "draft";
  const statusFinal = ["draft","published","archived"].includes(status) ? status : "draft";

  if (!Question) throw new Error(`[${row.id}] ${ID}: Question is empty`);
  if (!Category) throw new Error(`[${row.id}] ${ID}: Category is required`);

  // ensure choices minimal 2
  const choices = [A,B,C,D].map((x) => String(x || "").trim());
  const filled = choices.filter((c) => c.length > 0).length;
  if (filled < 2) throw new Error(`[${row.id}] ${ID}: at least two choices required`);

  // explanations array [A,B,C,D] + single explanation
  const explanationsArr = [ExA, ExB, ExC, ExD].map((x) => x || "");
  const explanationSingle = explanationsArr[correctIdx] || "";

  const choiceImagesArr = [AiA, AiB, AiC, AiD];

  return {
    legacy_id: ID,                          // selalu terisi
    question_text: Question,
    question_image_url: QuestionImage || null,
    choices: { A, B, C, D },                // DB JSONB object (A..D)
    choice_images: choiceImagesArr,         // DB array [A..D]
    explanations: explanationsArr,          // DB array [A..D]
    answer_key,
    explanation: explanationSingle,
    difficulty,
    tags: Tags,
    source: Source || null,
    aircraft: Aircraft,                     // csv (runtime filter ilike sudah mendukung)
    category_label: Category,
    subcategory_label: Subcategory || null,
    status: statusFinal,
  };
}

async function upsertQuestionAndLink(mapped) {
  const s = await sb();

  const parentId = await getOrCreateCategory({ label: mapped.category_label, parentId: null });
  let childId = null;
  if (mapped.subcategory_label) {
    childId = await getOrCreateCategory({ label: mapped.subcategory_label, parentId });
  }

  if (parentId) {
    const { data: parentRow } = await s
      .from("categories")
      .select("requires_aircraft")
      .eq("id", parentId)
      .single();
    if (parentRow?.requires_aircraft && !mapped.aircraft) {
      throw new Error(`[${mapped.legacy_id}] Aircraft is required for this category`);
    }
  }

  const { data: qRow, error } = await s
    .from("questions")
    .upsert(
      {
        legacy_id: mapped.legacy_id,
        question_text: mapped.question_text,
        question_image_url: mapped.question_image_url,
        choices: mapped.choices,
        choice_images: mapped.choice_images,
        answer_key: mapped.answer_key,
        explanation: mapped.explanation,
        explanations: mapped.explanations,
        difficulty: mapped.difficulty,
        source: mapped.source,
        aircraft: mapped.aircraft,
        status: mapped.status || "draft",
        tags: mapped.tags,
      },
      { onConflict: "legacy_id", ignoreDuplicates: false }
    )
    .select()
    .single();
  if (error) throw error;

  await s.from("question_categories").delete().eq("question_id", qRow.id);
  const linked = [parentId, childId].filter(Boolean);
  if (linked.length) {
    const rows = [...new Set(linked)].map((cid) => ({ question_id: qRow.id, category_id: cid }));
    const { error: e2 } = await s.from("question_categories").insert(rows);
    if (e2) throw e2;
  }

  return qRow.id;
}

/* -------------------- handler -------------------- */
exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS")
      return { statusCode: 204, headers: CORS, body: "" };
    if (event.httpMethod !== "POST")
      return json(405, { error: "method_not_allowed" });

    // guard + rate-limit
    ratelimit(event);
    await requireAdmin(event);

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE)
      return json(500, { error: "Missing Supabase envs" });
    if (!NOTION_TOKEN || !NOTION_DB_MASTER)
      return json(500, { error: "Missing NOTION_TOKEN/NOTION_DB_MASTER" });

    const qs = event.queryStringParameters || {};
    const DRY = qs.dry === "1" || qs.dry === "true" || qs.mode === "dry";
    const limit = Math.min(Math.max(parseInt(qs.limit || "50", 10), 1), 100);
    const startCursor = qs.cursor || undefined;

    const { results, nextCursor } = await fetchNotionBatch(NOTION_DB_MASTER, limit, startCursor);

    let imported = 0;
    const errors = [];

    for (const pg of results) {
      try {
        const mapped = mapNotionRow(pg);
        if (!DRY) await upsertQuestionAndLink(mapped);
        imported++;
      } catch (e) {
        errors.push(String(e.message || e));
      }
    }

    return json(200, {
      ok: true,
      batch: results.length,
      imported,
      skipped: errors.length,
      errors,
      nextCursor,   // gunakan ini untuk batch selanjutnya
      dryRun: DRY,
    });
  } catch (e) {
    const status = e.statusCode || 500;
    return json(status, { error: e.message });
  }
};
