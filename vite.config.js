import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    __HMR_CONFIG_NAME__: JSON.stringify(''),
  },
  build: {
    sourcemap: false,
  },
});
