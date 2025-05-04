import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // ⬅️ tambahkan ini untuk alias

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // ⬅️ alias @ untuk folder src
    },
  },
  build: {
    sourcemap: false,
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
