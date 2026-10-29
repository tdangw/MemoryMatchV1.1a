import { activateGameScope, createGameShellLifecycle, getActiveGameScope } from "./gameShellLifecycle.js";
import { mountGameFullscreen } from "./gameFullscreen.js";

import { disposeAppPage } from "../appPageLifecycle.js";
import { mountGameplayTouchEffects } from "../appNavigation.js";
import { mountGameplayBanner } from '../ads/menuAds.js';
import { mountPlayerHeaderPortrait } from '../progression/playerHeaderPortrait.js';
import { mountGameplayAmbient, setAmbientPaused } from '../background/bindings.js';

let activeShell = null;
const regionNames = ["title", "progress", "hud", "milestones", "frame", "board"];

/** Adopt existing regions or create empty semantic slots for a new adapter. */
export function createGameShell({ root = document.createElement("section"), regions = {}, title = "", display = "", backgroundScene = null } = {}) {
  const refs = { root };
  root.classList.add("game-shell-root", "game-shell-tokens");
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", title);
  for (const name of regionNames) {
    const element = regions[name] || document.createElement(name === "title" ? "header" : "div");
    if (!regions[name] && name === "title") element.textContent = title;
    element.dataset.shellRegion = name;
    if (!regions[name]) (name === "board" ? refs.frame : root).append(element);
    refs[name] = element;
  }
  // Public compatibility slot only. Gameplay metrics belong to refs.hud;
  // adapters supply an empty progress region and it never participates in layout.
  refs.progress.hidden = true;
  refs.progress.setAttribute("aria-hidden", "true");
  refs.hud.setAttribute("role", "group");
  refs.hud.setAttribute("aria-label", "Thông tin và công cụ màn chơi");
  refs.board.setAttribute("role", "group");
  refs.board.setAttribute("aria-label", `Bàn ${title}`);
  Object.freeze(refs);
  let scope = null;
  let pendingPresentation = null;
  const hideRoot = () => {
    root.hidden = true;
    root.style.display = "none";
    delete root.dataset.shellPaused;
  };
  const releaseMount = mountedScope => {
    if (scope !== mountedScope) return;
    pendingPresentation = null;
    hideRoot();
    if (activeShell === shell) activeShell = null;
  };
  const assertVisibleScope = action => {
    const visible = !root.hidden && root.style.display !== "none";
    if (!visible || scope?.active && getActiveGameScope() === scope) return;
    const message = `[GameShell] Invariant violation during ${action}: visible shell requires its active scope.`;
    if (import.meta.env?.DEV) throw new Error(message);
    console.error(message);
  };
  const shell = {
    refs,
    get scope() { return scope; },
    mount({ cleanup, deferPresentation = false } = {}) {
      disposeAppPage();
      activeShell?.unmount();
      const nextScope = createGameShellLifecycle();
      scope = nextScope;
      nextScope.own(() => releaseMount(nextScope), "cleanup");
      activateGameScope(nextScope);
      activeShell = shell;
      root.hidden = false;
      root.style.display = display;
      mountGameFullscreen(refs, nextScope);
      mountGameplayTouchEffects(root, nextScope);
      // Startup can budget this finite presentation work in its next task.
      // The active scope already owns controls and cancellation at this point.
      pendingPresentation = () => {
        pendingPresentation = null;
        mountPlayerHeaderPortrait(refs.title,nextScope);
        mountGameplayBanner(root, nextScope);
        if (backgroundScene) mountGameplayAmbient(nextScope, root, backgroundScene);
      };
      if (!deferPresentation) shell.preparePresentation(nextScope);
      if (cleanup) nextScope.own(cleanup);
      assertVisibleScope("mount");
      return nextScope;
    },
    preparePresentation(mountedScope) {
      if (scope !== mountedScope || !mountedScope.active || !pendingPresentation) return;
      pendingPresentation();
    },
    update({ paused = false } = {}) {
      assertVisibleScope("update");
      if (!scope?.active || getActiveGameScope() !== scope) return;
      root.dataset.shellPaused = String(paused);
      setAmbientPaused(scope, paused);
    },
    unmount() {
      if (scope?.active) {
        const parent = root.parentNode;
        const sibling = root.nextSibling;
        scope.dispose(() => root.remove());
        // The cached shell stays in its original DOM position, hidden. Child
        // teardown runs detached so it does not repeatedly invalidate the page.
        if (parent) parent.insertBefore(root, sibling?.parentNode === parent ? sibling : null);
      }
      else releaseMount(scope);
    },
  };
  return shell;
}

export function unmountActiveGameShell() { activeShell?.unmount(); }

/** Test-only snapshot: the active shell and lifecycle must always identify the same mount. */
export function getGameShellDiagnostics() {
  return {
    activeShell: activeShell ? { root: activeShell.refs.root, scope: activeShell.scope } : null,
    activeScope: getActiveGameScope(),
  };
}
