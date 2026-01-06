// src/components/quiz/QuizRunner.jsx
import React, { useEffect, useMemo, useState } from "react";
import QuestionView from "./QuestionView";
import { fetchQuestions } from "@/lib/quizApi";

export default function QuizRunner({
  categorySlug,
  includeDescendants = true,
  difficulty = "all",
  requiresAircraft = false,
  userTier,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [answers, setAnswers] = useState([]); // { questionId, selectedIndex, correctIndex }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchQuestions({
          categorySlug,
          includeDescendants,
          difficulty,
          requiresAircraft,
          userTier,
        });
        if (!cancelled) {
          setQuestions(data || []);
          setIndex(0);
          setSelectedIndex(null);
          setHasChecked(false);
          setAnswers([]);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load questions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (categorySlug) {
      load();
    } else {
      setQuestions([]);
      setLoading(false);
      setError("categorySlug is required");
    }
    return () => {
      cancelled = true;
    };
  }, [categorySlug, includeDescendants, difficulty, requiresAircraft, userTier]);

  const current = useMemo(() => questions[index] || null, [questions, index]);
  const currentCorrect = useMemo(
    () => (current?.correctIndex ?? current?.correct_index ?? null),
    [current]
  );

  function handleSelect(idx) {
    setSelectedIndex(idx);
  }

  function handleCheck() {
    if (!current || selectedIndex === null) return;
    const entry = { questionId: current.id, selectedIndex, correctIndex: currentCorrect };
    setAnswers((prev) => [...prev.filter((a) => a.questionId !== current.id), entry]);
    setHasChecked(true);
  }

  function handleNext() {
    if (!current) return;
    const newEntry =
      selectedIndex !== null
        ? { questionId: current.id, selectedIndex, correctIndex: currentCorrect }
        : null;
    if (newEntry) {
      setAnswers((prev) => [...prev.filter((a) => a.questionId !== current.id), newEntry]);
    }
    setSelectedIndex(null);
    setHasChecked(false);
    if (index < questions.length - 1) {
      setIndex(index + 1);
    } else {
      // eslint-disable-next-line no-console
      console.log("Quiz finished. Answers:", newEntry || answers);
    }
  }

  function handlePrev() {
    if (index === 0) return;
    setIndex(index - 1);
    setSelectedIndex(null);
    setHasChecked(false);
  }

  const showExplanation = hasChecked;
  const effectiveCorrect = hasChecked ? currentCorrect : null;

  if (loading) {
    return (
      <div className="border rounded-xl p-4 bg-white shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-10 bg-slate-200 rounded" />
          <div className="h-10 bg-slate-200 rounded" />
          <div className="h-10 bg-slate-200 rounded" />
          <div className="h-10 bg-slate-200 rounded" />
        </div>
        <div className="mt-3 h-3 w-24 bg-slate-200 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-500 bg-red-50 text-red-700 rounded p-3 text-sm">
        Error: {error}
        <div className="mt-1 text-xs text-red-600">Please try again or check your connection.</div>
      </div>
    );
  }

  if (!questions.length) {
    return <div className="border rounded p-3 bg-white text-sm">No questions available.</div>;
  }

  const progressPct = questions.length ? Math.round(((index + 1) / questions.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs">
            Difficulty: {difficulty || "all"}
          </span>
          <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs">
            Requires AC: {requiresAircraft ? "Yes" : "No"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>
            Question {index + 1} / {questions.length}
          </span>
          <div className="w-28 h-2 bg-slate-200 rounded">
            <div className="h-2 bg-sky-500 rounded" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <QuestionView
        question={current}
        selectedIndex={selectedIndex}
        correctIndex={effectiveCorrect}
        mode="learn"
        onSelect={handleSelect}
        onFlag={handleFlag}
        showExplanation={showExplanation}
      />

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handlePrev}
          disabled={index === 0}
          className="px-3 py-2 rounded border bg-white disabled:opacity-50"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={handleCheck}
          disabled={selectedIndex === null || hasChecked}
          className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
        >
          Check Answer
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={index >= questions.length - 1 && selectedIndex === null}
          className="ml-auto px-4 py-2 rounded bg-sky-600 text-white disabled:opacity-50"
        >
          {index < questions.length - 1 ? "Next" : "Finish"}
        </button>
      </div>
    </div>
  );
}

async function handleFlag(question) {
  if (!question?.id) return;
  const reason = window.prompt("Flag reason (wrong answer/typo/unclear):", "wrong answer");
  if (!reason) return;
  const comment = window.prompt("Optional comment:", "");
  try {
    // Lazy import to avoid circular deps
    const { submitQuestionFlag } = await import("@/lib/quizApi");
    await submitQuestionFlag({
      questionId: question.id,
      reason,
      comment,
      meta: { categorySlug: question.category_slugs?.[0] || null },
    });
    // eslint-disable-next-line no-console
    console.log("Flag submitted");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Flag failed", e);
  }
}
