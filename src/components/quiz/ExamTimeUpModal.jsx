// src/components/quiz/ExamTimeUpModal.jsx
import { AnimatePresence, motion } from "framer-motion";

export default function ExamTimeUpModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center p-4"
          >
            <div className="max-w-md w-full rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-lg font-semibold mb-1">Time is up</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                The exam has ended. You’re now in Review mode.
              </p>
              <button
                onClick={onClose}
                className="w-full rounded bg-blue-600 text-white py-2 hover:bg-blue-700"
              >
                View Review
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
