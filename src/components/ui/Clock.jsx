// src/components/ui/Clock.jsx
import { useState, useEffect } from "react";
import { Clock as ClockIcon } from "lucide-react";

function Clock() {
  const [localTime, setLocalTime] = useState("");
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const pad = (n) => String(n).padStart(2, "0");

    const updateClocks = () => {
      const now = new Date();

      // Local
      const localDay = now.toLocaleDateString(undefined, { weekday: 'long' });
      const localDate = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
      const localTimeString = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      // UTC
      const utc = new Date(now.toISOString());
      const utcDay = utc.toLocaleDateString(undefined, { weekday: 'long', timeZone: 'UTC' });
      const utcDate = `${pad(utc.getUTCDate())}-${pad(utc.getUTCMonth() + 1)}-${utc.getUTCFullYear()}`;
      const utcTimeString = `${pad(utc.getUTCHours())}:${pad(utc.getUTCMinutes())}:${pad(utc.getUTCSeconds())}Z`;

      setLocalTime(`${localDay}, ${localDate} ${localTimeString}`);
      setUtcTime(`${utcDay}, ${utcDate} ${utcTimeString}`);
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="mt-8 max-w-6xl mx-auto px-4">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        Current Time
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Local Time Card */}
        <div className="flex flex-col items-center bg-white/30 dark:bg-gray-700/30 backdrop-blur-md rounded-2xl shadow-md hover:shadow-2xl p-6 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 hover:ring-2 hover:ring-blue-400 dark:hover:ring-yellow-400 text-center">
          <ClockIcon size={40} className="text-blue-600 dark:text-yellow-400 mb-2" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Local Time</h3>
          <p className="font-mono text-lg text-gray-700 dark:text-gray-300 mt-2">{localTime}</p>
        </div>

        {/* UTC Time Card */}
        <div className="flex flex-col items-center bg-white/30 dark:bg-gray-700/30 backdrop-blur-md rounded-2xl shadow-md hover:shadow-2xl p-6 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 hover:ring-2 hover:ring-green-400 dark:hover:ring-yellow-400 text-center">
          <ClockIcon size={40} className="text-green-600 dark:text-yellow-400 mb-2" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">UTC Time</h3>
          <p className="font-mono text-lg text-gray-700 dark:text-gray-300 mt-2">{utcTime}</p>
        </div>

      </div>
    </section>
  );
}

export default Clock;
