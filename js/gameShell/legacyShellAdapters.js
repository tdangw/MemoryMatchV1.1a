import { createGameShell } from "./gameShell.js";

// Temporary Link ID bindings: remove in Phase 8.
const adapters = new Map();
export function getLinkShell() {
  return getShell("link", "#link-connect-container", "Link Connect", "", {
    title: "#link-game-logo", progress: ".link-game-progress-hud", hud: "#link-game-title",
    milestones: ".link-special-hud", frame: "#link-board-frame", board: "#link-board",
  });
}
function getShell(key, selector, title, display, selectors) {
  const cached = adapters.get(key);
  if (cached?.refs.root.isConnected) return cached;
  const root = document.querySelector(selector);
  if (!root) throw new Error(`Missing shell root: ${selector}`);
  const regions = Object.fromEntries(Object.entries(selectors).map(([name, selector]) => {
    const element = root.querySelector(selector);
    if (!element) throw new Error(`Missing shell region: ${name}`);
    return [name, element];
  }));
  const shell = createGameShell({ root, regions, title, display });
  adapters.set(key, shell);
  return shell;
}
