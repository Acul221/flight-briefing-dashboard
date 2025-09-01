// src/hooks/useSession.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * Hook untuk mengambil session aktif dari Supabase.
 * Menyediakan state yang akan update otomatis ketika user login/logout.
 */
export function useSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Ambil session saat ini
    supabase.auth.getSession().then(({ data, error }) => {
      if (isMounted) {
        if (error) {
          console.error("useSession error:", error.message);
          setSession(null);
        } else {
          setSession(data.session);
        }
        setLoading(false);
      }
    });

    // Listener perubahan auth (login/logout/refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (isMounted) setSession(newSession);
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return { session, loading };
}
