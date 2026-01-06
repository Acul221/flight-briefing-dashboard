// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    headless: true,
    baseURL,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 5_000,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // If server not running, Playwright will run `npm run dev`.
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: true, // important — uses existing dev server if present
    env: {
      ...process.env,
      VITE_ADMIN_ROUTE_BYPASS: 'true',
    },
  },
});
