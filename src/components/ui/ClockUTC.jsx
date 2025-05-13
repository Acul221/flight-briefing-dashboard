import { useState, useEffect } from "react";

function ClockUTC() {
  const [utcTime, setUtcTime] = useState("");
  const [utcDay, setUtcDay] = useState("");

  useEffect(() => {
    const pad = (n) => String(n).padStart(2, "0");

    const updateClock = () => {
      const now = new Date();
      const day = now.toLocaleDateString(undefined, { weekday: "long", timeZone: "UTC" });
      const hours = pad(now.getUTCHours());
      const minutes = pad(now.getUTCMinutes());
      const seconds = pad(now.getUTCSeconds());
      setUtcDay(day);
      setUtcTime(`${hours}:${minutes}:${seconds}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center text-center font-mono text-xs md:text-sm text-gray-700 dark:text-gray-300 leading-tight min-w-[80px]">
      <span>UTC {utcTime}</span>
      <span className="text-[0.65rem] md:text-xs opacity-70">{utcDay}</span>
    </div>
  );
}

export default ClockUTC;
