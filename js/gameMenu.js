import { bindGameHudMenus } from "./gameShell/gameHudMenus.js";

let activeMenus = null;
export function closeGameMenu() { activeMenus?.close(); }

export function bindMemoryMenus(scope, root) {
  const menus = bindGameHudMenus(scope, [
    { trigger: root.querySelector("#btn-actions-menu"), panel: root.querySelector("#game-actions-menu") },
    { trigger: root.querySelector("#memory-tools-toggle"), panel: root.querySelector("#memory-tools-menu") },
  ]);
  activeMenus = menus;
  scope.own(() => { if (activeMenus === menus) activeMenus = null; });
}
