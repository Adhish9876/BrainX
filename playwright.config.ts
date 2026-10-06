import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:3000',
    browserName: 'chromium',
    launchOptions: { executablePath: '/home/zapdos/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome' },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  reporter: 'list',
});
