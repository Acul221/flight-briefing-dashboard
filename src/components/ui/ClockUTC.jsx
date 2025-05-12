import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="flex items-center justify-between bg-white/20 dark:bg-gray-800/30 backdrop-blur-md rounded-xl px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Clock size={22} className="text-green-600 dark:text-yellow-300" />
        </motion.div>
        <span className="text-sm md:text-base font-medium text-gray-800 dark:text-gray-200">
          UTC Time
        </span>
      </div>
      <p className="font-mono text-sm md:text-base text-gray-700 dark:text-gray-300">
        {utcTime}
      </p>
    </motion.div>
  );
}

export default ClockUTC;
