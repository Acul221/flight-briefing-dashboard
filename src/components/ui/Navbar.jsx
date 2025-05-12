import { useState, useEffect, useRef } from "react";
import { Menu, Link as LinkIcon, Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function Navbar({ toggleSidebar }) {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const dropdownRef = useRef(null);

  const links = [
    { name: "Superlink", url: "https://application.lionair.com/saj/crewlink/Login.aspx" },
    { name: "eCrew", url: "https://ecrew.lionair.com/ecrew" },
    { name: "DMI", url: "https://docs.google.com/spreadsheets/d/1T5eFF8FHhWwjYPVOhSCqKik3b4WVEPcKOonZ7R4PSD0/edit" },
    { name: "E-PostFlight", url: "https://app.lionairgroup.com:18010/epfaims/Login.aspx" },
    { name: "Staff Portal", url: "https://staff.lionair.com" },
    { name: "Coruson", url: "https://gaelidentityserver.gaelenlighten.com/core/login?signin=7cfcc9e47cae24ebf5756cd04910d6e3" },
  ];

  useEffect(() => {
    const storedMode = localStorage.getItem("theme");
    if (storedMode === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDarkMode(!darkMode);
  };

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">
      {/* Sidebar Toggle */}
      <button
        onClick={toggleSidebar}
        className="text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-yellow-400 transition"
      >
        <Menu size={26} />
      </button>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-yellow-400 transition"
        >
          {darkMode ? <Sun size={22} /> : <Moon size={22} />}
        </button>

        {/* Quick Links */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm shadow transition-all duration-300"
          >
            <LinkIcon size={18} />
            <span className="hidden sm:inline font-medium">Quick Links</span>
          </button>

          {/* Animated Dropdown */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute right-0 mt-2 w-60 bg-white/90 dark:bg-gray-700/90 backdrop-blur-lg rounded-xl shadow-xl overflow-hidden z-50"
              >
                {links.map((link, i) => (
                  <motion.a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * i }}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <LinkIcon size={16} />
                    {link.name}
                  </motion.a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
