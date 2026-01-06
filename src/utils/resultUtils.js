// src/utils/resultUtils.js
// Pure helper utilities for ResultPage and related quiz views

export const idxToLetter = (i) => ["A", "B", "C", "D"][i] ?? "-";

export const asArray4 = (arr, fill = null) => {
  const base = Array.isArray(arr) ? arr.slice(0, 4) : [];
  while (base.length < 4) base.push(fill);
  return base;
};

export function normalizeQuestion(q) {
  if (!q) return null;

  const answerIndex = Number.isInteger(q.correctIndex) ? q.correctIndex : 0;

  const choicesArr = Array.isArray(q.choices)
    ? q.choices
    : [q.choices?.A, q.choices?.B, q.choices?.C, q.choices?.D];

  return {
    id: q.id,
    question: q.question_text || "",
    question_image: q.question_image || null,
    choices: asArray4((choicesArr || []).map((c) => c ?? ""), ""),
    choiceImages: asArray4(q.choice_images, null),
    explanations: asArray4(q.explanations, ""),
    correctIndex: answerIndex >= 0 && answerIndex <= 3 ? answerIndex : 0,
    difficulty: q.difficulty || null,
  };
}

export function mmss(sec) {
  const s = Math.max(0, parseInt(sec || 0, 10));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
