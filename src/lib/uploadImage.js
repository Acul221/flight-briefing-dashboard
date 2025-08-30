// lib/uploadImage.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadImage(file, folder = "general") {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    let { error } = await supabase.storage
      .from("quiz-images")
      .upload(filePath, file);

    if (error) throw error;

    // Ambil public URL
    const { data } = supabase.storage.from("quiz-images").getPublicUrl(filePath);

    console.log("✅ Uploaded:", data.publicUrl);
    return data.publicUrl;
  } catch (err) {
    console.error("❌ Upload error:", err.message);
    return null;
  }
}
