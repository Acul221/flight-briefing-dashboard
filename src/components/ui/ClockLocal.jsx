// src/components/ui/ClockLocal.jsx
import { useState, useEffect } from "react";
import { Clock as ClockIcon } from "lucide-react";

function ClockLocal() {
  const [localTime, setLocalTime] = useState("");

  useEffect(() => {
    const pad = (n) => String(n).padStart(2, "0");

    const updateClock = () => {
      const now = new Date();
      const localDay = now.toLocaleDateString(undefined, { weekday: "long" });
      const localDate = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
      const localTimeString = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      setLocalTime(`${localDay}, ${localDate} ${localTimeString}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center bg-white/30 dark:bg-gray-700/30 backdrop-blur-md rounded-2xl shadow-md hover:shadow-2xl p-6 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 hover:ring-2 hover:ring-blue-400 dark:hover:ring-yellow-400 text-center">
      <ClockIcon size={40} className="text-blue-600 dark:text-yellow-400 mb-2" />
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Local Time</h3>
      <p className="font-mono text-lg text-gray-700 dark:text-gray-300 mt-2">{localTime}</p>
    </div>
  );
}

export default ClockLocal;
