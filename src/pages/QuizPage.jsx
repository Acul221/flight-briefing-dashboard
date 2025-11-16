// src/pages/QuizPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { fnAuthed } from "@/lib/apiClient";
import QuestionCard from "@/components/quiz/QuestionCard";
import { useSession } from "@/hooks/useSession";
import { useSubscription } from "@/hooks/useSubscription";

const FUNCTIONS_BASE = (import.meta.env.VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, "");

/** Helpers */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const idxToLetter = (i) => ["A", "B", "C", "D"][i] ?? "-";

/** Normalisasi soal → format UI */
function normalizeQuestion(q) {
  const stem = String(q?.stem ?? q?.question_text ?? q?.question ?? q?.text ?? "");
  const answerKeyRaw =
    q?.answer_key ??
    q?.answerKey ??
    q?.correct_answer ??
    q?.correctAnswer ??
    q?.correct_index ??
    q?.correctIndex ??
    0;
  const answerIndex =
    typeof answerKeyRaw === "number"
      ? answerKeyRaw
      : ["A", "B", "C", "D"].indexOf(String(answerKeyRaw || "A").toUpperCase());
  const arr4 = (arr, fill = null) => {
    const v = Array.isArray(arr) ? [...arr] : [];
    while (v.length < 4) v.push(fill);
    return v.slice(0, 4);
  };
  const choicesArr = Array.isArray(q.choices)
    ? q.choices
    : [q.choices?.A, q.choices?.B, q.choices?.C, q.choices?.D];

  return {
    id: q.id,
    legacy_id: q.legacy_id || null,
    question: stem,
    questionImage: q.question_image_url || q.question_image || q.questionImage || null,
    choices: arr4((choicesArr || []).map((c) => c ?? ""), ""),
    choiceImages: arr4(q.choice_images || q.choiceImages, null),
    explanations: arr4(q.explanations || q.explanation_list, ""),
    correctIndex: Number.isInteger(answerIndex) && answerIndex >= 0 && answerIndex <= 3 ? answerIndex : 0,
    tags: Array.isArray(q.tags) ? q.tags : Array.isArray(q.tag_list) ? q.tag_list : [],
    difficulty: q.difficulty || q.level || null,
    category_path: Array.isArray(q.category_path)
      ? q.category_path
      : Array.isArray(q.categoryPath)
      ? q.categoryPath
      : null,
  };
}

/** Progress bar komponen kecil */
function ProgressBar({ value, total }) {
  const pct = total ? clamp(Math.round((value / total) * 100), 0, 100) : 0;
  return (
    <div className="w-full h-2 rounded bg-slate-100 overflow-hidden">
      <div
        className="h-full bg-emerald-500 transition-all"
        style={{ width: `${pct}%` }}
        aria-label={`Progress ${pct}%`}
      />
    </div>
  );
}

