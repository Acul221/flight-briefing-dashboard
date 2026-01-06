// netlify/functions/submit-question.js
// Submit question (admin) using canonical Quiz V3 payload + fn_upsert_question_v3
import { createClient } from "@supabase/supabase-js";

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE,
  ADMIN_API_SECRET,
  ADMIN_ALLOWED_ORIGIN,
} = process.env;

const ALLOW_ORIGINS = (ADMIN_ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
const CORS = {
  "Access-Control-Allow-Origin": ALLOW_ORIGINS[0] || "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-secret, X-Admin-Secret",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const json = (statusCode, body) => ({ statusCode, headers: CORS, body: JSON.stringify(body) });

const toArray4 = (arr, fill = null) => {
  const base = Array.isArray(arr) ? arr : [];
  return [...base, fill, fill, fill].slice(0, 4);
};
const normStr = (v) => (typeof v === "string" ? v.trim() : "");
const normArr = (v) => (Array.isArray(v) ? v : []);

const bucket = new Map();
function rateLimit(key, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const item = bucket.get(key) ?? { count: 0, ts: now };
  if (now - item.ts > windowMs) {
    item.count = 0;
    item.ts = now;
  }
  item.count += 1;
  bucket.set(key, item);
  if (item.count > limit) {
    const err = new Error("too_many_requests");
    err.statusCode = 429;
    throw err;
  }
}

let _sb;
function supabaseAdmin() {
  if (_sb) return _sb;
  _sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });
  return _sb;
}

function requireAdmin(event) {
  const secret = event.headers?.["x-admin-secret"] || event.headers?.["X-Admin-Secret"];
  if (!ADMIN_API_SECRET || secret !== ADMIN_API_SECRET) {
    const err = new Error("unauthorized");
    err.statusCode = 401;
    throw err;
  }
}

function enforceOrigin(event) {
  if (!ALLOW_ORIGINS.length) return;
  const origin = event.headers?.origin || event.headers?.Origin || "";
  if (!ALLOW_ORIGINS.includes(origin)) {
    const err = new Error("forbidden_origin");
    err.statusCode = 403;
    throw err;
  }
}

async function logAdminError(payload) {
  try {
    const s = supabaseAdmin();
    await s.from("admin_function_logs").insert([payload]);
  } catch (_) {
    // swallow logging errors
  }
}

function buildPayload(body) {
  const errors = [];
  const question_text = normStr(body.question_text || body.question);
  if (!question_text) errors.push("question_text_required");

  const choices = toArray4(body.choices || [], "");
  if (choices.some((c) => !normStr(c))) errors.push("choices_must_be_4_non_empty");

  const explanations = toArray4(body.explanations || [], "");
  const choice_images = toArray4(body.choice_images || [], null);

  const correctIndex =
    Number.isInteger(body.correctIndex) && body.correctIndex >= 0 && body.correctIndex <= 3
      ? body.correctIndex
      : -1;
  if (correctIndex === -1) errors.push("correctIndex_invalid");

  const category_slugs = normArr(body.category_slugs).filter(Boolean);
  if (!category_slugs.length) errors.push("category_slugs_required");

  const payload = {
    question_text,
    question_image: body.question_image || null,
    choices,
    choice_images,
    explanations,
    correctIndex,
    category_slugs,
    category_path: normArr(body.category_path),
    difficulty: normStr(body.difficulty || "medium") || "medium",
    requires_aircraft: !!body.requires_aircraft,
    aircraft: normArr(body.aircraft),
    access_tier: ["pro", "free"].includes(String(body.access_tier || "").toLowerCase())
      ? String(body.access_tier).toLowerCase()
      : "free",
    exam_pool: !!body.exam_pool,
    status: normStr(body.status || "draft") || "draft",
    is_active: body.is_active !== false,
    metadata: body.metadata || {},
    images_meta: body.images_meta || {},
    domain: body.domain || null,
    subject: body.subject || null,
    subcategory: body.subcategory || null,
    ata: body.ata || null,
    source: body.source || null,
  };

  return { payload, errors };
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return json(405, { error: "method_not_allowed" });

  const ip =
    event.headers?.["cf-connecting-ip"] ||
    event.headers?.["x-forwarded-for"] ||
    event.headers?.["client-ip"] ||
    "0.0.0.0";
  try {
    enforceOrigin(event);
    rateLimit(`submit-question:${ip}`);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    await logAdminError({
      fn: "submit-question",
      error_message: err.message || "rate_or_origin_error",
      status_code: statusCode,
      ip,
    });
    return json(statusCode, { error: err.message || "blocked" });
  }

  try {
    requireAdmin(event);
    const body = JSON.parse(event.body || "{}");
    const { payload, errors } = buildPayload(body);
    if (errors.length) return json(400, { error: "validation_failed", errors });

    const s = supabaseAdmin();
    const { data, error } = await s.rpc("fn_upsert_question_v3", { p_question: payload });
    if (error) return json(500, { error: "rpc_failed", details: error.message });

    const id = data?.id || data || null;
    return json(200, { ok: true, id });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    await logAdminError({
      fn: "submit-question",
      error_message: err?.message || "server_error",
      status_code: statusCode,
      ip,
    });
    return json(statusCode, { error: err?.message || "server_error" });
  }
};
