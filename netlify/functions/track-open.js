// netlify/functions/track-open.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export async function handler(event, context) {
  try {
    const { searchParams } = new URL(event.rawUrl);
    const campaignId = searchParams.get("c");
    const userId = searchParams.get("u");

    if (campaignId && userId) {
      await supabase.from("newsletter_logs").upsert({
        campaign_id: campaignId,
        user_id: userId,
        opened: true,
        opened_at: new Date().toISOString(),
      });
      await supabase.rpc("increment_open_count", { cid: campaignId });
    }

    const gif = Buffer.from("R0lGODlhAQABAIABAP///wAAACwAAAAAAQABAAACAkQBADs=", "base64");
    return {
      statusCode: 200,
      headers: { "Content-Type": "image/gif" },
      body: gif.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("track-open error:", err);
    return { statusCode: 500, body: "Error tracking open" };
  }
}
