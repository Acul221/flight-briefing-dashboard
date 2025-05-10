import { useState } from "react";

export default function BlockTimeCalculator() {
  const [blockOff, setBlockOff] = useState("");
  const [airborne, setAirborne] = useState("");
  const [landing, setLanding] = useState("");
  const [blockOn, setBlockOn] = useState("");
  const [result, setResult] = useState("");

  const parseTime = (str) => {
    if (!str) return null;
    const [h, m] = str.split(":").map(Number);
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
      if (hour < 6 || hour >= 18) nightMinutes++; // Night: 18:00–06:00
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
      `Block Time: ${format(blockTime)} (🌙 ${format(blockSplit.night)}, ☀️ ${format(blockSplit.day)})\n` +
      `Air Time: ${format(airTime)} (🌙 ${format(airSplit.night)}, ☀️ ${format(airSplit.day)})`
    );
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow w-full">
      <h2 className="text-xl font-bold mb-4">Block Time Calculator</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <label className="w-32">Block Off Time:</label>
          <input type="time" value={blockOff} onChange={(e) => setBlockOff(e.target.value)} className="p-2 border rounded flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <label className="w-32">Airborne Time:</label>
          <input type="time" value={airborne} onChange={(e) => setAirborne(e.target.value)} className="p-2 border rounded flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <label className="w-32">Landing Time:</label>
          <input type="time" value={landing} onChange={(e) => setLanding(e.target.value)} className="p-2 border rounded flex-1" />
        </div>
        <div className="flex items-center gap-2">
          <label className="w-32">Block On Time:</label>
          <input type="time" value={blockOn} onChange={(e) => setBlockOn(e.target.value)} className="p-2 border rounded flex-1" />
        </div>
      </div>
      <button onClick={calculate} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
        Calculate Block Time
      </button>
      <p className="mt-2 text-xs text-gray-500">Input your block and air time</p>
      {result && <p className="mt-2 text-sm text-gray-800 whitespace-pre-line">{result}</p>}
    </div>
  );
}
