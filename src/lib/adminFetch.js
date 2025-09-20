// src/lib/adminFetch.js
import { supabase } from "@/lib/apiClient";

/** Fetch helper untuk endpoint admin (auto Bearer token). */
export async function adminFetch(path, { method = "POST", body } = {}) {
  const { data: { session } = {} } = await supabase.auth.getSession();
  const headers = { "Content-Type": "application/json" };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = {};
  try { json = await res.json(); } catch (_) {}

  if (!res.ok) {
    const msg = json?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}
// helper fetch GET dgn bearer supabase (dipakai hooks/*)