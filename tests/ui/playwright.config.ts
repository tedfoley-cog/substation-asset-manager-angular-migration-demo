import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    testIdAttribute: 'data-test',
    baseURL: process.env.SAM_UI_URL || 'http://localhost:3000',
    ...devices['Desktop Chrome'],
    viewport: { width: 1400, height: 900 },
    screenshot: 'only-on-failure',
    video: process.env.SAM_UI_VIDEO ? 'on' : 'retain-on-failure',
    trace: 'retain-on-failure'
  }
});
