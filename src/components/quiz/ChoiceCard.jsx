import { motion } from "framer-motion";

export default function ChoiceCard({
  choice,
  index,
  selected,
  isCorrect,
  onSelect,
  showExplanation,
  isReview,
}) {
  const isSelected = selected === index;
  const locked = showExplanation || isReview;

  // warna & efek feedback
  let base =
    "w-full text-left p-3 border rounded shadow-sm transition outline-none focus:ring-2 focus:ring-blue-500";
  let visual = "border-gray-300 hover:shadow-md";
  if (locked) {
    visual = isCorrect
      ? "border-green-500 bg-green-50 dark:bg-green-900/40"
      : isSelected
      ? "border-red-500 bg-red-50 dark:bg-red-900/40"
      : "border-gray-200";
  }

  // animasi: shake kecil saat salah
  const variants = {
    initial: { x: 0, opacity: 1 },
    wrong: { x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.25 } },
    correct: { scale: [1, 1.02, 1], transition: { duration: 0.18 } },
  };

  const state =
    locked && isSelected && !isCorrect
      ? "wrong"
      : locked && isCorrect
      ? "correct"
      : "initial";

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={locked}
      className={`${base} ${visual}`}
      variants={variants}
      animate={state}
      role="option"
      aria-selected={isSelected}
    >
      <strong className="mr-2">{String.fromCharCode(65 + index)}.</strong> {choice.text}

      {choice.image && (
        <img
          src={choice.image}
          alt={`Choice ${String.fromCharCode(65 + index)}`}
          className="max-h-32 rounded my-2 border"
          loading="lazy"
        />
      )}

      {(showExplanation || isReview) && (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 italic">
          {choice.explanation}
        </p>
      )}

      {isReview && isSelected && (
        <span className="ml-2 italic text-xs">(Your Answer)</span>
      )}
      {isReview && isCorrect && (
        <span className="ml-2 italic text-xs">(Correct)</span>
      )}
    </motion.button>
  );
}
