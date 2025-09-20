// netlify/functions/send-newsletter.js
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE // ✅ gunakan service role
);

// Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const { subject, html, recipients, campaignId } = JSON.parse(event.body);

    if (!subject || !html || !recipients || !campaignId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing params" }),
      };
    }

    // --- Register campaign (supaya ada di newsletter_campaigns)
    const { error: upsertError } = await supabase
      .from("newsletter_campaigns")
      .upsert(
        {
          campaign_id: campaignId,
          subject,
          content: html,
          sent_at: new Date().toISOString(),
        },
        { onConflict: "campaign_id" } // ✅ pakai campaign_id, bukan id
      );

    if (upsertError) {
      console.error("Campaign upsert error:", upsertError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to register campaign" }),
      };
    }

    // --- Kirim email ke setiap user
    for (const user of recipients) {
      const userId = user.id;
      const userEmail = user.email;

      const unsubLink = `https://skydeckpro.id/.netlify/functions/track-unsub?c=${campaignId}&u=${userId}`;
      const openPixel = `<img src="https://skydeckpro.id/.netlify/functions/track-open?c=${campaignId}&u=${userId}" width="1" height="1" style="display:none;" />`;

      const finalHtml = `
        ${html}
        ${openPixel}
        <p style="font-size: 12px; color: #888; margin-top: 20px;">
          <a href="${unsubLink}" style="color: #888;">
            Unsubscribe from this newsletter
          </a>
        </p>
      `;

      try {
        await resend.emails.send({
          from: "SkyDeckPro <newsletter@skydeckpro.id>",
          to: [userEmail],
          subject,
          html: finalHtml,
        });

        // ✅ Simpan log sukses
        await supabase.from("newsletter_logs").insert({
          campaign_id: campaignId,
          user_id: userId,
          status: "success",
          sent_at: new Date().toISOString(),
        });
      } catch (sendErr) {
        console.error("Email send error:", sendErr);

        // ❌ Simpan log gagal
        await supabase.from("newsletter_logs").insert({
          campaign_id: campaignId,
          user_id: userId,
          status: "failed",
          error: JSON.stringify(sendErr),
          sent_at: new Date().toISOString(),
        });
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("send-newsletter error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal error", detail: err.message }),
    };
  }
}
