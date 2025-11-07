/* netlify/functions/notion-import-v3.js */
/* eslint-disable no-console */
const { Client } = require("@notionhq/client");

const {
  NOTION_TOKEN,
  NOTION_DB_QUESTION,   // ✅ v3 DB
  NOTION_DB_MASTER,     // legacy (fallback)
  ADMIN_API_SECRET,     // untuk insert ke /questions
  VITE_FUNCTIONS_BASE,  // optional; default "/.netlify/functions"
  PUBLIC_BASE_URL,      // optional; override base URL absolut
} = process.env;

const FUNCTIONS_BASE = (VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, "");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Secret, x-admin-secret",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json",
};
const json = (s, b) => ({ statusCode: s, headers: CORS, body: JSON.stringify(b) });

/** ===== PROPS (Notion Schema v3) — inline agar aman bundling ===== */
const P = {
  QUESTION: "Question",
  CHOICE_A: "Choice A", CHOICE_B: "Choice B", CHOICE_C: "Choice C", CHOICE_D: "Choice D",
  ANSWER_KEY: "Answer Key",
  EXPL_A: "Explanation A", EXPL_B: "Explanation B", EXPL_C: "Explanation C", EXPL_D: "Explanation D",
  IMG_Q: "Question Image", IMG_A: "Choice A Image", IMG_B: "Choice B Image",
  IMG_C: "Choice C Image", IMG_D: "Choice D Image",

  AIRCRAFT: "Aircraft",
  DOMAIN: "Domain",
  SUBJECT: "Subject",
  SUBCATEGORY: "Subcategory",
  ATA: "ATA",
  LEVEL: "Level",
  DIFFICULTY: "Difficulty",
  SOURCE: "Source",

  ACCESS_TIER: "Access Tier",   // free | pro
  EXAM_POOL: "Exam Pool",       // checkbox

  CAT_ROOT: "Category Root",
  CAT_PATH: "Category Path",
  CAT_SLUGS: "Category Slugs",
  TAGS: "Tags",

  LEGACY_ID: "Legacy ID",
  STATUS: "Status",             // draft | published | archived
  IS_ACTIVE: "Is Active",       // checkbox
  QC_CHECK: "QC Checklist",     // checkbox
};

/** ===== Utils ===== */
const notion = new Client({
  auth: NOTION_TOKEN,
  // Saat API baru rilis penuh: notionVersion: "2025-09-03",
});

const text = (rt = []) =>
  Array.isArray(rt) ? rt.map(t => t?.plain_text ?? "").join("").trim() : String(rt || "").trim();
const sel = (s) => s?.name || "";
const msel = (a = []) => a.map(x => x?.name).filter(Boolean);
const files = (a = []) => (a[0]?.external?.url || a[0]?.file?.url || "") || "";
const slug = (s) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function composePath({ root, domain, subject, subcat, ata }) {
  const mid = subject ? `${ata ? ata + "-" : ""}${subject}` : (domain || "General");
  return `${root || "General"} > ${mid}${subcat ? " > " + subcat : ""}`;
}

function parseStringList(raw) {
  if (raw === undefined || raw === null) {
    return { values: [], hadInput: false, invalid: false };
  }

  const result = { values: [], hadInput: false, invalid: false };
  const push = (value) => {
    const v = String(value ?? "").trim();
    if (v) {
      result.values.push(v);
    } else if (value !== undefined && value !== null) {
      result.invalid = true;
    }
  };
  const handleArray = (arr) => {
    if (!Array.isArray(arr)) return false;
    if (arr.length) result.hadInput = true;
    for (const item of arr) {
      if (typeof item === "string") {
        push(item);
      } else if (item && typeof item === "object") {
        if (typeof item.plain_text === "string") {
          push(item.plain_text);
        } else if (typeof item.content === "string") {
          push(item.content);
        } else if (typeof item.name === "string") {
          push(item.name);
        } else if (typeof item.text === "string") {
          push(item.text);
        } else if (Array.isArray(item)) {
          handleArray(item);
        } else if (item.type && item[item.type]) {
          const nested = item[item.type];
          if (typeof nested === "string") {
            push(nested);
          } else if (nested && typeof nested === "object" && typeof nested.plain_text === "string") {
            push(nested.plain_text);
          } else {
            result.invalid = true;
          }
        } else {
          result.invalid = true;
        }
      } else if (item !== undefined && item !== null) {
        result.invalid = true;
      }
    }
    return true;
  };

  if (handleArray(raw)) return result;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.length) result.hadInput = true;
    if (!trimmed.length) return result;
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        const nested = parseStringList(parsed);
        nested.hadInput = true;
        return nested;
      } catch {
        return { values: [], hadInput: true, invalid: true };
      }
    }
    const delim = [",", ">", "/", "|"].find((d) => trimmed.includes(d));
    if (delim) {
      trimmed.split(delim).forEach(push);
    } else {
      push(trimmed);
    }
    return result;
  }

  if (typeof raw === "object") {
    if (raw.multi_select) return parseStringList(raw.multi_select);
    if (raw.rich_text) return parseStringList(raw.rich_text);
    if (raw.title) return parseStringList(raw.title);
    if (raw.results) return parseStringList(raw.results);
    if (typeof raw.name === "string") {
      result.hadInput = true;
      push(raw.name);
      return result;
    }
    return { values: [], hadInput: true, invalid: true };
  }

  return { values: [], hadInput: true, invalid: true };
}

