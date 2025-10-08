// src/hooks/useQuizRuntime.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * useQuizRuntime
 * ----------------
 * Mem-fetch daftar soal untuk quiz sesuai filter.
 *
 * Params (semua optional kecuali minimal satu categorySlug/parentSlug):
 * - categorySlug: string        // slug kategori target (subject) atau parent
 * - parentSlug: string          // kalau cuma punya parent, set ini dan includeDescendants=true
 * - includeDescendants: bool    // true => ambil seluruh turunan dari categorySlug/parentSlug
 * - difficulty: "easy"|"medium"|"hard" | undefined
 * - aircraft: string            // contoh: "A320"
 * - strictAircraft: bool        // true => filter ketat kolom aircraft
 * - limit: number               // default 20
 * - seed: number                // buat random konsisten
 * - status: string              // default "published"
 * - debug: bool                 // return debugInfo
 *
 * Return:
 * - items: { id, question, image, choices[], answerKey, explanation, ... }[]
 * - count: number
 * - loading: bool
 * - error: Error | null
 * - refetch(): void
 * - debugInfo: object | null
 */
export function useQuizRuntime({
  categorySlug = "",
  parentSlug = "",
  includeDescendants = true,
  difficulty,
  aircraft = "",
  strictAircraft = false,
  limit = 20,
  seed,
  status = "published",
  debug = false,
} = {}) {
  const FN_BASE = useMemo(
    () => (import.meta.env.VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, ""),
    []
  );
  const Q_URL = `${FN_BASE}/questions`;

  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  // build URLSearchParams sekali setiap dependency berubah
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    // Server expects: q, status, category_slug, include_descendants, difficulty, aircraft, strict_ac, limit, seed
    if (status) p.set("status", status);
    if (categorySlug) {
      p.set("category_slug", String(categorySlug).toLowerCase());
      if (includeDescendants) p.set("include_descendants", "1");
    } else if (parentSlug) {
      // fallback: kalau cuma parent
      p.set("category_slug", String(parentSlug).toLowerCase());
      if (includeDescendants) p.set("include_descendants", "1");
    }

    if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
      p.set("difficulty", difficulty);
    }
    if (aircraft) p.set("aircraft", aircraft);
    if (strictAircraft) p.set("strict_ac", "1");
    if (limit) p.set("limit", String(Math.max(1, Math.min(200, limit))));
    if (typeof seed === "number" && !Number.isNaN(seed)) p.set("seed", String(seed));
    // Always only take published by default
    return p;
  }, [categorySlug, parentSlug, includeDescendants, difficulty, aircraft, strictAircraft, limit, seed, status]);

  const url = useMemo(() => `${Q_URL}?${qs.toString()}`, [Q_URL, qs]);

  // adapter -> ubah row API → shape ringan untuk UI
  const mapRow = useCallback((row) => {
    // server “questions” kita biasa punya:
    // question_text, question_image_url, choices(Obj/Array), choice_images(Array), explanations(Array), answer_key
    const choicesArray = Array.isArray(row.choices)
      ? row.choices
      : ["A", "B", "C", "D"].map((L) => {
          const v = row.choices?.[L];
          return typeof v === "object" && v !== null ? (v.text ?? "") : (v ?? "");
        });

    const explanations = Array.isArray(row.explanations) ? row.explanations : ["", "", "", ""];
    const choiceImages = Array.isArray(row.choice_images) ? row.choice_images : [null, null, null, null];

    return {
      id: row.id,
      question: row.question_text || "",
      image: row.question_image_url || null,
      choices: choicesArray,
      choiceImages,
      explanations,
      answerKey: String(row.answer_key || "A").toUpperCase(),
      difficulty: row.difficulty || "medium",
      status: row.status || "published",
      aircraft: row.aircraft || "",
      tags: Array.isArray(row.tags) ? row.tags : [],
      raw: row, // simpan jika UI perlu data mentah
    };
  }, []);

  // refetch
  const abortRef = useRef(null);
  const fetchNow = useCallback(async () => {
    if (!categorySlug && !parentSlug) {
      setItems([]); setCount(0); setErr(new Error("categorySlug/parentSlug required"));
      return;
    }
    abortRef.current?.abort?.();
    const ctl = new AbortController();
    abortRef.current = ctl;

    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(url, { signal: ctl.signal });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      const rows = Array.isArray(j.items) ? j.items : [];
      const adapted = rows.map(mapRow);
      setItems(adapted);
      setCount(Number(j.count || adapted.length || 0));

      if (debug) {
        setDebugInfo({
          requestUrl: url,
          params: Object.fromEntries(qs.entries()),
          serverCount: j.count,
          firstId: adapted[0]?.id || null,
        });
      } else {
        setDebugInfo(null);
      }
    } catch (e) {
      if (e.name !== "AbortError") setErr(e);
      setItems([]); setCount(0);
      if (debug) setDebugInfo({ requestUrl: url, error: String(e.message || e) });
    } finally {
      setLoading(false);
    }
  }, [url, categorySlug, parentSlug, mapRow, debug, qs]);

  useEffect(() => {
    fetchNow();
    return () => abortRef.current?.abort?.();
  }, [fetchNow]);

  return {
    items,
    count,
    loading,
    error: err,
    refetch: fetchNow,
    debugInfo,
  };
}
