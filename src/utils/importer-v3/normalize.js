// src/utils/importer-v3/normalize.js
// Normalize mapped Notion values into canonical shapes.

const slugify = (s) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const toLen4 = (arr = [], fill = "") => {
  const safe = Array.isArray(arr) ? arr : [];
  return [...safe, fill, fill, fill, fill].slice(0, 4);
};

const splitPath = (raw) => {
  if (!raw) return [];
  return String(raw)
    .split(/>|\/|\|/g)
    .map((s) => s.trim())
    .filter(Boolean);
};

/**
 * @param {ReturnType<import('./map-notion').mapNotionPage>} mapped
 */
export function normalizeMapped(mapped) {
  const question = String(mapped.question || "").trim();
  const choices = toLen4(mapped.choices).map((c) => String(c || "").trim());
  const explanations = toLen4(mapped.explanations).map((e) => (e == null ? "" : String(e).trim()));
  const choice_images = toLen4(mapped.choice_images).map((img) => (img ? String(img) : null));

  const correctIndex = Number.isInteger(mapped.correctIndex) ? mapped.correctIndex : -1;

  const category_path = splitPath(mapped.category_path_raw);
  let category_slugs = Array.isArray(mapped.category_slugs_raw)
    ? mapped.category_slugs_raw.map(slugify).filter(Boolean)
    : [];
  if (!category_slugs.length && category_path.length) {
    category_slugs = category_path.map(slugify).filter(Boolean);
  }

  const aircraft = Array.isArray(mapped.aircraft) ? mapped.aircraft.map(slugify).filter(Boolean) : [];

  const access_tier_raw = String(mapped.access_tier || "free").toLowerCase();
  const access_tier = access_tier_raw === "pro" ? "pro" : "free";

  const status = String(mapped.status || "draft").toLowerCase();

  return {
    question,
    choices,
    explanations,
    correctIndex,
    question_image: mapped.question_image || null,
    choice_images,
    difficulty: (mapped.difficulty || "medium").toLowerCase(),
    category_slugs,
    category_path,
    requires_aircraft: !!mapped.requires_aircraft,
    aircraft,
    access_tier,
    exam_pool: !!mapped.exam_pool,
    status,
    domain: mapped.domain || null,
    subject: mapped.subject || null,
    subcategory: mapped.subcategory || null,
    ata: mapped.ata || null,
    source: mapped.source || null,
    metadata: {
      level: mapped.level || null,
      source_id: mapped.source_id,
    },
  };
}
