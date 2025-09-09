// src/components/quiz/UpgradeLimitModal.jsx
import { motion, AnimatePresence } from "framer-motion";

export default function UpgradeLimitModal({ open, onClose, onLogin, onUpgrade, total = 10 }) {
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
              <h3 className="text-lg font-semibold mb-1">You’ve reached the trial limit</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                You completed {total} trial questions. Login or upgrade to continue practicing with the full bank and save your progress.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={onLogin}
                  className="flex-1 rounded bg-blue-600 text-white py-2 hover:bg-blue-700"
                >
                  Login
                </button>
                <button
                  onClick={onUpgrade}
                  className="flex-1 rounded border border-blue-600 text-blue-700 dark:text-blue-300 py-2 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                >
                  See Plans
                </button>
              </div>

              <button
                onClick={onClose}
                className="mt-3 w-full text-xs text-gray-500 hover:underline"
              >
                Not now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
