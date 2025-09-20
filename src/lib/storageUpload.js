// src/lib/storageUpload.js
import { supabase } from "@/lib/apiClient";

const BUCKET = import.meta.env.VITE_STORAGE_BUCKET || "assets";
// Jika kamu pakai struktur tanggal, set ini = "1" (picker tetap jalan jika file ada di root prefix)
const DATE_PREFIX = import.meta.env.VITE_STORAGE_DATE_PREFIX === "1";

function trimSlashes(s) { return String(s || "").replace(/^\/+|\/+$/g, ""); }

function datePrefix() {
  if (!DATE_PREFIX) return "";
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}/`;
}

function extFrom(file) {
  const byName = (file.name?.split(".").pop() || "").toLowerCase();
  if (byName) return byName;
  const mt = (file.type || "").toLowerCase();
  if (mt.includes("png")) return "png";
  if (mt.includes("jpeg") || mt.includes("jpg")) return "jpg";
  if (mt.includes("webp")) return "webp";
  if (mt.includes("gif")) return "gif";
  return "bin";
}

async function sha256Hex(blob) {
  const buf = await blob.arrayBuffer();
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Kompres sederhana di client (tanpa EXIF rotate).
 * opts: { maxW=1600, maxH=1600, quality=0.82, mime="image/jpeg"|"image/webp"|null }
 */
export async function compressImage(file, opts = {}) {
  const { maxW = 1600, maxH = 1600, quality = 0.82, mime } = opts;
  // pakai canvas
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = URL.createObjectURL(file);
  });
  let { width, height } = img;
  const ratio = Math.min(1, maxW / width, maxH / height);
  const w = Math.max(1, Math.round(width * ratio));
  const h = Math.max(1, Math.round(height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  const outMime = mime || (file.type.includes("png") ? "image/png" : "image/jpeg");
  const blob = await new Promise((res) => canvas.toBlob(res, outMime, quality));
  URL.revokeObjectURL(img.src);
  return blob || file;
}

/** Upload publik + dedup konten (hash setelah kompresi) */
export async function uploadPublicImage(file, prefix = "questions", options = {}) {
  if (!file) throw new Error("No file selected");

  // kompres dulu (bisa dimatikan via options.compress=false)
  let toUpload = file;
  if (options.compress !== false) {
    toUpload = await compressImage(file, options);
  }

  const safePrefix = trimSlashes(prefix);
  const hash = await sha256Hex(toUpload);
  const ext = extFrom(file); // gunakan ekstensi original agar URL enak dibaca
  const key = `${safePrefix}/${datePrefix()}${hash}.${ext}`;

  // Upload tanpa upsert → kalau sudah ada, biarkan error dan pakai path existing
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(key, toUpload, {
      cacheControl: "31536000",
      upsert: false,
      contentType: toUpload.type || "application/octet-stream",
    });

  if (error) {
    const msg = (error.message || "").toLowerCase();
    const alreadyExists = error.status === 409 || msg.includes("exists") || msg.includes("duplicate");
    if (!alreadyExists) throw error;
  }

  const path = data?.path || key;
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return pub.publicUrl;
}

/** Ambil daftar URL publik terbaru (tanpa recursion dalam-dalam).
 * Tips: simpan file langsung di root prefix (questions/, choices/) agar picker optimal.
 */
export async function listRecentPublicUrls(prefix = "questions", limit = 20) {
  const safePrefix = trimSlashes(prefix);
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(safePrefix, { limit: Math.max(limit, 20), sortBy: { column: "updated_at", order: "desc" } });

  if (error) throw error;
  const files = (data || []).filter(x => x.id && !x.metadata?.isDirectory); // file saja

  const urls = files.slice(0, limit).map(f => {
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(`${safePrefix}/${f.name}`);
    return { name: f.name, url: pub.publicUrl, updated_at: f.updated_at };
  });
  return urls;
}
