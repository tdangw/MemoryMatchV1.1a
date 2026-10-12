import { createGameShellLifecycle } from "./gameShell/gameShellLifecycle.js";

let current = null;
export function getAppPageScope() { return current; }
export function disposeAppPage() {
  current?.dispose();
  current = null;
}
export function mountAppPage(root) {
  disposeAppPage();
  current = createGameShellLifecycle();
  current.own(() => root.remove(), "node");
  return current;
}