/** Page → payload */
function mapPage(p) {
  const pageId = p.id;
  const pr = p.properties || {};
  const g = (k) => pr[k];

  const question_text = text(g(P.QUESTION)?.title);

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
  const answer_key = (sel(g(P.ANSWER_KEY)?.select) || "").toUpperCase();

  const imgQ = files(g(P.IMG_Q)?.files);
  const imgA = files(g(P.IMG_A)?.files);
  const imgB = files(g(P.IMG_B)?.files);
  const imgC = files(g(P.IMG_C)?.files);
  const imgD = files(g(P.IMG_D)?.files);

  const aircraft = sel(g(P.AIRCRAFT)?.select);
  const domain   = sel(g(P.DOMAIN)?.select);
  const subject  = sel(g(P.SUBJECT)?.select);
  const subcat   = text(g(P.SUBCATEGORY)?.rich_text);
  const ata      = text(g(P.ATA)?.rich_text);

  const level      = sel(g(P.LEVEL)?.select);
  const difficulty = sel(g(P.DIFFICULTY)?.select);
  const source     = text(g(P.SOURCE)?.rich_text);

  const accessTier = sel(g(P.ACCESS_TIER)?.select) || "pro";
  const examPool   = !!g(P.EXAM_POOL)?.checkbox;

  const root = sel(g(P.CAT_ROOT)?.select) || aircraft || "General";
  let cpath  = text(g(P.CAT_PATH)?.rich_text) || composePath({ root, domain, subject, subcat, ata });

  const tags    = msel(g(P.TAGS)?.multi_select);
  const legacy  = text(g(P.LEGACY_ID)?.rich_text) || null;
  const status  = sel(g(P.STATUS)?.select) || "draft";
  const active  = !!g(P.IS_ACTIVE)?.checkbox;
  const qc_ok   = !!g(P.QC_CHECK)?.checkbox;

  // Validasi minimal
  const problems = [];
  if (!question_text) problems.push("question_empty");
  if (!choices.every(x => x && x.trim().length)) problems.push("choices_incomplete");
  if (!["A", "B", "C", "D"].includes(answer_key)) problems.push("invalid_answer_key");

  const pathParsed = parseStringList(g(P.CAT_PATH));
  let category_path = Array.isArray(pathParsed.values) && pathParsed.values.length
    ? pathParsed.values
    : parseStringList(cpath).values;
  if (!Array.isArray(category_path)) category_path = [];
  category_path = category_path.map((s) => String(s).trim()).filter(Boolean);
  if (!category_path.length) {
    category_path = parseStringList(composePath({ root, domain, subject, subcat, ata })).values;
    category_path = Array.isArray(category_path) ? category_path.map((s) => String(s).trim()).filter(Boolean) : [];
  }

  const catSlugsProp = g(P.CAT_SLUGS);
  const slugsParsed = parseStringList(catSlugsProp);
  let category_slugs = Array.isArray(slugsParsed.values)
    ? slugsParsed.values.map((s) => slug(s)).filter(Boolean)
    : [];
  if (!category_slugs.length) {
    category_slugs = category_path.map((s) => slug(s)).filter(Boolean);
  }
  if (!Array.isArray(category_slugs)) category_slugs = [];
  if (!category_path.length && category_slugs.length) {
    category_path = [...category_slugs];
  }
  const conversionFailed = (slugsParsed.hadInput && !category_slugs.length) || slugsParsed.invalid;
  if (conversionFailed) {
    console.warn(`[WARN] Invalid category_slugs for ${pageId}:`, catSlugsProp);
  }

  const payload = {
    question_text,
    question_image_url: imgQ || null,
    choices,
    choice_images: [imgA || null, imgB || null, imgC || null, imgD || null],
    explanations,
    answer_key,
    difficulty: difficulty || null,
    source: source || null,
    tags,
    aircraft: aircraft || null,
    category_path,
    category_slugs,
    category_path_json: JSON.stringify(category_slugs),
    status,
    legacy_id: legacy, // null untuk soal baru
    meta: {
      level: level || null,
      access_tier: accessTier,
      exam_pool: !!examPool,
      ata: ata || null,
      domain: domain || null,
      subject: subject || null,
      subcategory: subcat || null,
      is_active: !!active,
      qc_ok: !!qc_ok,
    },
  };

  return { payload, problems };
}

