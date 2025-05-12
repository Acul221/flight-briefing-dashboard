import { useState } from "react";
import { motion } from "framer-motion";

export default function BlockTimeCalculator() {
  const [blockOff, setBlockOff] = useState("");
  const [airborne, setAirborne] = useState("");
  const [landing, setLanding] = useState("");
  const [blockOn, setBlockOn] = useState("");
  const [result, setResult] = useState("");

  const parseTime = (str) => {
    if (!str) return null;
    const [h, m] = str.split(":" ).map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  const diffMinutes = (start, end) => {
    if (end < start) end.setDate(end.getDate() + 1);
    return Math.round((end - start) / 60000);
  };

  const format = (minutes) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

  const splitDayNight = (start, end) => {
    if (end < start) end.setDate(end.getDate() + 1);

    let current = new Date(start);
    const totalMinutes = Math.round((end - start) / 60000);
    let nightMinutes = 0;

    while (current < end) {
      const hour = current.getHours();
      if (hour < 6 || hour >= 18) nightMinutes++;
      current.setMinutes(current.getMinutes() + 1);
    }

    return {
      night: nightMinutes,
      day: totalMinutes - nightMinutes,
    };
  };

  const calculate = () => {
    const t1 = parseTime(blockOff);
    const t2 = parseTime(airborne);
    const t3 = parseTime(landing);
    const t4 = parseTime(blockOn);

    if (!t1 || !t2 || !t3 || !t4) {
      alert("Please fill all time fields.");
      return;
    }

    const blockTime = diffMinutes(t1, t4);
    const airTime = diffMinutes(t2, t3);

    const blockSplit = splitDayNight(t1, t4);
    const airSplit = splitDayNight(t2, t3);

    setResult(
      `Block Time: ${format(blockTime)} (\uD83C\uDF19 ${format(blockSplit.night)}, \u2600\uFE0F ${format(blockSplit.day)})\n` +
      `Air Time: ${format(airTime)} (\uD83C\uDF19 ${format(airSplit.night)}, \u2600\uFE0F ${format(airSplit.day)})`
    );
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
          ⏱️ Block & Air Time Calculator
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Input UTC time to calculate total & split day/night
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Block Off</label>
          <input type="time" value={blockOff} onChange={(e) => setBlockOff(e.target.value)} className="p-2 border rounded bg-white dark:bg-zinc-800 text-sm" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Airborne</label>
          <input type="time" value={airborne} onChange={(e) => setAirborne(e.target.value)} className="p-2 border rounded bg-white dark:bg-zinc-800 text-sm" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Landing</label>
          <input type="time" value={landing} onChange={(e) => setLanding(e.target.value)} className="p-2 border rounded bg-white dark:bg-zinc-800 text-sm" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">Block On</label>
          <input type="time" value={blockOn} onChange={(e) => setBlockOn(e.target.value)} className="p-2 border rounded bg-white dark:bg-zinc-800 text-sm" />
        </div>
      </div>

      <button
        onClick={calculate}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-semibold transition"
      >
        🔍 Calculate Block Time
      </button>

      {result && (
        <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
          {result}
        </div>
      )}
    </motion.div>
  );
}
