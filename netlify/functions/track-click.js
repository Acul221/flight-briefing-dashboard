// netlify/functions/track-click.js
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
    const url = searchParams.get("url") || "https://skydeckpro.id";

    // Whitelist domain redirect
    const allowedDomains = ["skydeckpro.id", "www.skydeckpro.id"];
    const target = new URL(url);
    if (!allowedDomains.some((d) => target.hostname.endsWith(d))) {
      console.warn("Blocked redirect to:", target.hostname);
      return { statusCode: 400, body: "Invalid redirect URL" };
    }

    if (campaignId && userId) {
      const { error } = await supabase.from("newsletter_logs").upsert(
        {
          campaign_id: campaignId,
          user_id: userId,
          clicked: true,
          clicked_at: new Date().toISOString(),
        },
        { onConflict: "campaign_id,user_id" }
      );
      if (error) console.error("Supabase upsert error:", error);
    }

    return {
      statusCode: 302,
      headers: {
        Location: url,
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
      body: "",
    };
  } catch (err) {
    console.error("track-click error:", err);
    return { statusCode: 500, body: "Error tracking click" };
  }
}
