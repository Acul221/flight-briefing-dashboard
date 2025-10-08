// src/pages/ResultPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/apiClient";
import clsx from "clsx";

const idxToLetter = (i) => ["A", "B", "C", "D"][i] ?? "-";

function normalizeQuestion(q) {
  const answerIndex = ["A","B","C","D"].indexOf(String(q.answer_key || "A").toUpperCase());
  const asArray4 = (arr, fill=null) => {
    const v = Array.isArray(arr) ? [...arr] : [];
    while (v.length < 4) v.push(fill);
    return v.slice(0,4);
  };
  const choicesArr = Array.isArray(q.choices)
    ? q.choices
    : [q.choices?.A, q.choices?.B, q.choices?.C, q.choices?.D];

  return {
    id: q.id,
    question: q.question_text || "",
    questionImage: q.question_image_url || null,
    choices: asArray4((choicesArr || []).map((c)=>c ?? ""), ""),
    choiceImages: asArray4(q.choice_images, null),
    explanations: asArray4(q.explanations, ""),
    correctIndex: (answerIndex >= 0 && answerIndex <= 3) ? answerIndex : 0,
  };
}

export default function ResultPage() {
  const { attemptId } = useParams();

  const [attempt, setAttempt] = useState(null);
  const [items, setItems] = useState([]);
  const [questionsMap, setQuestionsMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setErr("");
      try {
        // Attempt
        const { data: a, error: e1 } = await supabase
          .from("quiz_attempts")
          .select("*")
          .eq("id", attemptId)
          .single();
        if (e1) throw e1;
        if (cancelled) return;
        setAttempt(a);

        // Items
        const { data: it, error: e2 } = await supabase
          .from("quiz_attempt_items")
          .select("*")
          .eq("attempt_id", attemptId)
          .order("created_at", { ascending: true });
        if (e2) throw e2;
        if (cancelled) return;
        setItems(it || []);

        // Questions (optional, RLS dependent)
        const ids = (it || []).map((x) => x.question_id);
        if (ids.length) {
          const { data: qs, error: e3 } = await supabase
            .from("questions")
            .select("id, question_text, question_image_url, choices, choice_images, explanations, answer_key")
            .in("id", ids);
          if (e3) {
            setQuestionsMap(null);
          } else {
            const map = {};
            (qs || []).forEach((q) => { map[q.id] = normalizeQuestion(q); });
            setQuestionsMap(map);
          }
        } else {
          setQuestionsMap({});
        }
      } catch (e) {
        console.error(e);
        setErr(e?.message || "Failed to load result");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [attemptId]);

  const summary = useMemo(() => {
    if (!attempt) return null;
    const pct = typeof attempt.score === "number"
      ? attempt.score
      : (attempt.correct_count / Math.max(1, attempt.question_count)) * 100;
    const mmss = (sec) => {
      const m = Math.floor((sec || 0) / 60);
      const s = (sec || 0) % 60;
      return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    };
    return {
      total: attempt.question_count,
      correct: attempt.correct_count,
      scorePct: Math.round(pct * 100) / 100,
      duration: mmss(attempt.duration_sec),
      submittedAt: attempt.submitted_at,
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
          <Link to="/" className="text-blue-600 hover:underline">Back to Home</Link>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-3 rounded bg-amber-50 text-amber-800 border border-amber-200">
          Attempt tidak ditemukan.
        </div>
        <div className="mt-4">
          <Link to="/" className="text-blue-600 hover:underline">Back to Home</Link>
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
              Mode: <span className="font-medium">{summary.mode}</span>
            </div>
            <div className="text-slate-900 text-xl font-semibold">
              Score: {summary.correct}/{summary.total} ({summary.scorePct}%)
            </div>
            <div className="text-slate-500 text-sm">
              Duration: <span className="font-medium">{summary.duration}</span> &nbsp;•&nbsp;
              Submitted: <span className="font-medium">{new Date(summary.submittedAt).toLocaleString()}</span>
            </div>
          </div>
          <div className="text-right">
            <Link
              to="/quiz"
              className="inline-block px-3 py-2 rounded bg-slate-800 text-white hover:bg-slate-900"
            >
              Try Another Quiz
            </Link>
          </div>
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-4">
        {items.map((it, idx) => {
          const q = questionsMap?.[it.question_id] || null;
          const isCorrect = it.is_correct ?? (it.answer_index === it.correct_index);
          const userLetter = idxToLetter(it.answer_index);
          const correctLetter = idxToLetter(it.correct_index);

          return (
            <div key={it.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="text-slate-900 font-semibold">
                  {idx + 1}. {q ? q.question : <span className="italic text-slate-500">Question text unavailable</span>}
                </div>
                <div className={clsx(
                  "text-xs px-2 py-1 rounded",
                  isCorrect ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                )}>
                  {isCorrect ? "Correct" : "Incorrect"}
                </div>
              </div>

              {q?.questionImage ? (
                <div className="mt-3">
                  <img src={q.questionImage} alt="question" className="rounded-lg border" />
                </div>
              ) : null}

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(q?.choices || [0,1,2,3].map(()=>"" )).map((ch, i) => {
                  const active = i === it.answer_index;
                  const correct = i === it.correct_index;
                  return (
                    <div
                      key={i}
                      className={clsx(
                        "rounded border p-2 text-sm",
                        correct ? "border-emerald-300 bg-emerald-50"
                        : active ? "border-rose-300 bg-rose-50"
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
                Your answer: <span className="font-semibold">{userLetter}</span> &nbsp;•&nbsp;
                Correct: <span className="font-semibold">{correctLetter}</span>
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
