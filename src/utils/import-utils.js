// src/utils/import-utils.js
// Helpers for importer dry-run/apply: normalization and validation.

const toSlug = (s) =>
  String(s || "")
    .toLowerCase()
    .split(/>|\/|\|/)
    .map((part) => part.trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))
    .filter(Boolean);

export function normalizeRow(input = {}) {
  const choices = [
    input["Choice A"] ?? input.choiceA ?? input.choice_a ?? input.choices?.[0],
    input["Choice B"] ?? input.choiceB ?? input.choice_b ?? input.choices?.[1],
    input["Choice C"] ?? input.choiceC ?? input.choice_c ?? input.choices?.[2],
    input["Choice D"] ?? input.choiceD ?? input.choice_d ?? input.choices?.[3],
  ].map((c) => (c == null ? "" : String(c)));

  const correctIndex =
    typeof input.correctIndex === "number"
      ? input.correctIndex
      : ["A", "B", "C", "D"].indexOf(String(input.correct || "").trim().toUpperCase());

  const categoryPathRaw = input["Category Path"] || input.category_path || "";
  const category_slugs =
    Array.isArray(input.category_slugs) && input.category_slugs.length
      ? input.category_slugs
      : toSlug(categoryPathRaw);

  return {
    question_text: String(input.question || input.question_text || "").trim(),
    choices,
    correctIndex,
    choice_images: Array.isArray(input.choice_images)
      ? input.choice_images.slice(0, 4)
      : [null, null, null, null],
    explanations: Array.isArray(input.explanations)
      ? [...input.explanations, "", "", "", ""].slice(0, 4)
      : ["", "", "", ""],
    category_slugs,
    access_tier: input.access_tier || "free",
    question_image: input.question_image || null,
    source: input.source || null,
  };
}

export function validateCanonical(row) {
  const errors = [];
  if (!row.question_text?.trim()) errors.push("question_text missing");
  if (!Array.isArray(row.choices) || row.choices.length !== 4 || row.choices.some((c) => !String(c || "").trim())) {
    errors.push("choices must have 4 non-empty items");
  }
  if (!(Number.isInteger(row.correctIndex) && row.correctIndex >= 0 && row.correctIndex <= 3)) {
    errors.push("correctIndex must be 0..3");
  }
  if (!Array.isArray(row.category_slugs) || row.category_slugs.length === 0) {
    errors.push("category_slugs required");
  }
  return { ok: errors.length === 0, errors };
}
