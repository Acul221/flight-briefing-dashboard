// netlify/functions/ai-proxy.js
// SkyDeckPro — AI Proxy (LLM usage logger)
// - Proxy panggilan ke OpenAI Chat Completions
// - Hitung biaya berdasarkan tabel `pricing_models`
// - Simpan log ke `ai_usage` (Supabase, bypass RLS pakai SERVICE ROLE)

import { createClient } from "@supabase/supabase-js";

/**
 * ======== ENV yang diperlukan di Netlify ========
 * SUPABASE_URL                -> https://<project>.supabase.co
 * SUPABASE_SERVICE_ROLE       -> service role key (server-side ONLY)
 * OPENAI_API_KEY (atau GPT_API_KEY sebagai fallback)
 * DEBUG_AI_PROXY=true         -> (opsional) log tambahan di function logs
 * =================================================
 */
// netlify/functions/ai-proxy.js

// ======= ENV =======
const OPENAI_KEY = process.env.GPT_API_KEY || process.env.OPENAI_API_KEY;
const PPLX_KEY = process.env.PERPLEXITY_API_KEY;
const SB_URL = process.env.SUPABASE_URL;
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE;
const DEBUG = String(process.env.DEBUG_AI_PROXY || "").toLowerCase() === "true";

const ALLOWED_ORIGIN =
  process.env.ADMIN_ALLOWED_ORIGIN ||
  process.env.PUBLIC_ALLOWED_ORIGIN ||
  "*";

// ======= Helpers =======
const CORS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResp = (status, body, extraHeaders = {}) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json", ...CORS, ...extraHeaders },
  body: JSON.stringify(body),
});

const safeJson = async (resp) => {
  try {
    return await resp.json();
  } catch {
    return null;
  }
};

// Supabase REST call
async function sb(path, { method = "GET", body } = {}) {
  const url = `${SB_URL}/rest/v1/${path}`;
  const headers = {
    apikey: SB_SERVICE_KEY,
    Authorization: `Bearer ${SB_SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await safeJson(res);
  if (!res.ok) {
    throw new Error(
      `Supabase ${method} ${path} ${res.status}: ${JSON.stringify(json)}`
    );
  }
  return json;
}

// Get pricing for provider+model
async function getPricing(provider, model) {
  const q = `pricing_models?select=provider,model,input_cost_usd,output_cost_usd,flat_cost_usd,active&provider=eq.${encodeURIComponent(
    provider
  )}&model=eq.${encodeURIComponent(model)}&limit=1`;
  const rows = await sb(q);
  return rows?.[0] || null;
}

// Calculate cost in USD
function calcCostUSD(usage, pricing) {
  if (!pricing || pricing.active === false) return 0;
  const inCost = Number(pricing.input_cost_usd || 0);
  const outCost = Number(pricing.output_cost_usd || 0);
  const flat = Number(pricing.flat_cost_usd || 0);
  const pt = Number(usage?.prompt_tokens || 0);
  const ct = Number(usage?.completion_tokens || 0);
  const cost =
    (pt / 1000) * inCost + (ct / 1000) * outCost + (isNaN(flat) ? 0 : flat);
  // keep 6 decimals
  return Math.round(cost * 1e6) / 1e6;
}

// Insert usage row
async function logUsage({
  feature,
  provider,
  model,
  request_id,
  user_id = null,
  prompt_tokens = 0,
  completion_tokens = 0,
  total_tokens = null,
  cost_usd = 0,
  meta = {},
}) {
  const row = {
    feature,
    provider,
    model,
    request_id,
    user_id,
    prompt_tokens,
    completion_tokens,
    total_tokens:
      total_tokens != null ? total_tokens : Number(prompt_tokens) + Number(completion_tokens),
    cost_usd,
    meta,
  };
  // Prefer: return=representation to help debugging
  await sb("ai_usage", {
    method: "POST",
    body: row,
  });
}

// ======= Provider Calls =======
async function callOpenAI(model, body) {
  if (!OPENAI_KEY) throw new Error("Missing GPT_API_KEY / OPENAI_API_KEY");

  const url =
    "https://api.openai.com/v1/chat/completions"; // Chat endpoint (4o/mini compatible)
  const reqBody = { model, ...body };

  const t0 = Date.now();
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reqBody),
  });
  const json = await safeJson(resp);
  const latency = Date.now() - t0;
  return { resp, json, latency };
}

async function callPerplexity(model, body) {
  if (!PPLX_KEY) throw new Error("Missing PERPLEXITY_API_KEY");

  const url = "https://api.perplexity.ai/chat/completions";
  const reqBody = { model, ...body };

  const t0 = Date.now();
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PPLX_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reqBody),
  });
  const json = await safeJson(resp);
  const latency = Date.now() - t0;
  return { resp, json, latency };
}

// ======= Handler =======
exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers: CORS, body: "" };
    }
    if (event.httpMethod !== "POST") {
      return jsonResp(405, { error: "Method not allowed" });
    }

    if (!SB_URL || !SB_SERVICE_KEY) {
      return jsonResp(500, { error: "Supabase env missing" });
    }

    // Parse payload
    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return jsonResp(400, { error: "Invalid JSON body" });
    }

    const { provider, model, feature, user_id = null, body = {} } = payload || {};
    if (!provider || !model || !feature) {
      return jsonResp(400, { error: "Missing provider/model/feature" });
    }

    // Route to provider
    let call, providerName;
    if (provider === "openai") {
      providerName = "openai";
      call = await callOpenAI(model, body);
    } else if (provider === "perplexity") {
      providerName = "perplexity";
      call = await callPerplexity(model, body);
    } else {
      return jsonResp(400, { error: `Unsupported provider: ${provider}` });
    }

    const { resp, json, latency } = call;

    // Extract usage for cost
    const usage = json?.usage || {};
    const prompt_tokens = Number(usage.prompt_tokens || 0);
    const completion_tokens = Number(usage.completion_tokens || 0);
    const total_tokens =
      Number(usage.total_tokens != null ? usage.total_tokens : prompt_tokens + completion_tokens);

    // Pricing & cost
    let pricing = null;
    let cost_usd = 0;
    try {
      pricing = await getPricing(providerName, model);
      cost_usd = calcCostUSD({ prompt_tokens, completion_tokens }, pricing);
    } catch (e) {
      // If pricing query fails, keep cost=0 but continue
      if (DEBUG) console.error("[pricing error]", e.message);
    }

    // Log usage regardless of success
    try {
      await logUsage({
        feature,
        provider: providerName,
        model,
        request_id: json?.id || null,
        user_id,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        cost_usd,
        meta: {
          http_status: resp.status,
          latency_ms: latency,
          debug: DEBUG ? { pricing } : undefined,
        },
      });
    } catch (e) {
      if (DEBUG) console.error("[log error]", e.message);
      // do not block response
    }

    if (!resp.ok) {
      // bubble provider error to client
      return jsonResp(resp.status, {
        error: "Provider error",
        detail: json || null,
      });
    }

    // Success: pass through provider response
    return jsonResp(200, json);
  } catch (err) {
    if (DEBUG) console.error("[ai-proxy fatal]", err);
    return jsonResp(500, { error: "ai-proxy failed", detail: String(err.message || err) });
  }
};
