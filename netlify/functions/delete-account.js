// netlify/functions/delete-account.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  // Jangan pernah deploy tanpa env ini
  console.warn("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function json(status, body, extraHeaders = {}) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",                // sesuaikan jika perlu strict
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

export async function handler(event) {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method Not Allowed" });
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { error: "Missing or invalid Authorization header" });
    }
    const token = authHeader.split(" ")[1];

    // Validasi token → dapatkan user dari token
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json(401, { error: "Invalid or expired token" });
    }
    const requester = userData.user; // { id, email, ... }

    // Body
    const { user_id: targetUserId } = JSON.parse(event.body || "{}");
    if (!targetUserId) {
      return json(400, { error: "user_id is required" });
    }

    // Siapa yang boleh menghapus:
    // - User hanya boleh hapus dirinya sendiri
    // - Admin boleh menghapus siapapun (opsional: matikan jika tak perlu)
    let isAdmin = false;
    {
      const { data: prof, error: pErr } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", requester.id)
        .single();
      if (!pErr && prof?.role === "admin") isAdmin = true;
    }

    if (requester.id !== targetUserId && !isAdmin) {
      return json(403, { error: "Forbidden: you can only delete your own account" });
    }

    // Catat log (opsional)
    await supabaseAdmin.from("deletion_logs").insert({
      user_id: targetUserId,
      requested_by: requester.id,
      requested_at: new Date().toISOString(),
      note: requester.id === targetUserId ? "self-delete" : "admin-delete",
    }).catch(() => { /* tabel opsional, abaikan error jika belum ada */ });

    // --- Bersihkan Storage (opsional, jika kamu pakai bucket per user) ---
    const buckets = (process.env.STORAGE_BUCKETS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const bucket of buckets) {
      try {
        // Asumsi pola: file disimpan di path prefix userId/
        // 1) list semua file di prefix userId (batasi batch)
        const listRes = await supabaseAdmin.storage.from(bucket).list(targetUserId, {
          limit: 1000,
          offset: 0,
          sortBy: { column: "name", order: "asc" },
        });

        if (listRes?.data?.length) {
          const paths = listRes.data.map((f) => `${targetUserId}/${f.name}`);
          await supabaseAdmin.storage.from(bucket).remove(paths);
        }

        // Jika punya subfolder nested, pertimbangkan loop rekursif (diabaikan untuk skeleton ini)
      } catch (e) {
        console.warn(`[storage] failed to clean bucket=${bucket}`, e?.message);
      }
    }

    // --- Hapus data di tabel aplikasi (kalau FK belum cascade) ---
    // Pastikan skema DB kamu punya FK ON DELETE CASCADE supaya aman.
    // Kalau belum, hapus manual di sini:
    // await supabaseAdmin.from("orders").delete().eq("user_id", targetUserId);
    // await supabaseAdmin.from("entitlements").delete().eq("user_id", targetUserId);
    // await supabaseAdmin.from("profiles").delete().eq("id", targetUserId);

    // --- Hapus akun auth ---
    const delRes = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (delRes.error) {
      // Kalau error karena constraint, pastikan dulu CASCADE atau hapus manual record terkait
      return json(500, { error: `Failed to delete auth user: ${delRes.error.message}` });
    }

    return json(200, { ok: true, message: "Account deleted" });
  } catch (e) {
    console.error(e);
    return json(500, { error: "Internal Server Error" });
  }
}
