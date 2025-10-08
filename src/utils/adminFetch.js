// src/utils/adminFetch.js
import { supabase } from "@/lib/apiClient";

export async function adminFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    else if (import.meta.env.VITE_ADMIN_API_SECRET) headers.set("x-admin-secret", import.meta.env.VITE_ADMIN_API_SECRET);
  } catch {}
  return fetch(url, { ...options, headers });
}
