// src/components/ui/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { Menu, Link as LinkIcon, Moon, Sun } from 'lucide-react';

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
    <nav className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 shadow relative">
      {/* Sidebar Toggle */}
      <button onClick={toggleSidebar} className="text-gray-800 dark:text-white">
        <Menu size={28} />
      </button>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button onClick={toggleDarkMode} className="text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-yellow-400">
          {darkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>

        {/* Quick Links Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-300 relative"
          >
            <LinkIcon size={20} />
            <span className="hidden sm:inline font-semibold">Quick Links</span>
            {/* Badge */}
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
                  <LinkIcon size={16} />
                  {link.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {showNotification && (
        <div className="absolute top-16 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fadeIn">
          {showNotification}
        </div>
      )}
    </nav>
  );
}

export default Navbar;

