// netlify/functions/register-campaign.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body || "{}");
    const { campaignId, subject } = body;

    if (!campaignId || !subject) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Missing campaignId or subject",
        }),
      };
    }

    // Upsert dengan onConflict biar gak error duplicate
    const { data, error } = await supabase
      .from("newsletter_campaigns")
      .upsert(
        {
          campaign_id: campaignId,
          subject,
          created_at: new Date().toISOString(),
        },
        { onConflict: "campaign_id" }
      );

    if (error) {
      console.error("Supabase error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Supabase insert/update error",
          supabaseError: error,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Campaign registered/updated successfully",
        campaignId,
        subject,
        data,
      }),
    };
  } catch (err) {
    console.error("register-campaign error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Internal Server Error",
        error: err.message,
      }),
    };
  }
}
