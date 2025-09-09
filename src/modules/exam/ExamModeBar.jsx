function fmt(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  const h = Math.floor(sec / 3600);
  if (h > 0) {
    const mm = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
    return `${h}:${mm}:${s}`;
  }
  return `${m}:${s}`;
}

export default function ExamModeBar({
  running, timeLeft, duration,
  onChangeDuration, onStart, onSubmitNow,
}) {
  return (
    <div className="mb-3 -mx-4 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-y border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 flex items-center justify-between gap-3">
      {running ? (
        <>
          <div className="text-sm font-semibold">🕒 Exam running</div>
          <div className="text-sm tabular-nums font-mono" aria-live="polite">Time left: {fmt(timeLeft)}</div>
          <button onClick={onSubmitNow} className="px-3 py-1 rounded bg-amber-600 text-white hover:bg-amber-700">
            Submit & Review
          </button>
        </>
      ) : (
        <>
          <div className="text-sm">Exam mode</div>
          <div className="flex items-center gap-2">
            <label htmlFor="exam-duration" className="text-xs opacity-70">Duration</label>
            <select
              id="exam-duration"
              className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-900"
              value={duration}
              onChange={(e) => onChangeDuration(Number(e.target.value))}
            >
              <option value={30*60}>30 min</option>
              <option value={60*60}>60 min</option>
              <option value={90*60}>90 min</option>
              <option value={120*60}>120 min</option>
            </select>
          </div>
          <button onClick={() => onStart(duration)} className="px-3 py-1 rounded bg-amber-600 text-white hover:bg-amber-700">
            Start exam
          </button>
        </>
      )}
    </div>
  );
}
