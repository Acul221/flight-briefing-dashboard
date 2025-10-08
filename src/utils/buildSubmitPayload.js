// src/utils/buildSubmitPayload.js
export function buildSubmitPayload(form, { dryRun = false } = {}) {
  const tags = (form.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const payload = {
    legacy_id: form.id || undefined, // kosong = create baru
    question: form.question,
    choices: [
      { text: form.answers?.[0] || "" },
      { text: form.answers?.[1] || "" },
      { text: form.answers?.[2] || "" },
      { text: form.answers?.[3] || "" }
    ],
    explanations: [
      form.explanations?.[0] || "",
      form.explanations?.[1] || "",
      form.explanations?.[2] || "",
      form.explanations?.[3] || ""
    ],
    correctIndex: typeof form.correctIndex === "number" ? form.correctIndex : null,
    difficulty: (form.level || "medium").toLowerCase(), // easy|medium|hard
    tags,
    source: form.source || "",
    question_image_url: form.questionImage || null,
    choice_images: Array.isArray(form.choiceImages)
      ? [...form.choiceImages].slice(0, 4).concat([null, null, null, null]).slice(0, 4)
      : [null, null, null, null],
    aircraft: form.aircraft || null,
    category_path: [`${form.category || ""} > ${form.subcategory || ""}`]
  };

  const qs = dryRun ? "?dry=1" : "";
  return { payload, qs };
}

export function validateForm(form, { requiresAircraft = false } = {}) {
  const errs = [];
  if (!form.question?.trim()) errs.push("Question is required.");
  if (!Array.isArray(form.answers) || form.answers.length !== 4) errs.push("Answers must be 4 options (A–D).");
  if ((form.answers || []).some((x) => !x?.trim())) errs.push("All answer choices must be filled.");
  if (typeof form.correctIndex !== "number" || form.correctIndex < 0 || form.correctIndex > 3)
    errs.push("Correct must be one of A/B/C/D.");
  if (!form.category?.trim()) errs.push("Category is required.");
  if (!form.subcategory?.trim()) errs.push("SubCategory is required.");
  if (requiresAircraft && !form.aircraft?.trim()) errs.push("Aircraft is required for this category.");
  return errs;
}
