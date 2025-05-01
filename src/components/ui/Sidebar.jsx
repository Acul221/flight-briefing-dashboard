import { Home, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar({ collapsed }) {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home size={18} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={18} /> },
  ];

  return (
    <div
      className={`${
        collapsed ? 'w-16' : 'w-60'
      } bg-white dark:bg-gray-800 h-screen shadow-md p-4 transition-all duration-300`}
    >
      <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">
        {collapsed ? '' : 'Menu'}
      </h2>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-3 py-2 rounded-lg
                ${isActive
                  ? 'bg-gray-100 dark:bg-gray-700 font-semibold'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
              text-gray-900 dark:text-white transition`}
            >
              {item.icon}
              {!collapsed && <span className="ml-3">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default Sidebar;
