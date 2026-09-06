import { gameState, spendCoins } from "../gameState.js";
import { saveCoins, saveProgress } from "../persistence.js";
import { GAMEPLAY_LIMITS } from "../gameplayTuning.js";

export const LINK_ITEMS = Object.freeze([
  Object.freeze({ id: "hint", title: "Gợi ý đường nối", icon: "search", price: 8 }),
  Object.freeze({ id: "reshuffle", title: "Xáo trộn", icon: "restart", price: 15 }),
  Object.freeze({ id: "thunder", title: "Sấm sét", icon: "wand", price: 25 }),
  Object.freeze({ id: "freeze", title: "Đóng băng thời gian", icon: "timer", price: 20 }),
]);

export function getLinkItemCount(id) {
  return gameState.progress.linkConnect.items[id] || 0;
}

export function grantLinkItem(id, amount = 1) {
  if (!getLinkItemDefinition(id)) return false;
  const currentCount = getLinkItemCount(id);
  const nextCount = Math.min(
    GAMEPLAY_LIMITS.itemCount,
    currentCount + Math.max(0, Math.floor(amount)),
  );
  if (nextCount <= currentCount) return false;
  gameState.progress.linkConnect.items[id] = nextCount;
  saveProgress(gameState.progress);
  return true;
}

export function consumeLinkItem(id) {
  if (!getLinkItemDefinition(id) || getLinkItemCount(id) < 1) return false;
  gameState.progress.linkConnect.items[id] -= 1;
  saveProgress(gameState.progress);
  return true;
}

export function buyLinkItem(id) {
  const item = getLinkItemDefinition(id);
  if (!item || getLinkItemCount(id) >= GAMEPLAY_LIMITS.itemCount || !spendCoins(item.price)) return false;
  grantLinkItem(id);
  saveCoins(gameState.coins);
  return true;
}

export function getLinkItemDefinition(id) {
  return LINK_ITEMS.find((item) => item.id === id) || null;
}
