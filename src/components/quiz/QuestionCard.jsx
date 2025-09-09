import { useState } from "react";
import ChoiceCard from "./ChoiceCard";
import ImageLightbox from "./ImageLightbox";

export default function QuestionCard({
  question,
  index,
  total,
  selected,
  onSelect,
  showExplanation,
  isReview,
}) {
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(false);

  const stem = String(question.question || "");
  const isLong = stem.length > 220; // heuristik ringkas
  const stemShort = isLong && !expanded ? stem.slice(0, 220) + "..." : stem;

  return (
    <div className="mb-6 border p-4 rounded-lg bg-white dark:bg-gray-800 shadow">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
        N°{String(index + 1).padStart(3, "0")} — ID: {question.id}
      </p>

      <h3 className="font-semibold mb-2">
        Question {index + 1} of {total}:
      </h3>

      <p className="mb-3 leading-relaxed">
        {stemShort}{" "}
        {isLong && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-blue-600 dark:text-blue-400 underline text-sm"
          >
            Read more
          </button>
        )}
      </p>

      {question.questionImage && (
        <>
          <img
            src={question.questionImage}
            alt="Question"
            className="max-h-60 rounded mb-4 border cursor-zoom-in"
            loading="lazy"
            onClick={() => setZoom(true)}
          />
          <ImageLightbox
            src={question.questionImage}
            alt="Question"
            open={zoom}
            onClose={() => setZoom(false)}
          />
        </>
      )}

      <div className="space-y-2" role="listbox" aria-label="Answer choices">
        {question.choices?.map((choice, i) => (
          <ChoiceCard
            key={i}
            choice={choice}
            index={i}
            selected={selected}
            isCorrect={!!choice.isCorrect}
            onSelect={() => onSelect && onSelect(i)}
            showExplanation={showExplanation}
            isReview={isReview}
          />
        ))}
      </div>
    </div>
  );
}
