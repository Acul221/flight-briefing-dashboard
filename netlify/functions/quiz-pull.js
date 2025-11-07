/* netlify/functions/quiz-pull.js (v3) */
const { createClient } = require("@supabase/supabase-js");

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE,
} = process.env;

const sba = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Content-Type": "application/json",
};

function respond(status, body) {
  return { statusCode: status, headers: HEADERS, body: JSON.stringify(body) };
}

function getBearerToken(event) {
  const headers = event.headers || {};
  const auth =
    headers.Authorization ||
    headers.authorization ||
    headers["AUTHORIZATION"];
  if (!auth || typeof auth !== "string") return null;

  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function decodeJwtPayload(token) {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4);
    const padded = normalized + "=".repeat(padding);
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
}

async function resolveUserTier(event, fallback = "free") {
  const token = getBearerToken(event);
  if (!token) return fallback;

  const payload = decodeJwtPayload(token);
  const userId = payload && payload.sub;
  if (!userId) return fallback;

  try {
    const { data, error } = await sba
      .from("profiles")
      .select("access_tier")
      .eq("id", userId)
      .limit(1);

    if (error) return fallback;
    const tier =
      Array.isArray(data) && data.length > 0 ? data[0].access_tier : null;
    return tier ? String(tier).toLowerCase() : fallback;
  } catch (_) {
    return fallback;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: HEADERS, body: "" };
  if (event.httpMethod !== "GET") return respond(405, { error: "method_not_allowed" });

  try {
    // 🔹 Parse query
    const qs = event.queryStringParameters || {};
    const category_slug = (qs.category_slug || "").trim().toLowerCase();
    const parent_slug = (qs.parent_slug || "").trim().toLowerCase() || null;
    const mode = (qs.mode || "").trim().toLowerCase(); // e.g. "exam"
    const tier = (qs.tier || "").trim().toLowerCase() || null;
    const limit = Math.min(parseInt(qs.limit || "20", 10) || 20, 50);
    const difficulty =
      typeof qs.difficulty === "string" && qs.difficulty.trim()
        ? qs.difficulty.trim()
        : null;
    const requires_aircraft =
      typeof qs.requires_aircraft === "string" &&
      qs.requires_aircraft.toLowerCase() === "true"
        ? true
        : null;

    if (!category_slug) {
      return respond(400, { error: "Missing category_slug" });
    }

    // 🔹 Auth resolve
    const userTier = await resolveUserTier(event, "free");

    // 🔹 RPC call
    const { data, error } = await sba.rpc("fn_get_questions_v3", {
      p_category_slug: category_slug,
      p_parent_slug: parent_slug,
      p_mode: mode,
      p_tier: tier,
      p_user_tier: userTier,
      p_limit: limit,
      p_difficulty: difficulty,
      p_requires_aircraft: requires_aircraft,
    });

    if (error) {
      console.error("[quiz-pull:error]", {
        level: "error",
        details: error?.message || error,
        category_slug,
        parent_slug,
        mode,
        tier,
        userTier,
        difficulty,
        requires_aircraft,
        time: new Date().toISOString(),
      });
      if (userTier !== "free") {
        const fallbackResult = await sba.rpc("fn_get_questions_v3", {
          p_category_slug: category_slug,
          p_parent_slug: parent_slug,
          p_mode: mode,
          p_tier: tier,
          p_user_tier: "free",
          p_limit: limit,
          p_difficulty: difficulty,
          p_requires_aircraft: requires_aircraft,
        });

        if (!fallbackResult.error) {
          // 🔹 Response
          const fallbackData = fallbackResult.data || {};
          const fallbackPayload = {
            success: true,
            category_slug,
            parent_slug,
            mode,
            tier,
            limit,
            user_tier: "free",
            difficulty,
            requires_aircraft,
            ...fallbackData,
          };
          fallbackPayload.user_tier = fallbackData.user_tier || "free";
          fallbackPayload.difficulty = difficulty;
          fallbackPayload.requires_aircraft = requires_aircraft;
          if (!Array.isArray(fallbackPayload.questions)) fallbackPayload.questions = [];
          if (typeof fallbackPayload.count !== "number") fallbackPayload.count = fallbackPayload.questions.length;
          return respond(200, fallbackPayload);
        }
      }

      return respond(500, {
        error: "RPC failed",
        details: error?.message || "Unknown error",
      });
    }

    // 🔹 Response
    const payloadData = data || {};
    const payload = {
      success: true,
      category_slug,
      parent_slug,
      mode,
      tier,
      limit,
      user_tier: userTier,
      difficulty,
      requires_aircraft,
      ...payloadData,
    };
    payload.user_tier = payloadData.user_tier || userTier;
    payload.difficulty = difficulty;
    payload.requires_aircraft = requires_aircraft;
    if (!Array.isArray(payload.questions)) payload.questions = [];
    if (typeof payload.count !== "number") payload.count = payload.questions.length;

    return respond(200, payload);
  } catch (err) {
    console.error("[quiz-pull:error]", {
      level: "error",
      details: err?.message || err,
      time: new Date().toISOString(),
    });
    return respond(500, {
      error: "RPC failed",
      details: err?.message || "Unknown error",
    });
  }
};
