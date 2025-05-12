import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-between bg-white/20 dark:bg-gray-800/30 backdrop-blur-md rounded-xl px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Clock size={22} className="text-blue-600 dark:text-yellow-300" />
        </motion.div>
        <span className="text-sm md:text-base font-medium text-gray-800 dark:text-gray-200">
          Local Time
        </span>
      </div>
      <p className="font-mono text-sm md:text-base text-gray-700 dark:text-gray-300">
        {localTime}
      </p>
    </motion.div>
  );
}

export default ClockLocal;
