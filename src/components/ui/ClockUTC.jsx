// src/components/ui/ClockUTC.jsx
import { useState, useEffect } from "react";
import { Clock as ClockIcon } from "lucide-react";

function ClockUTC() {
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const pad = (n) => String(n).padStart(2, "0");

    const updateClock = () => {
      const now = new Date();
      const utcDay = now.toLocaleDateString(undefined, { weekday: "long", timeZone: "UTC" });
      const utcDate = `${pad(now.getUTCDate())}-${pad(now.getUTCMonth() + 1)}-${now.getUTCFullYear()}`;
      const utcTimeString = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}Z`;
      setUtcTime(`${utcDay}, ${utcDate} ${utcTimeString}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center bg-white/30 dark:bg-gray-700/30 backdrop-blur-md rounded-2xl shadow-md hover:shadow-2xl p-6 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 hover:ring-2 hover:ring-green-400 dark:hover:ring-yellow-400 text-center">
      <ClockIcon size={40} className="text-green-600 dark:text-yellow-400 mb-2" />
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">UTC Time</h3>
      <p className="font-mono text-lg text-gray-700 dark:text-gray-300 mt-2">{utcTime}</p>
    </div>
  );
}

export default ClockUTC;
