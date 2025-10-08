/* eslint-disable no-case-declarations */
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE,
  ADMIN_API_SECRET,
  ADMIN_ALLOWED_ORIGIN
} = process.env;

const CORS_JSON = {
  "Access-Control-Allow-Origin": ADMIN_ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Secret, x-admin-secret",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS,PATCH",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const CORS_CSV = { ...CORS_JSON, "Content-Type": "text/csv; charset=utf-8" };

function json(status, body) { return { statusCode: status, headers: CORS_JSON, body: JSON.stringify(body) }; }
function csv(status, body, filename = "questions.csv") {
  return {
    statusCode: status,
    headers: { ...CORS_CSV, "Content-Disposition": `attachment; filename="${filename}"` },
    body
  };
}

const isUUID = (s) =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

let _sb;
async function sbAdmin() {
  if (_sb) return _sb;
  const { createClient } = await import("@supabase/supabase-js");
  _sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });
  return _sb;
}

function ratelimit(_event) { /* noop placeholder */ }

// -------- admin/auth helpers --------
function headerVal(h, k) { return h?.[k] ?? h?.[k.toLowerCase()] ?? h?.[k.toUpperCase()]; }
function isValidAdminHeader(event) {
  const h = event.headers || {};
  const secret = headerVal(h, "x-admin-secret");
  const auth = headerVal(h, "authorization");
  const hasValidSecret = !!(ADMIN_API_SECRET && secret && secret === ADMIN_API_SECRET);
  const hasBearer = !!(auth && String(auth).startsWith("Bearer "));
  return hasValidSecret || hasBearer;
}

async function requireAdmin(event) {
  const secret = headerVal(event.headers, "x-admin-secret");
  if (secret && ADMIN_API_SECRET && secret === ADMIN_API_SECRET) return "secret";
  return await requireAdminUser(event);
}
async function requireAdminUser(event) {
  const s = await sbAdmin();
  const auth = headerVal(event.headers, "authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) throw new Error("missing_authorization");
  const { data: userData, error: uerr } = await s.auth.getUser(token);
  if (uerr || !userData?.user?.id) throw new Error("invalid_user");
  const { data: prof, error: perr } = await s.from("profiles").select("id,is_admin").eq("id", userData.user.id).single();
  if (perr || !prof?.is_admin) throw new Error("not_admin");
  return prof.id;
}

/* ---------- helpers ---------- */
function toArray4(a) {
  if (!a) return [null, null, null, null];
  if (Array.isArray(a)) return [...a, null, null, null].slice(0, 4);
  return [a, null, null, null];
}
function normDifficulty(s) {
  const v = String(s || "").toLowerCase();
  return ["easy", "medium", "hard"].includes(v) ? v : "medium";
}
function ensureChoices(choices) {
  if (!choices) return { A: "", B: "", C: "", D: "" };
  if (Array.isArray(choices)) {
    const get = (i) => {
      const v = choices[i];
      return typeof v === "object" && v !== null ? (v.text ?? "") : (v ?? "");
    };
    return { A: get(0), B: get(1), C: get(2), D: get(3) };
  }
  return { A: choices.A ?? "", B: choices.B ?? "", C: choices.C ?? "", D: choices.D ?? "" };
}
function normalizePayload(body) {
  if (!body) throw new Error("empty_body");
  let answerKey = String(body.answer_key || "").toUpperCase();
  if (!answerKey && Number.isInteger(body.correctIndex)) {
    answerKey = ["A", "B", "C", "D"][body.correctIndex] || "A";
  }
  const choices = ensureChoices(body.choices);
  const choice_images = toArray4(body.choice_images || body.choiceImageUrls);
  const explanations = toArray4(body.explanations);
  const tags = Array.isArray(body.tags)
    ? body.tags
    : typeof body.tagsCsv === "string"
      ? body.tagsCsv.split(",")
      : null;
  const aircraft = typeof body.aircraft === "string"
    ? body.aircraft
    : typeof body.aircraftCsv === "string"
      ? body.aircraftCsv
      : null;

  const out = {
    legacy_id: body.legacy_id || null,
    question_text: String(body.question_text || body.question || "").trim(),
    question_image_url: body.question_image_url || body.questionImageUrl || null,
    choices, choice_images, explanations,
    answer_key: answerKey,
    explanation: body.explanation || null,
    difficulty: normDifficulty(body.difficulty || body.level),
    source: body.source || null,
    aircraft: aircraft || null,
    status: (body.status || "draft").toLowerCase(),
    tags: Array.isArray(tags) ? tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean) : null,
    category_ids: Array.isArray(body.category_ids) ? body.category_ids.filter((id) => isUUID(id)) : [],
    category_slugs: Array.isArray(body.category_slugs)
      ? body.category_slugs.map((s) => String(s).toLowerCase().trim()).filter(Boolean)
      : [],
    category_path: Array.isArray(body.category_path)
      ? body.category_path.map((s) => String(s).trim()).filter(Boolean)
      : [],
  };
  if (!out.question_text) throw new Error("question_text required");
  if (!["A", "B", "C", "D"].includes(out.answer_key)) throw new Error("answer_key must be A|B|C|D");
  if (!["draft", "published", "archived", "deleted"].includes(out.status)) throw new Error("status invalid");
  return out;
}

