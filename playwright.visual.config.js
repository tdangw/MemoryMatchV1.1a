import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";

// Shared presentation includes fullscreen; images remain review candidates.
process.env.GAME_SHELL_VISUAL_CANDIDATES = "1";
const visualViewports = Object.freeze({
  desktop: { width: 1024, height: 900 },
  "portrait-360": { width: 360, height: 640 },
  "portrait-411": { width: 411, height: 914 },
  "landscape-640": { width: 640, height: 360 },
  "landscape-914": { width: 914, height: 411 },
});
export default defineConfig({
  ...base,
  projects: Object.entries(visualViewports).map(([name, viewport]) => ({ name, use: { viewport } })),
  testMatch: "game-shell.audit.spec.js",
  snapshotPathTemplate: "{testDir}/visual-candidates/{projectName}/{arg}{ext}",
});
