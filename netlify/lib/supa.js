// Singleton clients for serverless functions
import { createClient as createSB } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

// service client: full DB (bypass RLS). DO NOT expose service key.
export const supaSvc = createSB(url, service, { auth: { persistSession: false } });

// helper: get user from incoming Authorization: Bearer <jwt>
export async function getUserFromReq(req) {
  const hdr = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const token = hdr.toLowerCase().startsWith("bearer ") ? hdr.slice(7) : null;
  if (!token) return null;
  // use anon key but forward the Bearer; getUser() validates JWT
  const supaUser = createSB(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data, error } = await supaUser.auth.getUser();
  if (error || !data?.user) return null;
  // fetch profile.is_admin via service client
  const { data: prof } = await supaSvc
    .from("profiles")
    .select("id,is_admin")
    .eq("id", data.user.id)
    .maybeSingle();
  return { id: data.user.id, email: data.user.email, is_admin: !!prof?.is_admin };
}
