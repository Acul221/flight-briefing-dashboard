/* global process */
// src/lib/emailClient.js
import { Resend } from "resend";

const apiKey = typeof process !== "undefined" ? process.env.RESEND_API_KEY : "";
const resend = new Resend(apiKey);
const fromName = typeof process !== "undefined" ? process.env.EMAIL_FROM_NAME : "";
const fromAddress = typeof process !== "undefined" ? process.env.EMAIL_FROM_ADDRESS : "";
const publicBase = typeof process !== "undefined" ? process.env.PUBLIC_BASE_URL : "";
const EMAIL_FROM = `${fromName} <${fromAddress}>`;

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

  const domain = fromAddress?.split("@")[1];

  try {
    const response = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      headers: {
        // Gmail/Yahoo prefer emails with clear unsubscribe
        "List-Unsubscribe": `<mailto:unsubscribe@${domain}>, <${publicBase}/unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    return response;
  } catch (err) {
    console.error("❌ emailClient error:", err.message);
    throw err;
  }
}
