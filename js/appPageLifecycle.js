import { setMeteorSceneEligible } from "./backgroundEffects.js";
import { createGameShellLifecycle } from "./gameShell/gameShellLifecycle.js";

let current = null;
const listeners = new Set();
export function subscribeToAppPages(listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function getAppPageScope() { return current; }
export function disposeAppPage() {
  setMeteorSceneEligible(false);
  current?.dispose();
  current = null;
}
export function mountAppPage(root) {
  disposeAppPage();
  current = createGameShellLifecycle();
  current.own(() => root.remove(), "node");
  for (const listener of listeners) {
    try { listener(root); } catch (error) { console.error("Page listener failed", error); }
  }
  return current;
}
