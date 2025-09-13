import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function usePsiTrend() {
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrend() {
      const { data, error } = await supabase.rpc("get_psi_trend");
      if (!error && data) {
        setTrend(data);
      }
      setLoading(false);
    }
    fetchTrend();
  }, []);

  return { trend, loading };
}
