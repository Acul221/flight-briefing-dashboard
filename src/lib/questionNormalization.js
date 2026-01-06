// Admin editor helper: normalization + simulated publish guards.
// Sprint 1 keeps publishing client-side only.
import { slugify, parseAircraft as parseAircraftTokens } from "@/lib/questionUtils";

const env =
  typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
const bypassAdminValidation =
  String(env.VITE_ADMIN_ROUTE_BYPASS || "").toLowerCase() === "true";

const LETTERS = ["A", "B", "C", "D"];

const ensureLength = (value, filler = "") => {
  const arr = Array.isArray(value) ? value.slice(0, 4) : [];
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
  const question = String(formState.question ?? formState.question_text ?? "").trim();

  const rawChoices =
    Array.isArray(formState.choices) && formState.choices.length === 4
      ? formState.choices
      : ensureLength(formState.answers ?? formState.choices, "");
  const choices = rawChoices.map((c) => String(c || "").trim());

  const explanations = ensureLength(formState.explanations ?? [], "").map((e) =>
    String(e || "").trim()
  );

  const choiceImages = ensureLength(formState.choice_images ?? [], null).map((img) =>
    img ? String(img) : null
  );

  const question_image = formState.question_image ?? null;

  const categorySlugs = [];
  const primaryCategorySlug = slugify(formState.category);
  if (primaryCategorySlug) categorySlugs.push(primaryCategorySlug);
  const subCategorySlug = slugify(formState.subcategory ?? formState.subCategory);
  if (subCategorySlug) categorySlugs.push(subCategorySlug);

  const requiresAircraft = !!(formState.requires_aircraft ?? formState.requiresAircraft);
  const aircraft = parseAircraftTokens(formState.aircraft ?? formState.aircraftRaw);

  const correctIndex = clampIndex(formState.correctIndex);

  const normalized = {
    question,
    choices,
    correctIndex,
    explanations,
    question_image: question_image || null,
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

  if (
    !bypassAdminValidation &&
    (!Array.isArray(normalized.category_slugs) || normalized.category_slugs.length === 0)
  ) {
    errors.category = "Pick at least one category.";
  }

  if (normalized.requires_aircraft && (!normalized.aircraft || normalized.aircraft.length === 0)) {
    errors.aircraft = "List at least one aircraft when required.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
