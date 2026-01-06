// netlify/functions/quiz-pull.js
// SkyDeckPro — Quiz Pull V3 (Netlify Runtime Compatible)

const { createClient } = require("@supabase/supabase-js");
const ensureLen4 = (arr, fill) => {
  const base = Array.isArray(arr) ? arr.slice(0, 4) : [];
  while (base.length < 4) base.push(fill);
  return base;
};

// lightweight in-memory token bucket
const _bucket = new Map();
function rateLimit(key, limit = 40, windowMs = 60_000) {
  const now = Date.now();
  const item = _bucket.get(key) ?? { count: 0, ts: now };
  if (now - item.ts > windowMs) {
    item.count = 0;
    item.ts = now;
  }
  item.count += 1;
  _bucket.set(key, item);
  if (item.count > limit) {
    const e = new Error("Too Many Requests");
    e.status = 429;
    throw e;
  }
}

exports.handler = async (event, context) => {
  try {
    const query = event.queryStringParameters || {};

    const {
      category_slug,
      include_descendants,
      difficulty = "all",
      requires_aircraft,
      user_tier,
      limit = 20,
    } = query;

    if (!category_slug) {
      return json(400, { ok: false, error: "missing_category_slug" });
    }

    // ------------------------------
    // JWT → determine user tier
    // ------------------------------
    const authHeader = event.headers.authorization || "";
    const jwt = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    let effectiveTier = user_tier || "free";

    if (jwt) {
      try {
        const payload = JSON.parse(
          Buffer.from(jwt.split(".")[1], "base64").toString("utf8")
        );

        if (payload?.user_metadata?.pro === true) effectiveTier = "pro";
        if (payload?.tier) effectiveTier = payload.tier;
      } catch (_) {}
    }

    // ------------------------------
    // Supabase Client
    // ------------------------------
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    );

    const includeDesc = (include_descendants ?? "1").toString() !== "0";
    const diffNorm = (difficulty || "all").toLowerCase();
    const p_difficulty = ["easy", "medium", "hard"].includes(diffNorm)
      ? diffNorm
      : "all";

    const p_requires_aircraft =
      String(requires_aircraft ?? "false").toLowerCase() === "true";

    const params = {
      p_category_slug: category_slug,
      p_include_descendants: includeDesc,
      p_difficulty,
      p_requires_aircraft,
      p_user_tier: effectiveTier,
      p_limit: Number(limit) || 20,
    };

    const ip =
      event.headers?.["cf-connecting-ip"] ||
      event.headers?.["x-forwarded-for"] ||
      event.headers?.["client-ip"] ||
      "0.0.0.0";
    rateLimit(String(ip));
    console.log("[quiz-pull] params", params);

    const { data, error } = await supabase.rpc(
      "fn_get_questions_v3",
      params
    );

    if (error) {
      return json(500, { ok: false, error: "rpc_failed", details: error });
    }

    const items = (data || []).map((q) => ({
      ...q,
      choice_images: ensureLen4(q.choice_images, null).map((u) => (u ? String(u) : null)),
      correctIndex:
        q.correctIndex ??
        q.correct_index ??
        (typeof q.correct_index === "number" ? q.correct_index : null),
    }));

    return json(200, { ok: true, count: items.length, items });
  } catch (err) {
    return json(500, {
      ok: false,
      error: "server_exception",
      details: err.message,
    });
  }
};

// Helper: standard JSON output
function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=30",
    },
    body: JSON.stringify(body),
  };
}
