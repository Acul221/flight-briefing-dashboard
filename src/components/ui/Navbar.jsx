import { useState, useEffect, useRef } from 'react';
import { Menu, Link as LinkIcon, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function Navbar({ toggleSidebar }) {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const dropdownRef = useRef(null);

  const links = [
    { name: 'Superlink', url: 'https://application.lionair.com/saj/crewlink/Login.aspx' },
    { name: 'eCrew', url: 'https://ecrew.lionair.com/ecrew' },
    { name: 'DMI', url: 'https://docs.google.com/spreadsheets/d/1T5eFF8FHhWwjYPVOhSCqKik3b4WVEPcKOonZ7R4PSD0/edit' },
    { name: 'E-PostFlight', url: 'https://app.lionairgroup.com:18010/epfaims/Login.aspx' },
    { name: 'Staff Portal', url: 'https://staff.lionair.com' },
    { name: 'Coruson', url: 'https://gaelidentityserver.gaelenlighten.com/core/login?signin=7cfcc9e47cae24ebf5756cd04910d6e3' }
  ];

  useEffect(() => {
    const storedMode = localStorage.getItem('theme');
    if (storedMode === 'dark') {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setDarkMode(!darkMode);
    triggerNotification(darkMode ? 'Light Mode On' : 'Dark Mode On');
  };

  const triggerNotification = (message) => {
    setShowNotification(message);
    setTimeout(() => setShowNotification(false), 2000);
  };

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 z-10">
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
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm shadow transition-all duration-300 relative"
          >
            <LinkIcon size={18} />
            <span className="hidden sm:inline font-medium">Quick Links</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="absolute right-0 mt-2 w-56 bg-white/90 dark:bg-gray-700/90 backdrop-blur-md rounded-lg shadow-xl overflow-hidden z-50"
              >
                {links.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <LinkIcon size={16} />
                    {link.name}
                  </a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50"
          >
            {showNotification}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
