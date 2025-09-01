import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300 py-4 mt-10 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center px-4 gap-3">
        <p>© SkyDeckPro, {new Date().getFullYear()}</p>
        <nav className="flex flex-wrap items-center gap-4" aria-label="Footer navigation">
          <Link to="/terms" className="hover:underline hover:text-blue-700 dark:hover:text-blue-400">Terms</Link>
          <Link to="/refund-policy" className="hover:underline hover:text-blue-700 dark:hover:text-blue-400">Refund Policy</Link>
          <Link to="/privacy" className="hover:underline hover:text-blue-700 dark:hover:text-blue-400">Privacy</Link>
          <Link to="/contact" className="hover:underline hover:text-blue-700 dark:hover:text-blue-400">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
