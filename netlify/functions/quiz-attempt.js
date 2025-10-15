/* netlify/functions/quiz-attempt.js */
/* eslint-disable no-console */
const { createClient } = require("@supabase/supabase-js");

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE,
  PUBLIC_ALLOWED_ORIGIN,
} = process.env;

const CORS = {
  "Access-Control-Allow-Origin": PUBLIC_ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,GET",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const json = (s, b) => ({ statusCode: s, headers: CORS, body: JSON.stringify(b) });

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const isUUID = (s) =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "GET") return json(405, { error: "method_not_allowed" });

  try {
    const qs = event.queryStringParameters || {};
    const id = (qs.id || qs.attempt_id || "").trim();
    const includeQuestions =
      qs.include_questions === "1" || qs.include_questions === "true";

    if (!isUUID(id)) return json(400, { error: "invalid_attempt_id" });

    // 1) Ambil attempt header
    const { data: attempt, error: e1 } = await sb
      .from("quiz_attempts")
      .select(
        "id, user_id, mode, aircraft, category_root_slug, category_slug, include_descendants, duration_sec, question_count, correct_count, score, meta, created_at"
      )
      .eq("id", id)
      .maybeSingle();

    if (e1) {
      console.error("[quiz-attempt] fetch attempt error:", e1);
      return json(500, { error: "fetch_attempt_failed" });
    }
    if (!attempt) return json(404, { error: "attempt_not_found" });

    // 2) Ambil items
    const { data: items, error: e2 } = await sb
      .from("quiz_attempt_items")
      .select(
        "id, question_id, legacy_id, answer_index, correct_index, is_correct, time_spent_sec, tags, difficulty, category_path"
      )
      .eq("attempt_id", id)
      .order("id", { ascending: true });

    if (e2) {
      console.error("[quiz-attempt] fetch items error:", e2);
      return json(500, { error: "fetch_items_failed" });
    }

    let questionsById = null;
    if (includeQuestions && items.length) {
      const qids = [...new Set(items.map((it) => it.question_id))].slice(0, 500);
      const { data: qsData, error: e3 } = await sb
        .from("questions")
        .select(
          "id, question_text, question_image_url, choices, choice_images, explanations, answer_key, tags, difficulty"
        )
        .in("id", qids);

      if (e3) {
        console.warn("[quiz-attempt] fetch questions error (non-fatal):", e3);
      } else {
        questionsById = new Map(qsData.map((q) => [q.id, q]));
      }
    }

    // 3) Ringkasan kecil untuk UI
    const total = attempt.question_count ?? items.length;
    const correct = attempt.correct_count ?? items.filter((x) => x.is_correct).length;
    const accuracy = total ? Math.round((correct / total) * 10000) / 100 : 0;

    // 4) Compose response
    const outItems = items.map((it) => {
      const q = questionsById?.get(it.question_id);
      return includeQuestions && q
        ? { ...it, question: q }
        : it;
    });

    return json(200, {
      attempt: {
        id: attempt.id,
        mode: attempt.mode,
        aircraft: attempt.aircraft,
        category_root_slug: attempt.category_root_slug,
        category_slug: attempt.category_slug,
        include_descendants: attempt.include_descendants,
        duration_sec: attempt.duration_sec,
        question_count: total,
        correct_count: correct,
        score: attempt.score ?? accuracy,
        meta: attempt.meta || {},
        created_at: attempt.created_at,
      },
      items: outItems,
      stats: {
        accuracy_pct: accuracy,
        answered: total,
        correct,
      },
    });
  } catch (err) {
    console.error("[quiz-attempt] internal error:", err);
    return json(500, { error: "internal_error" });
  }
};
