import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);

      // cek session aktif
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (isMounted) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      // ambil data profile user
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (isMounted) {
        if (error) {
          console.error("useProfile error:", error);
          setProfile(null);
        } else {
          setProfile(data);
        }
        setLoading(false);
      }
    };

    loadProfile();

    // listen event perubahan session (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { profile, loading };
}
