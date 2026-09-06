import { gameState } from "./gameState.js";
import { GAMEPLAY_LIMITS } from "./gameplayTuning.js";

export const MEMORY_ITEMS = Object.freeze([
  Object.freeze({ id: "preview4", type: "preview", value: 4, title: "Xem trước 4 thẻ", icon: "eye", tier: "teal" }),
  Object.freeze({ id: "preview8", type: "preview", value: 8, title: "Xem trước 8 thẻ", icon: "eye", tier: "blue" }),
  Object.freeze({ id: "preview12", type: "preview", value: 12, title: "Xem trước 12 thẻ", icon: "eye", tier: "purple" }),
  Object.freeze({ id: "previewAll", type: "preview", value: "all", title: "Xem trước tất cả", icon: "eye", tier: "gold" }),
  Object.freeze({ id: "time10", type: "time", value: 10, title: "+10 giây", icon: "timer", tier: "teal" }),
  Object.freeze({ id: "time30", type: "time", value: 30, title: "+30 giây", icon: "timer", tier: "blue" }),
  Object.freeze({ id: "time45", type: "time", value: 45, title: "+45 giây", icon: "timer", tier: "purple" }),
  Object.freeze({ id: "time60", type: "time", value: 60, title: "+60 giây", icon: "timer", tier: "gold" }),
]);

export function getMemoryItem(id) {
  return MEMORY_ITEMS.find((item) => item.id === id) || null;
}

export function getMemoryItemId(type, value) {
  const suffix = value === "all" ? "All" : String(value);
  return `${type}${suffix}`;
}

export function getMemoryItemCount(id) {
  return gameState.progress.memoryMatch.items?.[id] || 0;
}

export function changeMemoryItemCount(id, amount) {
  if (!getMemoryItem(id)) return false;
  const current = getMemoryItemCount(id);
  const next = Math.min(GAMEPLAY_LIMITS.itemCount, Math.max(0, current + Math.floor(Number(amount) || 0)));
  if (next === current) return false;
  gameState.progress.memoryMatch.items[id] = next;
  return true;
}

export function getMemoryItemTotal(type) {
  return MEMORY_ITEMS
    .filter((item) => item.type === type)
    .reduce((total, item) => total + getMemoryItemCount(item.id), 0);
}
