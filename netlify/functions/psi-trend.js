// netlify/functions/psi-trend.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export async function handler(event) {
  try {
    const { data, error } = await supabase.rpc("get_psi_trend");
    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ trend: data }, null, 2),
    };
  } catch (err) {
    console.error("[psi-trend] error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
