import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://localhost:4200',
    serviceWorkers: 'block',   // <- clave para que page.route intercepte
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
