import { gameState } from "../gameState.js";
import { saveProgress } from "../persistence.js";
import { GAMEPLAY_LIMITS } from "../gameplayTuning.js";
import { TRIPLE_PRODUCT_DECISIONS, TRIPLE_TIME_ITEM_SECONDS } from "./tripleConfig.js";

export const TRIPLE_ITEMS = Object.freeze([
  Object.freeze({ id: "hint", title: "Gợi ý", icon: "search", price: TRIPLE_PRODUCT_DECISIONS.itemPrices.hint }),
  Object.freeze({ id: "time", title: `+${TRIPLE_TIME_ITEM_SECONDS} giây`, icon: "timer", value: TRIPLE_TIME_ITEM_SECONDS, price: TRIPLE_PRODUCT_DECISIONS.itemPrices.timePerSecond * TRIPLE_TIME_ITEM_SECONDS }),
  Object.freeze({ id: "undo", title: "Hoàn tác", icon: "undo", price: TRIPLE_PRODUCT_DECISIONS.itemPrices.undo }),
  Object.freeze({ id: "shuffle", title: "Xáo trộn", icon: "shuffle", price: TRIPLE_PRODUCT_DECISIONS.itemPrices.shuffle }),
]);

export function getTripleItemCount(id) {
  return gameState.progress.tripleConnect.items[id] || 0;
}

export async function consumeTripleItem(id) {
  if (!getTripleItemDefinition(id) || getTripleItemCount(id) < 1) return false;
  const previousCount = getTripleItemCount(id);
  gameState.progress.tripleConnect.items[id] = previousCount - 1;
  if ((await saveProgress(gameState.progress))) return true;
  gameState.progress.tripleConnect.items[id] = previousCount;
  return false;
}

export async function grantTripleItem(id, amount = 1) {
  if (!getTripleItemDefinition(id)) return false;
  const previousCount = getTripleItemCount(id);
  const nextCount = Math.min(GAMEPLAY_LIMITS.itemCount, previousCount + Math.max(0, Math.floor(amount)));
  if (nextCount <= previousCount) return false;
  gameState.progress.tripleConnect.items[id] = nextCount;
  if ((await saveProgress(gameState.progress))) return true;
  gameState.progress.tripleConnect.items[id] = previousCount;
  return false;
}

export function getTripleItemDefinition(id) {
  return TRIPLE_ITEMS.find((item) => item.id === id) || null;
}
