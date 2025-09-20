// netlify/functions/send-email.js
import { sendEmail } from "../../src/lib/emailClient.js";
import dotenv from "dotenv";
dotenv.config();

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { to, subject, html } = JSON.parse(event.body || "{}");

    const data = await sendEmail({ to, subject, html });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data }),
    };
  } catch (err) {
    console.error("❌ send-email error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
