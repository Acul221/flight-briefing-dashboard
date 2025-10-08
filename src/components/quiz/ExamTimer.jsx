import { useEffect, useMemo, useRef, useState } from "react";

/**
 * ExamTimer
 * Props:
 *  - totalSec: number (required)
 *  - autoStart?: boolean (default true)
 *  - warnAtSec?: number (default 60) -> add "warning" style near end
 *  - onTick?: (remainingSec:number) => void
 *  - onExpire?: () => void
 *
 * Renders: mm:ss (00-padded)
 */
export default function ExamTimer({
  totalSec,
  autoStart = true,
  warnAtSec = 60,
  onTick,
  onExpire,
}) {
  const [remaining, setRemaining] = useState(totalSec);
  const startedAtMsRef = useRef(null);
  const rafRef = useRef(0);
  const lastWholeRef = useRef(totalSec);
  const expiredRef = useRef(false);

  const mmss = useMemo(() => {
    const s = Math.max(0, Math.floor(remaining));
    const mm = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  }, [remaining]);

  useEffect(() => {
    if (!autoStart) return;

    if (!startedAtMsRef.current) {
      startedAtMsRef.current = Date.now();
    }

    const tick = () => {
      const elapsed = (Date.now() - startedAtMsRef.current) / 1000;
      const left = Math.max(0, totalSec - elapsed);
      setRemaining(left);

      const whole = Math.floor(left);
      if (whole !== lastWholeRef.current) {
        lastWholeRef.current = whole;
        onTick?.(whole);
      }

      if (!expiredRef.current && left <= 0) {
        expiredRef.current = true;
        onExpire?.();
        return; // stop
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    const handleVis = () => {
      // force a recalculation next frame (Date.now based anyway)
      // ensures immediate jump after tab visibility change
    };
    document.addEventListener("visibilitychange", handleVis);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", handleVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, totalSec]);

  const danger = remaining <= warnAtSec;
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border
        ${danger ? "border-error/60 text-error" : "border-base-300 text-base-content"}
        bg-base-100 shadow-sm`}
      aria-live="polite"
      aria-atomic="true"
      title={danger ? "Time is running out" : "Exam timer"}
    >
      <span className="font-mono text-lg tabular-nums">{mmss}</span>
    </div>
  );
}
