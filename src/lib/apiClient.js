// src/lib/apiClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// SINGLETON: module scope -> hanya dibuat sekali
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: "sb-skydeckpro-auth", // custom biar gak tabrakan
    autoRefreshToken: true,
  },
});

// helper fetch ke Netlify Functions (tanpa auth)
export async function apiFetch(path) {
  const res = await fetch(`/.netlify/functions${path.startsWith("/") ? "" : "/"}${path}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

// helper fetch dgn bearer supabase (dipakai hooks/*)
export async function apiFetchAuthed(method, path, body) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  if (import.meta.env.VITE_ADMIN_API_SECRET) {
    headers["x-admin-secret"] = import.meta.env.VITE_ADMIN_API_SECRET;
  }
  const res = await fetch(`/.netlify/functions${path.startsWith("/") ? "" : "/"}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}
// helper fetch GET dgn bearer supabase (dipakai hooks/*)