// contoh-signup-handler.js (atau di file Anda sekarang)
import { supabase } from "@/lib/apiClient";

import { sendWelcomeEmail } from "@/lib/email";

export default async function onSignup({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;

  try { await sendWelcomeEmail(email, fullName || "Pilot"); } catch {}

  if (data?.user?.id) {
    await supabase
      .from("profiles")
      .update({
        welcome_email_sent: true,
        welcome_email_sent_at: new Date().toISOString(),
      })
      .eq("id", data.user.id);
  }
}