/** Navigator grid */
function Navigator({ total, currentIndex, answers, flags, onJump }) {
  return (
    <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-[repeat(15,minmax(0,1fr))] gap-1">
      {Array.from({ length: total }).map((_, i) => {
        const answered = answers[i] != null;
        const flagged = !!flags[i];
        return (
          <button
            key={i}
            onClick={() => onJump(i)}
            className={[
              "text-xs h-7 rounded border px-2",
              i === currentIndex
                ? "border-slate-900 text-white bg-slate-900"
                : answered
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-700",
              flagged ? "ring-2 ring-amber-400" : "",
            ].join(" ")}
            title={flagged ? "Flagged" : answered ? "Answered" : "Unanswered"}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

export default function QuizPage() {
  const { aircraft, subject, categorySlug, subjectSlug } = useParams();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const mode = (search.get("mode") || "practice").toLowerCase() === "exam" ? "exam" : "practice";

  const session = useSession(); // may be null for guests
  const { subscription } = useSubscription() || {}; // tests mock this

  const isActiveSubscriber = !!subscription && subscription.status === "active";

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  /** answersById: { [questionId]: 0..3 } */
  const [answersById, setAnswersById] = useState({});
  /** answersByIndex: array ringkas utk navigator */
  const answers = useMemo(() => {
    const arr = Array.from({ length: questions.length }).map(() => null);
    questions.forEach((q, i) => {
      if (Number.isInteger(answersById[q.id])) arr[i] = answersById[q.id];
    });
    return arr;
  }, [questions, answersById]);
  /** Flag per index */
  const [flags, setFlags] = useState({});
  /** Timer */
  const [durationSec, setDurationSec] = useState(0);
  /** UI state */
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  /** Feedback instan (practice) */
  const [showExplain, setShowExplain] = useState(false);
  /** Filter state */
  const [difficulty, setDifficulty] = useState("");
  const [requiresAircraft, setRequiresAircraft] = useState(false);

  // Ambil soal
  useEffect(() => {
    const abort = new AbortController();
    const load = async () => {
      setLoading(true);
      setErr("");
      setShowExplain(false);
      try {
        const u = new URL(`${FUNCTIONS_BASE}/quiz-pull`, window.location.origin);
        const parent = categorySlug || aircraft || null;
        const child = subjectSlug || subject || null;
        if (child) u.searchParams.set("category_slug", child);
        if (parent) u.searchParams.set("parent_slug", parent);
        u.searchParams.set("include_descendants", "1");
        u.searchParams.set("limit", "50"); // keep high; gating handled client-side
        if (parent) u.searchParams.set("aircraft", parent);
        u.searchParams.set("strict_aircraft", "0");
        if (difficulty) u.searchParams.set("difficulty", difficulty);
        if (requiresAircraft) u.searchParams.set("requires_aircraft", "true");

        const res = await fetch(u.toString().replace(window.location.origin, ""), {
          method: "GET",
          signal: abort.signal,
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`quiz-pull failed (${res.status})`);
        const json = await res.json();
        const items = Array.isArray(json?.items) ? json.items : [];
        const normalized = items.map(normalizeQuestion);
        setQuestions(normalized);
        setCurrentIndex(0);
        setAnswersById({});
        setFlags({});
        setDurationSec(0);
      } catch (e) {
        if (e.name !== "AbortError") {
          setErr(e?.message || "Failed to load questions");
        }
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(load, 250);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [aircraft, subject, categorySlug, subjectSlug, difficulty, requiresAircraft]);

  // Timer sederhana
  useEffect(() => {
    const t = setInterval(() => setDurationSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // === gating logic ===
  const fullCount = questions.length;
  const guestLimit = 10;
  const visibleCount = isActiveSubscriber ? fullCount : Math.min(fullCount, guestLimit);
  const displayedQuestions = useMemo(() => questions.slice(0, visibleCount), [questions, visibleCount]);
  const totalVisible = displayedQuestions.length;

  // Ensure currentIndex within visible range whenever visibleCount changes
  useEffect(() => {
    setCurrentIndex((i) => clamp(i, 0, Math.max(0, totalVisible - 1)));
  }, [totalVisible]);

  const current = displayedQuestions[currentIndex] ?? null;
  const difficultyLabel = difficulty ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1) : "All";
  const requiresAircraftLabel = requiresAircraft ? "Yes" : "No";

  function handleAnswer(idx) {
    if (!current) return;
    setAnswersById((prev) => ({ ...prev, [current.id]: idx }));
    setShowExplain(false);
  }

  function toggleFlag() {
    setFlags((f) => ({ ...f, [currentIndex]: !f[currentIndex] }));
  }

  function gotoPrev() {
    setCurrentIndex((i) => clamp(i - 1, 0, totalVisible - 1));
    setShowExplain(false);
  }
  function gotoNext() {
    setCurrentIndex((i) => clamp(i + 1, 0, totalVisible - 1));
    setShowExplain(false);
  }
  function jumpTo(i) {
    setCurrentIndex(clamp(i, 0, totalVisible - 1));
    setShowExplain(false);
  }

  const selectedIdx = current ? answersById[current.id] : null;
  const isAnswered = Number.isInteger(selectedIdx);
  const isCorrect = isAnswered ? selectedIdx === current?.correctIndex : null;

  // Progress: show X / fullCount (X is current visible index or visibleCount when at end)
  const progressValue = Math.min(currentIndex + 1, visibleCount);
  const progressText = `${progressValue} / ${fullCount}`;

  const durationText = useMemo(() => {
    const m = Math.floor(durationSec / 60);
    const s = durationSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [durationSec]);

  async function onFinish() {
    if (!questions.length || submitting) return;
    const items = questions
      .map((q) => ({
        question_id: q.id,
        legacy_id: q.legacy_id || null,
        answer_index: Number.isInteger(answersById[q.id]) ? answersById[q.id] : -1,
        correct_index: q.correctIndex,
        time_spent_sec: null,
        tags: q.tags || [],
        difficulty: q.difficulty || null,
        category_path: q.category_path || null,
      }))
      .filter((it) => it.answer_index >= 0);

    if (!items.length) {
      alert("Belum ada jawaban yang dipilih.");
      return;
    }

    const body = {
      aircraft: (categorySlug || aircraft) || null,
      category_root_slug: (categorySlug || aircraft) || null,
      category_slug: (subjectSlug || subject) || null,
      include_descendants: true,
      mode,
      duration_sec: durationSec,
      meta: { appVersion: "1.0.0", device: "web" },
      items,
    };

    try {
      setSubmitting(true);
      const res = await fnAuthed("/.netlify/functions/quiz-submit", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (res?.attempt_id) {
        navigate(`/quiz/result/${res.attempt_id}`);
      } else {
        alert(`Score: ${res.correct_count}/${res.question_count} (${res.score}%)`);
      }
    } catch (e) {
      alert(`Submit gagal: ${e?.message || e}`);
    } finally {
      setSubmitting(false);
    }
  }

  /** === Render === */
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse text-slate-500">Loading questions…</div>
      </div>
    );
  }
  if (err) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{err}</div>
      </div>
    );
  }
  if (!fullCount) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-3 rounded bg-amber-50 text-amber-800 border border-amber-200">
          Belum ada soal untuk kombinasi ini.
        </div>
        <div className="mt-3">
          <Link to="/quiz" className="text-blue-600 hover:underline">Kembali ke pilihan aircraft</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          Aircraft: <span className="font-medium">{aircraft || "-"}</span> - Subject:{" "}
          <span className="font-medium">{subject || "-"}</span> - Mode:{" "}
          <span className="font-medium capitalize">{mode}</span>
        </div>
        <div className="text-sm tabular-nums text-slate-600">Time: {durationText}</div>
      </div>

      {/* Filter panel */}
      <div className="flex flex-wrap gap-4 items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 dark:text-gray-300" htmlFor="quiz-filter-difficulty">
            Difficulty
          </label>
          <select
            id="quiz-filter-difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm"
          >
            <option value="">All</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={requiresAircraft}
            onChange={(e) => setRequiresAircraft(e.target.checked)}
            className="w-4 h-4 accent-sky-600"
          />
          Requires Aircraft
        </label>
      </div>
      <div className="mt-2 text-sm italic text-gray-500 dark:text-gray-400">
        Showing: {difficultyLabel} questions, Requires Aircraft: {requiresAircraftLabel}
      </div>

      {/* Progress */}
      <div className="mb-2">
        <ProgressBar value={progressValue} total={fullCount} />
        <div className="mt-1 text-right text-xs text-slate-500">{progressText}</div>

        {/* CTA area (shows only if we are gating and user can't see full set) */}
        {fullCount > visibleCount && (
          <div className="mt-3">
            {!session && (
              <div
                role="status"
                className="p-3 rounded bg-yellow-50 text-yellow-900 border border-yellow-200"
                data-testid="cta-login"
              >
                Login to access more questions —{" "}
                <Link to="/login" className="underline" aria-label="Sign in">
                  Sign in
                </Link>
              </div>
            )}

            {session && !isActiveSubscriber && (
              <div
                role="status"
                className="p-3 rounded bg-amber-50 text-amber-900 border border-amber-200"
                data-testid="cta-upgrade"
              >
                Upgrade to unlock all questions —{" "}
                <Link to="/billing" className="underline" aria-label="Upgrade plan">
                  Upgrade plan
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Kartu soal */}
      {current && (
        <div
          className={[
            "rounded-2xl border bg-white p-3 shadow-sm",
            mode === "practice" && isAnswered
              ? isCorrect
                ? "border-emerald-300 ring-1 ring-emerald-200"
                : "border-rose-300 ring-1 ring-rose-200"
              : "border-slate-200",
          ].join(" ")}
        >
          <QuestionCard
            key={current.id}
            question={current}
            index={currentIndex}
            total={totalVisible}
            selected={answersById[current.id]}
            onSelect={handleAnswer}
          />

          {/* Feedback instan hanya di practice mode */}
          {mode === "practice" && isAnswered && (
            <div className="mt-3 text-sm">
              <div
                className={[
                  "inline-flex items-center gap-2 rounded px-2 py-1 border",
                  isCorrect
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200",
                ].join(" ")}
              >
                {isCorrect ? "✓ Jawaban benar" : `✗ Jawaban salah (Kunci: ${idxToLetter(current.correctIndex)})`}
              </div>

              {/* Toggle Explanation */}
              {current.explanations?.[current.correctIndex] && (
                <button
                  onClick={() => setShowExplain((v) => !v)}
                  className="ml-2 text-slate-700 underline-offset-2 hover:underline"
                >
                  {showExplain ? "Sembunyikan penjelasan" : "Lihat penjelasan"}
                </button>
              )}

              {showExplain && current.explanations?.[current.correctIndex] && (
                <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-2 text-slate-700">
                  {current.explanations[current.correctIndex]}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Toolbar bawah */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFlag}
            className={[
              "px-3 py-2 rounded border",
              flags[currentIndex] ? "bg-amber-50 border-amber-300 text-amber-800" : "bg-white border-slate-200 text-slate-700",
            ].join(" ")}
          >
            {flags[currentIndex] ? "Flagged" : "Flag"}
          </button>
          <button
            type="button"
            onClick={() => {
              const firstUnanswered = answers.findIndex((v) => v == null);
              jumpTo(firstUnanswered !== -1 ? firstUnanswered : 0);
            }}
            className="px-3 py-2 rounded border bg-white border-slate-200 text-slate-700"
            title="Loncat ke soal belum dijawab"
          >
            Jump to Unanswered
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={gotoPrev}
            disabled={currentIndex === 0}
            className="px-3 py-2 rounded bg-slate-200 text-slate-800 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={gotoNext}
            disabled={currentIndex === totalVisible - 1}
            className="px-3 py-2 rounded bg-slate-800 text-white disabled:opacity-50"
          >
            Next Question
          </button>
          <button
            type="button"
            onClick={onFinish}
            disabled={submitting}
            className="ml-2 px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Finish & Review"}
          </button>
        </div>
      </div>

      {/* Navigator grid */}
      <div className="mt-4 p-3 rounded-2xl border border-slate-200 bg-white">
        <div className="mb-2 text-sm text-slate-500">Question Navigator</div>
        <Navigator
          total={totalVisible}
          currentIndex={currentIndex}
          answers={answers.slice(0, totalVisible)}
          flags={flags}
          onJump={jumpTo}
        />
      </div>
    </div>
  );
}
