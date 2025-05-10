import { useState } from "react";

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
    <div className="bg-white p-4 rounded-xl shadow w-full">
      <h2 className="text-xl font-bold mb-4">Time Between Dates</h2>
      <p className="text-sm text-gray-500 mb-2">Calculate your DMI remaining day</p>
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="p-2 border rounded flex-1 w-full"
        />
        <input
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="p-2 border rounded flex-1 w-full"
        />
        <button
          onClick={calculateTimeDifference}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
        >
          Calculate
        </button>
      </div>
      {result && <p className="mt-2 text-sm text-gray-700">{result}</p>}
    </div>
  );
}
