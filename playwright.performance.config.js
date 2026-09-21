import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";

const testPort = Number(process.env.GAME_SHELL_TEST_PORT || 4173);

export default defineConfig({
  ...base,
  outputDir: "playwright-report/effect-v2-performance/artifacts",
  reporter: [["list"], ["json", { outputFile: "playwright-report/effect-v2-performance/results.json" }]],
  testMatch: "effect-v2.performance.spec.js",
  projects: [
    { name: "desktop", use: { viewport: { width: 1024, height: 900 } } },
    { name: "mobile-360", use: { viewport: { width: 360, height: 800 } } },
    { name: "mobile-411", use: { viewport: { width: 411, height: 915 } } },
  ],
  webServer: {
    ...base.webServer,
    command: `node ./node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port ${testPort} --strictPort`,
  },
});
