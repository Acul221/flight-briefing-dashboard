// netlify/functions/sales-email.js
import { Resend } from "resend";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// Init clients
const resend = new Resend(process.env.RESEND_API_KEY);
const openai = new OpenAI({ apiKey: process.env.GPT_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async (req) => {
  let logEntry = {
    user_id: null,
    email: null,
    type: "sales_upsell",
    status: "failed",
    error_message: null,
  };

  try {
    // 1. Ambil payload
    const { user_id } = await req.json();
    logEntry.user_id = user_id;

    // 2. Ambil data user dari Supabase
    const { data: user, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user_id)
      .single();

    if (profileError) throw profileError;
    logEntry.email = user.email;

    // 3. Generate teks email dengan OpenAI
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a sales assistant for SkyDeckPro. Write a short, friendly upsell email in Indonesian.",
        },
        {
          role: "user",
          content: `User name: ${user.full_name}. Mereka sudah mencapai limit kuis gratis.`,
        },
      ],
      max_tokens: 200,
    });

    const emailText = aiResponse.choices[0].message.content;

    // 4. Kirim email via Resend
    await resend.emails.send({
      from: "SkyDeckPro <noreply@skydeckpro.id>",
      to: user.email,
      subject: "Upgrade ke SkyDeckPro Pro 🔓",
      html: `<p>${emailText}</p>`,
    });

    // 5. Simpan log sukses
    logEntry.status = "sent";
    await supabase.from("email_logs").insert(logEntry);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // 6. Log error ke Supabase
    logEntry.error_message = err.message;
    try {
      await supabase.from("email_logs").insert(logEntry);
    } catch (e) {
      console.error("Gagal simpan log error:", e.message);
    }

    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
