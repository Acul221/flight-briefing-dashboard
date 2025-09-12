import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export async function handler(event, context) {
  try {
    const url = new URL(event.rawUrl);
    const period = url.searchParams.get("period") || "week";

    // Tentukan batas tanggal
    let sinceDate;
    if (period === "month") {
      const now = new Date();
      sinceDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      sinceDate = new Date(new Date().setDate(new Date().getDate() - 7));
    }

    // Ambil data dari reports_log
    const { data: events, error } = await supabase
      .from("reports_log")
      .select("event_type, created_at, payload")
      .gte("created_at", sinceDate.toISOString());

    if (error) throw error;

    // Agregasi
    const eventSummary = {};
    let paidPro = 0;
    let voucherPro = 0;
    let totalRevenue = 0;

    events.forEach((row) => {
      eventSummary[row.event_type] = (eventSummary[row.event_type] || 0) + 1;

      if (row.event_type === "voucher_redeemed") voucherPro++;
      if (row.event_type === "payment_success") {
        paidPro++;
        const amt = parseInt(row.payload?.amount || 0, 10);
        if (!isNaN(amt)) totalRevenue += amt;
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          success: true,
          summary: {
            eventSummary,
            proSummary: {
              paidPro,
              voucherPro,
              totalPro: paidPro + voucherPro,
            },
            effectiveRevenue: totalRevenue,
            period: period === "month" ? "this month" : "last 7 days",
          },
        },
        null,
        2
      ),
    };
  } catch (err) {
    console.error("[cfo-report] Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
}
