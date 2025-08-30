// src/lib/uploadImage.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper: hash file dengan SHA-1
async function getFileHash(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Upload file ke Supabase Storage dengan nama hash-based
 * @param {File} file - File dari input
 * @param {string} folder - Folder target di bucket (misal "questions", "choices")
 * @returns {Promise<{ url: string, status: "new" | "reuse" }>}
 */
export async function uploadImage(file, folder = "questions") {
  if (!file) throw new Error("No file provided");

  // Buat nama file hash.ext
  const hash = await getFileHash(file);
  const ext = file.name.split(".").pop();
  const fileName = `${hash}.${ext}`;
  const filePath = `${folder}/${fileName}`;

  let status = "reuse";

  // Step 1: coba upload langsung
  const { error: uploadError } = await supabase.storage
    .from("quiz-images")
    .upload(filePath, file, { upsert: false });

  if (uploadError) {
    if (uploadError.message.includes("The resource already exists")) {
      // ✅ File sudah ada → reuse
      console.log("♻️ Reused existing file:", filePath);
      status = "reuse";
    } else {
      console.warn("⚠️ Upload error, fallback ke list():", uploadError.message);

      // Step 2: fallback cek pakai list()
      const { data: listData, error: listError } = await supabase.storage
        .from("quiz-images")
        .list(folder, { limit: 100 }); // ambil max 100 file, bisa diatur

      if (listError) {
        console.error("List error:", listError.message);
        throw uploadError; // lempar error asli upload kalau list juga gagal
      }

      const exists = listData?.some((f) => f.name === fileName);
      if (exists) {
        console.log("♻️ Found existing file via fallback:", filePath);
        status = "reuse";
      } else {
        console.error("🚨 Upload failed, file not found in list().");
        throw uploadError;
      }
    }
  } else {
    console.log("✅ Uploaded new file:", filePath);
    status = "new";
  }

  // Ambil public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("quiz-images").getPublicUrl(filePath);

  return { url: publicUrl, status };
}
