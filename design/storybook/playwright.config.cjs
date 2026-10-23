const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: __dirname, testMatch: 'compositor.spec.cjs', workers: 1, fullyParallel: false,
  timeout: 40000, reporter: [['list']], outputDir: '../../docs/design/achievements/runtime/qa/traces',
  use: { baseURL: 'http://127.0.0.1:4189', browserName: 'chromium', channel: 'chrome', headless: true,
    reducedMotion: 'reduce', locale: 'vi-VN', serviceWorkers: 'block', deviceScaleFactor: 1 },
  webServer: { command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4189 --strictPort',
    cwd: require('node:path').resolve(__dirname, '../..'),
    url: 'http://127.0.0.1:4189', env: { VITE_FIREBASE_DISABLED: '1', GAME_SHELL_TEST_PORT: '4189' }, reuseExistingServer: false },
});
