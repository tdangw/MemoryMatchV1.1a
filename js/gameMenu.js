import { bindGameHudMenus } from "./gameShell/gameHudMenus.js";
import { openGameExitDialog } from './gameExitDialog.js';
import { gameState } from './gameState.js';

let activeMenus = null;
export function closeGameMenu() { activeMenus?.close(); }

export function bindMemoryMenus(scope, root, { onExit, onRestart, onSettings }) {
  const menus = bindGameHudMenus(scope, [
    { trigger: root.querySelector("#memory-tools-toggle"), panel: root.querySelector("#memory-tools-menu") },
  ]);
  activeMenus = menus;
  const trigger = root.querySelector('#btn-actions-menu');
  scope.listen(trigger, 'click', () => {
    menus.close();
    const paused = gameState.isPaused;
    gameState.isPaused = true;
    openGameExitDialog({ owner: scope, trigger, onExit, onRestart, onSettings, onClose: () => { if (scope.active) gameState.isPaused = paused; } });
  });
  scope.own(() => { if (activeMenus === menus) activeMenus = null; });
}
