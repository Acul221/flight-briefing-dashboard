// netlify/functions/unsubscribe.js
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

function verifySignature(data, token) {
  const expected = crypto
    .createHmac("sha256", process.env.UNSUBSCRIBE_SECRET)
    .update(data)
    .digest("hex");
  return expected === token;
}

export const handler = async (event) => {
  try {
    const { id, c, t } = event.queryStringParameters || {};

    if (!id || !c || !t) {
      return {
        statusCode: 400,
        body: "Invalid unsubscribe link",
      };
    }

    // Verify signature
    const isValid = verifySignature(`${id}:${c}`, t);
    if (!isValid) {
      return { statusCode: 403, body: "Invalid or expired token" };
    }

    // Update profile → opt-out newsletter
    const { error } = await supabase
      .from("profiles")
      .update({ newsletter_opt_in: false })
      .eq("id", id);

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: `
        <html>
          <head>
            <title>Unsubscribed</title>
            <style>
              body { font-family: Arial, sans-serif; background: #f9fafb; padding: 40px; }
              .box { max-width: 480px; margin:auto; background:white; padding:30px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1);}
              h1 { color:#1f2937; font-size:24px; }
              p { color:#4b5563; }
            </style>
          </head>
          <body>
            <div class="box">
              <h1>✅ You have been unsubscribed</h1>
              <p>Your email preferences have been updated. You will no longer receive newsletters from SkyDeckPro.</p>
              <p>If this was a mistake, you can <a href="${process.env.PUBLIC_BASE_URL}/settings">manage your preferences</a>.</p>
            </div>
          </body>
        </html>
      `,
    };
  } catch (err) {
    console.error("❌ unsubscribe error:", err.message);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
