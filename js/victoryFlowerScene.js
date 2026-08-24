import { VICTORY_FLOWER_SOURCE_MARKUP } from "./victoryFlowerSourceTemplate.js";

/** Cảnh hoa gốc được bọc trong scope riêng, không đụng tới DOM/gameplay. */
export function createVictoryFlowerSceneMarkup() {
  return `<div class="victory-flower-overlay__source">${VICTORY_FLOWER_SOURCE_MARKUP}</div>`;
}
