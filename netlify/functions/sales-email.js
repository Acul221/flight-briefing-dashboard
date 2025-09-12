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
    // 1. Get payload
    const { user_id } = await req.json();
    logEntry.user_id = user_id;

    // 2. Fetch user profile from Supabase
    const { data: user, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user_id)
      .single();

    if (profileError) throw profileError;
    if (!user?.email) throw new Error("User email not found");
    logEntry.email = user.email;

    // 3. Generate upsell email text with OpenAI
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
You are a SkyDeckPro sales assistant. 
Write a short, persuasive upsell email in **english**. 
Rules:
- Tone: friendly, supportive, professional (not hard-sell).
- Mention user by their first name if available.
- Highlight 1–2 clear Pro benefits (e.g., unlimited quizzes, 1000+ questions, detailed explanations, personal analytics, exclusive pilot community).
- Apply Pro Teaser psychology:
   * Loss aversion → remind progress or insights may be lost without Pro.
   * Curiosity gap → detailed quiz explanations are locked for free users.
   * FOMO → other pilots already enjoy Pro features.
   * Anticipated reward → certificates, analytics, smoother training.
- Keep it concise: max 3 short paragraphs (<150 words).
- End with a clear CTA: “Upgrade ke SkyDeckPro Pro 🔓”.
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

    // 4. Send email via Resend
    await resend.emails.send({
      from: "SkyDeckPro <noreply@skydeckpro.id>",
      to: user.email,
      subject: "Upgrade ke SkyDeckPro Pro 🔓",
      html: `<div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.5;">${emailText}</div>`,
    });

    // 5. Save success log
    logEntry.status = "sent";
    await supabase.from("email_logs").insert(logEntry);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // 6. Log error to Supabase
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
