// src/lib/notion-db-props.js
// Mapping properti Notion v3 untuk SkyDeckPro_Master_Questions_v3

export const PROPS = {
  QUESTION: "Question",
  CHOICE_A: "Choice A",
  CHOICE_B: "Choice B",
  CHOICE_C: "Choice C",
  CHOICE_D: "Choice D",
  ANSWER_KEY: "Answer Key",
  EXPL_A: "Explanation A",
  EXPL_B: "Explanation B",
  EXPL_C: "Explanation C",
  EXPL_D: "Explanation D",

  IMG_Q: "Question Image",
  IMG_A: "Choice A Image",
  IMG_B: "Choice B Image",
  IMG_C: "Choice C Image",
  IMG_D: "Choice D Image",

  AIRCRAFT: "Aircraft",
  DOMAIN: "Domain",
  SUBJECT: "Subject",
  SUBCATEGORY: "Subcategory",
  ATA: "ATA",
  LEVEL: "Level",
  DIFFICULTY: "Difficulty",
  SOURCE: "Source",

  ACCESS_TIER: "Access Tier", // free | pro
  EXAM_POOL: "Exam Pool",     // checkbox

  CAT_ROOT: "Category Root",
  CAT_PATH: "Category Path",
  TAGS: "Tags",

  LEGACY_ID: "Legacy ID",
  STATUS: "Status",           // draft | published | archived
  IS_ACTIVE: "Is Active",     // checkbox
  QC_CHECK: "QC Checklist",   // checkbox
};

export const ANSWER_KEYS = new Set(["A","B","C","D"]);
export const DIFFICULTIES = new Set(["Easy","Medium","Hard"]);
export const LEVELS = new Set(["PPL","CPL","ATPL","Basic","Intermediate","Advanced"]);
export const ACCESS = new Set(["free","pro"]);
export const STATUS = new Set(["draft","published","archived"]);
