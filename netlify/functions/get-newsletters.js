// netlify/functions/get-newsletters.js
import { createClient } from "@supabase/supabase-js";

// Supabase service role (backend secure)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export async function handler(event) {
  try {
    // Optional: hanya izinkan GET
    if (event.httpMethod !== "GET") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    // Query ke view newsletter_overview
    const { data, error } = await supabase
      .from("newsletter_overview")
      .select("*")
      .order("last_sent", { ascending: false });

    if (error) {
      console.error("Error fetching newsletters:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Database fetch error", details: error }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ newsletters: data }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // atau limit ke domain kamu
      },
    };
  } catch (err) {
    console.error("get-newsletters error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
}
