// netlify/functions/notion-db-props.js
/* eslint-disable no-console */
const { Client } = require("@notionhq/client");

const {
  ADMIN_API_SECRET,
  NOTION_TOKEN,
  NOTION_DB_MASTER,
  ADMIN_ALLOWED_ORIGIN,
} = process.env;

const notion = new Client({ auth: NOTION_TOKEN });

const CORS = {
  "Access-Control-Allow-Origin": ADMIN_ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-secret",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const json = (status, body) => ({ statusCode: status, headers: CORS, body: JSON.stringify(body) });

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
    if (event.httpMethod !== "GET") return json(405, { error: "method_not_allowed" });

    const xadm = event.headers?.["x-admin-secret"] || event.headers?.["X-Admin-Secret"];
    if (!xadm || xadm !== ADMIN_API_SECRET) return json(403, { error: "forbidden" });

    const db = await notion.databases.retrieve({ database_id: NOTION_DB_MASTER });
    const props = db.properties || {};

    // ringkas: nama → tipe
    const summary = Object.fromEntries(
      Object.entries(props).map(([name, def]) => [name, def?.type || "unknown"])
    );

    // deteksi properti kunci
    const titleName = Object.entries(props).find(([, p]) => p?.type === "title")?.[0] || null;
    const selects = Object.entries(props).filter(([, p]) => p?.type === "select").map(([n]) => n);
    const multiSelects = Object.entries(props).filter(([, p]) => p?.type === "multi_select").map(([n]) => n);

    return json(200, {
      database_id: db.id,
      title_property: titleName,
      select_properties: selects,
      multi_select_properties: multiSelects,
      all_properties: summary,
    });
  } catch (e) {
    console.error(e);
    return json(400, { error: e.message || String(e) });
  }
};
