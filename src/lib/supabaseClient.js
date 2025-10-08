// src/lib/supabaseClient.js
// ❗️Alias ke client utama — tanpa createClient lagi
import { supabase, apiFetch, apiFetchAuthed, getBearer } from "./apiClient";

export { supabase, apiFetch, apiFetchAuthed, getBearer };
