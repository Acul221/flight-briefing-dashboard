// /netlify/functions/send-email.js
import fetch from "node-fetch";

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { to, subject, html } = JSON.parse(event.body || "{}");

    if (!to || !subject || !html) {
      return { statusCode: 400, body: "Missing required fields" };
    }

    console.log("ENV KEY:", process.env.RESEND_API_KEY?.slice(0, 10));

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev", // ✅ default Resend sender (aman untuk test)
        to,
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Resend error:", data);
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: data }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, id: data.id }),
    };
  } catch (err) {
    console.error("❌ Function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
