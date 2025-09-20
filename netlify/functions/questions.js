// netlify/functions/questions.js
/* eslint-disable no-case-declarations */
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE, ADMIN_API_SECRET } = process.env;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Admin-Secret, x-admin-secret",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS,PATCH",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function json(status, body) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
}

const isUUID = (s) =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );

let _sb;
async function sbAdmin() {
  if (_sb) return _sb;
  const { createClient } = await import("@supabase/supabase-js");
  _sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  return _sb;
}

/** Allow either: Bearer admin (profiles.is_admin) OR x-admin-secret */
async function requireAdmin(event) {
  const secret =
    event.headers?.["x-admin-secret"] ||
    event.headers?.["X-Admin-Secret"] ||
    event.headers?.["x-adminsecret"];
  if (secret && ADMIN_API_SECRET && secret === ADMIN_API_SECRET) return "secret";

  // fallback: Bearer admin user
  return await requireAdminUser(event);
}

async function requireAdminUser(event) {
  const s = await sbAdmin();
  const auth =
    event.headers?.authorization || event.headers?.Authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) throw new Error("missing_authorization");

  const { data: userData, error: uerr } = await s.auth.getUser(token);
  if (uerr || !userData?.user) throw new Error("invalid_token");

  const uid = userData.user.id;
  const { data: prof, error: perr } = await s
    .from("profiles")
    .select("is_admin")
    .eq("id", uid)
    .single();

  if (perr || !prof?.is_admin) throw new Error("forbidden");
  return uid;
}

/* ---------------- Normalizers & Validators ---------------- */

function normDifficulty(x) {
  if (!x) return null;
  const v = String(x).toLowerCase();
  return ["easy", "medium", "hard"].includes(v) ? v : null;
}

function ensureChoices(obj) {
  if (!obj || typeof obj !== "object") throw new Error("choices required");
  const out = { A: obj.A, B: obj.B, C: obj.C, D: obj.D };
  ["A", "B", "C", "D"].forEach((k) => {
    if (!out[k] || String(out[k]).trim() === "") {
      throw new Error(`choices.${k} is required`);
    }
  });
  return out;
}

function normalizePayload(body) {
  if (!body) throw new Error("empty_body");

  const choices =
    Array.isArray(body.choices) && body.choices.length === 4
      ? {
          A: body.choices[0],
          B: body.choices[1],
          C: body.choices[2],
          D: body.choices[3],
        }
      : body.choices;

  const normalized = {
    legacy_id: body.legacy_id || null,
    question_text: String(body.question_text || body.question || "").trim(),
    question_image_url: body.question_image_url || null,
    choices: ensureChoices(choices),
    choice_images: body.choice_images || null,
    answer_key: String(body.answer_key || "").toUpperCase(),
    explanation: body.explanation || null,
    explanations: body.explanations || null,
    difficulty: normDifficulty(body.difficulty),
    source: body.source || null,
    aircraft: body.aircraft || null,
    status: body.status || "draft",
    tags: Array.isArray(body.tags)
      ? body.tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean)
      : null,
    category_ids: Array.isArray(body.category_ids)
      ? body.category_ids.filter((id) => isUUID(id))
      : [],
  };

  if (!normalized.question_text) throw new Error("question_text required");
  if (!["A", "B", "C", "D"].includes(normalized.answer_key)) {
    throw new Error("answer_key must be A|B|C|D");
  }
  if (!["draft", "published", "archived"].includes(normalized.status)) {
    throw new Error("status invalid");
  }

  return normalized;
}

/* ---------------- Helpers ---------------- */

/** Build full descendant set (multi-level) for a root category id */
async function getDescendantIds(rootId) {
  if (!rootId) return [];
  const s = await sbAdmin();
  const { data: cats, error } = await s
    .from("categories")
    .select("id,parent_id");
  if (error) throw error;
  const byParent = {};
  (cats || []).forEach((c) => {
    byParent[c.parent_id || "null"] = byParent[c.parent_id || "null"] || [];
    byParent[c.parent_id || "null"].push(c.id);
  });

  const out = new Set([rootId]);
  const queue = [rootId];
  while (queue.length) {
    const cur = queue.shift();
    const children = byParent[cur] || [];
    for (const ch of children) {
      if (!out.has(ch)) {
        out.add(ch);
        queue.push(ch);
      }
    }
  }
  return Array.from(out);
}

