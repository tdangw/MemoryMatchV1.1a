import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";

const testPort = Number(process.env.GAME_SHELL_TEST_PORT || 4173);
const acceptanceViewports = Object.freeze({
  desktop: { width: 1024, height: 900 },
  "portrait-360": { width: 360, height: 640 },
  "portrait-411": { width: 411, height: 914 },
  "landscape-640": { width: 640, height: 360 },
  "landscape-914": { width: 914, height: 411 },
});

export default defineConfig({
  ...base,
  outputDir: "playwright-report/triple-web-acceptance/artifacts",
  reporter: [
    ["list"],
    ["json", { outputFile: "playwright-report/triple-web-acceptance/results.json" }],
  ],
  testMatch: "triple-connect.web-acceptance.spec.js",
  projects: Object.entries(acceptanceViewports).map(([name, viewport]) => ({
    name,
    use: { viewport },
  })),
  webServer: {
    ...base.webServer,
    command: `node ./node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port ${testPort} --strictPort`,
  },
});
