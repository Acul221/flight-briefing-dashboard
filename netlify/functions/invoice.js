// netlify/functions/invoice.js
import { createClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit";
import fs from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
  : null;

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

    // Prepare PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    const done = new Promise((resolve) => doc.on("end", resolve));

    // === HEADER ===
    // Logo (opsional, kalau ada public/logo.png)
    const logoPath = "public/logo.png";
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 80 });
    }
    doc.fontSize(20).text("SkyDeckPro – Invoice", 200, 50, { align: "right" });

    doc.moveDown(4);

    // Company Info
    doc.fontSize(10).fillColor("gray");
    doc.text("SkyDeckPro Indonesia", { align: "right" });
    doc.text("support@skydeckpro.id", { align: "right" });
    doc.text("https://skydeckpro.id", { align: "right" });

    doc.moveDown(2);
    doc.fillColor("black");

    // === INVOICE INFO ===
    doc.fontSize(14).text(`Invoice #${order.order_id}`, { align: "left" });
    doc.moveDown(0.5);

    const dt = order.transaction_time || order.created_at || new Date().toISOString();

    doc.fontSize(12);
    doc.text(`Date         : ${new Date(dt).toLocaleString("id-ID")}`);
    if (order.user_id) doc.text(`User ID      : ${order.user_id}`);
    if (order.plan) doc.text(`Plan         : ${order.plan}`);
    if (order.payment_type) doc.text(`Payment Type : ${order.payment_type}`);
    doc.text(`Amount       : Rp ${Number(order.amount || 0).toLocaleString("id-ID")}`);
    doc.text(`Status       : ${order.status}`);

    doc.moveDown(2);
    doc.text("Thank you for your purchase and enjoy your training with SkyDeckPro.");

    // === FOOTER ===
    doc.moveDown(4);
    doc.fontSize(10).fillColor("gray")
      .text("This invoice is generated automatically by SkyDeckPro.", { align: "center" })
      .text("For support, contact support@skydeckpro.id", { align: "center" });

    // Finish PDF
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
