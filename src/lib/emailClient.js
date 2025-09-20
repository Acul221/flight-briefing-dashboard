// src/lib/emailClient.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`;

/**
 * Kirim email via Resend API
 * @param {Object} options
 * @param {string|string[]} options.to - Target email(s)
 * @param {string} options.subject - Subject email
 * @param {string} options.html - Konten HTML
 * @returns {Promise<Object>} Response dari Resend API
 */
export async function sendEmail({ to, subject, html }) {
  if (!to || !subject || !html) {
    throw new Error("Missing required fields: to, subject, or html");
  }

  const domain = process.env.EMAIL_FROM_ADDRESS?.split("@")[1];

  try {
    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      headers: {
        // Gmail/Yahoo prefer emails with clear unsubscribe
        "List-Unsubscribe": `<mailto:unsubscribe@${domain}>, <${process.env.PUBLIC_BASE_URL}/unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    return response;
  } catch (err) {
    console.error("❌ emailClient error:", err.message);
    throw err;
  }
}
