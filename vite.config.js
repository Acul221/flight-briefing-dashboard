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
      // ⬇⬇⬇ PENTING: atur Workbox agar tidak gagal build karena file besar
      workbox: {
        // Naikkan limit > 4.73MB (default 2MiB)
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MiB
        // Precache hanya aset umum. WASM/worker tesseract kita exclude.
        globPatterns: ['**/*.{js,css,html,png,ico,svg,webmanifest}'],
        globIgnores: ['**/tess/**'], // <-- lewati semua di folder /tess/
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: { cacheName: 'pages' },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' || request.destination === 'style',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'assets' },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: { cacheName: 'images' },
          },
          // Opsional: runtime cache untuk WASM/worker besar agar tetap cepat saat kedua kali
          {
            urlPattern: ({ url }) => url.pathname.includes('/tess/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'tesseract-runtime' },
          }
        ]
      },
      // devOptions: { enabled: false }, // biarkan default
    })
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    sourcemap: false,
    // Opsional: kurangi warning chunk besar
    chunkSizeWarningLimit: 2000,
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
  },
});
