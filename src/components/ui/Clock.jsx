// src/components/ui/RACClockWidget.jsx
import { useEffect, useState } from "react";
import { Clock as ClockIcon } from "lucide-react";

const getColorClass = (deviation) => {
  if (deviation === null || isNaN(deviation)) return "text-gray-400";
  if (Math.abs(deviation) <= 5) return "text-green-500";
  if (Math.abs(deviation) <= 15) return "text-yellow-500";
  return "text-red-500";
};

export default function RACClockWidget() {
  const [summary, setSummary] = useState(null);
  const [localTime, setLocalTime] = useState("");
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const pad = (n) => String(n).padStart(2, "0");

    const updateClocks = () => {
      const now = new Date();

      // Local
      const localDay = now.toLocaleDateString(undefined, { weekday: "long" });
      const localDate = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
      const localTimeString = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      // UTC
      const utc = new Date(now.toISOString());
      const utcDay = utc.toLocaleDateString(undefined, { weekday: "long", timeZone: "UTC" });
      const utcDate = `${pad(utc.getUTCDate())}-${pad(utc.getUTCMonth() + 1)}-${utc.getUTCFullYear()}`;
      const utcTimeString = `${pad(utc.getUTCHours())}:${pad(utc.getUTCMinutes())}:${pad(utc.getUTCSeconds())}Z`;

      setLocalTime(`${localDay}, ${localDate} ${localTimeString}`);
      setUtcTime(`${utcDay}, ${utcDate} ${utcTimeString}`);
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("rac-latest");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSummary(parsed);
      } catch {
        console.warn("Invalid RAC data in localStorage");
      }
    }
  }, []);

  const etd = summary?.etd || "—";
  const pb = summary?.pb?.actualTime || "—";
  const dev = summary?.etdDeviation ?? null;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {/* Clock Section */}
      <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col items-center bg-white/30 dark:bg-gray-700/30 backdrop-blur-md rounded-xl shadow p-4">
          <ClockIcon size={36} className="text-blue-600 dark:text-yellow-400 mb-1" />
          <h3 className="font-semibold text-gray-800 dark:text-white">Local Time</h3>
          <p className="font-mono text-sm text-gray-700 dark:text-gray-300 mt-1">{localTime}</p>
        </div>
        <div className="flex flex-col items-center bg-white/30 dark:bg-gray-700/30 backdrop-blur-md rounded-xl shadow p-4">
          <ClockIcon size={36} className="text-green-600 dark:text-yellow-400 mb-1" />
          <h3 className="font-semibold text-gray-800 dark:text-white">UTC Time</h3>
          <p className="font-mono text-sm text-gray-700 dark:text-gray-300 mt-1">{utcTime}</p>
        </div>
      </div>
    </div>
  );
}
