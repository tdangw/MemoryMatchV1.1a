import { defineConfig } from "@playwright/test";

const viewports = {
  desktop: { width: 1024, height: 900 },
  mobile: { width: 390, height: 844 },
  "mobile-narrow": { width: 320, height: 568 },
  landscape: { width: 844, height: 390 },
};

export default defineConfig({
  testDir: "./tests/ui",
  outputDir: "test-results",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  expect: { timeout: 5000 },
  use: {
    baseURL: "http://127.0.0.1:4173",
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
    command: "npm run dev",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 30000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
