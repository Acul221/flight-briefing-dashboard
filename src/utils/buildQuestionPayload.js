// src/utils/buildQuestionPayload.js
// Utility: build payload siap kirim ke API questions
// Catatan: support Category + SubCategory → otomatis mapping ke category_slugs & category_path

export function buildQuestionPayload(form) {
  if (!form) throw new Error("form is required");

  // Handle categories
  let category_slugs = [];
  let category_path = [];

  if (form.category) {
    category_slugs.push(form.category);
    if (form.subcategory) {
      category_slugs.push(form.subcategory);
      category_path.push(`${form.category} > ${form.subcategory}`);
    } else {
      category_path.push(form.category);
    }
  }

  return {
    id: form.id || null,
    legacy_id: form.legacy_id || null,

    // 🔹 Soal utama
    question_text: form.question_text || "",
    question_image_url: form.question_image_url || null,

    // 🔹 Pilihan
    choices: form.choices || { A: "", B: "", C: "", D: "" },
    choice_images: form.choice_images || [null, null, null, null],
    explanations: form.explanations || ["", "", "", ""],

    // 🔹 Kunci jawaban
    answer_key: form.answer_key || "A",

    // 🔹 Metadata
    difficulty: form.difficulty || "medium",
    source: form.source || null,
    status: form.status || "draft",
    aircraft: form.aircraft || null,

    // 🔹 Kategori
    category_slugs,
    category_path,

    // 🔹 Tags
    tags: Array.isArray(form.tags) ? form.tags : [],

    // 🔹 Explanation (opsional, legacy)
    explanation: form.explanation || null,
  };
}
