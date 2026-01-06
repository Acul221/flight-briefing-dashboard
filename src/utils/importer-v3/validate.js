// src/utils/importer-v3/validate.js
// Validation for canonical importer shape.

/**
 * @param {ReturnType<import('./normalize').normalizeMapped>} row
 */
export function validateCanonical(row) {
  const errors = [];

  if (!row.question || !row.question.trim()) errors.push("question_missing");

  if (!Array.isArray(row.choices) || row.choices.length !== 4 || row.choices.some((c) => !String(c || "").trim())) {
    errors.push("choices_invalid");
  }

  if (!(Number.isInteger(row.correctIndex) && row.correctIndex >= 0 && row.correctIndex <= 3)) {
    errors.push("correctIndex_invalid");
  } else if (!row.choices?.[row.correctIndex]) {
    errors.push("correctIndex_missing_choice");
  }

  if (!Array.isArray(row.category_slugs) || row.category_slugs.length === 0) {
    errors.push("category_slugs_required");
  }

  if (row.requires_aircraft && (!Array.isArray(row.aircraft) || row.aircraft.length === 0)) {
    errors.push("aircraft_required_when_requires_aircraft");
  }

  if (!Array.isArray(row.explanations) || row.explanations.length !== 4) {
    errors.push("explanations_length_invalid");
  }
  if (!Array.isArray(row.choice_images) || row.choice_images.length !== 4) {
    errors.push("choice_images_length_invalid");
  }

  return { valid: errors.length === 0, errors };
}

export default validateCanonical;
