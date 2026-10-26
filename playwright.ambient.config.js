import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ui', testMatch: 'ambient-background-pilot.spec.js',
  outputDir: 'runtime/qa/animated-backgrounds/tests', workers: 1, retries: 0,
  use: { baseURL: 'http://127.0.0.1:4189', channel: 'chrome', reducedMotion: 'no-preference', serviceWorkers: 'block', trace: 'retain-on-failure' },
  projects: [
    { name: 'narrow', use: { viewport: { width: 320, height: 800 }, deviceScaleFactor: 2 } },
    { name: 'portrait', use: { viewport: { width: 412, height: 975 }, deviceScaleFactor: 3 } },
    { name: 'landscape', use: { viewport: { width: 844, height: 450 }, deviceScaleFactor: 2 } },
    { name: 'desktop', use: { viewport: { width: 1024, height: 960 }, deviceScaleFactor: 1 } },
  ],
  webServer: { command: 'node node_modules/vite/bin/vite.js preview --outDir runtime/qa/animated-backgrounds/pilot-dist --host 127.0.0.1 --port 4189 --strictPort', url: 'http://127.0.0.1:4189', reuseExistingServer: false },
});
