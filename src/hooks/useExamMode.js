import { useCallback, useMemo, useState } from "react";
import { supabase } from "@/lib/apiClient"; // singleton kamu
import { logEvent } from "@/lib/analytics"; // sudah ada di project kamu

// Mulberry32: PRNG ringan berbasis seed (deterministic)
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffleDeterministic(arr, seed) {
  const rnd = mulberry32(Number(seed) >>> 0);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const ensureLen4 = (arr, fill) => {
  const base = Array.isArray(arr) ? arr.slice(0, 4) : [];
  while (base.length < 4) base.push(fill);
  return base;
};

export default function useExamMode() {
  const [attempt, setAttempt] = useState(null);     // { id, seed, ... }
  const [items, setItems] = useState([]);           // [{idx, question_id, ...}]
  const [questionList, setQuestionList] = useState([]); // normalized questions for runtime
  const [startedAt, setStartedAt] = useState(null);

  const startExam = useCallback(async ({
    categorySlug,
    includeDescendants = true,
    difficulty,
    aircraft,
    limit = 20,
    requiresAircraft = false,
    userTier = "free",
    timeLimitSec = 1200,  // default 20 menit
  }) => {
    // 1) Ambil soal (published) via API kamu
    const params = new URLSearchParams({
      category_slug: categorySlug,
      include_descendants: includeDescendants ? "1" : "0",
      limit: String(limit),
    });
    if (difficulty) params.set("difficulty", difficulty);
    if (requiresAircraft) params.set("requires_aircraft", "true");
    if (userTier) params.set("user_tier", userTier);

    const res = await fetch(`/.netlify/functions/quiz-pull?` + params.toString());
    if (!res.ok) throw new Error("Failed to pull questions");
    const data = await res.json(); // expected: { items: [{id, choices, correctIndex,...}], ... }

    // 2) Buat seed & urutkan deterministik (tambahan safety)
    const seed = Date.now(); // you can store userId-based salt later
    const pruned = (data.items || []).map((q) => ({
      id: q.id,
      question_text: q.question_text || "",
      question_image: q.question_image || null,
      choices: ensureLen4(q.choices, "").map((c) => String(c || "")),
      choice_images: ensureLen4(q.choice_images, null).map((u) => (u ? String(u) : null)),
      explanations: ensureLen4(q.explanations, "").map((e) => String(e || "")),
      correctIndex:
        Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : null,
    }));
    const ordered = shuffleDeterministic(pruned, seed);

    // 3) Create attempt (RLS: owner insert)
    const { data: ins, error } = await supabase
      .from("quiz_attempts")
      .insert({
        mode: "exam",
        category_slug: categorySlug,
        include_descendants: !!includeDescendants,
        difficulty: difficulty ?? null,
        aircraft: aircraft ?? null,
        limit_n: limit,
        seed,
        time_limit_sec: timeLimitSec,
        meta: { question_ids: ordered.map((q) => q.id) },
      })
      .select("*")
      .single();
    if (error) throw error;

    setAttempt(ins);
    setQuestionList(ordered);
    setItems([]);
    setStartedAt(performance.now());

    logEvent("exam_start", { attempt_id: ins.id, categorySlug, difficulty, aircraft, limit });
    return { attempt: ins, questions: ordered };
  }, []);

  const recordAnswer = useCallback(async ({ idx, question, selectedIndex, elapsedMs }) => {
    if (!attempt) throw new Error("No attempt");
    const correct = selectedIndex === question.correctIndex;

    const payload = {
      attempt_id: attempt.id,
      idx,
      question_id: question.id,
      selected_index: selectedIndex,
      correct,
      time_ms: Math.max(0, Math.floor(elapsedMs ?? 0)),
    };

    // upsert by PK (attempt_id, idx)
    const { data, error } = await supabase
      .from("quiz_attempt_items")
      .upsert(payload)
      .select("*")
      .single();
    if (error) throw error;

    setItems((prev) => {
      const next = prev.slice();
      const i = next.findIndex((x) => x.idx === idx);
      if (i >= 0) next[i] = data; else next.push(data);
      return next;
    });

    logEvent("exam_answer", {
      attempt_id: attempt.id,
      idx,
      question_id: question.id,
      correct,
    });
    return data;
  }, [attempt]);

  const finalizeExam = useCallback(async () => {
    if (!attempt) throw new Error("No attempt");
    // call RPC to finalize score
    const { data, error } = await supabase
      .rpc("fn_finalize_attempt", { p_attempt: attempt.id });
    if (error) throw error;

    const [res] = data ?? [];
    logEvent("exam_finish", { attempt_id: attempt.id, ...res });

    // refresh attempt
    const { data: updated } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("id", attempt.id)
      .single();
    setAttempt(updated ?? attempt);
    return { summary: res, attempt: updated ?? attempt };
  }, [attempt]);

  const state = useMemo(() => ({
    attempt,
    questionList,
    items,
    startedAt,
  }), [attempt, items, questionList, startedAt]);

  return { state, startExam, recordAnswer, finalizeExam };
}
