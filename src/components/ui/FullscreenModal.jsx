// src/components/ui/FullscreenModal.jsx
import { motion, AnimatePresence } from "framer-motion";

export default function FullscreenModal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-[999] text-white bg-black/50 rounded-full p-2 hover:bg-red-500 transition"
          >
            ✕
          </button>
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-full h-full overflow-hidden">
              {children}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
