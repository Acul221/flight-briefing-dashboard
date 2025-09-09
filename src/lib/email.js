// src/lib/email.js
// Lightweight email helpers for SkyDeckPro
// - Uses Netlify functions: `send-email` (single) and `send-newsletter` (bulk).
// - No external deps. Works in browser (fetch).

const SEND_EMAIL_FN = "/.netlify/functions/send-email";
const SEND_NEWSLETTER_FN = "/.netlify/functions/send-newsletter";

/**
 * Low-level sender for a single email.
 * @param {Object} p
 * @param {string} p.to - Recipient email address
 * @param {string} p.subject - Email subject
 * @param {string} p.html - HTML body
 * @returns {Promise<{ok:boolean,id?:string,error?:string}>}
 */
export async function sendEmail({ to, subject, html }) {
  if (!to || !subject || !html) {
    return { ok: false, error: "Missing to/subject/html" };
  }
  try {
    const res = await fetch(SEND_EMAIL_FN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok
      ? { ok: true, id: data?.id }
      : { ok: false, error: data?.error ? JSON.stringify(data.error) : "Send failed" };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

/**
 * Simple, responsive(ish) HTML wrapper for brand-consistent emails.
 * You can tweak colors/spacing later or swap with a full template.
 */
export function buildEmailTemplate({
  title = "SkyDeckPro",
  preheader = "",
  bodyHtml = "",
  ctaText,
  ctaHref,
  footerHtml = "",
}) {
  const cta = ctaText && ctaHref
    ? `<p style="margin:24px 0">
         <a href="${ctaHref}" style="display:inline-block;padding:12px 18px;border-radius:10px;text-decoration:none;background:#0ea5e9;color:#fff;font-weight:600">
           ${ctaText}
         </a>
       </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(title)}</title>
<style>
  @media (prefers-color-scheme: dark) {
    body { background:#0b0b0b !important; color:#e5e7eb !important; }
    .card { background:#111827 !important; border-color:#1f2937 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f6f7fb;color:#111827;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none;visibility:hidden;opacity:0;height:0;width:0">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" class="card"
             style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:28px">
        <tr><td>
          <h1 style="margin:0 0 10px;font-size:20px;line-height:1.3">${escapeHtml(title)}</h1>
          <div style="font-size:14px;line-height:1.6">${bodyHtml}</div>
          ${cta}
          <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb"/>
          <div style="font-size:12px;color:#6b7280;line-height:1.6">
            ${footerHtml}
          </div>
        </td></tr>
      </table>
      <div style="margin-top:12px;font-size:11px;color:#9ca3af">
        SkyDeckPro • Made for pilots
      </div>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Welcome email (call right after successful signup).
 * Uses the single-send Netlify function underneath.
 */
export async function sendWelcomeEmail(to, name = "Pilot") {
  const html = buildEmailTemplate({
    title: "Welcome aboard ✈️",
    preheader: "Thanks for joining SkyDeckPro!",
    bodyHtml: `
      <p>Hi <b>${escapeHtml(name)}</b>,</p>
      <p>Thanks for joining <b>SkyDeckPro</b>. Start with a quick quiz session and watch for our upcoming OCR Logbook.</p>
      <ul style="margin:12px 0 0;padding-left:18px">
        <li>Tip of the week: 10 A320 questions per day — small but consistent.</li>
      </ul>
    `,
    ctaText: "Open Dashboard",
    ctaHref: "/dashboard",
    footerHtml:
      `If you didn’t create this account, please ignore this email.`,
  });

  return await sendEmail({
    to,
    subject: "Welcome to SkyDeckPro ✈️",
    html,
  });
}

/**
 * Trigger a stored newsletter campaign (bulk).
 * `newsletterId` must exist in the `newsletters` table.
 */
export async function triggerNewsletter(newsletterId) {
  if (!newsletterId) return { ok: false, error: "newsletterId is required" };
  try {
    const res = await fetch(SEND_NEWSLETTER_FN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newsletterId }),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok
      ? { ok: true, ...data }
      : { ok: false, error: data?.error ? JSON.stringify(data.error) : "Trigger failed" };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}

/** Utility: escape plain text used in HTML attributes/text nodes. */
function escapeHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
