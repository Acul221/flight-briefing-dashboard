// contoh handler signup
import { sendWelcomeEmail } from "@/lib/email";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

async function onSignup({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    // tampilkan error ke user
    return;
  }

  // kirim welcome (best-effort)
  try {
    await sendWelcomeEmail(email, fullName || "Pilot");
  } catch {}

  // set flag agar tidak terkirim lagi
  if (data?.user?.id) {
    await supabase
      .from("profiles")
      .update({ welcome_email_sent: true, welcome_email_sent_at: new Date().toISOString() })
      .eq("id", data.user.id);
  }
}
