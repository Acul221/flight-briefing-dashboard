import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./vitest.setup.jsx", // pastikan ada
    mockReset: true,
    exclude: [
      "node_modules/**",
      "dist/**",
      ".git/**",
      ".idea/**",
      ".vscode/**",
      "tests/playwright/**", // Playwright specs
      "tests/admin/**",      // Playwright specs
      "playwright-report/**",
      "test-results/**",
    ],
  },
});
