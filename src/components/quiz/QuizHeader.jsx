// src/components/quiz/QuizHeader.jsx
export default function QuizHeader({ aircraft, subject, currentIndex, total, level, source }) {
  // Clamp index agar tidak melebihi total-1
  const clampedIndex = Math.min(
    currentIndex ?? 0,
    Math.max((total ?? 1) - 1, 0)
  );
  const progress = total ? Math.round(((clampedIndex + 1) / total) * 100) : 0;

  return (
    <header
      role="banner"
      className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200/60 dark:border-gray-800/60"
    >
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
        <h2 className="text-sm sm:text-base font-semibold">
          {aircraft.toUpperCase()} / {subject.toUpperCase()}
        </h2>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          <span aria-label="Question progress">Q {clampedIndex + 1}/{total}</span>
          <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] sm:text-xs">
            {String(level ?? "").toLowerCase()}
          </span>
          {source && <span className="italic hidden sm:inline">{source}</span>}
        </div>
      </div>

      {/* progress bar */}
      <div className="max-w-3xl mx-auto mt-2 h-1.5 bg-gray-200 dark:bg-gray-800 rounded">
        <div
          className="h-1.5 bg-blue-600 rounded transition-[width] duration-300"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        />
      </div>
    </header>
  );
}
