import { defineConfig } from "@playwright/test";

const viewports = {
  desktop: { width: 1024, height: 900 },
  mobile: { width: 412, height: 915 },
  landscape: { width: 844, height: 390 },
};
const responsiveTestPattern = /(?:challenge-fullscreen|game-shell\.(?:geometry|layout|presentation)|triple-connect\.(?:chrome|geometry|presentation|witness))\.spec\.js$/;

const testPort = Number(process.env.GAME_SHELL_TEST_PORT || 4173);
if (!Number.isInteger(testPort) || testPort < 1024 || testPort > 65535) throw new Error("Invalid GAME_SHELL_TEST_PORT");
const baseURL = `http://127.0.0.1:${testPort}`;
const productionPreview = process.env.GAME_SHELL_TEST_SERVER === "preview";
const serverCommand = productionPreview
  ? `node ./node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port ${testPort} --strictPort`
  : `node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${testPort} --strictPort`;

export default defineConfig({
  testDir: "./tests/ui",
  outputDir: "test-results",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  expect: { timeout: 5000 },
  use: {
    baseURL,
    browserName: "chromium",
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
    headless: true,
    locale: "vi-VN",
    reducedMotion: "reduce",
    serviceWorkers: "block",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  projects: [...Object.entries(viewports).map(([name, viewport]) => ({
    name,
    grepInvert: /@cpu-budget/,
    use: { viewport },
    // State, persistence, economy and effect contracts are viewport-invariant.
    // Their owner is desktop; the three mobile profiles retain only responsive
    // geometry, presentation, overflow and playable-witness coverage.
    ...(name === "desktop" ? {} : { testMatch: responsiveTestPattern }),
  })), {
    // CPU budgets run without trace's DOM snapshotter. The default release run
    // still includes this project; functional projects retain their traces.
    name: 'cpu-budget',
    testMatch: /triple-generation\.spec\.js$/,
    grep: /@cpu-budget/,
    use: { viewport: viewports.desktop, trace: 'off' },
  }],
  webServer: {
    env: { VITE_FIREBASE_DISABLED: process.env.VITE_FIREBASE_USE_EMULATORS === "1" ? "0" : "1", VITE_FIREBASE_USE_EMULATORS: process.env.VITE_FIREBASE_USE_EMULATORS || "0" },
    command: serverCommand,
    url: baseURL,
    // Every test run owns a fresh Vite process. Reusing a developer server lets
    // stale assets or a previous failed run leak into Gate verification.
    reuseExistingServer: false,
    timeout: 30000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
