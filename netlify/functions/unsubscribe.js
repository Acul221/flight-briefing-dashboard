// /netlify/functions/unsubscribe.js
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

function sign(data) {
  return crypto.createHmac("sha256", process.env.UNSUBSCRIBE_SECRET).update(data).digest("hex");
}

export const handler = async (event) => {
  try {
    const params = new URLSearchParams(event.rawQuery || "");
    const id = params.get("id");         // user id
    const c  = params.get("c");          // campaign id
    const t  = params.get("t");          // token

    if (!id || !c || !t) {
      return { statusCode: 400, body: "Bad request" };
    }

    const expected = sign(`${id}:${c}`);
    if (t !== expected) {
      return { statusCode: 401, body: "Invalid token" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ newsletter_opt_in: false })
      .eq("id", id);

    if (error) throw error;

    // Simple HTML response
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: `
        <html><body style="font-family:system-ui;padding:24px">
          <h2>You're unsubscribed ✅</h2>
          <p>You will no longer receive newsletters from SkyDeckPro.</p>
        </body></html>
      `
    };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
};
