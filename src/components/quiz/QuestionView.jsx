// src/components/quiz/QuestionView.jsx
import React from "react";

const letters = ["A", "B", "C", "D"];

export default function QuestionView({
  question,
  selectedIndex = null,
  correctIndex = null,
  mode = "learn",
  onSelect,
  onFlag,
  showExplanation = false,
}) {
  const choices = Array.isArray(question?.choices) ? question.choices : [];
  const explanations = Array.isArray(question?.explanations) ? question.explanations : ["", "", "", ""];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{question?.question_text || ""}</h3>
      {onFlag && question?.id && (
        <div className="text-right">
          <button
            type="button"
            className="text-xs text-rose-600 underline underline-offset-2 hover:text-rose-700"
            onClick={() => onFlag(question)}
          >
            Flag this question
          </button>
        </div>
      )}

      <div className="space-y-2">
        {choices.map((choice, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = correctIndex !== null && correctIndex === idx;
          const isWrongSelection = correctIndex !== null && isSelected && !isCorrect;

          let cls =
            "w-full text-left border rounded-xl px-4 py-3 transition hover:shadow-sm focus:outline-none";

          if (mode === "learn" && correctIndex !== null) {
            if (isCorrect) cls += " border-green-500 bg-green-50";
            else if (isWrongSelection) cls += " border-red-500 bg-red-50";
          } else if (isSelected) {
            cls += " border-sky-500 bg-sky-50";
          }

          return (
            <button
              key={idx}
              className={cls}
              onClick={() => onSelect?.(idx)}
              type="button"
              data-testid={`choice-${idx}`}
            >
              <div className="flex items-start gap-3">
                <span className="font-semibold text-slate-700">{letters[idx]}</span>
                <span className="text-sm text-slate-800">{choice}</span>
              </div>
            </button>
          );
        })}
      </div>

      {showExplanation && typeof correctIndex === "number" && explanations[correctIndex] && (
        <div className="border rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800">
          {explanations[correctIndex]}
        </div>
      )}
    </div>
  );
}
