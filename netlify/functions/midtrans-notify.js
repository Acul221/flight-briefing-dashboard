// netlify/functions/midtrans-notify.js
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// ================== ENV ==================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const MIDTRANS_SERVER_KEY = (process.env.MIDTRANS_SERVER_KEY || "").trim();
const PUBLIC_BASE_URL = process.env.VITE_PUBLIC_BASE_URL || process.env.PUBLIC_BASE_URL || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "SkyDeckPro <no-reply@skydeckpro.id>";

// ================== CLIENTS ==================
const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    : null;

// ================== HELPERS ==================
/** Normalisasi status untuk konsistensi FE/DB */
function normStatus(s) {
  const v = (s || "").toLowerCase();
  if (v === "capture" || v === "settlement" || v === "success") return "success";
  if (v === "authorize" || v === "pending") return "pending";
  if (["deny", "expire", "cancel", "failed", "error", "refund", "partial_refund"].includes(v)) return "failed";
  return v || "unknown";
}

function planToProductCode(plan) {
  if (!plan) return null;
  const p = plan.toLowerCase();
  if (p === "pro" || p === "pro_month") return "quiz_pro";
  if (p === "pro_year" || p === "bundle") return "quiz_bundle";
  return `quiz_${p}`;
}

function computeExpiry(plan) {
  const now = new Date();
  const p = (plan || "").toLowerCase();
  let months = 1;
  if (p === "pro_year" || p === "bundle") months = 12;
  now.setMonth(now.getMonth() + months);
  return now.toISOString();
}

function invoiceUrl(orderId) {
  const path = `/.netlify/functions/invoice?orderId=${encodeURIComponent(orderId)}`;
  return PUBLIC_BASE_URL ? `${PUBLIC_BASE_URL.replace(/\/$/, "")}${path}` : path;
}

function buildEmailTemplate({ order_id, plan, amount, status, expiresAt, invoiceHref }) {
  const statusMap = {
    success: { label: "Success ✅", color: "#16a34a" },
    pending: { label: "Pending ⏳", color: "#ea580c" },
    failed: { label: "Failed ❌", color: "#dc2626" },
  };
  const meta = statusMap[status] || { label: "Unknown", color: "#6b7280" };

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;max-width:640px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
    <h2 style="margin:0 0 8px">SkyDeckPro – Payment ${meta.label}</h2>
    <p style="margin:0 0 16px;color:#374151">
      ${
        status === "success"
          ? "We’re happy to confirm your payment has been received."
          : status === "pending"
          ? "Your payment is still pending. If you already paid, it may take a moment to confirm."
          : "Unfortunately, your payment did not go through."
      }
    </p>

    <table style="width:100%;border-collapse:collapse;margin:12px 0">
      <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#6b7280">Order ID</td><td style="padding:8px;border-bottom:1px solid #eee"><b>${order_id}</b></td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#6b7280">Plan</td><td style="padding:8px;border-bottom:1px solid #eee">${plan || "-"}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#6b7280">Amount</td><td style="padding:8px;border-bottom:1px solid #eee"><b>Rp ${Number(amount || 0).toLocaleString("id-ID")}</b></td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#6b7280">Status</td><td style="padding:8px;border-bottom:1px solid #eee;color:${meta.color}">${meta.label}</td></tr>
      ${
        status === "success" && expiresAt
          ? `<tr><td style="padding:8px;color:#6b7280">Active Until</td><td style="padding:8px">${new Date(expiresAt).toLocaleDateString("id-ID")}</td></tr>`
          : ""
      }
    </table>

    ${
      status === "success"
        ? `<p style="margin:16px 0">Download your official invoice here:</p>
           <p style="margin:0 0 12px">
             <a href="${invoiceHref}" style="display:inline-block;background:#2563eb;color:white;padding:10px 16px;border-radius:8px;text-decoration:none" target="_blank" rel="noreferrer">📄 Download Invoice</a>
           </p>`
        : ""
    }

    <p style="margin-top:24px;color:#6b7280;font-size:12px">
      Need help? Contact <a href="mailto:support@skydeckpro.id">support@skydeckpro.id</a>.
    </p>
  </div>`;
}

/** Kirim email via Resend tanpa SDK (hindari bundling error). */
async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
    });
  } catch (err) {
    // Jangan gagal total hanya karena email error
    console.error("Resend error:", err);
  }
}

// ================== HANDLER ==================
export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body || "{}");

    // ---- Signature verification (wajib string persis dari payload Midtrans) ----
    const order_id = body.order_id;
    const status_code = body.status_code;
    const gross_amount = body.gross_amount; // Midtrans kirim string ("60000.00"); jangan di-coerce
    const signature_key = body.signature_key;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return { statusCode: 400, body: "Bad Request" };
    }

    const expectedSig = crypto
      .createHash("sha512")
      .update(String(order_id) + String(status_code) + String(gross_amount) + MIDTRANS_SERVER_KEY)
      .digest("hex");

    if (expectedSig !== signature_key) {
      return { statusCode: 401, body: "Invalid signature" };
    }

    // ---- Derive fields dari payload ----
    const status = normStatus(body.transaction_status);
    const plan = (body.custom_field2 || body.plan || "").toLowerCase() || null;
    const amountNum = Number(body.gross_amount || body?.transaction_details?.gross_amount || 0) || null;
    const payment_type = body.payment_type || null;
    const transaction_time = body.transaction_time
      ? new Date(body.transaction_time).toISOString()
      : new Date().toISOString();
    const user_id = body.custom_field1 || null; // diisi saat create checkout
    const email =
      body.custom_field3 || body?.customer_details?.email || body?.metadata?.email || null;

    // ---- Upsert orders (idempotent) ----
    if (supabase) {
      await supabase
        .from("orders")
        .upsert(
          {
            order_id,
            user_id,
            plan,
            amount: amountNum,
            status,
            payment_type,
            transaction_time,
            meta: body,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "order_id" }
        );
    }

    // ---- Grant/Update entitlement saat success ----
    let expiresAt = null;
    if (status === "success" && supabase && user_id) {
      const product_code = planToProductCode(plan);
      if (product_code) {
        expiresAt = computeExpiry(plan);
        await supabase
          .from("entitlements")
          .upsert(
            {
              user_id,
              product_code,
              status: "active",
              expires_at: expiresAt,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,product_code" }
          );
      }
    }

    // ---- Kirim email (sukses: invoice; pending/failed: notifikasi status) ----
    if (email) {
      const html = buildEmailTemplate({
        order_id,
        plan,
        amount: amountNum,
        status,
        expiresAt,
        invoiceHref: invoiceUrl(order_id),
      });
      await sendEmail({
        to: email,
        subject: `SkyDeckPro – Payment ${status.toUpperCase()} [${order_id}]`,
        html,
      });
    }

    console.log("[midtrans-notify] OK", { order_id, status, plan, payment_type });
    return { statusCode: 200, body: "OK" };
  } catch (e) {
    console.error("[midtrans-notify] error:", e);
    return { statusCode: 500, body: "Server Error" };
  }
}
