import config from "./playwright.config.js";

// HUD repair has one approved geometry baseline; logic uses the same browser.
export default { ...config, projects: [{ name: "hud-mobile", use: { viewport: { width: 412, height: 915 } } }] };
