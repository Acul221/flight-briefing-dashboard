// netlify/functions/track-click.js
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
    const url = searchParams.get("url") || "https://skydeckpro.id";

    if (campaignId && userId) {
      await supabase.from("newsletter_logs").upsert({
        campaign_id: campaignId,
        user_id: userId,
        clicked: true,
        clicked_at: new Date().toISOString(),
      }, { onConflict: "campaign_id,user_id" });

      await supabase.rpc("increment_click_count", { cid: campaignId });
    }

    return {
      statusCode: 302,
      headers: { Location: url },
      body: "",
    };
  } catch (err) {
    console.error("track-click error:", err);
    return { statusCode: 500, body: "Error tracking click" };
  }
}
