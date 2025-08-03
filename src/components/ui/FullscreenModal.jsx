// src/components/ui/FullscreenModal.jsx
import { motion, AnimatePresence } from "framer-motion";

export default function FullscreenModal({ isOpen, onClose, children, title = "" }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="w-full h-full flex flex-col justify-start items-center"
            style={{
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            {/* Header */}
            <div className="w-full flex items-center px-4 py-3 relative">
              <button
                onClick={onClose}
                className="absolute top-8 right-8 z-[999] text-white bg-black/80 rounded-full p-6 text-xl hover:bg-red-500 transition"
                aria-label="Close fullscreen modal"
              >
                ✕
              </button>
              <h2 className="text-white text-lg font-semibold text-center w-full">
                {title}
              </h2>
            </div>

            {/* Framed Content: 80% width & height */}
            <div className="w-full h-full flex justify-center items-center px-4 pb-6">
              <div
                className="rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-lg"
                style={{
                  width: "80vw",
                  height: "80vh",
                  maxWidth: "1024px", // optional limit
                }}
              >
                {children}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
