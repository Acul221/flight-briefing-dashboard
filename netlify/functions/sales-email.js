// netlify/functions/sales-email.js
import { Resend } from "resend";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async (req, res) => {
  try {
    const { user_id } = JSON.parse(req.body);

    // 1. Ambil data user
    const { data: user, error } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user_id)
      .single();

    if (error) throw error;

    // 2. Generate email copy via OpenAI
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a sales assistant for SkyDeckPro. Write a short, friendly upsell email."
        },
        {
          role: "user",
          content: `User name: ${user.full_name}. They reached the free quiz limit.`
        }
      ],
      max_tokens: 200
    });

    const emailText = aiResponse.choices[0].message.content;

    // 3. Kirim email via Resend
    await resend.emails.send({
      from: "SkyDeckPro <noreply@skydeckpro.id>",
      to: user.email,
      subject: "Upgrade ke SkyDeckPro Pro 🔓",
      html: `<p>${emailText}</p>`
    });

    // 4. Simpan log
    await supabase.from("email_logs").insert({
      user_id,
      email: user.email,
      type: "sales_upsell",
      status: "sent"
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
