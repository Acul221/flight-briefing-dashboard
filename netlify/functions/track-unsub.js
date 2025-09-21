// netlify/functions/track-unsub.js
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export async function handler(event) {
  try {
    const { searchParams } = new URL(event.rawUrl);
    const campaignId = searchParams.get("c");
    const userId = searchParams.get("u");

    if (campaignId && userId) {
      await supabase.from("newsletter_logs").upsert({
        campaign_id: campaignId,
        user_id: userId,
        unsubscribed: true,
        unsubscribed_at: new Date().toISOString(),
      }, { onConflict: "campaign_id,user_id" });

      await supabase.rpc("increment_unsub_count", { cid: campaignId });
      await supabase.from("profiles").update({ newsletter_opt_in: false }).eq("id", userId);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: `
        <html><body style="font-family:sans-serif;text-align:center;margin-top:100px;">
          <h2>✅ You have been unsubscribed.</h2>
          <p>You will no longer receive this newsletter.</p>
          <a href="https://skydeckpro.id" style="color:#0D47A1;display:inline-block;margin-top:20px;">
            ← Back to SkyDeckPro
          </a>
        </body></html>
      `,
    };
  } catch (err) {
    console.error("track-unsub error:", err);
    return { statusCode: 500, body: "Error processing unsubscribe" };
  }
}
