import { gameState } from "../gameState.js";
import { saveProgress } from "../persistence.js";
import { GAMEPLAY_LIMITS } from "../gameplayTuning.js";
import { TRIPLE_PRODUCT_DECISIONS } from "./tripleConfig.js";

export const TRIPLE_ITEMS = Object.freeze([
  Object.freeze({ id: "hint", title: "Gợi ý", price: TRIPLE_PRODUCT_DECISIONS.itemPrices.hint }),
  Object.freeze({ id: "time", title: "+1 giây", price: TRIPLE_PRODUCT_DECISIONS.itemPrices.timePerSecond }),
  Object.freeze({ id: "undo", title: "Hoàn tác", price: TRIPLE_PRODUCT_DECISIONS.itemPrices.undo }),
  Object.freeze({ id: "shuffle", title: "Xáo trộn", price: TRIPLE_PRODUCT_DECISIONS.itemPrices.shuffle }),
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
