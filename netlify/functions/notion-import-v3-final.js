// netlify/functions/notion-import-v3-final.js
// SkyDeckPro Notion Importer V3 (modular, canonical schema)

import { Client } from "@notionhq/client";
import { mapNotionPage } from "../../src/utils/importer-v3/map-notion.js";
import { normalizeMapped } from "../../src/utils/importer-v3/normalize.js";
import { validateCanonical } from "../../src/utils/importer-v3/validate.js";
import { rehostImages } from "../../src/utils/importer-v3/rehost-images.js";
import { buildPayload } from "../../src/utils/importer-v3/build-payload.js";
import { upsertQuestion } from "../../src/utils/importer-v3/upsert.js";
import { info, warn, error as logError, success } from "../../src/utils/importer-v3/logger.js";

const {
  NOTION_TOKEN,
  NOTION_DB_QUESTION,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE,
} = process.env;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Secret, x-admin-secret",
  "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
  "Content-Type": "application/json",
};
const json = (status, body) => ({ statusCode: status, headers: CORS, body: JSON.stringify(body) });

const notion = new Client({ auth: NOTION_TOKEN });

const titlePreview = (s = "", len = 80) => {
  const str = String(s || "").trim();
  return str.length > len ? `${str.slice(0, len)}...` : str;
};

async function queryNotion(database_id, page_size, start_cursor) {
  return notion.databases.query({
    database_id,
    page_size,
    start_cursor,
    sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
  });
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204, { ok: true });
  if (!["POST", "GET"].includes(event.httpMethod)) return json(405, { error: "method_not_allowed" });

  try {
    if (!NOTION_TOKEN || !NOTION_DB_QUESTION) throw new Error("Missing NOTION_TOKEN or NOTION_DB_QUESTION");

    const qs = event.queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : {};

    const dryParam = qs.dryrun ?? qs.dry_run ?? body.dryrun ?? body.dry_run ?? body.dryRun;
    const dryRun = String(dryParam || "").toLowerCase() === "true";
    const limitRaw = Number(body.limit || qs.limit || 50);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 200)) : 50;
    let start_cursor = body.start_cursor || qs.start_cursor || undefined;

    const summary = { total: 0, valid: 0, errors: 0, needs_review: 0 };
    const rows = [];

    info(`Starting Notion import v3 final`, { dryRun, limit });

    while (summary.total < limit) {
      const resp = await queryNotion(NOTION_DB_QUESTION, Math.min(50, limit - summary.total), start_cursor);
      start_cursor = resp.has_more ? resp.next_cursor : undefined;

      for (const page of resp.results || []) {
        if (summary.total >= limit) break;

        const mapped = mapNotionPage(page);
        const normalized = normalizeMapped(mapped);
        const validation = validateCanonical(normalized);

        const baseRow = {
          row_index: summary.total,
          source_id: mapped.source_id,
          title_preview: titlePreview(normalized.question),
          suggested_category_slugs: normalized.category_slugs,
          would_create_categories: normalized.category_slugs,
        };

        if (!validation.valid) {
          rows.push({ ...baseRow, status: "error", errors: validation.errors });
          summary.errors += 1;
          summary.total += 1;
          continue;
        }

        if (dryRun) {
          const wouldCreate = (mapped.category_slugs_raw || []).length ? [] : normalized.category_slugs;
          const needsReview = wouldCreate.length > 0 ? 1 : 0;
          summary.needs_review += needsReview;
          summary.valid += 1;
          summary.total += 1;
          rows.push({
            ...baseRow,
            status: needsReview ? "needs_review" : "ok",
            would_create_categories: wouldCreate,
            errors: [],
          });
          continue;
        }

        try {
          const rehosted = await rehostImages(normalized, { dryRun: false });
          const payload = buildPayload(normalized, rehosted);
          await upsertQuestion(payload, {
            supabaseUrl: SUPABASE_URL,
            serviceRoleKey: SUPABASE_SERVICE_ROLE,
          });
          rows.push({ ...baseRow, status: "imported", errors: [] });
          summary.valid += 1;
          success("Imported", mapped.source_id);
        } catch (err) {
          rows.push({ ...baseRow, status: "error", errors: [err.message || "unknown_error"] });
          summary.errors += 1;
          logError("Import error", err);
        }
        summary.total += 1;
      }

      if (!start_cursor) break;
    }

    const response = {
      dryRun,
      summary,
      rows,
      next_cursor: start_cursor || null,
    };

    return json(200, response);
  } catch (err) {
    logError("notion-import-v3-final error", err);
    return json(500, { error: err.message || "internal_error" });
  }
};
