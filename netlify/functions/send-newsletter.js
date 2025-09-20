// netlify/functions/send-newsletter.js
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// ✅ gunakan SUPABASE_URL (bukan VITE_SUPABASE_URL, karena ini server-side)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

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

      // ✅ kirim email
      await resend.emails.send({
        from: "SkyDeckPro <newsletter@skydeckpro.id>",
        to: [userEmail],
        subject,
        html: finalHtml,
      });

      // ✅ insert log ke Supabase
      const { error } = await supabase.from("newsletter_logs").insert({
        campaign_id: campaignId,
        user_id: userId,
        email: userEmail,
        sent_at: new Date().toISOString(),
      });

      if (error) {
        console.error("❌ Supabase insert error:", error.message);
      } else {
        console.log("✅ Supabase log inserted:", {
          campaignId,
          userId,
          userEmail,
        });
      }
    }

    // ✅ update counter
    const { error: rpcError } = await supabase.rpc("increment_total_sent", {
      cid: campaignId,
      count: recipients.length,
    });
    if (rpcError) {
      console.error("❌ RPC error:", rpcError.message);
    } else {
      console.log("✅ RPC increment_total_sent success");
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("send-newsletter error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal error" }),
    };
  }
}
