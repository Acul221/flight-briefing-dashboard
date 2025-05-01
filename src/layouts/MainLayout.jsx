import { useState, useEffect } from "react";
import Navbar from "../components/ui/Navbar";
import Sidebar from "../components/ui/Sidebar";
import Footer from "../components/ui/Footer";
import FloatingMenu from "../components/FloatingMenu";

function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  // Auto collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} />

      <div className="flex flex-col flex-1">
        {/* Navbar with toggle */}
        <Navbar toggleSidebar={() => setCollapsed(!collapsed)} />

        {/* Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 transition-all duration-300">
          {children}
        </main>

        //Di hilangkan sementara FloatingMenu
        <Footer />
      </div>
    </div>
  );
}

export default MainLayout;
