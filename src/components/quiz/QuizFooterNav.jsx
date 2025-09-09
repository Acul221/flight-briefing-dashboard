// src/components/quiz/QuizFooterNav.jsx
export default function QuizFooterNav({
  currentIndex,
  total,
  showExplanation,
  onNext,
  onPrev,
  disableNextUntilAnswered = false,
  hasAnswered = false,
  disablePrev = false,      // <— NEW
}) {
  const isLast = currentIndex >= total - 1;
  const nextDisabled = disableNextUntilAnswered ? !hasAnswered : false;

  return (
    <nav
      role="navigation"
      className="sticky bottom-0 left-0 right-0 -mx-4 px-4 py-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-t border-gray-200/60 dark:border-gray-800/60 z-20"
    >
      <div className="max-w-3xl mx-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={disablePrev || currentIndex === 0}
          className="flex-1 border rounded px-3 py-2 text-sm disabled:opacity-50"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled || (!showExplanation && !isLast)}
          className="flex-[2] bg-blue-600 text-white rounded px-3 py-2 text-sm disabled:opacity-50"
        >
          {isLast ? "Submit & Review" : "Next Question"}
        </button>
      </div>
    </nav>
  );
}
