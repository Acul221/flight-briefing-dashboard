// netlify/functions/question-flag.js

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
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { ok: false, error: "Method not allowed" });
  }

  const authHeader = getAuthHeader(event);
  if (!authHeader) {
    return jsonResponse(401, { ok: false, error: "Missing Authorization header" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { ok: false, error: "Invalid JSON body" });
  }

  const {
    question_id,
    questionId,
    reason = "",
    comment = "",
    meta = {},
  } = payload || {};

  const qid = question_id || questionId;
  if (!qid) {
    return jsonResponse(400, { ok: false, error: "question_id is required" });
  }

  try {
    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/rpc/fn_submit_question_flag`,
      {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_question_id: qid,
          p_reason: reason,
          p_comment: comment,
          p_meta: meta,
        }),
      }
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return jsonResponse(res.status, {
        ok: false,
        error: "Failed to submit question flag",
      });
    }

    return jsonResponse(200, { ok: true, id: data });
  } catch (err) {
    console.error("question-flag error", err);
    return jsonResponse(500, { ok: false, error: "Internal server error" });
  }
};
