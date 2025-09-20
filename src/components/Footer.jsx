import { Link } from "react-router-dom";
import { useState } from "react";

export default function Footer() {
  const [open, setOpen] = useState(false);

  return (
    <footer className="bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300 py-4 mt-10 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center px-4 gap-3">
        <p>© SkyDeckPro, {new Date().getFullYear()}</p>

        <nav
          className="flex flex-wrap items-center gap-4 text-sm"
          aria-label="Footer navigation"
        >
          {/* Halaman */}
          <Link
            to="/terms"
            className="hover:underline hover:text-blue-700 dark:hover:text-blue-400"
          >
            Terms / S&K
          </Link>
          <Link
            to="/refund-policy"
            className="hover:underline hover:text-blue-700 dark:hover:text-blue-400"
          >
            Refund Policy
          </Link>
          <Link
            to="/privacy"
            className="hover:underline hover:text-blue-700 dark:hover:text-blue-400"
          >
            Privacy / Privasi
          </Link>
          <Link
            to="/contact"
            className="hover:underline hover:text-blue-700 dark:hover:text-blue-400"
          >
            Contact
          </Link>

          {/* Dropdown PDF */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="hover:underline hover:text-blue-700 dark:hover:text-blue-400"
            >
              Download PDF ▾
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-10">
                <ul className="py-2 text-sm">
                  <li>
                    <a
                      href="/legal/terms_id.pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Terms (ID)
                    </a>
                  </li>
                  <li>
                    <a
                      href="/legal/terms_en.pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Terms (EN)
                    </a>
                  </li>
                  <li>
                    <a
                      href="/legal/refund.pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Refund Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/legal/privacy_id.pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Privacy (ID)
                    </a>
                  </li>
                  <li>
                    <a
                      href="/legal/privacy_en.pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Privacy (EN)
                    </a>
                  </li>
                  <li>
                    <a
                      href="/legal/contact.pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Contact (PDF)
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </nav>
      </div>
    </footer>
  );
}