async function getDescendantIds(rootId) {
  if (!rootId) return [];
  const s = await sbAdmin();
  try {
    const { data, error } = await s.rpc("fn_category_descendants", { p_root: rootId });
    if (!error && Array.isArray(data)) return data.map((x) => x.id);
  } catch { /* fallback to BFS below */ }
  const ids = [];
  const queue = [rootId];
  while (queue.length) {
    const id = queue.shift();
    ids.push(id);
    const { data } = await s.from("categories").select("id").eq("parent_id", id);
    (data || []).forEach((r) => queue.push(r.id));
  }
  return ids;
}
async function getCategoryIdBySlug(slug) {
  if (!slug) return null;
  const s = await sbAdmin();
  const { data } = await s.from("categories").select("id").eq("slug", String(slug).toLowerCase()).maybeSingle();
  return data?.id || null;
}
async function ensureCategoryPathIds(pathArr = []) {
  const s = await sbAdmin();
  const out = [];
  for (const path of pathArr) {
    const parts = String(path).split(">").map((p) => p.trim()).filter(Boolean);
    let parent = null;
    for (const label of parts) {
      let { data: row } = await s
        .from("categories")
        .select("id")
        .eq("label", label)
        .eq("parent_id", parent)
        .maybeSingle();
      if (!row) {
        const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const { data: created } = await s
          .from("categories")
          .insert({ label, slug, parent_id: parent })
          .select()
          .single();
        row = created;
      }
      parent = row.id;
    }
    if (parent) out.push(parent);
  }
  return out;
}

/* ===== requires_aircraft guard (cek parent chain) ===== */
async function requiresAircraftForAny(categoryIds) {
  if (!categoryIds || !categoryIds.length) return false;
  const s = await sbAdmin();
  const visited = new Set();
  async function checkOne(id) {
    if (!id || visited.has(id)) return false;
    visited.add(id);
    const { data, error } = await s.from("categories").select("id,parent_id,requires_aircraft").eq("id", id).single();
    if (error) return false;
    if (data?.requires_aircraft) return true;
    if (data?.parent_id) return checkOne(data.parent_id);
    return false;
  }
  for (const id of categoryIds) { if (await checkOne(id)) return true; }
  return false;
}

/* ---------- core create/update/delete ---------- */
async function createOne(event) {
  ratelimit(event); await requireAdmin(event);
  const s = await sbAdmin();
  const payload = normalizePayload(JSON.parse(event.body || "{}"));

  let catIds = payload.category_ids.slice();
  if (!catIds.length && payload.category_slugs.length) {
    const resolved = await Promise.all(payload.category_slugs.map(getCategoryIdBySlug));
    catIds = resolved.filter(Boolean);
  }
  if (!catIds.length && payload.category_path.length) {
    catIds = await ensureCategoryPathIds(payload.category_path);
  }
  if (await requiresAircraftForAny(catIds)) { if (!payload.aircraft) throw new Error("aircraft_required_for_category"); }

  const { data: row, error } = await s.from("questions").insert({
    legacy_id: payload.legacy_id,
    question_text: payload.question_text,
    question_image_url: payload.question_image_url,
    choices: payload.choices,
    choice_images: payload.choice_images,
    answer_key: payload.answer_key,
    explanation: payload.explanation,
    explanations: payload.explanations,
    difficulty: payload.difficulty,
    source: payload.source,
    aircraft: payload.aircraft,
    status: payload.status,
    tags: payload.tags,
  }).select().single();
  if (error) throw error;

  if (catIds.length) {
    const rows = catIds.map((cid) => ({ question_id: row.id, category_id: cid }));
    const { error: e2 } = await s.from("question_categories").insert(rows);
    if (e2) throw e2;
  }
  return row;
}

