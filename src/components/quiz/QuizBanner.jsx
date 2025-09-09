// src/components/quiz/QuizBanner.jsx
export default function QuizBanner({
  variant = "guest",            // 'guest' | 'inactive'
  onLogin,
  onUpgrade,
  size = "full",                // 'full' | 'slim'
  onDismiss,                    // optional
}) {
  const isGuest = variant === "guest";
  const text = isGuest
    ? "You're in Guest mode — login to access more questions and save your progress."
    : "Upgrade to Pro to unlock all questions and explanations.";

  const actionLabel = isGuest ? "Login to access more" : "See Plans";

  const base =
    size === "slim"
      ? "flex items-center justify-between gap-3 px-3 py-2 text-xs rounded-lg border bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
      : "flex items-center justify-between gap-3 px-4 py-3 text-sm rounded-xl border bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800";

  return (
    <div className={base} role="status" aria-live="polite">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs">i</span>
        <p className="text-blue-900/90 dark:text-blue-100">{text}</p>
      </div>

      <div className="flex items-center gap-2">
        {isGuest ? (
          <button
            onClick={onLogin}
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            {actionLabel}
          </button>
        ) : (
          <button
            onClick={onUpgrade}
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            {actionLabel}
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-2 py-1 text-blue-700 dark:text-blue-200 hover:underline"
            aria-label="Dismiss"
            title="Dismiss"
          >
            Not now
          </button>
        )}
      </div>
    </div>
  );
}
