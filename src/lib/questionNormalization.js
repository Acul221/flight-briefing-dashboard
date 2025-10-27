// Admin editor helper: normalization + simulated publish guards.
// Sprint 1 keeps publishing client-side only.
import { slugify, mapAnswerKey, parseAircraft as parseAircraftTokens } from "@/lib/questionUtils";

const LETTERS = ["A", "B", "C", "D"];

const ensureLength = (value, filler = "") => {
  const arr = Array.isArray(value)
    ? value.slice(0, 4)
    : typeof value === "object" && value !== null
    ? LETTERS.map((L) => value[L] ?? "")
    : [];
  while (arr.length < 4) arr.push(filler);
  return arr;
};

const clampIndex = (value) => {
  if (!Number.isInteger(value)) return null;
  if (value < 0) return 0;
  if (value > 3) return 3;
  return value;
};

export function buildNormalizedQuestion(formState = {}) {
  const question = String(
    formState.question ??
      formState.question_text ??
      formState.questionText ??
      ""
  ).trim();

  const rawChoices =
    Array.isArray(formState.choices) && formState.choices.length === 4
      ? formState.choices
      : ensureLength(formState.answers ?? formState.choices, "");
  const choices = rawChoices.map((c) => String(c || "").trim());

  const explanations = ensureLength(formState.explanations ?? [], "").map((e) =>
    String(e || "").trim()
  );

  const choiceImages = ensureLength(
    formState.choice_images ?? formState.choiceImages ?? [],
    null
  ).map((img) => (img ? String(img) : null));

  const questionImage =
    formState.question_image ??
    formState.questionImage ??
    formState.question_image_url ??
    formState.questionImageUrl ??
    null;

  const categorySlugs = [];
  const primaryCategorySlug = slugify(formState.category);
  if (primaryCategorySlug) categorySlugs.push(primaryCategorySlug);
  const subCategorySlug = slugify(formState.subcategory ?? formState.subCategory);
  if (subCategorySlug) categorySlugs.push(subCategorySlug);

  const requiresAircraft = !!(formState.requires_aircraft ?? formState.requiresAircraft);
  const aircraft = parseAircraftTokens(formState.aircraft ?? formState.aircraftRaw);

  let correctIndex = clampIndex(formState.correctIndex);
  if (correctIndex === null) {
    const mapped = mapAnswerKey(formState.answer_key ?? formState.answerKey);
    correctIndex = mapped ?? 0;
  }

  const normalized = {
    question,
    choices,
    correctIndex,
    explanations,
    question_image: questionImage || null,
    choice_images: choiceImages,
    difficulty: String(formState.difficulty ?? formState.level ?? "medium").trim() || "medium",
    category_slugs: categorySlugs,
    access_tier: formState.access_tier ?? formState.accessTier ?? null,
    requires_aircraft: requiresAircraft,
    aircraft,
    status: String(formState.status ?? "").trim() || "draft",
  };

  return normalized;
}

export function validateNormalizedQuestion(normalized) {
  const errors = {};
  if (!normalized.question?.trim()) {
    errors.question = "Question text is required.";
  }

  if (!Array.isArray(normalized.choices) || normalized.choices.length !== 4) {
    errors.choices = "Four answer choices are required.";
  } else {
    normalized.choices.forEach((choice, idx) => {
      if (!String(choice || "").trim()) {
        errors[`choices.${idx}`] = `Choice ${LETTERS[idx]} is required.`;
      }
    });
    if (!errors.choices && Object.keys(errors).some((key) => key.startsWith("choices."))) {
      errors.choices = "Fill in all answer choices.";
    }
  }

  if (
    !Number.isInteger(normalized.correctIndex) ||
    normalized.correctIndex < 0 ||
    normalized.correctIndex > 3 ||
    !String(normalized.choices?.[normalized.correctIndex] || "").trim()
  ) {
    errors.correctIndex = "Select a valid correct answer.";
  }

  if (!Array.isArray(normalized.category_slugs) || normalized.category_slugs.length === 0) {
    errors.category = "Pick at least one category.";
  }

  if (normalized.requires_aircraft && (!normalized.aircraft || normalized.aircraft.length === 0)) {
    errors.aircraft = "List at least one aircraft when required.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
