const LIGHT = "skydeckpro";
const DARK  = "skydeckprodark";

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  // optional: also toggle Tailwind's 'dark' class, in case you use dark: variants
  document.documentElement.classList.toggle("dark", theme === DARK);
  try { localStorage.setItem("theme", theme); } catch {}
}

export function initTheme() {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === LIGHT || saved === DARK) return applyTheme(saved);
  } catch {}

  // fallback: match OS preference
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  applyTheme(prefersDark ? DARK : LIGHT);
}

export function toggleTheme() {
  const curr = document.documentElement.getAttribute("data-theme");
  applyTheme(curr === DARK ? LIGHT : DARK);
}
