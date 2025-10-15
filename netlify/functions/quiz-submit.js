/* netlify/functions/quiz-submit.js */
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE,
  ADMIN_API_SECRET,
  ADMIN_ALLOWED_ORIGIN
} = process.env;

const CORS = {
  "Access-Control-Allow-Origin": ADMIN_ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Secret, x-admin-secret",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json",
};

const json = (status, body) => ({ statusCode: status, headers: CORS, body: JSON.stringify(body) });

let _sb;
async function sbAdmin() {
  if (_sb) return _sb;
  const { createClient } = await import("@supabase/supabase-js");
  _sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });
  return _sb;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  try {
    const s = await sbAdmin();
    const body = event.body ? JSON.parse(event.body) : {};

    const {
      mode = "practice",
      aircraft = null,
      category_root_slug = null,
      category_slug = null,
      include_descendants = true,
      duration_sec = 0,
      meta = {},
      items = [],
      user_id = null,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return json(400, { error: "no_items" });
    }

    // ✅ hitung skor
    const question_count = items.length;
    let correct_count = 0;

    const rows = items.map((it) => {
      const answer_index = Number.isInteger(it.answer_index) ? it.answer_index : -1;
      const correct_index = Number.isInteger(it.correct_index) ? it.correct_index : -1;
      const is_correct = answer_index === correct_index && answer_index >= 0 && correct_index >= 0;
      if (is_correct) correct_count++;
      return {
        question_id: it.question_id || null,
        legacy_id: it.legacy_id || null,
        answer_index,
        correct_index,
        is_correct,
        time_spent_sec: it.time_spent_sec || null,
        meta: it.meta || {},
      };
    });

    const score = question_count ? (correct_count / question_count) * 100 : 0;

    // ✅ Insert ke quiz_attempts
    const attemptInsert = {
      user_id,
      mode,
      aircraft,
      category_root_slug,
      category_slug,
      include_descendants: !!include_descendants,
      duration_sec: Number(duration_sec) || 0,
      question_count,
      correct_count,
      score,
      meta: meta || {},
    };

    const { data: attemptData, error: attemptErr } = await s
      .from("quiz_attempts")
      .insert(attemptInsert)
      .select()
      .single();

    if (attemptErr || !attemptData) {
      console.error("[quiz-submit] insert_attempt_failed:", attemptErr);
      return json(500, { error: "insert_attempt_failed", details: attemptErr?.message });
    }

    const attemptId = attemptData.id;

    // ✅ Insert ke quiz_attempt_items
    const itemsToInsert = rows.map((r) => ({
      attempt_id: attemptId,
      question_id: r.question_id,
      legacy_id: r.legacy_id,
      answer_index: r.answer_index,
      correct_index: r.correct_index,
      is_correct: r.is_correct,
      time_spent_sec: r.time_spent_sec,
      meta: r.meta,
    }));

    const { error: itemsErr } = await s.from("quiz_attempt_items").insert(itemsToInsert);

    if (itemsErr) {
      console.error("[quiz-submit] insert_items_failed:", itemsErr);
      // rollback
      await s.from("quiz_attempts").delete().eq("id", attemptId);
      return json(500, { error: "insert_items_failed", details: itemsErr?.message });
    }

    // ✅ Return success
    return json(200, {
      attempt_id: attemptId,
      question_count,
      correct_count,
      score,
      created_at: attemptData.created_at || new Date().toISOString(),
    });
  } catch (err) {
    console.error("[quiz-submit] unexpected error:", err);
    return json(500, { error: err.message || "internal_error" });
  }
};
