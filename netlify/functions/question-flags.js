// netlify/functions/question-flags.js

const fetch = global.fetch;

function getAuthHeader(event) {
  const h = event.headers || {};
  return h.authorization || h.Authorization || "";
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { ok: false, error: "Method not allowed" });
  }

  const authHeader = getAuthHeader(event);
  if (!authHeader) {
    return jsonResponse(401, { ok: false, error: "Missing Authorization header" });
  }

  const params = event.queryStringParameters || {};
  const resolved = params.resolved; // "true" / "false" / undefined

  // Build query string for PostgREST
  const search = new URLSearchParams();
  search.set("select", "*");
  search.set("order", "created_at.desc");
  search.set("limit", "50");

  if (resolved === "true") {
    search.set("resolved", "eq.true");
  } else if (resolved === "false") {
    search.set("resolved", "eq.false");
  }

  const url = `${process.env.SUPABASE_URL}/rest/v1/question_flags?${search.toString()}`;

  try {
    const res = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json().catch(() => []);

    if (!res.ok) {
      return jsonResponse(res.status, {
        ok: false,
        error: "Failed to fetch question flags",
      });
    }

    return jsonResponse(200, { ok: true, flags: data });
  } catch (err) {
    console.error("question-flags error", err);
    return jsonResponse(500, { ok: false, error: "Internal server error" });
  }
};