async function updateOne(event, id) {
  ratelimit(event); await requireAdmin(event);
  const s = await sbAdmin();
  const payload = normalizePayload(JSON.parse(event.body || "{}"));

  let catIds = payload.category_ids.slice();
  if (!catIds.length && payload.category_slugs.length) {
    const resolved = await Promise.all(payload.category_slugs.map(getCategoryIdBySlug));
    catIds = resolved.filter(Boolean);
  }
  if (!catIds.length && payload.category_path.length) {
    catIds = await ensureCategoryPathIds(payload.category_path);
  }
  if (await requiresAircraftForAny(catIds)) { if (!payload.aircraft) throw new Error("aircraft_required_for_category"); }

  const { data: row, error } = await s.from("questions").update({
    legacy_id: payload.legacy_id,
    question_text: payload.question_text,
    question_image_url: payload.question_image_url,
    choices: payload.choices,
    choice_images: payload.choice_images,
    answer_key: payload.answer_key,
    explanation: payload.explanation,
    explanations: payload.explanations,
    difficulty: payload.difficulty,
    source: payload.source,
    aircraft: payload.aircraft,
    status: payload.status,
    tags: payload.tags,
  }).eq("id", id).select().single();
  if (error) throw error;

  if (catIds.length) {
    await s.from("question_categories").delete().eq("question_id", id);
    const rows = catIds.map((cid) => ({ question_id: id, category_id: cid }));
    const { error: e2 } = await s.from("question_categories").insert(rows);
    if (e2) throw e2;
  }
  return row;
}

async function removeOne(event, id) {
  ratelimit(event); await requireAdmin(event);
  const s = await sbAdmin();
  await s.from("question_categories").delete().eq("question_id", id);
  const { error } = await s.from("questions").delete().eq("id", id);
  if (error) throw error;
  return { deleted: true, id };
}

/* ---------- handleGet (list/single/csv) ---------- */
async function handleGet(event) {
  const s = await sbAdmin();
  const qs = event.queryStringParameters || {};
  const wantCsv = String(qs.format || "").toLowerCase() === "csv";
  const id = qs.id;

  // public vs admin: jika tidak ada admin header valid → paksa status=published
  const forcePublished = !isValidAdminHeader(event);

  // GET by id
  if (id) {
    const { data: row, error } = await s.from("questions").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!row) return json(404, { error: "not_found" });
    if (forcePublished && row.status !== "published") return json(403, { error: "forbidden" });
    return json(200, row);
  }

  // Build filters
  const q = (qs.q || "").trim();
  const status = (qs.status || "").trim();
  const difficulty = (qs.difficulty || "").trim();
  const categorySlug = (qs.category_slug || "").trim();
  const incRaw = (qs.include_descendants ?? qs.includeDesc ?? "").toString().toLowerCase();
  const includeDesc = ["1", "true", "yes"].includes(incRaw);
  const limit = Math.min(Number(qs.limit || 50), 200);
  const offset = Math.max(Number(qs.offset || 0), 0);

  // Filter by category (fetch question_ids via junction)
  let questionIds = null;
  if (categorySlug) {
    const catId = await getCategoryIdBySlug(categorySlug);
    if (catId) {
      const ids = includeDesc ? await getDescendantIds(catId) : [catId];
      const { data: links } = await s.from("question_categories").select("question_id").in("category_id", ids);
      questionIds = (links || []).map((x) => x.question_id);
      if (!questionIds.length) return json(200, { items: [], count: 0 });
    } else {
      return json(200, { items: [], count: 0 });
    }
  }

  // Main select with count
  let sel = s.from("questions").select("*", { count: "exact" });
  if (forcePublished) sel = sel.eq("status", "published");
  else if (status) sel = sel.eq("status", status);
  if (difficulty) sel = sel.eq("difficulty", difficulty);
  if (q) sel = sel.ilike("question_text", `%${q}%`);
  if (questionIds) sel = sel.in("id", questionIds);

  sel = sel.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  const { data: items, count, error } = await sel;
  if (error) throw error;

  if (!wantCsv) return json(200, { items, count });

  // CSV export (admin only)
  if (forcePublished && wantCsv) return json(403, { error: "forbidden" });
  const header = ["id", "question_text", "difficulty", "status", "aircraft", "source", "tags", "answer_key"].join(",");
  const rows = (items || []).map((r) => {
    const tags = Array.isArray(r.tags) ? r.tags.join("|") : "";
    const esc = (v) => String(v ?? "").replace(/"/g, '""');
    return [
      `"${esc(r.id)}"`,
      `"${esc(r.question_text)}"`,
      `"${esc(r.difficulty)}"`,
      `"${esc(r.status)}"`,
      `"${esc(r.aircraft || "")}"`,
      `"${esc(r.source || "")}"`,
      `"${esc(tags)}"`,
      `"${esc(r.answer_key)}"`,
    ].join(",");
  });
  return csv(200, [header, ...rows].join("\n"), "questions.csv");
}

