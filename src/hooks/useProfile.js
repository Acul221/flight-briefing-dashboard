// src/hooks/useProfile.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * useProfile
 * - Ambil data profil user dari tabel `profiles`
 * - Wajib ada kolom `role` di tabel profiles (default: "user")
 * - Return { profile, loading, error }
 */
export function useProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        // 1) Ambil session user
        const {
          data: { session },
          error: sErr,
        } = await supabase.auth.getSession();
        if (sErr) throw sErr;

        if (!session?.user?.id) {
          if (mounted) {
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        // 2) Query profile dari tabel `profiles`
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id,email,full_name,role,newsletter_opt_in,welcome_email_sent,created_at"
          )
          .eq("id", session.user.id)
          .single();

        if (error) throw error;

        // 3) Pastikan role ada (default ke "user" kalau null/undefined)
        const safeProfile = {
          ...data,
          role: data.role ?? "user",
        };

        if (mounted) setProfile(safeProfile);
      } catch (err) {
        console.error("[useProfile] error:", err);
        if (mounted) {
          setError(err);

          // fallback: hanya info dasar dari token
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            setProfile({
              id: session.user.id,
              email: session.user.email ?? "",
              role: null, // jangan paksa user, biar AdminRoute bisa blok
            });
          } else {
            setProfile(null);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();

    // refresh saat auth berubah
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      run();
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  return { profile, loading, error };
}
