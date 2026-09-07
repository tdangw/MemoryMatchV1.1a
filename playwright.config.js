import { defineConfig } from "@playwright/test";

const viewports = {
  desktop: { width: 1024, height: 900 },
  mobile: { width: 390, height: 844 },
  "mobile-narrow": { width: 320, height: 568 },
  landscape: { width: 844, height: 390 },
};

const testPort = Number(process.env.GAME_SHELL_TEST_PORT || 4173);
if (!Number.isInteger(testPort) || testPort < 1024 || testPort > 65535) throw new Error("Invalid GAME_SHELL_TEST_PORT");
const baseURL = `http://127.0.0.1:${testPort}`;

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
    headless: true,
    locale: "vi-VN",
    reducedMotion: "reduce",
    serviceWorkers: "block",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  projects: Object.entries(viewports).map(([name, viewport]) => ({ name, use: { viewport } })),
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${testPort} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.GAME_SHELL_TEST_PORT,
    timeout: 30000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
