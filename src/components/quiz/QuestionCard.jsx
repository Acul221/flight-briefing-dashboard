// src/components/quiz/QuestionCard.jsx
import { useState, useMemo } from "react";

export default function QuestionCard({
  question,
  index,
  total,
  selected,        // index pilihan user (0..3) atau null
  onSelect,        // (idx) => void
  showExplanation, // boolean
  isReview,        // boolean
}) {
  const [expanded, setExpanded] = useState(false);

  const stem = String(question.question || "");
  const isLong = stem.length > 220;
  const stemShort = isLong && !expanded ? stem.slice(0, 220) + "…" : stem;

  // jaga-jaga normalisasi choices/explanations
  const choices = useMemo(
    () => (Array.isArray(question.choices) ? question.choices.map((c) => String(c || "")) : []),
    [question.choices]
  );
  const explanations = useMemo(
    () => (Array.isArray(question.explanations) ? question.explanations.map((e) => String(e || "")) : []),
    [question.explanations]
  );
  const imgs = useMemo(
    () => (Array.isArray(question.choiceImages) ? question.choiceImages.map((u) => (u ? String(u) : null)) : [null,null,null,null]),
    [question.choiceImages]
  );
  const correctIndex = Number.isInteger(question.correctIndex) ? question.correctIndex : 0;

  return (
    <div className="mb-6 border p-4 rounded-lg bg-base-100 shadow">
      <p className="text-xs opacity-60 mb-1">
        N°{String(index + 1).padStart(3, "0")} / {total} — ID: {question.legacy_id || question.id}
      </p>

      <h3 className="font-semibold mb-2">Question {index + 1}</h3>
      <p className="mb-3 leading-relaxed">
        {stemShort}{" "}
        {isLong && !expanded && (
          <button onClick={() => setExpanded(true)} className="link link-primary text-sm">
            Read more
          </button>
        )}
      </p>

      {question.questionImage && (
        <img
          src={question.questionImage}
          alt="Question"
          className="max-h-60 rounded mb-4 border"
          loading="lazy"
        />
      )}

      <div className="space-y-2" role="listbox" aria-label="Answer choices">
        {choices.map((text, i) => {
          const isSelected = selected === i;
          const isCorrect = i === correctIndex;
          const showExpForThis =
            !!showExplanation || !!isReview || (typeof selected === "number" && (isSelected || isCorrect));
          return (
            <div
              key={i}
              className={`rounded border p-3 hover:bg-base-200/60 cursor-pointer ${
                isSelected ? "border-primary" : "border-base-300"
              }`}
              onClick={() => onSelect?.(i)}
              role="option"
              aria-selected={isSelected}
            >
              <div className="flex items-start gap-3">
                <div className={`badge ${isCorrect ? "badge-success" : "badge-ghost"}`}>
                  {String.fromCharCode(65 + i)}
                </div>
                <div className="flex-1">
                  <div className="mb-1">{text}</div>
                  {imgs[i] && (
                    <img
                      src={imgs[i]}
                      alt={`Choice ${String.fromCharCode(65 + i)}`}
                      className="max-h-40 rounded border mt-2"
                      loading="lazy"
                    />
                  )}
                  {showExpForThis && (explanations[i] || "").trim() && (
                    <div className={`mt-2 text-sm ${isCorrect ? "text-success" : "text-base-content/70"}`}>
                      {explanations[i]}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/** single explanation (opsional): tampilkan kalau mau */}
      {showExplanation && (question.explanation || "").trim() && (
        <div className="mt-3 alert alert-info text-sm">{question.explanation}</div>
      )}
    </div>
  );
}
