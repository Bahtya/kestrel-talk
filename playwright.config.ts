import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './browser-e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: [
    { command: 'node mock-server.mjs', port: 8090, reuseExistingServer: true },
    { command: 'npm run dev', port: 3000, reuseExistingServer: true },
  ],
});
