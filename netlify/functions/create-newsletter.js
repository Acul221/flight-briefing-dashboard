// netlify/functions/create-newsletter.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { subject, content, audience } = JSON.parse(event.body || "{}");

    const { data, error } = await supabase
      .from("newsletters")
      .insert([{ title: subject, content, audience }])
      .select()
      .single();

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
