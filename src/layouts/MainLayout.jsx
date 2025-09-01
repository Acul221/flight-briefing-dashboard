import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import Navbar from "../components/ui/Navbar";
import Sidebar from "../components/ui/Sidebar";
import Footer from "../components/Footer";
import LogoutButton from "@/components/LogoutButton";
import { useProfile } from "@/hooks/useProfile"; // ✅ untuk ambil email & role

function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(true);
  const { profile } = useProfile();

  const openSidebar = () => setCollapsed(false);
  const closeSidebar = () => setCollapsed(true);

  // Swipe kanan → buka sidebar (mobile only)
  const bindGesture = useDrag(
    ({ movement: [mx], direction: [xDir], down }) => {
      if (
        !down &&
        xDir > 0 &&
        mx > 50 &&
        collapsed &&
        typeof window !== "undefined" &&
        window.innerWidth < 768
      ) {
        openSidebar();
      }
    },
    { axis: "x", pointer: { touch: true }, eventOptions: { passive: false } }
  );

  // Auto-collapse on resize
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
      className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white transition-colors duration-300"
      style={{ touchAction: "pan-y" }}
    >
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onClose={closeSidebar} />

      {/* Overlay Blur (mobile) */}
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
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-3 bg-white/80 dark:bg-gray-800/80 shadow-md backdrop-blur-md">
          <Navbar toggleSidebar={() => setCollapsed(!collapsed)} />

          {/* user info + logout */}
          <div className="flex items-center gap-4">
            {profile ? (
              <div className="text-right">
                <p className="text-sm font-medium">{profile.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {profile.role === "admin" ? "Admin" : "User"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Loading...</p>
            )}
            <LogoutButton />
          </div>
        </header>

        {/* Page content */}
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
