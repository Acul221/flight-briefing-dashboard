// netlify/functions/submit-question.js
/* eslint-disable no-console */
const { Client } = require("@notionhq/client");
const { createClient } = require("@supabase/supabase-js");

const {
  // Secrets & endpoints
  ADMIN_API_SECRET,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE,
  NOTION_TOKEN,
  NOTION_DB_MASTER,

  // Optional overrides (boleh kosong; kita auto-detect)
  NOTION_PROP_TITLE,
  NOTION_PROP_QUESTION,
  NOTION_PROP_Q_IMAGE,
  NOTION_PROP_TAGS,
  NOTION_PROP_AIRCRAFT,
  NOTION_PROP_LEVEL,
  NOTION_PROP_SOURCE,
  NOTION_PROP_CAT_PARENT,
  NOTION_PROP_CAT_CHILD,
  NOTION_PROP_CATEGORIES,   // multi-select agregat (opsional)
  NOTION_PROP_STATUS,       // select Draft/Published/Archived (opsional)

  // CORS & safety
  ADMIN_ALLOWED_ORIGIN,     // "https://admin.skydeckpro.id,https://app.skydeckpro.id"
  ALLOWED_IMAGE_HOSTS       // "xyz.supabase.co,cdn.example.com" (opsional)
} = process.env;

// ---- Clients ----
const notion = new Client({ auth: NOTION_TOKEN });
const sba = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---- CORS ----
const CORS = {
  "Access-Control-Allow-Origin": ADMIN_ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-secret",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const json = (status, body) => ({ statusCode: status, headers: CORS, body: JSON.stringify(body) });

// ---- Utils ----
const LETTERS = ["A", "B", "C", "D"];
const LETTER_OF = { 0: "A", 1: "B", 2: "C", 3: "D" };

const slugify = (s) =>
  String(s || "")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);

const normDifficulty = (x) => {
  if (!x) return "easy";
  const v = String(x).toLowerCase();
  return ["easy", "medium", "hard"].includes(v) ? v : "easy";
};

const arrCsvToArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((x) => String(x).trim()).filter(Boolean);
  return String(val).split(",").map((t) => t.trim()).filter(Boolean);
};

// ---- image URL safety (opsional) ----
const ALLOWED_IMG = (ALLOWED_IMAGE_HOSTS || "")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

function isSafeHttpUrl(u) {
  if (!u) return false;
  try {
    const url = new URL(String(u));
    if (!/^https?:$/.test(url.protocol)) return false;
    if (ALLOWED_IMG.length && !ALLOWED_IMG.includes(url.hostname.toLowerCase())) return false;
    return true;
  } catch { return false; }
}

// Normalizer kecil: pilih alias field yang tersedia
const pick = (...vals) => vals.find(v => v !== undefined && v !== null);

// Choice image urls: terima 3 varian
function normalizeChoiceImageUrls(body) {
  const raw = pick(body.choiceImageUrls, body.choice_images, body.choiceImages);
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw.slice(0, 4) : [];
  while (arr.length < 4) arr.push(null);
  return arr.map((x) => (isSafeHttpUrl(x) ? String(x).trim() : null));
}

// ---- tiny rate-limit (per instance) ----
const BUCKET = new Map();
function ratelimit(ip, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const it = BUCKET.get(ip) ?? { c: 0, ts: now };
  if (now - it.ts > windowMs) { it.c = 0; it.ts = now; }
  it.c++; BUCKET.set(ip, it);
  if (it.c > limit) { const e = new Error("too_many_requests"); e.statusCode = 429; throw e; }
}

