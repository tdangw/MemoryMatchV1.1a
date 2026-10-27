import { defineConfig } from '@playwright/test';
const port = 4193;
export default defineConfig({
  testDir: './tests/ui', testMatch: ['ambient-background-scenes.spec.js','background-effects.spec.js',
    'game-shell.lifecycle.spec.js','game-shell.cleanup.spec.js','game-shell.startup.spec.js',
    'game-shell.layout.spec.js','game-shell.effects.spec.js','challenge-fullscreen.spec.js',
    'progression-wave-presentation.spec.js'], workers: 1, retries: 0,
  outputDir: 'runtime/qa/animated-backgrounds/scenes', timeout: 90000,
  use: { baseURL: `http://127.0.0.1:${port}`, channel: 'chrome', reducedMotion: 'no-preference', serviceWorkers: 'block', trace: 'retain-on-failure' },
  projects: [
    { name: 'narrow', metadata:{portraitOnly:true}, use: { viewport: { width: 320, height: 740 }, deviceScaleFactor: 2 } },
    { name: 'portrait', metadata:{portraitOnly:true}, use: { viewport: { width: 412, height: 915 }, deviceScaleFactor: 3 } },
    { name: 'desktop-portrait', metadata:{portraitOnly:true}, use: { viewport: { width: 900, height: 1024 }, deviceScaleFactor: 1 } },
  ],
  webServer: { command: `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${port} --strictPort`, url: `http://127.0.0.1:${port}`, reuseExistingServer: false,
    env: { VITE_FIREBASE_DISABLED: '1', GAME_SHELL_TEST_PORT: String(port) } },
});
