// netlify/functions/sales-email.js
import { sendEmail } from "../../src/lib/emailClient.js";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

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
    const { user_id } = await req.json();
    logEntry.user_id = user_id;

    const { data: user, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user_id)
      .single();

    if (profileError) throw profileError;
    if (!user?.email) throw new Error("User email not found");
    logEntry.email = user.email;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
You are a SkyDeckPro sales assistant.
Write a short, persuasive upsell email in english.
Rules:
- Tone: friendly, supportive, professional.
- Mention user by first name if available.
- Highlight 1–2 Pro benefits (unlimited quizzes, 1000+ questions, explanations, analytics, pilot community).
- Use psychology: loss aversion, curiosity gap, FOMO, reward.
- Max 150 words.
- End with CTA: “Upgrade ke SkyDeckPro Pro 🔓”.
          `,
        },
        {
          role: "user",
          content: `User name: ${user.full_name}. They have already reached the free quiz limit.`,
        },
      ],
      max_tokens: 200,
    });

    const emailText = aiResponse.choices?.[0]?.message?.content?.trim();
    if (!emailText) throw new Error("Failed to generate email content");

    await sendEmail({
      to: user.email,
      subject: "Upgrade ke SkyDeckPro Pro 🔓",
      html: `<div style="font-family:sans-serif;font-size:15px;line-height:1.5;">${emailText}</div>`,
    });

    logEntry.status = "sent";
    await supabase.from("email_logs").insert(logEntry);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    logEntry.error_message = err.message;
    try {
      await supabase.from("email_logs").insert(logEntry);
    } catch (e) {
      console.error("Failed to save error log:", e.message);
    }

    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