// ---- Audit ----
async function auditLog({ actor = null, action, status, meta }) {
  try {
    await sba.from("admin_audit_logs").insert({
      actor, action, status,
      meta: meta ? JSON.stringify(meta) : null,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("auditLog fail:", e.message);
  }
}

// ---- Admin check ----
async function requireAdmin(event) {
  const xadm = event.headers?.["x-admin-secret"] || event.headers?.["X-Admin-Secret"];
  if (xadm && ADMIN_API_SECRET && xadm === ADMIN_API_SECRET) return { via: "secret" };

  const auth = event.headers?.authorization || event.headers?.Authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) throw new Error("forbidden");

  const { data: userData, error: e1 } = await sba.auth.getUser(token);
  if (e1 || !userData?.user) throw new Error("invalid_token");

  const uid = userData.user.id;
  const { data: prof, error: e2 } = await sba.from("profiles").select("is_admin").eq("id", uid).maybeSingle();
  if (e2 || !prof?.is_admin) throw new Error("forbidden");
  return { via: "bearer", uid };
}

// ------- Category helpers -------
async function getCategoryBySlugAndParent(slug, parentId) {
  let q = sba.from("categories").select("id,label,slug,parent_id").eq("slug", slug);
  q = parentId ? q.eq("parent_id", parentId) : q.is("parent_id", null);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return data || null;
}

async function ensureCategory({ label, parentId = null, createIfMissing = true }) {
  const slug = slugify(label);
  const found = await getCategoryBySlugAndParent(slug, parentId);
  if (found || !createIfMissing) return found;

  const { data, error } = await sba
    .from("categories")
    .insert({ label, slug, parent_id: parentId })
    .select()
    .single();

  // concurrent insert: reselect
  if (error && error.code === "23505") {
    const again = await getCategoryBySlugAndParent(slug, parentId);
    if (again) return again;
  }
  if (error) throw error;
  return data;
}

async function replaceQuestionCategories(questionId, categoryIds) {
  await sba.from("question_categories").delete().eq("question_id", questionId);
  if (categoryIds?.length) {
    const rows = categoryIds.map((id) => ({ question_id: questionId, category_id: id }));
    const { error } = await sba.from("question_categories").insert(rows);
    if (error) throw error;
  }
}

/** safe resolver: saat skipMirror=true, tidak membuat kategori baru */
async function resolveCategories(body, { safe = false } = {}) {
  const out = { categoryRows: [], warnings: [], wouldCreate: [] };

  const pushOrMark = async (label, parentRowOrId = null) => {
    const parentId = parentRowOrId && parentRowOrId.id ? parentRowOrId.id : parentRowOrId;
    const row = await ensureCategory({ label, parentId, createIfMissing: !safe });
    if (row) out.categoryRows.push(row);
    else out.wouldCreate.push({ label, parentLabel: parentRowOrId?.label || null });
    return row;
  };

  if (Array.isArray(body.category_ids) && body.category_ids.length) {
    const { data, error } = await sba
      .from("categories")
      .select("id,label,slug,parent_id")
      .in("id", body.category_ids);
    if (error) throw error;
    if (data?.length) out.categoryRows.push(...data);
  }

  if (Array.isArray(body.categories) && body.categories.length) {
    for (const it of body.categories) {
      if (!it?.parent) continue;
      const p = await pushOrMark(String(it.parent).trim());
      if (it.child) await pushOrMark(String(it.child).trim(), p || { label: it.parent });
    }
  }

  const toArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  for (const raw of toArr(body.category_path)) {
    const [pLbl, cLbl] = String(raw).split(">").map((x) => x.trim()).filter(Boolean);
    if (!pLbl) continue;
    const p = await pushOrMark(pLbl);
    if (cLbl) await pushOrMark(cLbl, p || { label: pLbl });
  }

  const legacyParent = (body.parentCategoryLabel || body.fallbackParentLabel || "").trim();
  const legacyChild = (body.childCategoryLabel || body.fallbackChildLabel || "").trim();
  if (legacyParent) {
    const p = await pushOrMark(legacyParent);
    if (legacyChild) await pushOrMark(legacyChild, p || { label: legacyParent });
  }

  // dedupe
  const seen = {};
  out.categoryRows = out.categoryRows.filter((r) => (r && !seen[r.id] ? (seen[r.id] = true) : false));

  if (safe && out.wouldCreate.length) {
    out.warnings.push(`dry-run: ${out.wouldCreate.length} kategori akan dibuat bila mirror diaktifkan`);
  }
  return out;
}

// ------- Validation -------
function validatePayload(body) {
  const issues = [];
  const choices = Array.isArray(body.choices) ? body.choices : [];
  const correctIndex = Number.isInteger(body.correctIndex) ? body.correctIndex : Number(body.correctIndex);

  if (choices.length !== 4) issues.push("choices must be an array of length 4");
  const filled = choices.filter((c) => String(c || "").trim().length > 0).length;
  if (filled < 2) issues.push("at least two choices must be non-empty");
  if (!(correctIndex >= 0 && correctIndex <= 3)) issues.push("correctIndex must be 0..3");

  return { ok: issues.length === 0, issues };
}

// ------- Notion: auto-detect props & build -------
let __propsCache = { at: 0, resolved: null, props: null };
async function detectNotionProps() {
  // cache 5 menit untuk kurangi rate-limit
  if (__propsCache.at && (Date.now() - __propsCache.at) < 5 * 60_000 && __propsCache.resolved) {
    return { props: __propsCache.props, resolved: __propsCache.resolved };
  }
  if (!NOTION_DB_MASTER) throw new Error("notion_db_missing");
  const db = await notion.databases.retrieve({ database_id: NOTION_DB_MASTER });
  const props = db.properties || {};

  const findByType = (type) => Object.entries(props).find(([, p]) => p?.type === type)?.[0] || null;
  const findByName = (candidates) => candidates.find((n) => n && props[n]) || null;

  // Title
  const titleProp = NOTION_PROP_TITLE || findByType("title");

  // Common candidates
  const parentCandidates = [NOTION_PROP_CAT_PARENT, "Category", "Parent Category", "Subject", "Parent"];
  const childCandidates  = [NOTION_PROP_CAT_CHILD, "Subcategory", "Sub Category", "Child Category", "Topic", "Child"];
  const levelCandidates  = [NOTION_PROP_LEVEL, "Level", "Difficulty"];
  const questionCandidates = [NOTION_PROP_QUESTION, "Question", "Pertanyaan"];
  const qImgCandidates   = [NOTION_PROP_Q_IMAGE, "Question Image URL", "Question Image"];
  const tagsCandidates   = [NOTION_PROP_TAGS, "Tags"];
  const aircraftCandidates = [NOTION_PROP_AIRCRAFT, "Aircraft"];
  const sourceCandidates = [NOTION_PROP_SOURCE, "Source", "Reference"];
  const statusCandidates = [NOTION_PROP_STATUS, "Status"];
  const catsAggCandidates = [NOTION_PROP_CATEGORIES, "Categories"];

  // detect optional "Choice Image X URL"
  const choiceImgProps = {};
  ["A","B","C","D"].forEach(L => {
    const key = `Choice Image ${L} URL`;
    if (props[key]?.type === "url") choiceImgProps[L] = key;
  });

  const resolved = {
    title: titleProp, // must
    parent: findByName(parentCandidates),
    child: findByName(childCandidates),
    level: findByName(levelCandidates),
    question: findByName(questionCandidates),
    qImage: findByName(qImgCandidates),
    tags: findByName(tagsCandidates),
    aircraft: findByName(aircraftCandidates),
    source: findByName(sourceCandidates),
    status: findByName(statusCandidates),
    catsAgg: findByName(catsAggCandidates),
    choices: LETTERS.map((L) => `Choice ${L}`).filter((n) => props[n]),
    explanations: LETTERS.map((L) => `Explanation ${L}`).filter((n) => props[n]),
    isCorrect: LETTERS.map((L) => `isCorrect ${L}`).filter((n) => props[n]),
    choiceImageUrl: choiceImgProps, // map {A:"Choice Image A URL",...}
  };

  __propsCache = { at: Date.now(), resolved, props };
  return { props, resolved };
}

function buildNotionProperties(body, resolved, warn) {
  const tagsArr = arrCsvToArray(pick(body.tagsCsv, body.tags)).map((name) => ({ name }));
  const aircraftArr = arrCsvToArray(pick(body.aircraftCsv, body.aircraft)).map((name) => ({ name }));
  const code = (body.code && String(body.code)) || `Q-${Date.now()}`;

  const p = {};

  if (resolved.title) p[resolved.title] = { title: [{ text: { content: code } }] };
  else warn.push("Notion: title property tidak ditemukan (wajib).");

  if (resolved.question && body.question != null) {
    p[resolved.question] = { rich_text: [{ text: { content: String(body.question || "") } }] };
  } else if (!resolved.question) {
    warn.push("Notion: property untuk Question tidak ditemukan (di-skip).");
  }

  if (resolved.level && (body.level || body.difficulty)) {
    const lvl = (body.level || body.difficulty || "Easy").toString().replace(/^\w/, (c) => c.toUpperCase());
    p[resolved.level] = { select: { name: lvl } };
  }

  if (resolved.tags && tagsArr.length) p[resolved.tags] = { multi_select: tagsArr };
  if (resolved.aircraft && aircraftArr.length) p[resolved.aircraft] = { multi_select: aircraftArr };
  if (resolved.source && body.source != null) {
    p[resolved.source] = { rich_text: [{ text: { content: String(body.source || "") } }] };
  }

  const qImgUrl = pick(body.questionImageUrl, body.question_image_url);
  if (resolved.qImage && isSafeHttpUrl(qImgUrl)) {
    p[resolved.qImage] = { url: String(qImgUrl) };
  }

  // Category parent/child (opsional; hanya jika property ada)
  if (resolved.parent && body.parentCategoryLabel) {
    p[resolved.parent] = { select: { name: String(body.parentCategoryLabel).trim() } };
  }
  if (resolved.child && body.childCategoryLabel) {
    p[resolved.child] = { select: { name: String(body.childCategoryLabel).trim() } };
  }
  // Jika kirim category_path / categories[], handler akan set parent/child utama di bawah

  if (resolved.catsAgg && Array.isArray(body.category_path)) {
    p[resolved.catsAgg] = { multi_select: body.category_path.map((x) => ({ name: String(x) })) };
  }

  // Choices/explanations/isCorrect -> hanya set yang propertinya ada
  const choiceImageUrls = normalizeChoiceImageUrls(body);
  LETTERS.forEach((L, i) => {
    const cName = `Choice ${L}`;
    const eName = `Explanation ${L}`;
    const kName = `isCorrect ${L}`;
    const choice = body.choices?.[i] || "";
    const expl = body.explanations?.[i] || "";
    const isC = Number(body.correctIndex) === i;

    if (resolved.choices.includes(cName)) {
      p[cName] = { rich_text: [{ text: { content: String(choice) } }] };
    }
    if (resolved.explanations.includes(eName)) {
      p[eName] = { rich_text: [{ text: { content: String(expl) } }] };
    }
    if (resolved.isCorrect.includes(kName)) {
      p[kName] = { checkbox: !!isC };
    }
    const url = choiceImageUrls[i];
    const imgProp = resolved.choiceImageUrl?.[L];
    if (imgProp && isSafeHttpUrl(url)) {
      p[imgProp] = { url: String(url) };
    }
  });

  if (resolved.status && body.status) {
    const name = String(body.status).replace(/^\w/, (c) => c.toUpperCase());
    p[resolved.status] = { select: { name } };
  }

  return p;
}

// ------- Supabase mirror -------
async function upsertMirrorSupabase(body, notionPageId, categoryIds) {
  const choicesObj = {
    A: body.choices?.[0] || "",
    B: body.choices?.[1] || "",
    C: body.choices?.[2] || "",
    D: body.choices?.[3] || "",
  };
  const choiceImages = normalizeChoiceImageUrls(body);
  const answerKey = LETTER_OF[Number(body.correctIndex) || 0] || "A";
  const tags = arrCsvToArray(pick(body.tagsCsv, body.tags)).map((t) => t.toLowerCase());
  const aircraftCSV = arrCsvToArray(pick(body.aircraftCsv, body.aircraft)).join(",");

  const questionImageUrl = pick(body.questionImageUrl, body.question_image_url);
  const payload = {
    legacy_id: notionPageId,
    question_text: String(body.question || "").trim(),
    question_image_url: questionImageUrl && isSafeHttpUrl(questionImageUrl) ? questionImageUrl : null,
    choices: choicesObj,
    choice_images: choiceImages,
    answer_key: answerKey,
    explanation: body.explanations?.[Number(body.correctIndex) || 0] || null,
    explanations: Array.isArray(body.explanations) && body.explanations.length === 4 ? body.explanations : null,
    difficulty: normDifficulty(pick(body.difficulty, body.level)),
    source: body.source || null,
    aircraft: aircraftCSV || null,
    status: ["draft", "published", "archived"].includes(String(body.status)) ? body.status : "draft",
    tags: tags.length ? tags : null,
  };

  const { data: up, error: e1 } = await sba
    .from("questions")
    .upsert(payload, { onConflict: "legacy_id" })
    .select()
    .single();
  if (e1) throw e1;

  await replaceQuestionCategories(up.id, categoryIds || []);
  return up;
}

// ------- Handler -------
exports.handler = async (event) => {
  const startedAt = Date.now();
  let actor = null;
  try {
    // rate-limit
    const ip = event.headers?.["cf-connecting-ip"] || event.headers?.["x-forwarded-for"] || "0.0.0.0";
    ratelimit(String(ip));

    if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
    if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

    const auth = await requireAdmin(event);
    actor = auth.uid || auth.via;

    const qs = event.queryStringParameters || {};
    const isDry = String(qs.dry || "").toLowerCase() === "1";
    const skipMirror = isDry || String(qs.mirror || "") === "0";

    const raw = JSON.parse(event.body || "{}");
    // alias harmonisasi
    const body = {
      ...raw,
      legacyId: pick(raw.legacyId, raw.legacy_id, null),
      questionImageUrl: pick(raw.questionImageUrl, raw.question_image_url),
      choiceImageUrls: pick(raw.choiceImageUrls, raw.choice_images, raw.choiceImages),
      difficulty: pick(raw.difficulty, raw.level),
      tagsCsv: pick(raw.tagsCsv, raw.tags),
      aircraftCsv: pick(raw.aircraftCsv, raw.aircraft),
    };

    const val = validatePayload(body);
    if (!val.ok) {
      await auditLog({ actor, action: "submit-question", status: "validation_failed", meta: { issues: val.issues } });
      return json(409, { error: "validation_failed", issues: val.issues });
    }

    // resolve categories
    const { categoryRows, warnings, wouldCreate } = await resolveCategories(body, { safe: skipMirror });
    const categoryIds = categoryRows.map((r) => r.id);

    // tentukan pasangan utama parent/child untuk ditulis ke Notion (jika property ada)
    let mainParentLabel = null;
    let mainChildLabel = null;
    const firstParent = categoryRows.find((r) => !r.parent_id);
    if (firstParent) {
      mainParentLabel = firstParent.label;
      const firstChild = categoryRows.find((r) => r.parent_id === firstParent.id);
      if (firstChild) mainChildLabel = firstChild.label;
    }
    if (!mainParentLabel && (body.parentCategoryLabel || body.fallbackParentLabel)) {
      mainParentLabel = String(body.parentCategoryLabel || body.fallbackParentLabel);
    }
    if (!mainChildLabel && (body.childCategoryLabel || body.fallbackChildLabel)) {
      mainChildLabel = String(body.childCategoryLabel || body.fallbackChildLabel);
    }
    if (categoryIds.length > 2) warnings.push("Notion hanya diset 1 parent & 1 child; lainnya disimpan di Supabase saja.");

    // ------- Notion auto-detect & build -------
    const { resolved } = await detectNotionProps();
    const notionWarnings = [];

    const bodyForNotion = {
      ...body,
      parentCategoryLabel: mainParentLabel || body.parentCategoryLabel,
      childCategoryLabel: mainChildLabel || body.childCategoryLabel,
    };
    const properties = buildNotionProperties(bodyForNotion, resolved, notionWarnings);

    if (!resolved.title) {
      return json(400, { error: "notion_title_property_missing", warnings: [...warnings, ...notionWarnings] });
    }

    // ------- Create/Update Notion (skip saat dry) -------
    let notionPageId;
    const legacyId = body.legacyId;
    if (legacyId) {
      notionPageId = legacyId;
      if (!isDry) await notion.pages.update({ page_id: legacyId, properties });
    } else {
      if (isDry) notionPageId = "dry-run-new-id";
      else {
        const resp = await notion.pages.create({ parent: { database_id: NOTION_DB_MASTER }, properties });
        notionPageId = resp.id;
      }
    }

    // ------- Mirror DB (skip jika skipMirror) -------
    const row = skipMirror ? null : await upsertMirrorSupabase(body, notionPageId, categoryIds);

    const notionUrl = `https://www.notion.so/${String(notionPageId).replace(/-/g, "")}`;
    await auditLog({
      actor, action: "submit-question", status: "ok",
      meta: {
        dry: isDry, skipMirror, notionPageId, question_id: row?.id || null,
        linked_category_ids: categoryIds, wouldCreate, warnings: [...warnings, ...notionWarnings],
        duration_ms: Date.now() - startedAt,
      },
    });

    return json(200, {
      success: true,
      dry: isDry,
      mirror: skipMirror ? "skipped" : "done",
      legacy_id: notionPageId,
      notion_url: notionUrl,
      question_id: row ? row.id : null,
      linked_category_ids: categoryIds,
      warnings: [...warnings, ...notionWarnings],
      wouldCreate,
    });
  } catch (e) {
    console.error("submit-question error:", e);
    await auditLog({ actor, action: "submit-question", status: "error", meta: { message: e.message, stack: e.stack, duration_ms: Date.now() - startedAt } });
    const statusCode = e.statusCode || 400;
    return json(statusCode, { error: e.message || String(e) });
  }
};
