// src/utils/importer-v3/rehost-images.js
// Rehost question and choice images to Supabase Storage (or dev stub).

import { rehostImage } from "../rehostImage.js";

/**
 * @param {{ question_image: string|null, choice_images: (string|null)[] }} row
 * @param {{ dryRun?: boolean }} options
 */
export async function rehostImages(row, { dryRun = false } = {}) {
  if (dryRun) {
    return {
      question_image: row.question_image || null,
      choice_images: Array.isArray(row.choice_images) ? row.choice_images : [null, null, null, null],
      images_meta: {
        question: { mode: "dry-run" },
        choices: (row.choice_images || []).map(() => ({ mode: "dry-run" })),
      },
    };
  }

  const question = await rehostImage(row.question_image);
  const choices = await Promise.all((row.choice_images || []).map((img) => rehostImage(img)));

  return {
    question_image: question.url,
    choice_images: choices.map((c) => c.url),
    images_meta: {
      question: question.meta,
      choices: choices.map((c) => c.meta),
    },
  };
}

export default rehostImages;
