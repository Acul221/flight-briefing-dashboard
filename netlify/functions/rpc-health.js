// netlify/functions/rpc-health.js
// Simple health check hitting fn_validate_rpc_health

const { createClient } = require("@supabase/supabase-js");

exports.handler = async () => {
  try {
    const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data, error } = await client.rpc("fn_validate_rpc_health");
    if (error) throw error;
    const ok = Array.isArray(data) ? data?.[0]?.ok ?? data?.[0] === true : data === true;
    return resp(200, { ok: !!ok });
  } catch (err) {
    return resp(500, { ok: false, error: err.message || "rpc_error" });
  }
};

function resp(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}