/** Insert ke backend existing — gunakan URL absolut */
async function postQuestion(payload, baseUrl) {
  const endpoint = `${baseUrl}${FUNCTIONS_BASE}/questions`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "x-admin-secret": ADMIN_API_SECRET || "",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`insert_failed ${res.status} ${txt}`);
  }
  return res.json();
}

/** ===== Handler ===== */
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  try {
    // Enforce v3-only (NOTION_DB_QUESTION)
    const databaseId = NOTION_DB_QUESTION;
    if (!NOTION_TOKEN || !databaseId) {
      throw new Error("Missing NOTION_TOKEN or NOTION_DB_QUESTION");
    }

    // Bangun absolute base URL untuk memanggil function lain
    const proto = (event.headers["x-forwarded-proto"] || event.headers["X-Forwarded-Proto"] || "http").split(",")[0].trim();
    const host  = event.headers.host || event.headers.Host || "localhost:8888";
    const baseUrl = (PUBLIC_BASE_URL && PUBLIC_BASE_URL.trim()) || `${proto}://${host}`;

    const body   = event.body ? JSON.parse(event.body) : {};
    const limit  = Number(body.limit || 50);
    const dryRun = body.dry_run !== false; // default: true

    let cursor;
    let imported = 0;
    const results = [];
    let ok = 0, sk = 0, er = 0;

    do {
      const resp = await notion.databases.query({
        database_id: databaseId,
        page_size: Math.min(limit - imported, 50),
        start_cursor: cursor,
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      });

      for (const page of resp.results || []) {
        if (imported >= limit) break;

        const { payload, problems } = mapPage(page);
        if (payload.question_text && Array.isArray(payload.category_slugs) && payload.category_slugs.length === 0) {
          const preview = payload.question_text.length > 40
            ? `${payload.question_text.slice(0, 40)}...`
            : payload.question_text;
          console.log(`[SKIP] No valid category slugs for ${page.id} (${preview})`);
        }

        if (problems.length) {
          results.push({ id: page.id, status: "skip", problems });
          sk++; imported++; continue;
        }

        if (dryRun) {
          results.push({
            id: page.id,
            status: "ok",
            dry_run: true,
            slug: payload.category_slugs.join("/"),
          });
          ok++; imported++; continue;
        }

        try {
          await postQuestion(payload, baseUrl);
          results.push({ id: page.id, status: "ok" });
          ok++;
        } catch (e) {
          results.push({ id: page.id, status: "error", error: e.message });
          er++;
        }
        imported++;
      }

      cursor = resp.has_more ? resp.next_cursor : undefined;
    } while (cursor && imported < limit);

    return json(200, {
      dryRun,
      imported,
      summary: { ok, skipped: sk, error: er },
      items: results,
      meta: { databaseIdUsed: databaseId, baseUrlUsed: baseUrl },
    });
  } catch (e) {
    console.error("notion-import-v3 error:", e);
    return json(500, { error: e.message || "internal_error" });
  }
};
