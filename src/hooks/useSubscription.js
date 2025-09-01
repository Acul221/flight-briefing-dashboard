// src/hooks/useSubscription.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "./useSession";

/**
 * Hook untuk mengambil subscription user dari tabel `subscriptions`.
 * Mengembalikan { subscription, loading, error }.
 */
export function useSubscription() {
  const { session, loading: sessionLoading } = useSession();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Jika session masih loading → jangan query dulu
    if (sessionLoading) return;

    // Kalau tidak ada user → kosongkan state
    if (!session?.user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error) {
        console.error("useSubscription error:", error.message);
        setSubscription(null);
        setError(error);
      } else {
        setSubscription(data);
      }
      setLoading(false);
    };

    load();
  }, [session, sessionLoading]);

  return { subscription, loading, error };
}
