// src/utils/importer-v3/map-notion.js
// Map a Notion page object into a raw importer shape (no normalization/validation yet).

const P = {
  QUESTION: "Question",
  CHOICE_A: "Choice A",
  CHOICE_B: "Choice B",
  CHOICE_C: "Choice C",
  CHOICE_D: "Choice D",
  EXPL_A: "Explanation A",
  EXPL_B: "Explanation B",
  EXPL_C: "Explanation C",
  EXPL_D: "Explanation D",
  ANSWER_KEY: "Answer Key",
  QUESTION_IMAGE: "Question Image",
  CHOICE_A_IMAGE: "Choice A Image",
  CHOICE_B_IMAGE: "Choice B Image",
  CHOICE_C_IMAGE: "Choice C Image",
  CHOICE_D_IMAGE: "Choice D Image",
  DIFFICULTY: "Difficulty",
  LEVEL: "Level",
  CATEGORY_PATH: "Category Path",
  CATEGORY_SLUGS: "Category Slugs",
  TAGS: "Tags",
  AIRCRAFT: "Aircraft",
  REQUIRES_AC: "Requires Aircraft",
  ACCESS_TIER: "Access Tier",
  EXAM_POOL: "Exam Pool",
  STATUS: "Status",
  LEGACY_ID: "Legacy ID",
  DOMAIN: "Domain",
  SUBJECT: "Subject",
  SUBCATEGORY: "Subcategory",
  ATA: "ATA",
};

const ANSWER_LETTERS = ["A", "B", "C", "D"];

const text = (rich) =>
  Array.isArray(rich) ? rich.map((r) => r?.plain_text ?? "").join("").trim() : String(rich ?? "").trim();

const selectName = (sel) => sel?.name || "";
const multiNames = (arr = []) => arr.map((x) => x?.name || "").filter(Boolean);
const fileUrl = (arr = []) => arr?.[0]?.external?.url || arr?.[0]?.file?.url || null;
const checkboxVal = (v) => !!v;

function composePath({ domain, subject, subcategory, aircraft }) {
  const root = aircraft || "general";
  const mid = subject || domain || "general";
  return [root, mid, subcategory].filter(Boolean).join(" > ");
}

function parseAnswer(raw) {
  const letter = String(raw || "").trim().toUpperCase();
  return ANSWER_LETTERS.indexOf(letter);
}

/**
 * @param {import('@notionhq/client').APIPageObject} page
 * @returns {{ source_id: string, question: string, choices: string[], explanations: string[], correctIndex: number, question_image: string|null, choice_images: (string|null)[], difficulty: string|null, level: string|null, category_path_raw: string, category_slugs_raw: string[], requires_aircraft: boolean, aircraft: string[], access_tier: string, exam_pool: boolean, status: string, domain: string|null, subject: string|null, subcategory: string|null, ata: string|null }}
 */
export function mapNotionPage(page) {
  const props = page.properties || {};
  const g = (k) => props[k];

  const question = text(g(P.QUESTION)?.title);
  const choices = [
    text(g(P.CHOICE_A)?.rich_text),
    text(g(P.CHOICE_B)?.rich_text),
    text(g(P.CHOICE_C)?.rich_text),
    text(g(P.CHOICE_D)?.rich_text),
  ];
  const explanations = [
    text(g(P.EXPL_A)?.rich_text),
    text(g(P.EXPL_B)?.rich_text),
    text(g(P.EXPL_C)?.rich_text),
    text(g(P.EXPL_D)?.rich_text),
  ];

  const answerKey = selectName(g(P.ANSWER_KEY)?.select) || text(g(P.ANSWER_KEY)?.rich_text);
  const correctIndex = parseAnswer(answerKey);

  const question_image = fileUrl(g(P.QUESTION_IMAGE)?.files) || null;
  const choice_images = [
    fileUrl(g(P.CHOICE_A_IMAGE)?.files) || null,
    fileUrl(g(P.CHOICE_B_IMAGE)?.files) || null,
    fileUrl(g(P.CHOICE_C_IMAGE)?.files) || null,
    fileUrl(g(P.CHOICE_D_IMAGE)?.files) || null,
  ];

  const difficulty = selectName(g(P.DIFFICULTY)?.select) || null;
  const level = selectName(g(P.LEVEL)?.select) || null;
  const domain = selectName(g(P.DOMAIN)?.select) || null;
  const subject = selectName(g(P.SUBJECT)?.select) || null;
  const subcategory = text(g(P.SUBCATEGORY)?.rich_text) || null;
  const ata = text(g(P.ATA)?.rich_text) || null;

  const category_path_raw =
    text(g(P.CATEGORY_PATH)?.rich_text) ||
    composePath({ domain, subject, subcategory, aircraft: selectName(g(P.AIRCRAFT)?.select) });
  const category_slugs_raw = multiNames(g(P.CATEGORY_SLUGS)?.multi_select);
  const aircraft = multiNames(g(P.AIRCRAFT)?.multi_select);
  const requires_aircraft = checkboxVal(g(P.REQUIRES_AC)?.checkbox || g(P.AIRCRAFT)?.checkbox);

  const access_tier = selectName(g(P.ACCESS_TIER)?.select) || "free";
  const exam_pool = checkboxVal(g(P.EXAM_POOL)?.checkbox);
  const status = selectName(g(P.STATUS)?.select) || "draft";
  return {
    source_id: page.id,
    question,
    choices,
    explanations,
    correctIndex,
    question_image,
    choice_images,
    difficulty,
    level,
    category_path_raw,
    category_slugs_raw,
    requires_aircraft,
    aircraft,
    access_tier,
    exam_pool,
    status,
    domain,
    subject,
    subcategory,
    ata,
  };
}

export const NOTION_PROPS = P;
