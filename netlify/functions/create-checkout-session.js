// netlify/functions/create-checkout-session.js
export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { plan } = JSON.parse(event.body || "{}");

    const plans = {
      pro:    { amount: 60000, name: "SkyDeckPro – Pro" },
      bundle: { amount: 90000, name: "SkyDeckPro – Bundle" },
    };
    const selected = plans[plan];
    if (!selected) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid plan" }) };
    }

    // 🔑 Server Key dari Netlify env
    const raw = (process.env.MIDTRANS_SERVER_KEY || "").trim();
    const serverKey = raw.includes("=") ? raw.split("=").pop().trim().replace(/^"(.*)"$/, "$1") : raw;

    if (!serverKey || !serverKey.startsWith("Mid-server-")) {
      return { statusCode: 500, body: JSON.stringify({ error: "Invalid or missing server key" }) };
    }

    const order_id = `skydeck_${plan}_${Date.now()}`;

    // Payload ke Snap API
    const payload = {
      transaction_details: {
        order_id,
        gross_amount: selected.amount,
      },
      item_details: [
        {
          id: plan,
          price: selected.amount,
          quantity: 1,
          name: selected.name,
        },
      ],
      customer_details: {
        first_name: "Pilot",
        email: "test@skydeckpro.net",
      },
      credit_card: { secure: true },
      currency: "IDR",
      callbacks: {
        finish: "https://skydeckpro.netlify.app/payment-result",
      },
    };

    // Call Midtrans Snap
    const res = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Basic " + Buffer.from(serverKey + ":").toString("base64"),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: "midtrans_error", data }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        token: data.token,
        redirect_url: data.redirect_url,
        order_id,
      }),
    };
  } catch (err) {
    console.error("Checkout error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error", message: err.message }) };
  }
}
