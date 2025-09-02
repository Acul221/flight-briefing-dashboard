import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
  : null;

const rawKey = (process.env.MIDTRANS_SERVER_KEY || "").trim();
const SERVER_KEY = rawKey.includes("=")
  ? rawKey.split("=").pop().trim().replace(/^"(.*)"$/, "$1")
  : rawKey;

function normalizeStatus(body) {
  const s = (body?.transaction_status || "").toLowerCase();
  if (s === "capture" || s === "settlement") return "success";
  if (s === "pending") return "pending";
  if (s === "deny" || s === "expire" || s === "cancel") return "failed";
  return s || "unknown";
}

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body || "{}");
    const { order_id, status_code, gross_amount, signature_key } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return { statusCode: 400, body: "Bad Request" };
    }

    // Validate signature
    const expected = crypto
      .createHash("sha512")
      .update(String(order_id) + String(status_code) + String(gross_amount) + SERVER_KEY)
      .digest("hex");

    if (expected !== signature_key) {
      return { statusCode: 401, body: "Invalid signature" };
    }

    const txStatus = normalizeStatus(body);

    // ⬇️ kalau ada Supabase, upsert ke tabel "orders"
    if (supabase) {
      await supabase.from("orders").upsert({
        order_id,
        plan: order_id.includes("_pro_") ? "pro" : (order_id.includes("_bundle_") ? "bundle" : null),
        amount: Number(gross_amount) || null,
        status: txStatus,
        payment_type: body.payment_type || null,
        transaction_time: body.transaction_time
          ? new Date(body.transaction_time).toISOString()
          : new Date().toISOString(),
        meta: body,
      }, { onConflict: "order_id" });
    }

    console.log("Webhook OK:", { order_id, txStatus, payment_type: body.payment_type });

    return { statusCode: 200, body: "OK" };
  } catch (e) {
    console.error("Webhook error:", e);
    return { statusCode: 500, body: "Server Error" };
  }
}
