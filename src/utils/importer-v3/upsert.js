// src/utils/importer-v3/upsert.js
// Upsert canonical question via Supabase RPC with retry.

import { info, warn, error as logError } from "./logger.js";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * @param {object} payload
 * @param {{ supabaseUrl: string, serviceRoleKey: string, retries?: number }} options
 */
export async function upsertQuestion(payload, { supabaseUrl, serviceRoleKey, retries = 3 }) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE");
  }

  const endpoint = `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/rpc/fn_upsert_question_v3`;

  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({ p_question: payload }),
      });

      const txt = await res.text();
      if (!res.ok) {
        throw new Error(`rpc_failed_${res.status}_${txt || "no_body"}`);
      }

      const data = txt ? JSON.parse(txt) : null;
      info(`Upserted question`, payload.legacy_source?.id || payload.question);
      return data;
    } catch (err) {
      lastError = err;
      warn(`Upsert attempt ${attempt} failed`, err.message);
      if (attempt < retries) await sleep(500 * attempt);
    }
  }

  logError("Upsert failed after retries", lastError?.message || lastError);
  throw lastError;
}

export default upsertQuestion;