/* ---------- handlePatch (bulk_status + bulk_delete) ---------- */
async function handlePatch(event) {
  await requireAdmin(event);
  const s = await sbAdmin();
  const body = JSON.parse(event.body || "{}");
  const action = body.action;

  const incRaw = (v) => (v ?? "").toString().toLowerCase();
  async function selectIdsByFilters(f = {}) {
    const categorySlug = (f.category_slug || "").trim();
    const includeDesc = ["1", "true", "yes"].includes(incRaw(f.include_descendants || f.includeDesc));
    const currentStatus = (f.current_status || "").trim();
    const q = (f.q || "").trim();

    let sel = s.from("questions").select("id");
    if (currentStatus) sel = sel.eq("status", currentStatus);
    if (q) sel = sel.ilike("question_text", `%${q}%`);

    if (categorySlug) {
      const catId = await getCategoryIdBySlug(categorySlug);
      if (!catId) return [];
      const ids = includeDesc ? await getDescendantIds(catId) : [catId];
      const { data: links } = await s.from("question_categories").select("question_id").in("category_id", ids);
      const qids = (links || []).map((r) => r.question_id);
      if (!qids.length) return [];
      sel = sel.in("id", qids);
    }
    const { data: rows } = await sel;
    return (rows || []).map((r) => r.id);
  }

  if (action === "bulk_status") {
    const newStatus = String(body.new_status || "").toLowerCase();
    if (!["draft", "published", "archived", "deleted"].includes(newStatus)) {
      return json(400, { error: "invalid_new_status" });
    }
    const ids = await selectIdsByFilters(body.filters || {});
    if (!ids.length) return json(200, { affected: 0, new_status: newStatus });
    const { error } = await s.from("questions").update({ status: newStatus }).in("id", ids);
    if (error) throw error;
    return json(200, { affected: ids.length, new_status: newStatus });
  }

  if (action === "bulk_delete") {
    // hard delete only for archived/deleted items to be safe
    const f = body.filters || {};
    const mustStatus = String(f.current_status || "").toLowerCase();
    if (!["archived", "deleted"].includes(mustStatus)) {
      return json(400, { error: "bulk_delete_requires_archived_or_deleted" });
    }
    const ids = await selectIdsByFilters(f);
    if (!ids.length) return json(200, { affected: 0 });
    await s.from("question_categories").delete().in("question_id", ids);
    const { error } = await s.from("questions").delete().in("id", ids);
    if (error) throw error;
    return json(200, { affected: ids.length, hard_deleted: true });
  }

  return json(400, { error: "unknown_action" });
}

/* ---------- main handler ---------- */
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_JSON, body: "" };
  }
  try {
    switch (event.httpMethod) {
      case "GET": return await handleGet(event);
      case "POST": return json(200, await createOne(event));
      case "PUT": {
        const id = event.queryStringParameters?.id;
        if (!isUUID(id)) return json(400, { error: "invalid id" });
        return json(200, await updateOne(event, id));
      }
      case "PATCH": return await handlePatch(event);
      case "DELETE": {
        const id = event.queryStringParameters?.id;
        if (!isUUID(id)) return json(400, { error: "invalid id" });
        return json(200, await removeOne(event, id));
      }
      default: return json(405, { error: "method_not_allowed" });
    }
  } catch (err) {
    const message = err?.message || "internal_error";
    const code =
      message === "not_admin" || message === "missing_authorization" ? 401 :
      message === "invalid_user" ? 403 :
      message === "aircraft_required_for_category" ? 400 : 500;
    return json(code, { error: message });
  }
};
