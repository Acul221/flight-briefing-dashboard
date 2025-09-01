import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { plan } = JSON.parse(event.body || "{}");

    // ✅ Map plan to amount & name
    const plans = {
      pro: { amount: 60000, name: "SkyDeckPro – Pro" },
      bundle: { amount: 90000, name: "SkyDeckPro – Bundle" },
    };

    const selected = plans[plan];
    if (!selected) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid plan" }) };
    }

    // ✅ Generate unique order_id
    const order_id = `skydeck_${plan}_${Date.now()}`;

    // ✅ Payload for Midtrans Snap
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
        email: "test@skydeckpro.net", // bisa diganti nanti dengan user login
      },
      credit_card: { secure: true },
      currency: "IDR",
    };

    // ✅ Call Midtrans Snap API
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return { statusCode: 500, body: "Missing MIDTRANS_SERVER_KEY in env" };
    }

    const res = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        Authorization:
          "Basic " + Buffer.from(serverKey + ":").toString("base64"),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify(data) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        token: data.token,
        redirect_url: data.redirect_url,
        order_id,
      }),
    };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
}
