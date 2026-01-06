import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Persisted countdown timer, survives refresh. */
export default function useExamTimer({ aircraft, subject, onExpire }) {
  const storageKey = useMemo(() => `examTimer:${aircraft}:${subject}`, [aircraft, subject]);

  const initial = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      const baseDuration = Number.isFinite(saved?.duration) ? saved.duration : 60 * 60;
      return {
        duration: baseDuration,
        startedAt: saved?.startedAt ?? null,
        running: !!saved?.running,
        timeLeft: baseDuration,
      };
    } catch {
      return { duration: 60 * 60, startedAt: null, running: false, timeLeft: 60 * 60 };
    }
  }, [storageKey]);

  const [running, setRunning] = useState(initial.running);
  const [duration, setDuration] = useState(initial.duration); // default 60 min
  const [startedAt, setStartedAt] = useState(initial.startedAt);  // epoch seconds
  const [timeLeft, setTimeLeft] = useState(initial.timeLeft);
  const tickRef = useRef(null);

  // normalize restored state once (handles elapsed time since last visit)
  useEffect(() => {
    if (initial.startedAt && initial.running) {
      const now = Math.floor(Date.now() / 1000);
      const left = Math.max(0, initial.duration - (now - initial.startedAt));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStartedAt(initial.startedAt);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeft(left > 0 ? left : initial.duration);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRunning(left > 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ running, duration, startedAt })
      );
    } catch {
      /* no-op */
    }
  }, [storageKey, running, duration, startedAt]);

  const clearTick = () => { if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; } };

  // ticking
  useEffect(() => {
    clearTick();
    if (!running || !startedAt) return;

    const loop = () => {
      const now = Math.floor(Date.now() / 1000);
      const left = Math.max(0, duration - (now - startedAt));
      setTimeLeft(left);
      if (left <= 0) {
        clearTick();
        setRunning(false);
        onExpire?.();
      }
    };
    loop();
    tickRef.current = setInterval(loop, 1000);
    return clearTick;
  }, [running, startedAt, duration, onExpire]);

  const start = useCallback((durSec) => {
    const d = Number(durSec) || duration;
    const now = Math.floor(Date.now() / 1000);
    setDuration(d);
    setStartedAt(now);
    setRunning(true);
    setTimeLeft(d);
  }, [duration]);

  const stop = useCallback(() => { clearTick(); setRunning(false); }, []);
  const reset = useCallback(() => { clearTick(); setRunning(false); setStartedAt(null); setTimeLeft(duration); }, [duration]);

  return { running, duration, timeLeft, start, stop, reset, setDuration };
}
