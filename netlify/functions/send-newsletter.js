// /netlify/functions/send-newsletter.js
import crypto from "crypto";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

function sign(data) {
  return crypto
    .createHmac("sha256", process.env.UNSUBSCRIBE_SECRET)
    .update(data)
    .digest("hex");
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { newsletterId } = JSON.parse(event.body || "{}");
    if (!newsletterId) return { statusCode: 400, body: "Missing newsletterId" };

    // 1) Ambil campaign
    const { data: campaign, error: cErr } = await supabase
      .from("newsletters")
      .select("*")
      .eq("id", newsletterId)
      .single();
    if (cErr || !campaign) return { statusCode: 404, body: "Newsletter not found" };

    // 2) Ambil audience
    let query = supabase.from("profiles").select("id, email, full_name, role, newsletter_opt_in");
    if (campaign.audience === "free") query = query.eq("role", "user");
    if (campaign.audience === "pro")  query = query.eq("role", "pro");
    const { data: users, error: uErr } = await query.eq("newsletter_opt_in", true);
    if (uErr) throw uErr;

    const results = [];
    for (const u of users || []) {
      try {
        if (!u.email) continue;

        // 3) Generate UNSUB link per user (HMAC)
        const token = sign(`${u.id}:${newsletterId}`);
        const unsubUrl =
          `${process.env.PUBLIC_BASE_URL}/.netlify/functions/unsubscribe?` +
          `id=${encodeURIComponent(u.id)}&c=${encodeURIComponent(newsletterId)}&t=${token}`;

        // 4) Personalize konten via placeholder
        const html =
          (campaign.content || "")
            .replaceAll("{{NAME}}", u.full_name || "Pilot")
            .replaceAll("{{UNSUB_URL}}", unsubUrl) +
          `<hr style="margin-top:24px;border:none;border-top:1px solid #eee" />` +
          `<p style="font-size:12px;color:#666">
             You received this because you opted in at SkyDeckPro.
             <a href="${unsubUrl}">Unsubscribe</a>
           </p>`;

        // 5) Kirim via Resend
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "onboarding@resend.dev",
            to: u.email,
            subject: campaign.title,
            html,
          }),
        });
        const data = await res.json();

        // 6) Log kirim
        await supabase.from("newsletter_logs").insert({
          newsletter_id: campaign.id,
          user_id: u.id,
          status: res.ok ? "success" : "failed",
          error: res.ok ? null : JSON.stringify(data),
        });

        results.push({ email: u.email, status: res.ok ? "sent" : "failed" });
      } catch (e) {
        await supabase.from("newsletter_logs").insert({
          newsletter_id: campaign.id,
          user_id: u.id,
          status: "failed",
          error: e.message,
        });
        results.push({ email: u.email, status: "failed" });
      }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, count: results.length, results }) };
  } catch (err) {
    console.error("❌ Function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
