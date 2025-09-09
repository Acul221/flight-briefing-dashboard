// netlify/functions/invoice.js
import { createClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

// guard sederhana
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.warn("[invoice] Missing Supabase envs");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

export async function handler(event) {
  try {
    const orderId = event.queryStringParameters?.orderId;
    if (!orderId) return { statusCode: 400, body: "Missing orderId" };

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error || !order) {
      console.error("[invoice] Order not found:", error?.message);
      return { statusCode: 404, body: "Order not found" };
    }

    // PDF buffer
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    const done = new Promise((resolve) => doc.on("end", resolve));

    // Header
    doc.fontSize(18).text("SkyDeckPro - Invoice", { align: "center" });
    doc.moveDown(1);

    // Body
    doc.fontSize(12);
    doc.text(`Order ID     : ${order.order_id}`);
    if (order.user_id) doc.text(`User ID       : ${order.user_id}`);
    if (order.plan) doc.text(`Plan          : ${order.plan}`);
    if (order.payment_type) doc.text(`Payment Type  : ${order.payment_type}`);
    doc.text(`Amount        : Rp ${Number(order.amount || 0).toLocaleString("id-ID")}`);
    doc.text(`Status        : ${order.status}`);
    const dt = order.transaction_time || order.created_at || new Date().toISOString();
    doc.text(`Date          : ${new Date(dt).toLocaleString("id-ID")}`);
    doc.moveDown();
    doc.text("Thank you for your purchase and enjoy your training with SkyDeckPro.");

    doc.end();
    await done;

    const pdf = Buffer.concat(chunks);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=invoice-${orderId}.pdf`,
        "Cache-Control": "no-store",
      },
      body: pdf.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (e) {
    console.error("[invoice] error:", e);
    return { statusCode: 500, body: "Server error" };
  }
}
