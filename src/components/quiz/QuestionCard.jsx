// src/components/quiz/QuestionCard.jsx
import { useState, useMemo } from "react";
import PropTypes from "prop-types";

const ensureLen4 = (arr, fill) => {
  const base = Array.isArray(arr) ? arr.slice(0, 4) : [];
  while (base.length < 4) base.push(fill);
  return base;
};

export default function QuestionCard({
  question = { question_text: "", choices: [], explanations: [], choice_images: [], correctIndex: null },
  index,
  total,
  selected, // index pilihan user (0..3) atau null
  onSelect, // (idx) => void
  showExplanation, // boolean
  isReview, // boolean
}) {
  const [expanded, setExpanded] = useState(false);

  const questionText = String(question?.question_text ?? "").trim();
  const isLong = questionText.length > 220;
  const questionPreview = isLong && !expanded ? `${questionText.slice(0, 220)}...` : questionText;

  const choices = useMemo(
    () => ensureLen4(question?.choices, "").map((c) => String(c || "")),
    [question?.choices]
  );
  const explanations = useMemo(
    () => ensureLen4(question?.explanations, "").map((e) => String(e || "")),
    [question?.explanations]
  );
  const imgs = useMemo(
    () => ensureLen4(question?.choice_images, null).map((u) => (u ? String(u) : null)),
    [question?.choice_images]
  );
  const correctIndex =
    Number.isInteger(question?.correctIndex) && question.correctIndex >= 0 && question.correctIndex <= 3
      ? question.correctIndex
      : null;

  return (
    <div className="mb-6 border p-4 rounded-lg bg-base-100 shadow">
      <p className="text-xs opacity-60 mb-1">
        Q{String(index + 1).padStart(3, "0")} / {total} — ID: {question.id || "-"}
      </p>

      <h3 className="font-semibold mb-2">Question {index + 1}</h3>
      {questionText && <p className="mb-3 leading-relaxed">{questionPreview}</p>}

      {question.question_image && (
        <img
          src={question.question_image}
          alt="Question"
          className="max-h-60 rounded mb-4 border"
          loading="lazy"
        />
      )}

      <div className="space-y-2" role="listbox" aria-label="Answer choices">
        {choices.map((text, i) => {
          const isSelected = selected === i;
          const isCorrect = typeof correctIndex === "number" && i === correctIndex;
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

    </div>
  );
}

QuestionCard.propTypes = {
  question: PropTypes.shape({
    question_text: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    choices: PropTypes.array,
    explanations: PropTypes.array,
    choice_images: PropTypes.array,
    correctIndex: PropTypes.number,
    question_image: PropTypes.string,
    id: PropTypes.any,
    explanation: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  }),
  index: PropTypes.number,
  total: PropTypes.number,
  selected: PropTypes.number,
  onSelect: PropTypes.func,
  showExplanation: PropTypes.bool,
  isReview: PropTypes.bool,
};
