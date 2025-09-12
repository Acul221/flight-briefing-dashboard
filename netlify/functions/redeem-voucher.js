// netlify/functions/redeem-voucher.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE // ⚠️ hanya di server, jangan expose ke client
);

export async function handler(event, context) {
  try {
    // 1. Parse request body
    const { user_id, voucher_code } = JSON.parse(event.body || "{}");

    if (!user_id || !voucher_code) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Missing user_id or voucher_code",
        }),
      };
    }

    // 2. Call Supabase RPC (redeem_voucher)
    const { data, error } = await supabase.rpc("redeem_voucher", {
      p_user_id: user_id,
      p_voucher_code: voucher_code,
    });

    if (error) {
      console.error("[redeem-voucher] Supabase error:", error);
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: error.message,
        }),
      };
    }

    // 3. Logging ke reports_log
    const { error: logError } = await supabase.from("reports_log").insert([
      {
        user_id,
        event_type: "voucher_redeemed",
        payload: {
          voucher_code,
          new_plan: "pro",
          permanent: true,
        },
      },
    ]);

    if (logError) {
      console.error("[redeem-voucher] Log insert error:", logError);
      // tidak perlu return error ke user, cukup log saja
    }

    // 4. Response sukses
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: data,
      }),
    };
  } catch (err) {
    console.error("[redeem-voucher] Unexpected error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err.message,
      }),
    };
  }
}
