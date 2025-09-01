// vite.config.js
import { defineConfig } from "vitest/config"; // gunakan vitest/config
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "Flightbriefing Dashboard",
        short_name: "Skydeck",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#1e3a8a",
        icons: [
          {
            src: "/manifest-icon-192.maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/manifest-icon-512.maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        screenshots: [
          {
            src: "/screenshot-desktop.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
          },
          {
            src: "/screenshot-mobile.png",
            sizes: "360x640",
            type: "image/png",
            form_factor: "narrow",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MB
        globPatterns: ["**/*.{js,css,html,png,ico,svg,webmanifest,jpg}"],
        globIgnores: ["**/tess/**"],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
            options: { cacheName: "pages" },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === "script" ||
              request.destination === "style",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "assets" },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: { cacheName: "images" },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes("/tess/"),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "tesseract-runtime" },
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // alias untuk src
    },
  },

  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },

  // ✅ vitest config
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.jsx", // <-- pastikan file sudah rename ke .js
    mockReset: true,
  },
});
