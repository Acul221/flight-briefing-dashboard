import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function DisclaimerPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/dashboard"), 3500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="flex items-center justify-center min-h-screen px-4 bg-white dark:bg-zinc-900"
    >
      <div className="max-w-xl bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md border border-gray-200 dark:border-zinc-700 p-6 rounded-xl shadow-md text-center space-y-4">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Disclaimer
          </h1>
          <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
            This dashboard is a private tool for flight preparation use only. <br />
            Data are retrieved from publicly available sources. <br />
            No login required.
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition"
        >
          Enter Dashboard
        </button>
      </div>
    </motion.section>
  );
}
