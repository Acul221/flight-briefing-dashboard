import TimeBetweenDates from "@/components/TimeBetweenDates";
import BlockTimeCalculator from "@/components/BlockTimeCalculator";
import { motion } from "framer-motion";

export default function TimeTools() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 md:px-6 py-8 min-h-screen bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-300">
            🧮 Time Tools
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Calculate durations, block times, and day/night splits
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TimeBetweenDates />
          <BlockTimeCalculator />
        </div>
      </div>
    </motion.section>
  );
}
