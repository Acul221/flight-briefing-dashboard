// netlify/functions/send-newsletter.js
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE // <- pakai SUPABASE_SERVICE_ROLE
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event, context) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    const { subject, html, recipients, campaignId } = JSON.parse(event.body);

    if (!subject || !html || !recipients || !campaignId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing params" }) };
    }

    // Loop send per user
    for (const user of recipients) {
      const userId = user.id;
      const userEmail = user.email;
      const unsubLink = `https://skydeckpro.id/.netlify/functions/track-unsub?c=${campaignId}&u=${userId}`;

      const finalHtml = `
        ${html}
        <p style="font-size: 12px; color: #888; margin-top: 20px;">
          <a href="${unsubLink}" style="color: #888;">
            Unsubscribe from this newsletter
          </a>
        </p>
      `;

      await resend.emails.send({
        from: "SkyDeckPro <newsletter@skydeckpro.id>",
        to: [userEmail],
        subject,
        html: finalHtml,
      });

      await supabase.from("newsletter_logs").insert({
        campaign_id: campaignId,
        user_id: userId,
        email: userEmail,
        sent_at: new Date().toISOString(),
      });
    }

    // Update counter
    await supabase.rpc("increment_total_sent", { cid: campaignId, count: recipients.length });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("send-newsletter error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal error" }) };
  }
}
