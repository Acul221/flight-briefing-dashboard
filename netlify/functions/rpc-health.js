import { createClient } from "@supabase/supabase-js";

const sba = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export const handler = async (event) => {
  try {
    const { data, error } = await sba.rpc("fn_validate_rpc_health");
    if (error) throw error;

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data, null, 2),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Health check failed",
        details: err.message,
      }),
    };
  }
};
