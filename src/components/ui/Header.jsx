import { motion } from "framer-motion";
import FlightTipSlideshow from "@/components/ui/FlightTipSlideshow";

function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-xl shadow-md p-6 md:p-8 mx-4 md:mx-8 my-4 text-center text-gray-900 dark:text-white"
    >
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
        Briefing Dashboard
      </h1>
      <p className="text-sm md:text-base mt-1">Welcome Captain</p>
      <p className="italic font-semibold text-blue-800 dark:text-blue-300 mt-2">
        Proper Preparation Prevents Poor Performance
      </p>

      <FlightTipSlideshow />
    </motion.div>
  );
}

export default Header;
