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
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function respond(status, body) {
  return { statusCode: status, headers: HEADERS, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: HEADERS, body: "" };
  if (event.httpMethod !== "GET") return respond(405, { error: "method_not_allowed" });

  try {
    const qs = event.queryStringParameters || {};
    const category_slug = (qs.category_slug || "").trim().toLowerCase();
    const parent_slug = (qs.parent_slug || "").trim().toLowerCase() || null;
    const mode = (qs.mode || "").toLowerCase(); // e.g. "exam"
    const tier = (qs.tier || "").toLowerCase(); // e.g. "pro"
    const limit = Math.min(parseInt(qs.limit || "20", 10) || 20, 50);

    if (!category_slug) {
      return respond(400, { error: "Missing category_slug" });
    }

    const { data, error } = await sba.rpc("fn_get_questions_v3", {
      p_category_slug: category_slug,
      p_parent_slug: parent_slug,
      p_mode: mode,
      p_tier: tier,
      p_limit: limit,
    });

    if (error) {
      console.error(
        JSON.stringify({
          level: "error",
          message: "RPC fn_get_questions_v3 failed",
          category_slug,
          parent_slug,
          details: error.message,
          time: new Date().toISOString(),
        })
      );
      return respond(500, { error: "RPC failed", details: error.message });
    }

    const payload = data || {
      success: true,
      parent_slug,
      category_slug,
      mode,
      tier,
      limit,
      count: 0,
      questions: [],
    };

    return respond(200, payload);
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "quiz-pull failed",
        error: err.message,
        time: new Date().toISOString(),
      })
    );
    return respond(500, { error: "RPC failed", details: err.message });
  }
};
