import { gameState, spendCoins } from "../gameState.js";
import { savePersistentGameData, saveProgress } from "../persistence.js";
import { GAMEPLAY_LIMITS } from "../gameplayTuning.js";
import { calculateConsumablePrice } from '../shopCatalog.js';
export const LINK_FREEZE_SECONDS = 30;

export const LINK_ITEMS = Object.freeze([
  Object.freeze({ id: "hint", title: "Gợi ý đường nối", icon: "search", price: 8 }),
  Object.freeze({ id: "reshuffle", title: "Xáo trộn", icon: "shuffle", price: 15 }),
  Object.freeze({ id: "thunder", title: "Sấm sét", icon: "wand", price: 25 }),
  Object.freeze({ id: "freeze", title: "Đóng băng thời gian", icon: "freeze", price: 40 }),
].map(item => Object.freeze({ ...item, price: calculateConsumablePrice(item.price) })));

export function getLinkItemCount(id) {
  return gameState.progress.linkConnect.items[id] || 0;
}

export async function grantLinkItem(id, amount = 1) {
  if (!getLinkItemDefinition(id)) return false;
  const currentCount = getLinkItemCount(id);
  const nextCount = Math.min(
    GAMEPLAY_LIMITS.itemCount,
    currentCount + Math.max(0, Math.floor(amount)),
  );
  if (nextCount <= currentCount) return false;
  gameState.progress.linkConnect.items[id] = nextCount;
  if (!(await saveProgress(gameState.progress))) {
    gameState.progress.linkConnect.items[id] = currentCount;
    return false;
  }
  return true;
}

export async function consumeLinkItem(id) {
  if (!getLinkItemDefinition(id) || getLinkItemCount(id) < 1) return false;
  const previousCount = getLinkItemCount(id);
  gameState.progress.linkConnect.items[id] -= 1;
  if (!(await saveProgress(gameState.progress))) {
    gameState.progress.linkConnect.items[id] = previousCount;
    return false;
  }
  return true;
}

export async function buyLinkItem(id) {
  const item = getLinkItemDefinition(id);
  if (!item || getLinkItemCount(id) >= GAMEPLAY_LIMITS.itemCount || !spendCoins(item.price)) return false;
  const previousCoins = gameState.coins + item.price;
  const previousCount = getLinkItemCount(id);
  gameState.progress.linkConnect.items[id] = previousCount + 1;
  if (!(await savePersistentGameData({ coins: gameState.coins, progress: gameState.progress }))) {
    gameState.coins = previousCoins;
    gameState.progress.linkConnect.items[id] = previousCount;
    return false;
  }
  return true;
}

export function getLinkItemDefinition(id) {
  return LINK_ITEMS.find((item) => item.id === id) || null;
}
