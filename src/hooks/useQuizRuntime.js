// src/hooks/useQuizRuntime.js
import { useEffect, useMemo, useState } from "react";

/**
 * useQuizRuntime
 * @param {object} opts
 * @param {string} opts.parentSlug           - slug parent (mis. 'atpl-test')
 * @param {string=} opts.subjectSlug         - slug child (mis. 'systems'); kalau diisi akan mengirim parent_slug
 * @param {boolean=} opts.includeDescendants - true jika start dari parent ingin ambil subtree
 * @param {('easy'|'medium'|'hard')=} opts.difficulty
 * @param {string=} opts.aircraftCsv         - e.g. "A320,A330"
 * @param {boolean=} opts.strictAircraft
 * @param {number=} opts.limit               - default 20
 */
export function useQuizRuntime(opts) {
  const {
    parentSlug,
    subjectSlug,
    includeDescendants = false,
    difficulty,
    aircraftCsv,
    strictAircraft = false,
    limit = 20,
  } = opts || {};

  const [state, setState] = useState({ loading: false, error: null, items: [], count: 0 });

  const url = useMemo(() => {
    if (!parentSlug && !subjectSlug) return null;

    const qs = new URLSearchParams();
    if (subjectSlug) {
      qs.set("category_slug", subjectSlug);
      if (parentSlug) qs.set("parent_slug", parentSlug); // disambiguasi child dgn parent
    } else {
      // parent mode
      qs.set("category_slug", parentSlug);
      if (includeDescendants) qs.set("include_descendants", "1");
    }

    if (difficulty) qs.set("difficulty", difficulty);
    if (aircraftCsv) qs.set("aircraft", aircraftCsv);
    if (strictAircraft) qs.set("strict_aircraft", "1");
    if (limit) qs.set("limit", String(limit));

    return `/.netlify/functions/quiz-pull?${qs.toString()}`;
  }, [parentSlug, subjectSlug, includeDescendants, difficulty, aircraftCsv, strictAircraft, limit]);

  async function refetch() {
    if (!url) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      setState({ loading: false, error: null, items: json.items || [], count: json.count || 0 });
    } catch (e) {
      setState({ loading: false, error: e.message, items: [], count: 0 });
    }
  }

  useEffect(() => { refetch(); }, [url]);

  return { ...state, refetch, url };
}

export default useQuizRuntime;
