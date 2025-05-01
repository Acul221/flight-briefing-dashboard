// src/components/FloatingMenu.jsx
import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';

function FloatingMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 30, y: 30 });
  const [dragging, setDragging] = useState(false);
  const [idle, setIdle] = useState(false);
  const containerRef = useRef(null);
  const idleTimer = useRef(null);

  const links = [
    { name: 'Superlink', url: 'https://application.lionair.com/saj/crewlink/Login.aspx' },
    { name: 'eCrew', url: 'https://ecrew.lionair.com/ecrew' },
    { name: 'DMI', url: 'https://docs.google.com/spreadsheets/d/1T5eFF8FHhWwjYPVOhSCqKik3b4WVEPcKOonZ7R4PSD0/edit' },
    { name: 'E-PostFlight', url: 'https://app.lionairgroup.com:18010/epfaims/Login.aspx' },
    { name: 'Staff Portal', url: 'https://staff.lionair.com' },
    { name: 'Coruson', url: 'https://gaelidentityserver.gaelenlighten.com/core/login?signin=7cfcc9e47cae24ebf5756cd04910d6e3' }
  ];

  const startIdleTimer = () => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 3000);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setIdle(false);
    clearTimeout(idleTimer.current);
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    const newX = Math.min(Math.max(0, e.clientX - 28), window.innerWidth - 56);
    const newY = Math.min(Math.max(0, window.innerHeight - e.clientY - 28), window.innerHeight - 56);
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    if (!dragging) return;
    setDragging(false);
    setIsOpen(false); // Auto close radial
    stickyToEdge();
    startIdleTimer();
  };

  const handleTouchStart = (e) => {
    setDragging(true);
    setIdle(false);
    clearTimeout(idleTimer.current);
  };

  const handleTouchMove = (e) => {
    if (!dragging || e.touches.length === 0) return;
    const touch = e.touches[0];
    const newX = Math.min(Math.max(0, touch.clientX - 28), window.innerWidth - 56);
    const newY = Math.min(Math.max(0, window.innerHeight - touch.clientY - 28), window.innerHeight - 56);
    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    if (!dragging) return;
    setDragging(false);
    setIsOpen(false); // Auto close radial
    stickyToEdge();
    startIdleTimer();
  };

  const stickyToEdge = () => {
    const midX = window.innerWidth / 2;
    const finalX = position.x < midX ? 10 : window.innerWidth - 70;
    setPosition(pos => ({ x: finalX, y: pos.y }));
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    startIdleTimer();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      clearTimeout(idleTimer.current);
    };
  }, [dragging, position.x, position.y]);

  return (
    <div
      className="fixed z-50 transition-all duration-500 ease-out"
      ref={containerRef}
      style={{ left: position.x, bottom: position.y }}
    >
      {/* Links */}
      <div className="relative">
        {links.map((link, index) => {
          const angle = (index / links.length) * 2 * Math.PI;
          const x = Math.cos(angle) * 80;
          const y = Math.sin(angle) * 80;

          return (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`absolute w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-auto'}`}
              style={{
                transform: isOpen
                  ? `translate(${x}px, ${-y}px)`
                  : 'translate(0, 0)',
                pointerEvents: dragging ? 'none' : 'auto',
              }}
            >
              <span className="text-xs font-bold">{link.name[0]}</span>
            </a>
          );
        })}

        {/* Main Floating Button */}
        <button
          onClick={() => !dragging && setIsOpen(!isOpen)}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all"
          style={{ opacity: idle ? 0.5 : 1 }}
        >
          <Plus size={28} className={isOpen ? 'rotate-45 transition-transform' : 'transition-transform'} />
        </button>
      </div>
    </div>
  );
}

export default FloatingMenu;
