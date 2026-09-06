import assert from "node:assert/strict";
import {
  getMemoryPreviewDropValue,
  getMemorySupportDrop,
  resolveMemoryMilestoneRewards,
  shouldDropMemoryEnergy,
} from "../js/config.js";
import { gameState, hydrateGameState } from "../js/gameState.js";
import { getComboWindowMs } from "../js/gameplayTuning.js";
import { changeMemoryItemCount, getMemoryItemCount, getMemoryItemId, getMemoryItemTotal } from "../js/memoryItems.js";

assert.equal(shouldDropMemoryEnergy(0, () => 0.99), true, "100% test chance must always drop");
assert.equal(shouldDropMemoryEnergy(9, () => 1), true, "pity threshold must guarantee energy");
assert.equal(getMemoryPreviewDropValue(() => 0), 4);
assert.equal(getMemoryPreviewDropValue(() => 0.5), 8);
assert.equal(getMemoryPreviewDropValue(() => 0.999), 12);
assert.deepEqual(resolveMemoryMilestoneRewards(7, () => 0), [
  { type: "hint", value: 1 },
  { type: "coins", value: 5 },
]);
assert.equal(getMemorySupportDrop(() => 0)?.type, "preview-auto");
assert.equal(getComboWindowMs(8), 15000);
assert.equal(getComboWindowMs(15), 20000);
assert.equal(getComboWindowMs(16), 30000);

hydrateGameState({ progress: { memoryMatch: { items: { preview4: 2, time30: 3, previewAll: -4 } } } });
assert.equal(getMemoryItemCount("preview4"), 2);
assert.equal(getMemoryItemTotal("preview"), 2);
assert.equal(getMemoryItemTotal("time"), 3);
assert.equal(getMemoryItemId("preview", "all"), "previewAll");
assert.equal(changeMemoryItemCount("preview4", -1), true);
assert.equal(gameState.progress.memoryMatch.items.preview4, 1);

console.log("Memory special rewards and inventory checks passed.");
