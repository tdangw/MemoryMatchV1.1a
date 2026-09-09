import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";

// Shared presentation includes fullscreen; images remain review candidates.
process.env.GAME_SHELL_VISUAL_CANDIDATES = "1";
export default defineConfig({
  ...base,
  testMatch: "game-shell.audit.spec.js",
  snapshotPathTemplate: "{testDir}/visual-candidates/{projectName}/{arg}{ext}",
});
