// src/lib/quizApi.js
const FN_BASE = (import.meta?.env?.VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, "");
const ENDPOINT = `${FN_BASE}/quiz-pull`;

export async function fetchQuestions({
  categorySlug,
  includeDescendants = true,
  difficulty,
  requiresAircraft = false,
  userTier,
} = {}) {
  const params = new URLSearchParams();
  if (categorySlug) params.set("category_slug", categorySlug);
  if (includeDescendants) params.set("include_descendants", "1");
  if (difficulty && difficulty !== "all") params.set("difficulty", difficulty);
  if (requiresAircraft) params.set("requires_aircraft", "true");
  if (userTier) params.set("user_tier", userTier);

  const url = `${ENDPOINT}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`quiz-pull failed (${res.status}): ${body || res.statusText}`);
  }
  const data = await res.json().catch(() => ({}));
  const rows = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  return rows.map((q) => {
    const correctIndex = q.correctIndex ?? q.correct_index ?? null;
    const choiceImages = Array.isArray(q.choice_images) ? q.choice_images : [null, null, null, null];
    const explanations = Array.isArray(q.explanations) ? q.explanations : ["", "", "", ""];

    return {
      ...q,
      correctIndex,
      question_text: q.question_text ?? q.question ?? "",
      question: q.question_text ?? q.question ?? "",
      question_image: q.question_image ?? null,
      choice_images: choiceImages,
      choiceImages,
      explanations,
    };
  });
}

export async function submitExamAttempt({ subjectSlug, answers } = {}) {
  const payload = { subject: subjectSlug, answers: answers || [] };
  const res = await fetch(`${FN_BASE}/exam-attempt`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`exam-attempt failed (${res.status}): ${txt || res.statusText}`);
  }
  return res.json().catch(() => ({ ok: true }));
}

export async function submitQuestionFlag({ questionId, reason, comment, meta } = {}) {
  const res = await fetch(`${FN_BASE}/question-flag`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      question_id: questionId,
      reason,
      comment,
      meta: meta || {},
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`question-flag failed (${res.status}): ${txt || res.statusText}`);
  }
  return res.json().catch(() => ({ ok: true }));
}

export async function fetchExamAttempts({ subjectSlug } = {}) {
  if (!subjectSlug) return [];
  const res = await fetch(`${FN_BASE}/exam-attempts?subject=${encodeURIComponent(subjectSlug)}`);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`exam-attempts failed (${res.status}): ${txt || res.statusText}`);
  }
  const data = await res.json().catch(() => ({}));
  return Array.isArray(data?.attempts) ? data.attempts : [];
}

export async function fetchQuestionFlags({ subjectSlug, resolved = null } = {}) {
  const params = new URLSearchParams();
  if (subjectSlug) params.set("subject", subjectSlug);
  if (resolved !== null) params.set("resolved", resolved ? "true" : "false");
  const res = await fetch(`${FN_BASE}/question-flags?${params.toString()}`);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`question-flags failed (${res.status}): ${txt || res.statusText}`);
  }
  const data = await res.json().catch(() => ({}));
  return Array.isArray(data?.flags) ? data.flags : [];
}

export async function resolveQuestionFlag(id) {
  const res = await fetch(`${FN_BASE}/question-flag-resolve`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`question-flag-resolve failed (${res.status}): ${txt || res.statusText}`);
  }
  return res.json().catch(() => ({ ok: true }));
}

export default { fetchQuestions, submitExamAttempt, submitQuestionFlag, fetchExamAttempts, fetchQuestionFlags, resolveQuestionFlag };
