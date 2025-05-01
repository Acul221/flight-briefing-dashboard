import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
  },
  define: {
    __DEFINES__: {},
    __HMR_CONFIG_NAME__: JSON.stringify(''),
    __BASE__: JSON.stringify('/'), // ✅ tambahkan ini
  },
});
