import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";

// Reviewed separately from fullscreen work; images are candidates until approved.
process.env.GAME_SHELL_AUDIT_WITHOUT_FULLSCREEN = "1";
process.env.GAME_SHELL_VISUAL_CANDIDATES = "1";
export default defineConfig({
  ...base,
  testMatch: "game-shell.audit.spec.js",
  snapshotPathTemplate: "{testDir}/visual-candidates/{projectName}/{arg}{ext}",
});
