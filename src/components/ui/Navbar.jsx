import { useState, useEffect, useRef } from 'react';
import { Menu, Link as LinkIcon, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import ClockUTC from '@/components/ui/ClockUTC';
import ClockLocal from '@/components/ui/ClockLocal';
import NavbarMarquee from '@/components/ui/NavbarMarquee';

function Navbar({ toggleSidebar }) {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  const links = [
    { name: 'Skydeck', url: 'https://skydeckpro.netlify.app/' },
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    <motion.nav
      className={`sticky top-0 z-40 w-full backdrop-blur-md transition-all duration-300 px-4 ${scrolled ? 'py-2 shadow-md bg-white/70 dark:bg-gray-800/60' : 'py-3 bg-white/40 dark:bg-gray-800/40'}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: Sidebar Toggle + UTC Clock */}
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="text-gray-800 dark:text-white">
            <Menu size={24} />
          </button>
          <ClockUTC />
        </div>

        {/* Center: Marquee */}
        <div className="hidden md:flex flex-1 justify-center">
          <NavbarMarquee />
        </div>

        {/* Right: Local Clock + Theme + Links */}
        <div className="flex items-center gap-4">
          <ClockLocal />

          <button onClick={toggleDarkMode} className="text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-yellow-400">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-300 relative"
            >
              <LinkIcon size={16} />
              <span className="hidden sm:inline font-semibold text-sm">Quick Links</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500"></span>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-52 bg-white/90 dark:bg-gray-700/90 backdrop-blur-md rounded-lg shadow-lg overflow-hidden z-50 animate-fadeIn">
                {links.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <LinkIcon size={14} />
                    {link.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showNotification && (
        <div className="absolute top-16 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fadeIn">
          {showNotification}
        </div>
      )}
    </motion.nav>
  );
}

export default Navbar;
