import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
const installedChromium = '/home/zapdos/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync(installedChromium) ? installedChromium : undefined);
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:3000',
    browserName: 'chromium',
    launchOptions: { executablePath },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  reporter: 'list',
});
