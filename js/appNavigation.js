import { createIcon } from "./icons.js";
import { gameState } from "./gameState.js";
import { getGameDefinition, GAME_DEFINITIONS, getGameModeLabel } from "./gameCatalog.js";
import { openAppModal, showAppToast } from "./modal.js";
import { mountAppPage } from "./appPageLifecycle.js";

import { mountTouchDust } from "./touchDust.js";

const actions = Object.freeze([
  { id: "shop", icon: "shop", label: "Cửa hàng" },
  { id: "collection", icon: "collection", label: "Bộ sưu tập" },
  { id: "ranking", icon: "trophy", label: "Xếp hạng" },
  { id: "settings", icon: "settings", label: "Cài đặt" },
]);
let handlers = {};
export function configureAppNavigation(next) { handlers = next; }

export function createAppDock(scope, { gameId = null, playing = false, root = null } = {}) {
  const dock = document.createElement("nav");
  dock.className = "adventure-dock";
  dock.setAttribute("aria-label", "Chức năng");
  for (const action of actions) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.dockAction = action.id;
    button.append(createIcon(action.icon), document.createTextNode(action.label));
    scope.listen(button, "click", async () => {
      if (button.disabled) return;
      button.disabled = true;
      try { await handlers.action?.(action.id, { gameId, playing, root, scope }); }
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
  mountTouchDust(root, scope);
  root.classList.add("adventure-page");
  const header = document.createElement("header");
  header.className = "adventure-header";
  const account = document.createElement("button");
  account.type = "button";
  account.className = "adventure-account";
  account.append(createIcon("account"), document.createTextNode("Khách"));
  scope.listen(account, "click", () => handlers.account?.());
  const coins = document.createElement("span");
  coins.className = "adventure-wallet";
  coins.append(createIcon("coin"), document.createTextNode(gameState.coins.toLocaleString("vi-VN")));
  header.append(account, coins);
  if (gameId && onHome) {
    const back = document.createElement("button");
    back.type = "button";
    back.className = "adventure-back";
    back.setAttribute("aria-label", "Về menu chính");
    back.append(createIcon("home"));
    scope.listen(back, "click", onHome);
    header.prepend(back);
  }
  root.prepend(header);
  const footer = document.createElement("footer");
  footer.className = "adventure-footer";
  footer.append(createAppDock(scope, { gameId }));
  const ad = document.createElement("div");
  ad.className = "adventure-ad-slot";
  ad.dataset.adPlacement = "menu";
  ad.setAttribute("aria-hidden", "true");
  footer.append(ad);
  root.append(footer);
  // Functional destinations now have a single shared dock owner.
  for (const item of root.querySelectorAll(".menu-item")) {
    if (["Cửa hàng", "Bộ sưu tập", "Cài đặt", "Home"].includes(item.textContent.trim())) item.remove();
  }
  return scope;
}

export function mountGameplayDock(root, scope) {
  const gameId = ({ "game-container": "memory-match", "link-connect-container": "link-connect", "triple-connect-container": "triple-connect" })[root.id];
  if (!gameId) return;
  const dock = createAppDock(scope, { gameId, playing: true, root });
  dock.classList.add("adventure-dock--playing");
  root.append(dock);
  scope.own(() => dock.remove(), "node");
  mountTouchDust(root, scope);
}

export function refreshAppWallet() {
  const wallet = document.querySelector(".adventure-wallet");
  if (wallet) wallet.replaceChildren(createIcon("coin"), document.createTextNode(gameState.coins.toLocaleString("vi-VN")));
}

export function openLocalRankings(gameId, onClose) {
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
  return openAppModal({ id: "rankings-modal", title: "Kỷ lục của bạn", icon: "trophy", content, onClose });
}
