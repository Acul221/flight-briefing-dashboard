// netlify/functions/track-open.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export async function handler(event) {
  try {
    const { searchParams } = new URL(event.rawUrl);
    const campaignId = searchParams.get("c");
    const userId = searchParams.get("u");

    if (campaignId && userId) {
      const { error } = await supabase.from("newsletter_logs").upsert(
        {
          campaign_id: campaignId,
          user_id: userId,
          opened: true,
          opened_at: new Date().toISOString(),
        },
        { onConflict: "campaign_id,user_id" }
      );
      if (error) console.error("Supabase upsert error:", error);
    }

    // 1x1 transparent GIF
    const gif = Buffer.from(
      "R0lGODlhAQABAIABAP///wAAACwAAAAAAQABAAACAkQBADs=",
      "base64"
    );
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
      body: gif.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("track-open error:", err);
    return { statusCode: 500, body: "Error tracking open" };
  }
}
