import { useState } from "react";
import { motion } from "framer-motion";

export default function TimeBetweenDates() {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [result, setResult] = useState("");

  const calculateTimeDifference = () => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start) || isNaN(end) || end <= start) {
      alert("Please provide valid start and end times.");
      return;
    }

    const diffMs = end - start;
    const days = Math.floor(diffMs / 86400000);
    const hours = Math.floor((diffMs % 86400000) / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);

    setResult(`${days}d ${hours}h ${minutes}m`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-blue-100 dark:border-zinc-700 rounded-2xl shadow-md px-6 py-5 space-y-4"
    >
      <div>
        <h2 className="text-lg md:text-xl font-bold text-blue-700 dark:text-blue-300">
          ⏳ Time Between Dates
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Calculate your DMI remaining day
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Start Date & Time</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="p-2 border rounded bg-white dark:bg-zinc-800 text-sm"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">End Date & Time</label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="p-2 border rounded bg-white dark:bg-zinc-800 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={calculateTimeDifference}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-semibold transition"
          >
            🔍 Calculate
          </button>
        </div>
      </div>

      {result && (
        <div className="text-sm text-gray-800 dark:text-gray-200">
          Result: <span className="font-mono font-semibold">{result}</span>
        </div>
      )}
    </motion.div>
  );
}