/** Resolve category by slug (first match) -> id */
async function getCategoryIdBySlug(slug) {
  if (!slug) return null;
  const s = await sbAdmin();
  const { data, error } = await s
    .from("categories")
    .select("id")
    .eq("slug", String(slug).toLowerCase())
    .limit(1)
    .single();
  if (error) return null;
  return data?.id || null;
}

/* ---------------- Queries ---------------- */

async function getList(qs) {
  const s = await sbAdmin();

  const status = qs.status || null;
  const search = qs.q || null;
  const difficulty = normDifficulty(qs.difficulty);
  const aircraft = qs.aircraft || null;

  const limit = Math.min(Math.max(parseInt(qs.limit || "100", 10), 1), 200);
  const offset = Math.max(parseInt(qs.offset || "0", 10), 0);
  const includeCategories = qs.include_categories === "1";

  // category by id or slug, with optional descendants
  let categoryId = qs.category_id && isUUID(qs.category_id) ? qs.category_id : null;
  const categorySlug = qs.category_slug || null;
  const includeDesc = qs.include_descendants === "1";

  if (!categoryId && categorySlug) {
    categoryId = await getCategoryIdBySlug(categorySlug);
  }

  let ids = null;
  if (categoryId) {
    const targetIds = includeDesc
      ? await getDescendantIds(categoryId)
      : [categoryId];

    const { data: rows, error: jerr } = await s
      .from("question_categories")
      .select("question_id, category_id")
      .in("category_id", targetIds);
    if (jerr) throw jerr;
    ids = [...new Set((rows || []).map((r) => r.question_id))];
    if (!ids.length) return { items: [], count: 0 };
  }

  let query = s
    .from("questions")
    .select(
      "id, legacy_id, question_text, question_image_url, choices, choice_images, answer_key, explanation, explanations, difficulty, source, aircraft, status, tags, updated_at",
      { count: "exact" }
    );

  if (status) query = query.eq("status", status);
  if (search) query = query.ilike("question_text", `%${search}%`);
  if (difficulty) query = query.eq("difficulty", difficulty);
  if (aircraft) query = query.eq("aircraft", aircraft);
  if (ids) query = query.in("id", ids);

  query = query.order("updated_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  if (includeCategories && data?.length) {
    const qids = data.map((d) => d.id);
    const { data: jc } = await s
      .from("question_categories")
      .select("question_id, category_id, categories:category_id(id, label, slug, parent_id)")
      .in("question_id", qids);

    const byQ = {};
    (jc || []).forEach((r) => {
      byQ[r.question_id] = byQ[r.question_id] || [];
      byQ[r.question_id].push(r.categories);
    });
    data.forEach((d) => (d.categories = byQ[d.id] || []));
  }

  return { items: data || [], count: count || 0 };
}

async function getOne(id) {
  const s = await sbAdmin();
  const { data, error } = await s.from("questions").select("*").eq("id", id).single();
  if (error) throw error;

  const { data: jc } = await s
    .from("question_categories")
    .select("category_id")
    .eq("question_id", id);

  data.category_ids = (jc || []).map((r) => r.category_id);
  return data;
}

async function createOne(event) {
  await requireAdmin(event);
  const s = await sbAdmin();

  const body = JSON.parse(event.body || "{}");
  const payload = normalizePayload(body);

  const { data: row, error } = await s
    .from("questions")
    .insert({
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
    })
    .select()
    .single();

  if (error) throw error;

  if (payload.category_ids?.length) {
    const rows = [...new Set(payload.category_ids)].map((cid) => ({
      question_id: row.id,
      category_id: cid,
    }));
    const { error: e2 } = await s.from("question_categories").insert(rows);
    if (e2) throw e2;
  }

  return row;
}

