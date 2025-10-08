// src/utils/uploadImage.js
import { supabase } from "@/lib/apiClient";

const BUCKET = import.meta.env.VITE_STORAGE_BUCKET || "quiz-images";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp"];

const EXT_FROM_MIME = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const toSlug = (s) =>
  (s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

async function hash8(file) {
  try {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    const hashBytes = Array.from(new Uint8Array(digest));
    return hashBytes.slice(0, 4).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return Math.random().toString(16).slice(2, 10);
  }
}

function datePrefix() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
}

function deriveExt(file) {
  // prioritas dari MIME, fallback dari nama file, terakhir "png"
  if (EXT_FROM_MIME[file.type]) return EXT_FROM_MIME[file.type];
  const nameExt = (file.name || "").split(".").pop();
  if (nameExt && /^[a-z0-9]{1,5}$/i.test(nameExt)) return nameExt.toLowerCase();
  return "png";
}

export async function uploadImage(file, { label = "image", prefix = "q" } = {}) {
  if (!file) throw new Error("No file selected");
  if (!ALLOWED.includes(file.type)) throw new Error("Only PNG, JPG, or WEBP allowed");
  if (file.size > MAX_SIZE) throw new Error("File too large (max 5MB)");

  const ext = deriveExt(file);
  const id = await hash8(file);
  const base = `${prefix}-${id}-${toSlug(label)}`.replace(/-+/g, "-");
  const path = `${datePrefix()}/${base}.${ext}`;

  // cacheControl tinggi + contentType eksplisit → CDN friendly
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || `image/${ext}`,
    cacheControl: "31536000", // 1 tahun
  });

  if (upErr) {
    // beri pesan yang lebih helpful
    if (upErr.statusCode === "409" || upErr.status === 409) {
      throw new Error("Upload conflict: file already exists. Coba lagi (nama unik berubah otomatis).");
    }
    if (/quota|storage/i.test(upErr.message || "")) {
      throw new Error("Upload failed: storage quota exceeded.");
    }
    throw upErr;
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // normalisasi supaya tidak ada '//' ganda
  const publicUrl = String(pub?.publicUrl || "").replace(/([^:]\/)\/+/g, "$1");

  return { path, publicUrl };
}
