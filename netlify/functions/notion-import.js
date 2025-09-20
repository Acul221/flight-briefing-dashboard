// netlify/functions/notion-import.js
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;
const { NOTION_TOKEN, NOTION_DB_MASTER } = process.env;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function json(status, body) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
}

/* -------------------- helpers -------------------- */
const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

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
  _sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  return _sb;
}
async function notion() {
  if (_notion) return _notion;
  const { Client } = await import("@notionhq/client");
  _notion = new Client({ auth: NOTION_TOKEN });
  return _notion;
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

// ambil/auto-create kategori; dukung parent/child
async function getOrCreateCategory({ label, parentId = null }) {
  if (!label) return null;
  const s = await sb();
  const slug = slugify(label);

  let q = s.from("categories").select("id, slug, parent_id").eq("slug", slug);
  if (parentId) q = q.eq("parent_id", parentId);
  else q = q.is("parent_id", null);

  const { data: rows, error } = await q.limit(1);
  if (error) throw error;
  if (rows?.length) return rows[0].id;

  const { data: ins, error: e2 } = await s
    .from("categories")
    .insert({
      slug,
      label,
      parent_id: parentId || null,
      order_index: 0,
      is_active: true,
    })
    .select()
    .single();
  if (e2) throw e2;
  return ins.id;
}

function mapNotionRow(row) {
  const p = row.properties || {};

  const ID = rt(p["ID"]) || title(p["ID"]) || rt(p["Ai ID"]);
  const Question = rt(p["Question"]);
  const QuestionImage =
    url(p["Question Image URL"]) || fileFirstUrl(p["Question Image"]);

  const A = rt(p["Choice A"]);
  const B = rt(p["Choice B"]);
  const C = rt(p["Choice C"]);
  const D = rt(p["Choice D"]);

  const AiA = url(p["Choice Image A URL"]) || fileFirstUrl(p["Choice A Image"]);
  const AiB = url(p["Choice Image B URL"]) || fileFirstUrl(p["Choice B Image"]);
  const AiC = url(p["Choice Image C URL"]) || fileFirstUrl(p["Choice C Image"]);
  const AiD = url(p["Choice Image D URL"]) || fileFirstUrl(p["Choice D Image"]);

  const ExA = rt(p["Explanation A"]);
  const ExB = rt(p["Explanation B"]);
  const ExC = rt(p["Explanation C"]);
  const ExD = rt(p["Explanation D"]);

  const IcA = chk(p["isCorrect A"]);
  const IcB = chk(p["isCorrect B"]);
  const IcC = chk(p["isCorrect C"]);
  const IcD = chk(p["isCorrect D"]);

  // exactly one correct
  const correctCount = [IcA, IcB, IcC, IcD].filter(Boolean).length;
  if (correctCount !== 1) {
    throw new Error(
      `${ID || row.id}: exactly one of isCorrect A/B/C/D must be checked`
    );
  }
  const answer_key = IcA ? "A" : IcB ? "B" : IcC ? "C" : "D";

  const Level = (sel(p["Level"]) || "").toLowerCase();
  const difficulty = ["easy", "medium", "hard"].includes(Level) ? Level : null;
  const Tags = (msel(p["Tags"]) || [])
    .map((t) => String(t).toLowerCase().trim())
    .filter(Boolean);

  const Source = rt(p["Source"]);
  const Aircraft =
    (sel(p["Aircraft"]) || sel(p["Ai"]) || "").toLowerCase().trim() || null;

  const Category = sel(p["Category"]);
  const Subcategory = sel(p["Subcategory"]); // opsional

  if (!Question) throw new Error(`${ID || row.id}: Question is empty`);
  if (!Category) throw new Error(`${ID || row.id}: Category is required`);

  const choices = { A, B, C, D };
  for (const k of ["A", "B", "C", "D"]) {
    if (!choices[k] || !String(choices[k]).trim()) {
      throw new Error(`${ID || row.id}: Choice ${k} is required`);
    }
  }

  return {
    legacy_id: ID || null,
    question_text: Question,
    question_image_url: QuestionImage || null,
    choices,
    choice_images: {
      A: AiA || null,
      B: AiB || null,
      C: AiC || null,
      D: AiD || null,
    },
    explanations: { A: ExA || "", B: ExB || "", C: ExC || "", D: ExD || "" },
    answer_key,
    explanation:
      (ExA && answer_key === "A") ? ExA :
      (ExB && answer_key === "B") ? ExB :
      (ExC && answer_key === "C") ? ExC :
      (ExD && answer_key === "D") ? ExD : "",
    difficulty,
    tags: Tags,
    source: Source || null,
    aircraft: Aircraft,
    category_label: Category,
    subcategory_label: Subcategory || null,
    status: "draft",
  };
}

async function upsertQuestionAndLink(mapped) {
  const s = await sb();

  const parentId = await getOrCreateCategory({
    label: mapped.category_label,
    parentId: null,
  });
  let childId = null;
  if (mapped.subcategory_label) {
    childId = await getOrCreateCategory({
      label: mapped.subcategory_label,
      parentId,
    });
  }

  if (parentId) {
    const { data: parentRow } = await s
      .from("categories")
      .select("requires_aircraft")
      .eq("id", parentId)
      .single();
    if (parentRow?.requires_aircraft && !mapped.aircraft) {
      throw new Error(
        `${mapped.legacy_id || ""}: Aircraft is required for this category`
      );
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
        status: mapped.status,
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
    const rows = [...new Set(linked)].map((cid) => ({
      question_id: qRow.id,
      category_id: cid,
    }));
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

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE)
      return json(500, { error: "Missing Supabase envs" });
    if (!NOTION_TOKEN || !NOTION_DB_MASTER)
      return json(500, { error: "Missing NOTION_TOKEN/NOTION_DB_MASTER" });

    const qs = event.queryStringParameters || {};
    const DRY =
      qs.dry === "1" || qs.dry === "true" || qs.mode === "dry";
    const limit = Math.min(Math.max(parseInt(qs.limit || "50", 10), 1), 100);
    const startCursor = qs.cursor || undefined;

    // ambil batch saja (hindari timeout)
    const { results, nextCursor } = await fetchNotionBatch(
      NOTION_DB_MASTER,
      limit,
      startCursor
    );

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
      nextCursor,          // gunakan ini untuk batch selanjutnya
      dryRun: DRY,
    });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
