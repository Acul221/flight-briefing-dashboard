// src/lib/apiClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Missing Supabase env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
}

// SINGLETON Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: "sb-skydeckpro-auth",
    autoRefreshToken: true,
  },
});

/** Ambil bearer token dari Supabase */
export async function getBearer() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

/** Normalisasi path supaya selalu string */
function toPathString(path) {
  if (typeof path === "string") return path;
  if (path instanceof URL) return path.toString();
  if (path && typeof path.url === "string") return path.url;   // Request
  if (path && typeof path.href === "string") return path.href; // Location-like
  return String(path || "");
}

/** Build URL absolut/relatif aman */
function buildUrl(p) {
  const s = toPathString(p);
  if (!s) throw new Error("apiFetch: empty path");
  // kalau sudah http(s) biarkan; kalau relatif, pastikan diawali '/'
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith("/") ? s : `/${s}`;
}

/** Fetch biasa (tanpa auth) */
export async function apiFetch(path, init = {}) {
  const url = buildUrl(path);
  const headers = {
    Accept: "application/json",
    ...(init.headers || {}),
  };
  const res = await fetch(url, { ...init, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || `HTTP ${res.status}`);
  return json;
}

/** Fetch dengan Bearer Supabase (dan optional x-admin-secret).
 *  init.body boleh JSON-string atau FormData; kalau FormData, Content-Type tidak diset manual. */
export async function apiFetchAuthed(path, init = {}) {
  const url = buildUrl(path);
  const token = await getBearer();
  if (!token) throw new Error("Not authenticated");

  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;

  const headers = {
    Accept: "application/json",
    ...(isForm ? {} : { "Content-Type": "application/json" }),
    ...(init.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  // opsional: admin secret
  if (import.meta.env.VITE_ADMIN_API_SECRET) {
    headers["x-admin-secret"] = import.meta.env.VITE_ADMIN_API_SECRET;
  }

  const res = await fetch(url, { ...init, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    const msg = json?.error || json?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

/** Helper ringkas untuk Netlify Functions (authed).
 *  Contoh: await fnAuthed("/.netlify/functions/submit-question?dry=1", payload)
 */
export async function fnAuthed(path, body, opts = {}) {
  const init = {
    method: opts.method || "POST",
    ...opts,
  };
  if (body && !(body instanceof FormData)) {
    init.body = JSON.stringify(body);
  } else if (body) {
    init.body = body; // FormData
  }
  return apiFetchAuthed(path, init);
}
