const path = require('node:path');
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({ testDir: __dirname, testMatch: '*.spec.cjs', outputDir: path.join(__dirname, 'qa/test-results'),
  workers: 1, retries: 0, timeout: 45000, reporter: 'list',
  use: { baseURL: process.env.UI_SKIN_BASE_URL || 'http://localhost:4173', channel: 'chrome', headless: true,
    locale: 'vi-VN', reducedMotion: 'reduce', serviceWorkers: 'block', screenshot: 'only-on-failure' } });
