// src/pages/ResultPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { formatDateTime } from "@/utils/date";
import clsx from "clsx";

const FUNCTIONS_BASE = (import.meta.env.VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, "");

/** --- Helpers (kepraktisan: inline supaya mudah dipakai langsung) --- */
const idxToLetter = (i) => ["A", "B", "C", "D"][Number(i)] ?? "-";

function normalizeQuestion(q) {
  if (!q) return null;
  const answerIndex = ["A", "B", "C", "D"].indexOf(String(q.answer_key || "A").toUpperCase());
  const asArray4 = (arr, fill = null) => {
    const v = Array.isArray(arr) ? [...arr] : [];
    while (v.length < 4) v.push(fill);
    return v.slice(0, 4);
  };

  const choicesArr = Array.isArray(q.choices)
    ? q.choices
    : [q.choices?.A, q.choices?.B, q.choices?.C, q.choices?.D];

  return {
    id: q.id,
    question: q.question_text || "",
    questionImage: q.question_image_url || null,
    choices: asArray4((choicesArr || []).map((c) => (c == null ? "" : c)), ""),
    choiceImages: asArray4(q.choice_images || [], null),
    explanations: asArray4(q.explanations || [], ""),
    correctIndex: answerIndex >= 0 && answerIndex <= 3 ? answerIndex : 0,
    difficulty: q.difficulty || null,
    tags: Array.isArray(q.tags) ? q.tags : [],
  };
}

function mmss(sec) {
  const s = Math.max(0, parseInt(sec || 0, 10) || 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/** --- Component --- */
export default function ResultPage() {
  const { attemptId } = useParams();

  const [attempt, setAttempt] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let abort = new AbortController();

    async function load() {
      setLoading(true);
      setErr("");
      try {
        const u = new URL(`${FUNCTIONS_BASE}/quiz-attempt`, window.location.origin);
        u.searchParams.set("id", attemptId);
        u.searchParams.set("include_questions", "1");

        const res = await fetch(u.toString().replace(window.location.origin, ""), {
          method: "GET",
          signal: abort.signal,
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`quiz-attempt ${res.status}`);
        const json = await res.json();

        const normItems = (json.items || []).map((it) => ({
          ...it,
          question: normalizeQuestion(it.question),
        }));

        setAttempt(json.attempt || null);
        setItems(normItems);
      } catch (e) {
        if (e.name !== "AbortError") setErr(e?.message || "Failed to load result");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => abort.abort();
  }, [attemptId]);

  const summary = useMemo(() => {
    if (!attempt) return null;
    const pct =
      typeof attempt.score === "number"
        ? attempt.score
        : (attempt.correct_count / Math.max(1, attempt.question_count)) * 100;
    return {
      total: attempt.question_count,
      correct: attempt.correct_count,
      scorePct: Math.round(pct * 100) / 100,
      duration: mmss(attempt.duration_sec),
      createdAt: attempt.created_at,
      aircraft: attempt.aircraft || "-",
      subject: attempt.category_slug || "-",
      mode: attempt.mode || "practice",
    };
  }, [attempt]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse text-slate-500">Loading result…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{err}</div>
        <div className="mt-4">
          <Link to="/quiz" className="text-blue-600 hover:underline">
            Back to Quiz
          </Link>
        </div>
      </div>
    );
  }

  if (!attempt || !summary) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-3 rounded bg-amber-50 text-amber-800 border border-amber-200">
          Attempt tidak ditemukan.
        </div>
        <div className="mt-4">
          <Link to="/quiz" className="text-blue-600 hover:underline">
            Back to Quiz
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Summary card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-sm">
              Aircraft: <span className="font-medium">{summary.aircraft}</span> &nbsp;•&nbsp;
              Subject: <span className="font-medium">{summary.subject}</span> &nbsp;•&nbsp;
              Mode: <span className="font-medium capitalize">{summary.mode}</span>
            </div>
            <div className="text-slate-900 text-xl font-semibold">
              Score: {summary.correct}/{summary.total} ({summary.scorePct}%)
            </div>
            <div className="text-slate-500 text-sm">
              Duration: <span className="font-medium">{summary.duration}</span> &nbsp;•&nbsp;
              Submitted:{" "}
              <span className="font-medium">
                {summary.createdAt ? formatDateTime(summary.createdAt) : "-"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <Link to="/quiz" className="inline-block px-3 py-2 rounded bg-slate-800 text-white hover:bg-slate-900">
              Try Another Quiz
            </Link>
          </div>
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-4">
        {items.map((it, idx) => {
          const q = it.question;
          const isCorrect = it.is_correct ?? (it.answer_index === it.correct_index);
          const userLetter = Number.isInteger(it.answer_index) ? idxToLetter(it.answer_index) : "-";
          const correctLetter = Number.isInteger(it.correct_index) ? idxToLetter(it.correct_index) : "-";

          // safe choices fallback
          const choices = (q?.choices && q.choices.length ? q.choices : Array(4).fill(""));

          return (
            <div key={it.id || idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="text-slate-900 font-semibold">
                  {idx + 1}.{" "}
                  {q ? q.question : <span className="italic text-slate-500">Question text unavailable</span>}
                </div>
                <div
                  className={clsx(
                    "text-xs px-2 py-1 rounded",
                    isCorrect
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  )}
                >
                  {isCorrect ? "Correct" : "Incorrect"}
                </div>
              </div>

              {q?.questionImage ? (
                <div className="mt-3">
                  <img src={q.questionImage} alt="question" className="rounded-lg border" />
                </div>
              ) : null}

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {choices.map((ch, i) => {
                  const active = i === it.answer_index;
                  const correct = i === it.correct_index;
                  return (
                    <div
                      key={i}
                      className={clsx(
                        "rounded border p-2 text-sm",
                        correct
                          ? "border-emerald-300 bg-emerald-50"
                          : active
                          ? "border-rose-300 bg-rose-50"
                          : "border-slate-200 bg-white"
                      )}
                    >
                      <div className="font-medium mb-1">{idxToLetter(i)}.</div>
                      <div className="text-slate-800">{ch || <span className="text-slate-400">—</span>}</div>
                      {q?.choiceImages?.[i] ? (
                        <div className="mt-2">
                          <img src={q.choiceImages[i]} alt={`choice-${i}`} className="rounded border" />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {q?.explanations?.[it.correct_index] ? (
                <div className="mt-3 text-sm text-slate-700">
                  <div className="font-semibold mb-1">Explanation:</div>
                  <div>{q.explanations[it.correct_index]}</div>
                </div>
              ) : null}

              <div className="mt-3 text-sm text-slate-600">
                Your answer: <span className="font-semibold">{userLetter}</span> &nbsp;•&nbsp; Correct:{" "}
                <span className="font-semibold">{correctLetter}</span>
                {Array.isArray(it.category_path) && it.category_path.length ? (
                  <>
                    &nbsp;•&nbsp; Category: <span className="font-medium">{it.category_path.join(" > ")}</span>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
