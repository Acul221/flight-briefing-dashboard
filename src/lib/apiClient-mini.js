// ❗️Mini alias — JANGAN bikin client baru
import supabase, { getBearer, apiFetch, apiFetchAuthed } from "./apiClient";

export { supabase, getBearer, apiFetch, apiFetchAuthed };
export default supabase;

export async function authorizedHeaders() {
  const token = await getBearer();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
