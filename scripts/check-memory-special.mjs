import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getMemoryPreviewDropValue,
  getMemorySupportDrop,
  getChallengeLayout,
  getModeLayout,
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
assert.equal(getModeLayout("easy").mobileColumns, 4, "easy mobile board must be 4x3");
assert.equal(getChallengeLayout(1).mobileColumns, 4, "early challenge mobile board must be 4x3");

hydrateGameState({ progress: { memoryMatch: { items: { preview4: 2, time30: 3, previewAll: -4 } } } });
assert.equal(getMemoryItemCount("preview4"), 2);
assert.equal(getMemoryItemTotal("preview"), 2);
assert.equal(getMemoryItemTotal("time"), 3);
assert.equal(getMemoryItemId("preview", "all"), "previewAll");
assert.equal(changeMemoryItemCount("preview4", -1), true);
assert.equal(gameState.progress.memoryMatch.items.preview4, 1);

const hudCss = readFileSync(new URL("../styles/hud.css", import.meta.url), "utf8");
const gameplayUiCss = readFileSync(new URL("../styles/gameplay-ui.css", import.meta.url), "utf8");
const tooltipJs = readFileSync(new URL("../js/tooltips.js", import.meta.url), "utf8");
const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.doesNotMatch(
  hudCss,
  /\.game-quick-action\s*\{[^}]*position:\s*relative/s,
  "inventory badges must not override the absolute HUD tool positions",
);
assert.doesNotMatch(indexHtml, /memory-(?:time|preview)-item-count/, "quick tools must not show external inventory badges");
assert.doesNotMatch(indexHtml, /id="memory-time-(?:hud|progress)"/, "Memory timer must be integrated into the main HUD");
assert.match(
  gameplayUiCss,
  /\.game-hud\.has-timer-progress::after\s*\{[^}]*height:\s*3px/s,
  "games must share the compact 3px HUD timer bar",
);
assert.match(hudCss, /\.memory-special-hud\s*\{[^}]*margin:\s*4px auto 0/s, "Memory milestones must clear the HUD timer");
assert.match(hudCss, /#grid-board-frame\s*\{[^}]*margin-top:\s*10px/s, "Memory board must keep the same post-milestone gap as Link");
assert.match(tooltipJs, /\.memory-special-hud__milestones span/, "Memory milestone rewards must be reachable by tooltip");

console.log("Memory special rewards and inventory checks passed.");
