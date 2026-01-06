// netlify/functions/exam-attempts.js

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
  const slug = params.subject || params.subject_slug;
  if (!slug) {
    return jsonResponse(400, {
      ok: false,
      error: "subject or subject_slug query param is required",
    });
  }

  try {
    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/rpc/fn_get_exam_attempts`,
      {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ p_subject_slug: slug }),
      }
    );

    const data = await res.json().catch(() => []);

    if (!res.ok) {
      return jsonResponse(res.status, {
        ok: false,
        error: "Failed to fetch exam attempts",
      });
    }

    // Keep shape: { attempts: [...] }
    return jsonResponse(200, { ok: true, attempts: data });
  } catch (err) {
    console.error("exam-attempts error", err);
    return jsonResponse(500, { ok: false, error: "Internal server error" });
  }
};
