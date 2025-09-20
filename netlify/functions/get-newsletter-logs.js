// netlify/functions/get-newsletter-logs.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export const handler = async (event) => {
  try {
    // 🔐 Basic auth check
    const adminSecret = event.headers["x-admin-secret"];
    if (adminSecret !== process.env.ADMIN_API_SECRET) {
      return { statusCode: 403, body: "Forbidden" };
    }

    const limit = parseInt(event.queryStringParameters?.limit || "20", 10);
    const page = parseInt(event.queryStringParameters?.page || "1", 10);
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("newsletter_logs")
      .select("id, newsletter_id, user_id, status, error, sent_at", { count: "exact" })
      .order("sent_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        logs: data,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      }),
    };
  } catch (err) {
    console.error("❌ get-newsletter-logs error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
