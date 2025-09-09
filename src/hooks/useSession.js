// src/hooks/useSession.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { isForceGuest } from "@/lib/guestMode";

/**
 * Hook session Supabase dengan dukungan "force guest" (?as=guest)
 * dan update otomatis pada login/logout/refresh.
 */
export function useSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // QA override: paksa guest via query param
        if (isForceGuest()) {
          if (mounted) {
            setSession(null);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;

        if (error) {
          console.error("[useSession] getSession error:", error.message);
          setSession(null);
        } else {
          setSession(data?.session ?? null);
        }
      } finally {
        mounted && setLoading(false);
      }
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      // hormati force guest saat URL masih pakai ?as=guest
      if (isForceGuest()) {
        setSession(null);
        return;
      }
      setSession(newSession ?? null);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  return { session, loading };
}
