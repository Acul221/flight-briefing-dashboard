// src/components/quiz/ExamResultPanel.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

export default function ExamResultPanel({ questions = [], answers = [], categorySlug }) {
  const result = useMemo(() => {
    const byId = new Map();
    questions.forEach((q) => byId.set(q.id, q));
    const rows = answers.map((a) => {
      const q = byId.get(a.questionId) || {};
      return {
        question: q.question_text || "Untitled question",
        yourAnswer: typeof a.selectedIndex === "number" ? q.choices?.[a.selectedIndex] : "Not answered",
        correctAnswer: typeof a.correctIndex === "number" ? q.choices?.[a.correctIndex] : "N/A",
        isCorrect: a.selectedIndex === a.correctIndex,
      };
    });
    const total = rows.length;
    const correct = rows.filter((r) => r.isCorrect).length;
    const incorrect = total - correct;
    return { rows, total, correct, incorrect };
  }, [questions, answers]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="text-lg font-semibold text-slate-800">Exam Results</div>
        {categorySlug && (
          <Link
            to={`/quiz/${categorySlug}`}
            className="text-sky-700 text-sm underline underline-offset-2"
          >
            Back to category
          </Link>
        )}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="ml-auto px-3 py-1.5 rounded border border-slate-200 text-sm hover:bg-slate-50"
        >
          Retake
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-4 py-3">
          <div className="text-sm font-semibold">Total</div>
          <div className="text-2xl font-bold">{result.total}</div>
        </div>
        <div className="bg-sky-50 border border-sky-200 text-sky-800 rounded-lg px-4 py-3">
          <div className="text-sm font-semibold">Correct</div>
          <div className="text-2xl font-bold">{result.correct}</div>
        </div>
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-4 py-3">
          <div className="text-sm font-semibold">Incorrect</div>
          <div className="text-2xl font-bold">{result.incorrect}</div>
        </div>
      </div>

      <div className="border rounded-lg bg-white divide-y">
        {result.rows.map((r, idx) => (
          <div key={idx} className="p-3 space-y-1">
            <div className="text-sm font-semibold text-slate-800">{r.question}</div>
            <div className="text-xs text-slate-600">
              <span className="font-semibold">Your answer:</span> {r.yourAnswer || "Not answered"}
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-semibold">Correct:</span> {r.correctAnswer || "N/A"}
            </div>
            <div
              className={[
                "inline-flex text-[11px] px-2 py-[2px] rounded",
                r.isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
              ].join(" ")}
            >
              {r.isCorrect ? "Correct" : "Incorrect"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

ExamResultPanel.propTypes = {
  questions: PropTypes.array,
  answers: PropTypes.array,
  categorySlug: PropTypes.string,
};
