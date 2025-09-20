// netlify/functions/list-newsletters.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export const handler = async () => {
  try {
    const { data, error } = await supabase
      .from("newsletters")
      .select("id, title, audience, created_at, sent_count")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
