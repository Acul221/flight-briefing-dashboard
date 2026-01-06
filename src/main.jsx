// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { RACProvider } from "./context/RACContext.jsx";

import "react-image-crop/dist/ReactCrop.css";
import "./index.css";
import App from "./App.jsx";

/** -------- Theme boot --------
 * Initializes DaisyUI theme BEFORE first paint to avoid FOUC.
 * Persists choice in localStorage; falls back to OS prefers-color-scheme.
 */
(function initTheme() {
  if (typeof document === "undefined") return;

  const LIGHT = "skydeckpro";
  const DARK = "skydeckprodark";

  function applyTheme(theme) {
    const el = document.documentElement;
    el.setAttribute("data-theme", theme);
    // Also toggle Tailwind's 'dark' class (if you ever use dark: variants)
    el.classList.toggle("dark", theme === DARK);
    try { localStorage.setItem("theme", theme); } catch { /* noop */ }
  }

  try {
    const saved = localStorage.getItem("theme");
    if (saved === LIGHT || saved === DARK) {
      applyTheme(saved);
      return;
    }
  } catch { /* noop */ }

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  applyTheme(prefersDark ? DARK : LIGHT);
})();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <RACProvider>
          <App />
        </RACProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
