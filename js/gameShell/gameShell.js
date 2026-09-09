import { activateGameScope, createGameShellLifecycle } from "./gameShellLifecycle.js";
import { mountGameFullscreen } from "./gameFullscreen.js";

let activeShell = null;
const regionNames = ["title", "progress", "hud", "milestones", "frame", "board"];

/** Adopt existing regions or create empty semantic slots for a new adapter. */
export function createGameShell({ root = document.createElement("section"), regions = {}, title = "", display = "" } = {}) {
  const refs = { root };
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", title);
  for (const name of regionNames) {
    const element = regions[name] || document.createElement(name === "title" ? "header" : "div");
    if (!regions[name] && name === "title") element.textContent = title;
    element.dataset.shellRegion = name;
    if (!regions[name]) (name === "board" ? refs.frame : root).append(element);
    refs[name] = element;
  }
  refs.progress.setAttribute("role", "group");
  refs.hud.setAttribute("role", "group");
  refs.hud.setAttribute("aria-label", "Thông tin và công cụ màn chơi");
  refs.board.setAttribute("role", "group");
  refs.board.setAttribute("aria-label", `Bàn ${title}`);
  Object.freeze(refs);
  let scope = null;
  const shell = {
    refs,
    get scope() { return scope; },
    mount({ cleanup } = {}) {
      activeShell?.unmount();
      scope = createGameShellLifecycle();
      activateGameScope(scope);
      activeShell = shell;
      root.hidden = false;
      root.style.display = display;
      mountGameFullscreen(refs, scope);
      if (cleanup) scope.own(cleanup);
      return scope;
    },
    update({ paused = false } = {}) {
      if (!scope?.active) return;
      root.dataset.shellPaused = String(paused);
    },
    unmount() {
      if (!scope?.active) return;
      scope.dispose();
      root.hidden = true;
      root.style.display = "none";
      delete root.dataset.shellPaused;
      if (activeShell === shell) activeShell = null;
    },
  };
  return shell;
}

export function unmountActiveGameShell() { activeShell?.unmount(); }