async function updateOne(event, id) {
  await requireAdmin(event);
  const s = await sbAdmin();

  const body = JSON.parse(event.body || "{}");
  const payload = normalizePayload(body);

  const { data: row, error } = await s
    .from("questions")
    .update({
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
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // replace junctions
  await s.from("question_categories").delete().eq("question_id", id);
  if (payload.category_ids?.length) {
    const rows = [...new Set(payload.category_ids)].map((cid) => ({
      question_id: id,
      category_id: cid,
    }));
    const { error: e2 } = await s.from("question_categories").insert(rows);
    if (e2) throw e2;
  }

  return row;
}

async function removeOne(event, id) {
  await requireAdmin(event);
  const s = await sbAdmin();

  await s.from("question_categories").delete().eq("question_id", id);
  const { error } = await s.from("questions").delete().eq("id", id);
  if (error) throw error;

  return { ok: true };
}

/* ---------------- Handler ---------------- */

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: CORS, body: "" };
    }

    switch (event.httpMethod) {
      case "GET": {
        const qs = event.queryStringParameters || {};
        const id = qs.id && isUUID(qs.id) ? qs.id : null;
        if (id) {
          const item = await getOne(id);
          return json(200, { item });
        }
        const { items, count } = await getList(qs);
        return json(200, { items, count });
      }

      case "POST": {
        const row = await createOne(event);
        return json(200, { item: row });
      }

      case "PUT": {
        const qs = event.queryStringParameters || {};
        const id = qs.id && isUUID(qs.id) ? qs.id : null;
        if (!id) return json(400, { error: "id_required" });
        const row = await updateOne(event, id);
        return json(200, { item: row });
      }

      case "PATCH": {
        // 🔒 now guarded
        await requireAdmin(event);

        const body = JSON.parse(event.body || "{}");
        if (body.action !== "bulk_status") {
          return json(400, { error: "unknown_action" });
        }

        const newStatus = body.new_status || body.status;
        if (!["draft", "published", "archived"].includes(newStatus)) {
          return json(400, { error: "invalid_status" });
        }

        const s = await sbAdmin();
        const filters = body.filters || {};

        // Resolve category filter (id or slug) + descendants
        let categoryId =
          filters.category_id && isUUID(filters.category_id)
            ? filters.category_id
            : null;
        if (!categoryId && filters.category_slug) {
          categoryId = await getCategoryIdBySlug(filters.category_slug);
        }
        const includeDesc = !!filters.include_descendants;

        let candidateIds = null;
        if (categoryId) {
          const targetIds = includeDesc
            ? await getDescendantIds(categoryId)
            : [categoryId];
          const { data: rows, error: e0 } = await s
            .from("question_categories")
            .select("question_id")
            .in("category_id", targetIds);
          if (e0) return json(500, { error: e0.message });
          candidateIds = [...new Set((rows || []).map((r) => r.question_id))];
          if (!candidateIds.length)
            return json(200, {
              matched: 0,
              updated: 0,
              status: newStatus,
              filters_applied: { ...filters, category_id: categoryId, include_descendants: includeDesc },
            });
        }

        // Build main query
        let q = s.from("questions").select("id");
        if (filters.q) q = q.ilike("question_text", `%${filters.q}%`);
        if (filters.difficulty) {
          const diff = normDifficulty(filters.difficulty);
          if (diff) q = q.eq("difficulty", diff);
        }
        if (filters.aircraft) q = q.eq("aircraft", filters.aircraft);
        if (filters.current_status) {
          if (!["draft", "published", "archived"].includes(filters.current_status)) {
            return json(400, { error: "invalid_current_status" });
          }
          q = q.eq("status", filters.current_status);
        }
        if (candidateIds) q = q.in("id", candidateIds);

        const { data: candidates, error: e1 } = await q;
        if (e1) return json(500, { error: e1.message });

        const ids = (candidates || []).map((r) => r.id);
        if (!ids.length)
          return json(200, {
            matched: 0,
            updated: 0,
            status: newStatus,
            filters_applied: { ...filters, category_id: categoryId, include_descendants: includeDesc },
          });

        const { error: e2 } = await s
          .from("questions")
          .update({ status: newStatus })
          .in("id", ids);
        if (e2) return json(500, { error: e2.message });

        return json(200, {
          matched: ids.length,
          updated: ids.length,
          status: newStatus,
          filters_applied: { ...filters, category_id: categoryId, include_descendants: includeDesc },
        });
      }

      case "DELETE": {
        const qs = event.queryStringParameters || {};
        const id = qs.id && isUUID(qs.id) ? qs.id : null;
        if (!id) return json(400, { error: "id_required" });
        const res = await removeOne(event, id);
        return json(200, res);
      }

      default:
        return json(405, { error: "method_not_allowed" });
    }
  } catch (e) {
    return json(400, { error: e.message || String(e) });
  }
};
