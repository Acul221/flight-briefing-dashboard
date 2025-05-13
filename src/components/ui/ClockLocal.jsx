import { useState, useEffect } from "react";

function ClockLocal() {
  const [localTime, setLocalTime] = useState("");
  const [localDay, setLocalDay] = useState("");

  useEffect(() => {
    const pad = (n) => String(n).padStart(2, "0");

    const updateClock = () => {
      const now = new Date();
      const day = now.toLocaleDateString(undefined, { weekday: "long" });
      const hours = pad(now.getHours());
      const minutes = pad(now.getMinutes());
      const seconds = pad(now.getSeconds());
      setLocalDay(day);
      setLocalTime(`${hours}:${minutes}:${seconds}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center text-center font-mono text-xs md:text-sm text-gray-700 dark:text-gray-300 leading-tight min-w-[80px]">
      <span>Local {localTime}</span>
      <span className="text-[0.65rem] md:text-xs opacity-70">{localDay}</span>
    </div>
  );
}

export default ClockLocal;
