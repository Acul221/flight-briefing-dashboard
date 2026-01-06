// src/utils/rehostImage.js
// Dev stub + Supabase Storage upload for production.
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const BUCKET = process.env.SUPABASE_BUCKET || "questions";

const isDev = !SUPABASE_URL || !SUPABASE_SERVICE_ROLE;
let _client;
function client() {
  if (isDev) return null;
  if (_client) return _client;
  _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });
  return _client;
}

export async function rehostImage(url) {
  if (!url) return { url: null, meta: { mode: "none" } };
  const trimmed = String(url).trim();
  if (!trimmed) return { url: null, meta: { mode: "none" } };

  if (isDev) {
    return { url: `dev-rehosted://${trimmed}`, meta: { mode: "dev-stub" } };
  }

  try {
    const supabase = client();
    const res = await fetch(trimmed);
    if (!res.ok) throw new Error(`fetch_failed_${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = (trimmed.split(".").pop() || "bin").split("?")[0].toLowerCase();
    const name = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const path = `imported/${name}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
      contentType: res.headers.get("content-type") || "application/octet-stream",
      upsert: false,
    });
    if (error) throw error;
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { url: pub.publicUrl, meta: { mode: "supabase", path, size: buf.length, origin: trimmed } };
  } catch (err) {
    // fallback to passthrough if upload fails
    return { url: trimmed, meta: { mode: "passthrough", error: err.message } };
  }
}
