import { setMeteorSceneEligible } from "./backgroundEffects.js";
import { createGameShellLifecycle } from "./gameShell/gameShellLifecycle.js";

let current = null;
const listeners = new Set();
export function subscribeToAppPages(listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function getAppPageScope() { return current?.scope || null; }
export function disposeAppPage() {
  setMeteorSceneEligible(false);
  const previous = current;
  current = null;
  if (previous) previous.scope.dispose(() => previous.root.remove());
}
export function mountAppPage(root) {
  disposeAppPage();
  const scope = createGameShellLifecycle();
  current = { scope, root };
  scope.own(() => {
    if (current?.scope === scope) current = null;
    root.remove();
  }, "node");
  for (const listener of listeners) {
    try { listener(root); } catch (error) { console.error("Page listener failed", error); }
  }
  return scope;
}
