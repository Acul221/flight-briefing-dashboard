// netlify/functions/send-email.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = "SkyDeckPro <noreply@skydeckpro.id>";

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { to, subject, html } = JSON.parse(event.body || "{}");

    if (!to || !subject || !html) {
      return { statusCode: 400, body: "Missing required fields" };
    }

    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

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
