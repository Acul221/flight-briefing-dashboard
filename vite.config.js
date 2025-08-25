// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Flightbriefing Dashboard',
        short_name: 'Skydeck',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1e3a8a',
        icons: [
          { src: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/favicon-512x512.png', sizes: '512x512', type: 'image/png' }
        ],
        screenshots: [
          { src: '/screenshot-desktop.png', sizes: '1280x720', type: 'image/png', form_factor: 'wide' },
          { src: '/screenshot-mobile.png', sizes: '360x640', type: 'image/png', form_factor: 'narrow' }
        ]
      },
      // PENTING: Workbox config
      workbox: {
        // ⬇ mencegah error "maximumFileSizeToCacheInBytes" dari WASM besar
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB (> 4.73MB)
        globPatterns: ['**/*.{js,css,html,png,ico,svg,webmanifest}'],
        globIgnores: ['**/tess/**'], // jangan precache folder WASM/worker

        // PWA update langsung aktif (tanpa nunggu tab lama ditutup)
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,

        // (opsional) kalau SPA, fallback ke index.html
        // navigateFallback: '/index.html',

        // Runtime caching dasar
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: { cacheName: 'pages' }
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' || request.destination === 'style',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'assets' }
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: { cacheName: 'images' }
          },
          // Cache runtime untuk file besar Tesseract (tidak diprecache)
          {
            urlPattern: ({ url }) => url.pathname.includes('/tess/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'tesseract-runtime' }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 2000 // kurangin noise peringatan chunk besar
  },
  define: {
    __DEFINES__: {},
    __HMR_CONFIG_NAME__: JSON.stringify(''),
    __BASE__: JSON.stringify('/'),
    __HMR_BASE__: JSON.stringify(''),
    __SERVER_HOST__: JSON.stringify(''),
    __HMR_PROTOCOL__: JSON.stringify(''),
    __HMR_PORT__: JSON.stringify(''),
    __HMR_HOSTNAME__: JSON.stringify(''),
    __HMR_DIRECT_TARGET__: JSON.stringify(''),
    __HMR_TIMEOUT__: JSON.stringify(30000),
    __WS_TOKEN__: JSON.stringify(''),
    __HMR_ENABLE_OVERLAY__: false,

    // 🔎 Build stamp buat verifikasi versi di UI (opsional tampilkan di footer)
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __COMMIT_REF__: JSON.stringify(process.env.COMMIT_REF || '')
  }
});
