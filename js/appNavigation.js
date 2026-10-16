import { setMeteorSceneEligible } from "./backgroundEffects.js";
import { createIcon } from "./icons.js";
import { gameState } from "./gameState.js";
import { getGameDefinition, GAME_DEFINITIONS, getGameModeLabel } from "./gameCatalog.js";
import { openAppModal, showAppToast } from "./modal.js";
import { mountAppPage } from "./appPageLifecycle.js";
import { createGameShellLifecycle } from './gameShell/gameShellLifecycle.js';

import { mountTouchDust } from "./touchDust.js";

const actions = Object.freeze([
  { id: "shop", icon: "shop", label: "Cửa hàng" },
  { id: "collection", icon: "collection", label: "Bộ sưu tập" },
  { id: "ranking", icon: "trophy", label: "Xếp hạng" },
  { id: "settings", icon: "settings", label: "Cài đặt" },
]);
let handlers = {};
let cloudState = "connecting";
export function configureAppNavigation(next) { handlers = next; }

export function createAppDock(scope, { gameId = null, selected = null, onAction } = {}) {
  const dock = document.createElement("nav");
  dock.className = "adventure-dock";
  dock.setAttribute("aria-label", "Chức năng");
  const center = gameId ? { id: 'map', icon: 'map', label: 'Bản đồ' } : { id: 'profile', icon: 'account', label: 'Profile' };
  const leading = gameId ? actions.slice(0, 2) : [{ id: 'missions', icon: 'missions', label: 'Nhiệm vụ' }, { id: 'events', icon: 'events', label: 'Sự kiện' }];
  const entries = [...leading, center, ...actions.slice(2)];
  for (const action of entries) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.dockAction = action.id;
    if (action.id === 'profile') button.dataset.cloudState = cloudState;
    if (selected === action.id) button.setAttribute('aria-current', 'page');
    button.append(createIcon(action.icon), document.createTextNode(action.label));
    scope.listen(button, "click", async () => {
      if (button.disabled) return;
      button.disabled = true;
      try { await onAction(action.id); }
      catch (error) {
        console.error("Navigation action failed", error);
        if (scope.active) showAppToast("Chưa mở được chức năng. Hãy thử lại.");
      } finally { if (scope.active) button.disabled = false; }
    });
    dock.append(button);
  }
  return dock;
}

export function decorateAdventureMenu(root, { gameId = null, onHome } = {}) {
  const scope = mountAppPage(root);
  setMeteorSceneEligible(true);
  mountTouchDust(root, scope);
  root.classList.add("adventure-page");
  const header = document.createElement("header");
  header.className = "adventure-header";
  root.prepend(header);
  let screen = null;
  scope.own(() => screen?.dispose());
  const goHome = () => (onHome || handlers.home)();
  function createExit(owner) {
    const exit = document.createElement('button'); exit.type = 'button'; exit.className = 'adventure-exit';
    exit.setAttribute('aria-label', 'Thoát về trang chủ'); exit.append(createIcon('exit'));
    owner.listen(exit, 'click', goHome);
    return exit;
  }
  if (gameId) header.append(createExit(scope));
  const navigate = async action => {
    screen?.dispose();
    screen = null;
    setMeteorSceneEligible(action === 'map');
    if (action === 'map') { root.querySelector('[data-dock-action="map"]').focus(); return; }
    const viewScope = createGameShellLifecycle();
    screen = viewScope;
    const view = document.createElement('section');
    view.className = 'adventure-page adventure-screen';
    view.dataset.screen = action;
    const host = document.createElement('div'); host.className = 'adventure-screen-host';
    const footer = createFooter(viewScope, action);
    view.append(host, footer, createExit(viewScope));
    document.body.append(view);
    root.hidden = true;
    viewScope.own(() => { view.remove(); if (scope.active) root.hidden = false; }, 'node');
    const surface = { presentation: 'screen', host, owner: viewScope };
    if (action === 'profile') return handlers.account?.(surface);
    return handlers.action?.(action, { gameId, playing: false, root: view, scope: viewScope, surface });
  };
  function createFooter(owner, selected) {
    const footer = document.createElement('footer'); footer.className = 'adventure-footer';
    footer.append(createAppDock(owner, { gameId, selected, onAction: navigate }));
    if (!selected || selected === 'map') {
      const ad = document.createElement('div'); ad.className = 'adventure-ad-slot'; ad.dataset.adPlacement = 'menu'; ad.setAttribute('aria-hidden', 'true');
      footer.append(ad);
    }
    return footer;
  }
  root.append(createFooter(scope, gameId ? 'map' : null));
  // Functional destinations now have a single shared dock owner.
  for (const item of root.querySelectorAll(".menu-item")) {
    if (["Cửa hàng", "Bộ sưu tập", "Cài đặt", "Home"].includes(item.textContent.trim())) item.remove();
  }
  return scope;
}

export function mountGameplayTouchEffects(root, scope) {
  mountTouchDust(root, scope);
}

export function refreshAppWallet() {
  const wallet = document.querySelector(".adventure-wallet");
  if (wallet) wallet.replaceChildren(createIcon("coin"), document.createTextNode(gameState.coins.toLocaleString("vi-VN")));
}
export function refreshAppAccount(state) {
  cloudState = state.phase;
  for (const account of document.querySelectorAll('[data-dock-action="profile"]')) account.dataset.cloudState = cloudState;
}

export function openLocalRankings(gameId, onClose, surface = {}) {
  const content = document.createElement("div");
  const games = gameId ? [getGameDefinition(gameId)] : GAME_DEFINITIONS;
  for (const game of games) {
    const heading = document.createElement("h3");
    heading.textContent = game.title;
    content.append(heading);
    const records = Object.entries(gameState.progress[game.progressKey].bestByLevel || {})
      .filter(([, value]) => value.durationMs > 0).slice(-20);
    const list = document.createElement("ul");
    for (const [key, value] of records) {
      const [mode, level] = key.split(":");
      const item = document.createElement("li");
      item.textContent = `${getGameModeLabel(mode)} · Màn ${level} — ${(value.durationMs / 1000).toFixed(2)}s`;
      list.append(item);
    }
    if (!records.length) {
      const text = document.createElement("p");
      text.textContent = "Chơi một màn mới để ghi kỷ lục thời gian.";
      content.append(text);
    } else content.append(list);
  }
  return openAppModal({ ...surface, id: "rankings-modal", title: "Kỷ lục của bạn", icon: "trophy", content, onClose });
}
