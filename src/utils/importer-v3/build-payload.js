// src/utils/importer-v3/build-payload.js
// Build canonical payload for fn_upsert_question_v3.

/**
 * @param {ReturnType<import('./normalize').normalizeMapped>} normalized
 * @param {{ question_image: string|null, choice_images: (string|null)[], images_meta: any }} rehosted
 */
export function buildPayload(normalized, rehosted) {
  const now = new Date().toISOString();

  return {
    question_text: normalized.question,
    question_image: rehosted.question_image || null,
    choices: normalized.choices,
    choice_images: rehosted.choice_images || [],
    explanations: normalized.explanations,
    correctIndex: normalized.correctIndex,
    difficulty: normalized.difficulty,
    category_slugs: normalized.category_slugs,
    category_path: normalized.category_path,
    requires_aircraft: normalized.requires_aircraft,
    aircraft: normalized.aircraft,
    access_tier: normalized.access_tier,
    exam_pool: normalized.exam_pool,
    status: normalized.status,
    is_active: true,
    images_meta: rehosted.images_meta,
    domain: normalized.domain,
    subject: normalized.subject,
    subcategory: normalized.subcategory,
    ata: normalized.ata,
    source: normalized.source || "notion",
    metadata: {
      imported_at: now,
      ...normalized.metadata,
    },
  };
}

export default buildPayload;
