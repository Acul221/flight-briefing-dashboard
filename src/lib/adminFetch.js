// src/lib/adminFetch.js
import { supabase } from "@/lib/supabaseClient"; // ganti ke apiClient kalau kamu memang pakai itu

/**
 * Fetch helper untuk endpoint admin (Netlify Functions).
 * - Auto attach Bearer token Supabase (kalau ada session)
 * - Fallback x-admin-secret dari env (VITE_ADMIN_API_SECRET)
 * - Default method: GET
 */
export async function adminFetch(path, { method = "GET", body, headers = {} } = {}) {
  // siapkan header dasar
  const h = { "Content-Type": "application/json", ...headers };

  // Bearer token dari Supabase (kalau login)
  try {
    const { data: { session } = {} } = await supabase.auth.getSession();
    if (session?.access_token) {
      h.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (_) {
    // ignore
  }

  // Fallback secret untuk admin endpoints
  const secret = import.meta.env.VITE_ADMIN_API_SECRET;
  if (secret) h["x-admin-secret"] = secret;

  const res = await fetch(path, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = {};
  try { json = await res.json(); } catch (_) { /* ignore parse errors */ }

  if (!res.ok) {
    const msg = json?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}
