const path = require('node:path');
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: __dirname, testMatch: 'screens.spec.cjs', outputDir: path.join(__dirname, 'qa', 'test-results'),
  workers: 1, retries: 0, timeout: 120000, reporter: 'list',
  use: { baseURL: process.env.UI_SKIN_BASE_URL || 'http://127.0.0.1:4193', channel: 'chrome', headless: true, locale: 'vi-VN', reducedMotion: 'reduce', serviceWorkers: 'block', screenshot: 'only-on-failure' },
  webServer: process.env.UI_SKIN_BASE_URL ? undefined : {
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4193 --strictPort',
    cwd: path.resolve(__dirname, '../../../..'), url: 'http://127.0.0.1:4193',
    env: { VITE_FIREBASE_DISABLED: '1' }, reuseExistingServer: false, timeout: 30000,
  },
});
