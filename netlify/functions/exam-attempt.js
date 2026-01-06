// netlify/functions/exam-attempt.js

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

  const { subject, subject_slug, answers } = payload || {};
  const slug = subject_slug || subject;
  if (!slug || !Array.isArray(answers) || answers.length === 0) {
    return jsonResponse(400, {
      ok: false,
      error: "subject/subject_slug and non-empty answers[] are required",
    });
  }

  const normalizedAnswers = answers.map((a) => ({
    selected_index: typeof a.selected_index === "number" ? a.selected_index : a.selectedIndex,
    correct_index:
      typeof a.correct_index === "number"
        ? a.correct_index
        : typeof a.correctIndex === "number"
          ? a.correctIndex
          : null,
    question_id: a.question_id || a.questionId || null,
  }));

  // Hitung score sederhana: correct_index vs selected_index
  const total = answers.length;
  const correctCount = normalizedAnswers.filter(
    (a) =>
      typeof a.selected_index === "number" &&
      typeof a.correct_index === "number" &&
      a.selected_index === a.correct_index
  ).length;
  const score = total > 0 ? (correctCount / total) * 100 : 0;

  try {
    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/rpc/fn_submit_exam_attempt`,
      {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_subject_slug: slug,
          p_answers: normalizedAnswers,
          p_score: score,
          p_total: total,
        }),
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return jsonResponse(res.status, {
        ok: false,
        error: "Failed to submit exam attempt",
      });
    }

    return jsonResponse(200, {
      ok: true,
      id: data, // RPC returns uuid directly
      score,
      total,
      correct: correctCount,
    });
  } catch (err) {
    console.error("exam-attempt error", err);
    return jsonResponse(500, { ok: false, error: "Internal server error" });
  }
};
