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

const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.GPT_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// ---------- Utils ----------
const ok = (body) => ({
  statusCode: 200,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const bad = (statusCode, message, extra = {}) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ error: message, ...extra }),
});

function safeJson(str) {
  try {
    return JSON.parse(str || "{}");
  } catch {
    return {};
  }
}

async function getPricing(provider, model) {
  const { data, error } = await supabase
    .from("pricing_models")
    .select("*")
    .eq("provider", provider)
    .eq("model", model)
    .eq("active", true)
    .single();
  if (error) {
    if (process.env.DEBUG_AI_PROXY) console.error("pricing lookup error:", error);
    return null;
  }
  return data;
}

function calcCostUSD(usage, pricing) {
  if (!pricing) return 0;
  const prompt = usage?.prompt_tokens || 0;
  const completion = usage?.completion_tokens || 0;
  const inUsd = (prompt / 1000) * (pricing.input_cost_usd || 0);
  const outUsd = (completion / 1000) * (pricing.output_cost_usd || 0);
  return +(inUsd + outUsd).toFixed(6);
}

// ---------- Handler ----------
export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return bad(405, "Method Not Allowed");
  }

  // Validasi env minimal
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    return bad(500, "Supabase server credentials missing.");
  }

  const payload = safeJson(event.body);
  const {
    provider = "openai",
    model = "gpt-4o-mini",
    feature = "unspecified",
    user_id = null,
    body = {}, // OpenAI Chat payload: { messages: [...], temperature, ... }
  } = payload;

  // Validasi input minimum
  if (!feature) return bad(400, "Missing 'feature' field.");
  if (provider !== "openai") return bad(400, `Unsupported provider: ${provider}`);

  if (!OPENAI_KEY) {
    return bad(500, "Missing OPENAI_API_KEY / GPT_API_KEY on server.");
  }

  try {
    // 1) Proxy ke OpenAI
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const reqBody = { model, ...body };
    if (!reqBody.messages || !Array.isArray(reqBody.messages)) {
      return bad(400, "body.messages must be an array of chat messages.");
    }

    const t0 = Date.now();
    const resp = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    });

    const json = await resp.json();
    const latencyMs = Date.now() - t0;

    if (!resp.ok) {
      // tetap log meta error untuk audit (tanpa token usage)
      await supabase.from("ai_usage").insert({
        feature,
        provider,
        model,
        request_id: json?.id || null,
        user_id,
        prompt_tokens: 0,
        completion_tokens: 0,
        cost_usd: 0,
        meta: {
          http_status: resp.status,
          error: json?.error || json,
          latency_ms: latencyMs,
          prompt_hash: body?.prompt_hash || null,
        },
      });
      return bad(resp.status, "Provider error", json);
    }

    // 2) Ambil usage & hitung biaya
    const usage = json.usage || { prompt_tokens: 0, completion_tokens: 0 };
    const pricing = await getPricing(provider, model);
    const cost_usd = calcCostUSD(usage, pricing);

    // 3) Insert log ke Supabase (bypass RLS via service role)
    await supabase.from("ai_usage").insert({
      feature,
      provider,
      model,
      request_id: json.id || null,
      user_id,
      prompt_tokens: usage.prompt_tokens || 0,
      completion_tokens: usage.completion_tokens || 0,
      cost_usd,
      meta: {
        http_status: resp.status,
        latency_ms: latencyMs,
        prompt_hash: body?.prompt_hash || null,
      },
    });

    if (process.env.DEBUG_AI_PROXY) {
      console.log(
        `[ai-proxy] ${feature} • ${provider}/${model} • in:${usage.prompt_tokens} out:${usage.completion_tokens} • $${cost_usd} • ${latencyMs}ms`
      );
    }

    // 4) Balikkan response asli ke FE
    return ok(json);
  } catch (e) {
    if (process.env.DEBUG_AI_PROXY) console.error("ai-proxy fatal:", e);
    return bad(500, "Internal error", { detail: String(e?.message || e) });
  }
};
