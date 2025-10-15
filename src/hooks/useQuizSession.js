// src/hooks/useQuizSession.js
import { useEffect, useMemo, useRef, useState } from "react";
import { logEvent } from "@/lib/analytics";

export default function useQuizSession({ aircraft, subject }) {
  const storageKey = useMemo(() => `quiz:${aircraft}:${subject}`, [aircraft, subject]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // array of choiceIdx
  const [showExplanation, setShowExplanation] = useState(false);
  const [isReview, setIsReview] = useState(false);
  const [selected, setSelected] = useState(null); // choiceIdx at currentIndex
  const abortRef = useRef(null);

  // utils
  const clamp = (n, min, max) => Math.max(min, Math.min(n, max));
  const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const safeJSON = (s, dflt) => { try { return JSON.parse(s); } catch { return dflt; } };

  // ===== Fetch + restore =====
  useEffect(() => {
    let mounted = true;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const base = (import.meta.env?.VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, "");
        const u = new URL(`${base}/quiz-pull`, window.location.origin);
        if (subject) u.searchParams.set("category_slug", subject);
        u.searchParams.set("include_descendants", "1");
        if (aircraft) u.searchParams.set("aircraft", aircraft);
        u.searchParams.set("strict_aircraft", "0");
        // default limit; biarkan server shuffle/seed bila perlu
        u.searchParams.set("limit", "20");

        const res = await fetch(u.toString().replace(window.location.origin, ""), { signal: controller.signal, headers: { accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const items = Array.isArray(json?.items) ? json.items : [];

        // Map ke shape UI (QuestionCard kompatibel)
        const mapped = items.map((q) => ({
          id: q.id,
          legacy_id: q.legacy_id || null,
          question: q.question || "",
          questionImage: q.image || null,
          choices: Array.isArray(q.choices) ? q.choices : [],
          choiceImages: Array.isArray(q.choiceImages) ? q.choiceImages : [null, null, null, null],
          explanations: Array.isArray(q.explanations) ? q.explanations : ["", "", "", ""],
          correctIndex: Number.isInteger(q.correctIndex) ? q.correctIndex : 0,
          tags: Array.isArray(q.tags) ? q.tags : [],
          difficulty: q.difficulty || null,
          source: q.source || null,
        }));

        const fingerprint = JSON.stringify(mapped.map((q) => q.id));
        const saved = safeJSON(safeGet(storageKey), {});
        const sameSet = saved?.fingerprint === fingerprint;

        if (!mounted) return;

        setQuestions(mapped);

        // clamp index aman dua arah
        const restoredRaw = sameSet ? (saved.currentIndex ?? 0) : 0;
        const maxIdx = Math.max(mapped.length - 1, 0);
        const restoredSafe = Number.isFinite(restoredRaw) ? restoredRaw : 0;
        const clampedIdx = clamp(restoredSafe, 0, maxIdx);
        setCurrentIndex(clampedIdx);

        // restore answers (hanya jika set soal sama)
        const restoredAnswers = sameSet ? (saved.answers ?? []) : [];
        setAnswers(restoredAnswers);

        // sinkronkan selected ke jawaban di index aktif
        const selectedFromAnswers = sameSet ? (restoredAnswers?.[clampedIdx] ?? null) : null;
        setSelected(selectedFromAnswers);

        // showExplanation: pakai nilai restore; fallback true bila ada selected
        const restoredShow = sameSet ? saved.showExplanation : undefined;
        setShowExplanation(
          typeof restoredShow === "boolean" ? restoredShow : selectedFromAnswers != null
        );

        // isReview restore hanya jika sama set
        setIsReview(sameSet ? (saved.isReview ?? false) : false);

        // persist state awal (simetris)
        safeSet(
          storageKey,
          JSON.stringify({
            ...(saved || {}),
            fingerprint,
            currentIndex: clampedIdx,
            answers: restoredAnswers,
            selected: selectedFromAnswers,
            showExplanation:
              typeof restoredShow === "boolean" ? restoredShow : selectedFromAnswers != null,
            isReview: sameSet ? (saved.isReview ?? false) : false,
          })
        );
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("[useQuizSession] Fetch error:", e);
          setError(e);
          setQuestions([]);
        }
      } finally {
        mounted && setLoading(false);
      }
    }

    load();
    return () => { mounted = false; controller.abort(); };
  }, [aircraft, subject, storageKey]);

  // ===== Persist every change =====
  useEffect(() => {
    const prevState = safeJSON(safeGet(storageKey), {});
    const payload = {
      ...prevState,
      currentIndex,
      answers,
      isReview,
      selected,
      showExplanation,
    };
    safeSet(storageKey, JSON.stringify(payload));
  }, [storageKey, currentIndex, answers, isReview, selected, showExplanation]);

  // ===== Prefetch gambar soal berikutnya =====
  useEffect(() => {
    const nextQ = questions[currentIndex + 1];
    if (nextQ?.questionImage) {
      const img = new Image();
      img.src = nextQ.questionImage;
    }
  }, [questions, currentIndex]);

  // ===== Handlers =====
  // versi final dengan opsi { silent } untuk Exam Mode
  const answer = (choiceIdx, opts = {}) => {
    const { silent = false } = opts;
    if (choiceIdx == null) return;

    setSelected(choiceIdx);
    setShowExplanation(silent ? false : true);

    setAnswers((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      next[currentIndex] = choiceIdx;
      return next;
    });

    const q = questions[currentIndex];
    const isCorrect = q?.choices?.[choiceIdx]?.isCorrect;

    // analytics tetap jalan
    logEvent("answer_select", {
      id: q?.id,
      idx: currentIndex,
      choice: choiceIdx,
      correct: !!isCorrect,
    });

    // confetti hanya kalau tidak silent
    if (!silent && isCorrect) {
      import("canvas-confetti")
        .then(({ default: confetti }) => {
          confetti({ particleCount: 28, startVelocity: 30, spread: 45, origin: { y: 0.7 } });
        })
        .catch(() => {});
    }
  };

  // catatan: gating 10 soal dihandle di QuizPage (pakai gatedTotal & viewIndex)
  const next = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      // sinkronkan selected/showExplanation dengan jawaban di idx baru
      setSelected(answers?.[nextIdx] ?? null);
      setShowExplanation(answers?.[nextIdx] != null ? true : false);
      setIsReview(false);
    } else {
      setIsReview(true);
    }
  };

  const prev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setSelected(answers?.[prevIdx] ?? null);
      setShowExplanation(answers?.[prevIdx] != null ? true : false);
      setIsReview(false);
    }
  };

  const jumpTo = (idx) => {
    if (!questions.length) return;
    const maxIdx = Math.max(questions.length - 1, 0);
    const target = Math.max(0, Math.min(Number(idx) || 0, maxIdx));
    setCurrentIndex(target);
    setSelected(answers?.[target] ?? null);
    setShowExplanation(answers?.[target] != null ? true : false);
    setIsReview(false);
    logEvent("nav_jump", { idx: target });
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setAnswers([]);
    setSelected(null);
    setShowExplanation(false);
    setIsReview(false);
    const prevState = safeJSON(safeGet(storageKey), {});
    safeSet(storageKey, JSON.stringify({
      ...prevState,
      currentIndex: 0,
      answers: [],
      selected: null,
      showExplanation: false,
      isReview: false,
    }));
    logEvent("session_reset", { aircraft, subject });
  };

  return {
    // state
    loading,
    error,
    questions,
    currentIndex,
    answers,
    showExplanation,
    isReview,
    selected,
    // actions
    answer,          // <-- sudah mendukung { silent }
    next,
    prev,
    jumpTo,
    resetSession,
    setIsReview,     // untuk paksa Review (gating/timeout)
    setShowExplanation, // untuk paksa hide di Exam Mode
  };
}
