// netlify/functions/send-newsletter.js
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    const { subject, html, recipients, campaignId } = JSON.parse(event.body);
    if (!subject || !html || !recipients || !campaignId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing params" }) };
    }

    // Upsert campaign record
    await supabase.from("newsletter_campaigns").upsert({
      id: campaignId,
      subject,
      content: html,
      sent_at: new Date().toISOString(),
    }, { onConflict: "id" });

    for (const user of recipients) {
      const userId = user.id;
      const userEmail = user.email;

      const openPixel = `${process.env.VITE_PUBLIC_BASE_URL || "https://skydeckpro.id"}/.netlify/functions/track-open?c=${campaignId}&u=${userId}`;
      const clickBase = `${process.env.VITE_PUBLIC_BASE_URL || "https://skydeckpro.id"}/.netlify/functions/track-click?c=${campaignId}&u=${userId}&url=`;

      const unsubLink = `${process.env.VITE_PUBLIC_BASE_URL || "https://skydeckpro.id"}/.netlify/functions/track-unsub?c=${campaignId}&u=${userId}`;

      const finalHtml = `
        ${html}
        <img src="${openPixel}" width="1" height="1" style="display:none;" />
        <p style="font-size:12px;color:#888;margin-top:20px;">
          <a href="${unsubLink}" style="color:#888;">Unsubscribe from this newsletter</a>
        </p>
      `;

      try {
        await resend.emails.send({
          from: "SkyDeckPro <newsletter@skydeckpro.id>",
          to: [userEmail],
          subject,
          html: finalHtml.replace(/https?:\/\/[^\s"]+/g, (match) => `${clickBase}${encodeURIComponent(match)}`),
        });

        await supabase.from("newsletter_logs").upsert({
          campaign_id: campaignId,
          user_id: userId,
          status: "success",
          sent_at: new Date().toISOString(),
          opened: false,
          clicked: false,
          unsubscribed: false,
        }, { onConflict: "campaign_id,user_id" });

      } catch (err) {
        console.error("Send error:", err);
        await supabase.from("newsletter_logs").upsert({
          campaign_id: campaignId,
          user_id: userId,
          status: "failed",
          error: JSON.stringify(err),
          sent_at: new Date().toISOString(),
          opened: false,
          clicked: false,
          unsubscribed: false,
        }, { onConflict: "campaign_id,user_id" });
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("send-newsletter error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal error" }) };
  }
}
