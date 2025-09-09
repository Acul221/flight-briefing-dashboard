// netlify/functions/create-checkout-session.js
import { createClient } from "@supabase/supabase-js";

function normalizeKey(raw){const v=(raw||"").trim();return v.includes("=")?v.split("=").pop().trim().replace(/^"(.*)"$/,"$1"):v;}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const MIDTRANS_SERVER_KEY = normalizeKey(process.env.MIDTRANS_SERVER_KEY);
const MIDTRANS_IS_PROD = (process.env.MIDTRANS_IS_PROD || "false") === "true";

const MID_BASE = MIDTRANS_IS_PROD
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
  : null;

// Harga ditentukan di server
const PRICES = { pro: 60000, bundle: 90000 };

function json(s,b){return {statusCode:s, body:JSON.stringify(b)}}

export async function handler(event){
  if (event.httpMethod !== "POST") return json(405, {error:"Method Not Allowed"});
  let body={}; try{ body = JSON.parse(event.body||"{}"); }catch{}

  const plan = (body.plan||"").toLowerCase();
  const user_id = body.user_id || null;
  const email = body.email || null;

  if (!plan || !user_id || !email) {
    return json(422, { error:"Missing required fields", fields:{plan:!!plan, user_id:!!user_id, email:!!email} });
  }

  const amount = PRICES[plan];
  if (!amount) return json(422, { error:`Unknown plan: ${plan}` });
  if (!MIDTRANS_SERVER_KEY) return json(500, { error:"MIDTRANS_SERVER_KEY is missing" });

  const order_id = `SDP-${Date.now()}-${Math.floor(Math.random()*9000+1000)}`;

  if (supabase){
    await supabase.from("orders").upsert({
      order_id, user_id, plan, amount, status:"pending", payment_type:null,
      meta:{requested_by:"create-checkout-session"},
      created_at:new Date().toISOString(), updated_at:new Date().toISOString(),
    }, { onConflict:"order_id" });
  }

  const auth = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");
  const payload = {
    transaction_details:{ order_id, gross_amount: amount },
    credit_card:{ secure:true },
    customer_details:{ email },
    item_details:[{ id:plan, price:amount, quantity:1, name:`SkyDeckPro ${plan}` }],
    custom_field1:user_id, custom_field2:plan, custom_field3:email,
  };

  const resp = await fetch(MID_BASE, {
    method:"POST",
    headers:{ "Content-Type":"application/json", Accept:"application/json", Authorization:`Basic ${auth}` },
    body: JSON.stringify(payload),
  });

  const out = await resp.json().catch(()=>({}));
  if (!resp.ok){
    if (supabase){
      await supabase.from("orders").update({
        status:"failed", meta:{ ...payload, error:out }, updated_at:new Date().toISOString()
      }).eq("order_id", order_id);
    }
    return json(502, { error:"Midtrans error", details: out });
  }

  if (supabase){
    await supabase.from("orders").update({
      meta:{ ...payload, midtrans:{ token: out.token, redirect_url: out.redirect_url } },
      updated_at:new Date().toISOString(),
    }).eq("order_id", order_id);
  }

  return json(200, { order_id, token: out.token, redirect_url: out.redirect_url });
}
