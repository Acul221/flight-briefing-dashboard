// src/hooks/useSubscription.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "./useSession";
import { isForceGuest } from "@/lib/guestMode"; // optional helper; return false if you don't use it

/**
 * Menentukan status subscription user untuk gating:
 * - 'guest'    : tidak ada session / force guest
 * - 'inactive' : login tapi tidak punya sub aktif
 * - 'pro'      : sub aktif (status 'active' & belum expired)
 *
 * Kembalian:
 * { status, isPro, isGuest, isInactive, current, loading, error, refresh }
 */
export function useSubscription() {
  const { session, loading: sessionLoading } = useSession();

  const [status, setStatus] = useState("guest"); // 'guest' | 'inactive' | 'pro'
  const [current, setCurrent] = useState(null);  // baris subscription aktif/terbaru (jika ada)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = session?.user?.id || null;

  const computeStatusFromRow = (row) => {
    const now = Date.now();
    const end = row?.current_period_end ? new Date(row.current_period_end).getTime() : 0;
    const active = row?.status === "active" && end > now;
    return active ? "pro" : "inactive";
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // QA: paksa guest via query (?as=guest)
      if (isForceGuest && isForceGuest()) {
        setStatus("guest");
        setCurrent(null);
        return;
      }

      // belum login → guest
      if (!userId) {
        setStatus("guest");
        setCurrent(null);
        return;
      }

      // Ambil subscription terbaru user (kalau ada)
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status,current_period_end,plan,provider,updated_at")
        .eq("user_id", userId)
        .order("current_period_end", { ascending: false })
        .limit(1);

      if (error) throw error;

      const row = Array.isArray(data) && data.length ? data[0] : null;
      setCurrent(row);
      setStatus(row ? computeStatusFromRow(row) : "inactive");
    } catch (e) {
      console.warn("[useSubscription] fallback inactive:", e?.message || e);
      // fallback aman: kalau ada session tapi query gagal → jadikan 'inactive'
      setCurrent(null);
      setStatus(userId ? "inactive" : "guest");
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (sessionLoading) return;
    let mounted = true;

    (async () => {
      await refresh();
      if (!mounted) return;
    })();

    // re-evaluate saat auth berubah
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, [sessionLoading, refresh]);

  const isPro = useMemo(() => status === "pro", [status]);
  const isGuest = useMemo(() => status === "guest", [status]);
  const isInactive = useMemo(() => status === "inactive", [status]);

  return { status, isPro, isGuest, isInactive, current, loading, error, refresh };
}
