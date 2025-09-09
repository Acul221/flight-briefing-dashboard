// src/components/quiz/QuestionNavigator.jsx
import React from "react";

export default function QuestionNavigator({
  total,
  currentIndex,
  answers = [],
  flagged,            // optional: Set<number> atau boolean[] untuk pertanyaan yang ditandai
  onJump,             // function(index) => void (biasanya panggil jumpTo)
  className = "",
}) {
  if (!total || total <= 1) return null;

  const isFlagged = (i) => {
    if (!flagged) return false;
    if (flagged instanceof Set) return flagged.has(i);
    return !!flagged[i];
  };

  return (
    <section
      aria-label="Question Navigator"
      className={`border rounded-lg p-3 bg-white dark:bg-gray-800 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Navigator</h3>
        <div className="hidden sm:flex gap-3 items-center text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-200 inline-block" /> Answered
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gray-200 inline-block" /> Empty
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-200 inline-block" /> Current
          </span>
        </div>
      </div>

      <div className="grid grid-cols-10 sm:grid-cols-12 gap-1">
        {Array.from({ length: total }).map((_, i) => {
          const answered = answers[i] != null;
          const current = i === currentIndex;
          const flaggedHere = isFlagged(i);

          const base =
            "relative h-8 w-8 sm:h-9 sm:w-9 rounded-md text-xs sm:text-sm flex items-center justify-center border transition";
          let color = answered
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700"
            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700";
          if (current) {
            color =
              "bg-amber-200 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/60";
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => onJump?.(i)}
              className={`${base} ${color}`}
              aria-current={current ? "true" : "false"}
              aria-label={`Question ${i + 1}${answered ? " answered" : " not answered"}${
                flaggedHere ? ", flagged" : ""
              }`}
            >
              {i + 1}
              {flaggedHere && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white dark:border-gray-800"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
