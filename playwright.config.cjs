// SarNi 9 browser regression: diagnostics configured globally, not inside test.describe.
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './quality',
  testMatch: '**/*.spec.cjs',
  timeout: 30000,
  expect: { timeout: 15000 },
  retries: 0,
  use: {
    browserName: 'chromium',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    serviceWorkers: 'block'
  }
});
