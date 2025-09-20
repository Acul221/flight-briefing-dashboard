/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  darkMode: ["class", '[data-theme="skydeckprodark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"], // modern & clean
      },
      colors: {
        // optional aliases for direct Tailwind usage (rarely needed because DaisyUI maps theme tokens)
        brand: {
          navy: "#0D47A1",
          sky: "#2196F3",
          orange: "#FF9800",
        },
        layout: {
          bg: "#F8F9FB",
          card: "#FFFFFF",
          border: "#E0E0E0",
          text: "#2E3A45",
          textMuted: "#607D8B",
        },
      },
      boxShadow: {
        card: "0 6px 18px rgba(13, 71, 161, 0.06)", // soft brandy shadow
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem", // smooth radius ala iOS/Shopify
      },
    },
  },
  plugins: [
    require("daisyui"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
  daisyui: {
    // make SkyDeckPro the default theme
    themes: [
      {
        skydeckpro: {
          "primary": "#0D47A1",     // brand navy → main actions (Start, Next, Save)
          "primary-content": "#FFFFFF",

          "secondary": "#2196F3",   // sky blue → secondary/links/outline
          "secondary-content": "#FFFFFF",

          "accent": "#FF9800",      // orange → CTA highlights, Pro, celebratory
          "accent-content": "#1A1A1A",

          "neutral": "#2E3A45",     // text-primary
          "base-100": "#FFFFFF",    // card
          "base-200": "#F0F2F6",    // subtle surfaces
          "base-300": "#E0E0E0",    // borders

          "info": "#0288D1",
          "success": "#4CAF50",
          "warning": "#FFC107",
          "error": "#E53935",
        },
      },
      {
        skydeckprodark: {
          "primary": "#2196F3",
          "primary-content": "#0B1220",

          "secondary": "#90CAF9",
          "secondary-content": "#0B1220",

          "accent": "#FFB74D",      // softened orange for dark
          "accent-content": "#0B1220",

          "neutral": "#EAEAEA",
          "base-100": "#1E1E1E",
          "base-200": "#171717",
          "base-300": "#2A2A2A",

          "info": "#4FC3F7",
          "success": "#81C784",
          "warning": "#FFD54F",
          "error": "#EF5350",
        },
      },
    ],
    logs: false,
  },
};
