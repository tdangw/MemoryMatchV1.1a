const config = require('./playwright.config.cjs');
module.exports = { ...config, testMatch: 'public-profile.spec.cjs', testIgnore: [], timeout: 90000,
  webServer: { ...config.webServer, env: { VITE_FIREBASE_DISABLED: '0', VITE_FIREBASE_USE_EMULATORS: '1', VITE_FIREBASE_ENV: 'test', GAME_SHELL_TEST_PORT: '4189' } } };
