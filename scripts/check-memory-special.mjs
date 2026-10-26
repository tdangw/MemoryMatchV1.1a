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
import { GAME_SHELL_DEFAULTS } from "../js/gameShell/gameShellConfig.js";
import { changeMemoryItemCount, getMemoryItemCount, getMemoryItemId, getMemoryItemTotal } from "../js/memoryItems.js";

assert.equal(shouldDropMemoryEnergy(0, () => 0.99), true, "100% test chance must always drop");
assert.equal(shouldDropMemoryEnergy(9, () => 1), true, "pity threshold must guarantee energy");
assert.equal(getMemoryPreviewDropValue(() => 0), 4);
assert.equal(getMemoryPreviewDropValue(() => 0.5), 8);
assert.equal(getMemoryPreviewDropValue(() => 0.999), 12);
assert.deepEqual(resolveMemoryMilestoneRewards(7, () => 0), [
  { type: "hint", value: 1 },
  { type: "time-item", value: 30 },
]);
assert.equal(getMemorySupportDrop(() => 0)?.type, "preview-item");
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
const indexHtml = readFileSync(new URL("../js/memoryMatch/memoryShellDom.js", import.meta.url), "utf8");
const shellPresentationCss = readFileSync(new URL("../styles/game-shell/presentation.css", import.meta.url), "utf8");
const shellTokensCss = readFileSync(new URL("../styles/game-shell/tokens.css", import.meta.url), "utf8");
assert.doesNotMatch(
  hudCss,
  /\.game-quick-action\s*\{[^}]*position:\s*relative/s,
  "inventory badges must not override the absolute HUD tool positions",
);
assert.doesNotMatch(indexHtml, /memory-(?:time|preview)-item-count/, "quick tools must not show external inventory badges");
assert.doesNotMatch(indexHtml, /id="memory-time-(?:hud|progress)"/, "Memory timer must be integrated into the main HUD");
assert.match(
  gameplayUiCss,
  /\.game-hud\.has-timer-progress::after\s*\{[^}]*height:\s*var\(--shell-hud-timer-height\)/s,
  "games must share the compact 3px HUD timer bar",
);
const unifiedHudCss = readFileSync("styles/game-shell/hud-unified.css", "utf8");
assert.match(unifiedHudCss, /\[data-shell-region="milestones"\]\s*\{[^}]*margin:\s*var\(--unified-hud-milestone-margin\)/s, "All games must use the shared milestone spacing token");
assert.match(tooltipJs, /\[data-tooltip\]/, "HUD definitions must be reachable by tooltip");
assert.match(tooltipJs, /\[data-hud-info\]/, "HUD informational targets must support touch explanation");
assert.equal(GAME_SHELL_DEFAULTS.hud.timerHeight, 3, "timer bar remains 3px");
assert.match(shellPresentationCss, /\.game-shell-root\s*\{[^}]*gap:\s*var\(--shell-active-frame-gap\)/s, "Memory and Link must read the shared shell row gap");
assert.match(shellTokensCss, /--shell-active-frame-gap:\s*var\(--shell-layout-gap\)/, "Default shell row gap must come from the layout token");
assert.match(shellTokensCss, /--shell-active-frame-gap:\s*var\(--shell-frame-narrow-gap\)/, "Narrow shell row gap must come from the shared frame token");
assert.deepEqual(GAME_SHELL_DEFAULTS.board, { gap: 5, narrowGap: 4, padding: 8, narrowPadding: 6 });

console.log("Memory special rewards and inventory checks passed.");
