import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Persisted countdown timer, survives refresh. */
export default function useExamTimer({ aircraft, subject, onExpire }) {
  const storageKey = useMemo(() => `examTimer:${aircraft}:${subject}`, [aircraft, subject]);

  const [running, setRunning] = useState(false);
  const [duration, setDuration] = useState(60 * 60); // default 60 min
  const [startedAt, setStartedAt] = useState(null);  // epoch seconds
  const [timeLeft, setTimeLeft] = useState(duration);
  const tickRef = useRef(null);

  // restore
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (saved?.duration) setDuration(saved.duration);
      if (saved?.startedAt && saved?.running) {
        const now = Math.floor(Date.now() / 1000);
        const left = Math.max(0, saved.duration - (now - saved.startedAt));
        setStartedAt(saved.startedAt);
        setTimeLeft(left);
        setRunning(left > 0);
      }
    } catch {}
  }, [storageKey]);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ running, duration, startedAt })
      );
    } catch {}
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
