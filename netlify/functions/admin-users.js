// /netlify/functions/admin-users.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

// Simple header-based guard so random callers can't hit this endpoint
function assertAdminSecret(event) {
  const secret = event.headers["x-admin-secret"] || event.headers["X-Admin-Secret"];
  if (!process.env.ADMIN_API_SECRET || secret !== process.env.ADMIN_API_SECRET) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    // Require shared admin secret
    assertAdminSecret(event);

    const { action, userId, newRole } = JSON.parse(event.body || "{}");
    if (!action || !userId) {
      return { statusCode: 400, body: "Missing parameters" };
    }

    // DELETE: remove from Auth (profiles row will cascade delete)
    if (action === "delete") {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // ROLE: promote/demote (admin <-> user/pro)
    if (action === "role" && newRole) {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole, suspended_at: null })
        .eq("id", userId);
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // SUSPEND: mark as disabled + timestamp
    if (action === "suspend") {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "disabled", suspended_at: new Date().toISOString() })
        .eq("id", userId);
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // UNSUSPEND: back to user (or pro, kalau mau dibuat parameter, tapi simple dulu ke 'user')
    if (action === "unsuspend") {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "user", suspended_at: null })
        .eq("id", userId);
      if (error) throw error;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 400, body: "Invalid action" };
  } catch (err) {
    console.error("AdminUsers error:", err);
    const status = err.status || 500;
    return { statusCode: status, body: JSON.stringify({ error: err.message }) };
  }
};
