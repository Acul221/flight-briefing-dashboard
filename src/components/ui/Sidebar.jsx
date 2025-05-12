import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Settings, ClipboardList, Clock } from "lucide-react";

function Sidebar({ collapsed, onClose }) {
  const location = useLocation();
  const sidebarRef = useRef(null);

  const navItems = [
    { name: "Dashboard", path: "/", icon: <Home size={18} /> },
    { name: "RAC Delay", path: "/rac-delay", icon: <ClipboardList size={18} /> },
    { name: "Time Tools", path: "/time-tools", icon: <Clock size={18} /> },
    { name: "Settings", path: "/settings", icon: <Settings size={18} /> },
  ];

  // Auto close when click outside (on mobile)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target) && window.innerWidth < 768) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <AnimatePresence>
      {!collapsed && (
        <motion.aside
          ref={sidebarRef}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(event, info) => {
            if (info.offset.x < -50) {
              onClose();
            }
          }}
          className="w-64 h-full bg-white/20 dark:bg-gray-800/20 backdrop-blur-md border-r border-gray-300 dark:border-gray-700 shadow-lg fixed md:static z-30 overflow-y-auto touch-none"
        >
          <div className="p-4">
            <h2 className="text-xl font-bold tracking-tight text-gray-800 dark:text-white mb-6">
              Flight Tools
            </h2>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-xl transition-all duration-200 group
                      ${
                        isActive
                          ? "bg-gray-200/60 dark:bg-gray-700/50 font-semibold text-blue-600 dark:text-blue-400"
                          : "hover:bg-gray-100/40 dark:hover:bg-gray-700/20 text-gray-800 dark:text-gray-200"
                      }
                    `}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="ml-3 text-sm truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default Sidebar;
