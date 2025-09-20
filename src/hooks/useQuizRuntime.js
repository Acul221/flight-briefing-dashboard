import { useEffect, useState } from "react";

export function useQuizRuntime({ category_slug, limit = 20, difficulty, aircraft, strict_aircraft } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState(null);

  useEffect(() => {
    let abort = false;
    async function go() {
      try {
        setLoading(true);
        setErr(null);
        const qs = new URLSearchParams();
        if (category_slug) qs.set("category", category_slug);
        if (limit) qs.set("limit", String(limit));
        if (difficulty) qs.set("difficulty", Array.isArray(difficulty) ? difficulty.join(",") : difficulty);
        if (aircraft) qs.set("aircraft", aircraft);
        if (strict_aircraft) qs.set("strict_aircraft", "1");
        const url = `/.netlify/functions/quiz-pull?${qs.toString()}`;
        const res = await fetch(url);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        if (!abort) setItems(json.items || []);
      } catch (e) {
        if (!abort) setErr(e);
      } finally {
        if (!abort) setLoading(false);
      }
    }
    if (category_slug) go();
    return () => { abort = true; };
  }, [category_slug, limit, difficulty, aircraft, strict_aircraft]);

  return { items, loading, error };
}
