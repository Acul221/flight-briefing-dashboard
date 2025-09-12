import { createClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit";
import path from "path";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

const __dirname = path.resolve();

export async function handler(event, context) {
  try {
    const url = new URL(event.rawUrl);
    const period = url.searchParams.get("period") || "week";

    // Tentukan periode awal
    let sinceDate;
    if (period === "month") {
      const now = new Date();
      sinceDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      sinceDate = new Date(new Date().setDate(new Date().getDate() - 7));
    }

    // 🔹 Ambil data dari reports_log
    const { data: events, error } = await supabase
      .from("reports_log")
      .select("event_type, created_at, payload")
      .gte("created_at", sinceDate.toISOString());

    if (error) throw error;

    // 🔹 Agregasi data
    const eventSummary = {};
    let paidPro = 0;
    let voucherPro = 0;
    let totalRevenue = 0;
    const paymentDetails = [];

    events.forEach((row) => {
      eventSummary[row.event_type] = (eventSummary[row.event_type] || 0) + 1;

      if (row.event_type === "voucher_redeemed") {
        voucherPro++;
      }
      if (row.event_type === "payment_success") {
        paidPro++;
        const amt = parseInt(row.payload?.amount || 0, 10);
        if (!isNaN(amt)) totalRevenue += amt;

        paymentDetails.push({
          order_id: row.payload?.order_id || "-",
          amount: amt || 0,
          user_id: row.payload?.user_id || "-",
          created_at: row.created_at,
        });
      }
    });

    // 🔹 Generate PDF
    const doc = new PDFDocument({ margin: 40 });

    // Register font Roboto
    doc.registerFont("Regular", path.join(__dirname, "netlify/functions/fonts/Roboto-Regular.ttf"));
    doc.registerFont("Bold", path.join(__dirname, "netlify/functions/fonts/Roboto-Bold.ttf"));
    doc.registerFont("Medium", path.join(__dirname, "netlify/functions/fonts/Roboto-Medium.ttf"));
    doc.registerFont("Italic", path.join(__dirname, "netlify/functions/fonts/Roboto-Italic.ttf"));

    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));

    // === Header ===
    doc.font("Bold").fontSize(18).text("SkyDeckPro – CFO Report", { align: "center" });
    doc.moveDown();
    doc.font("Regular").fontSize(12).text(`Period: ${period === "month" ? "This Month" : "Last 7 Days"}`);
    doc.font("Regular").fontSize(12).text(`Generated at: ${new Date().toLocaleString()}`);
    doc.moveDown();

    // === Summary ===
    doc.font("Medium").fontSize(14).text("Summary", { underline: true });
    doc.font("Regular").fontSize(12).text(`Total Paid Pro: ${paidPro}`);
    doc.font("Regular").fontSize(12).text(`Total Voucher Pro: ${voucherPro}`);
    doc.font("Regular").fontSize(12).text(`Total Pro: ${paidPro + voucherPro}`);
    doc.font("Regular").fontSize(12).text(`Effective Revenue: Rp ${totalRevenue.toLocaleString("id-ID")}`);
    doc.moveDown();

    // === Event Breakdown ===
    doc.font("Medium").fontSize(14).text("Event Breakdown", { underline: true });
    Object.entries(eventSummary).forEach(([event, count]) => {
      doc.font("Regular").fontSize(12).text(`${event}: ${count}`);
    });
    doc.moveDown();

    // === Payment Transactions ===
    if (paymentDetails.length > 0) {
      doc.font("Medium").fontSize(14).text("Payment Transactions", { underline: true });
      doc.moveDown(0.5);

      paymentDetails.forEach((p) => {
        doc.font("Regular").fontSize(12).text(
          `Order: ${p.order_id} | Amount: Rp ${p.amount.toLocaleString("id-ID")} | User: ${p.user_id} | Date: ${new Date(p.created_at).toLocaleString()}`
        );
      });
      doc.moveDown();
      doc.font("Italic").fontSize(10).text("*All transactions are recorded based on Midtrans callback events.");
    }

    doc.end();

    // ✅ Tunggu sampai PDF selesai dibuat
    const pdfBuffer = await new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
    });

    // ✅ Return PDF sebagai base64
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="cfo-report-${period}.pdf"`,
      },
      body: pdfBuffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("[cfo-report-pdf] Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
}
