import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import Navbar from "../components/ui/Navbar";
import Sidebar from "../components/ui/Sidebar";
import Footer from "../components/ui/Footer";

function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(true);

  const openSidebar = () => setCollapsed(false);
  const closeSidebar = () => setCollapsed(true);

  // Gesture: swipe kanan untuk buka sidebar (mobile only)
  const bindGesture = useDrag(
    ({ movement: [mx], direction: [xDir], down }) => {
      if (!down && xDir > 0 && mx > 50 && collapsed && window.innerWidth < 768) {
        openSidebar();
      }
    },
    { axis: "x" }
  );

  // Auto-collapse on screen resize (optional)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setCollapsed(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      {...bindGesture()}
      className="min-h-screen flex bg-gradient-to-br from-gray-100/80 via-white/60 to-gray-200/80 dark:from-gray-900/80 dark:via-gray-800/60 dark:to-gray-900/80 text-gray-900 dark:text-white transition-colors duration-300 touch-none"
    >
      {/* Sidebar with gesture + auto-close */}
      <Sidebar collapsed={collapsed} onClose={closeSidebar} />

      {/* Overlay blur when sidebar active (mobile only) */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut", delay: 0.1 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-col flex-1 z-10">
        <Navbar toggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-8 md:py-10 transition-all duration-300 ease-in-out">
          <AnimatePresence mode="wait">
            <motion.div
              key={typeof window !== "undefined" ? window.location.pathname : "page"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default MainLayout;
