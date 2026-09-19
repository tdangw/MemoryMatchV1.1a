import assert from "node:assert/strict";
import {
  findAvailableConnections,
  findConnectionPath,
  hasAvailableConnection,
} from "../js/linkConnect/pathfinder.js";
import {
  calculateLinkMatchPoints,
  calculateLinkCompletionTimeBonus,
  calculateLinkThunderPairPoints,
  calculateLinkStarRating,
  getLinkComboWindowMs,
  getLinkChallengeLayout,
  getLinkModeLayout,
  getLinkPremiumSupplyItem,
  getLinkPremiumType,
  getLinkStarScoreTargets,
  getLinkTimerDirection,
  getLinkGravityShift,
  LINK_CONNECT_TIMING,
} from "../js/linkConnect/linkConfig.js";
import { calculateMatchCoinReward } from "../js/coinRewards.js";
import {
  getActiveLinkConnectionEffect,
  LINK_EXIT_EFFECTS,
  LINK_PATH_EFFECTS,
} from "../js/linkConnect/linkEffects.js";
import { normalizeAppearance } from "../js/appearance.js";
import { beginLinkRound, linkGameState } from "../js/linkConnect/linkState.js";

const tile = (id) => ({ id });

const straightGrid = [
  [null, null, null, null, null],
  [null, tile("a"), null, tile("a"), null],
  [null, null, null, null, null],
];
assert.deepEqual(findConnectionPath(straightGrid, { row: 1, column: 1 }, { row: 1, column: 3 }), [
  { row: 1, column: 1 },
  { row: 1, column: 3 },
]);

const cornerGrid = [
  [null, null, null, null, null],
  [null, tile("a"), null, null, null],
  [null, null, null, tile("a"), null],
  [null, null, null, null, null],
];
assert.equal(findConnectionPath(cornerGrid, { row: 1, column: 1 }, { row: 2, column: 3 }).length, 3);

const boundaryGrid = [
  [null, null, null, null, null],
  [null, tile("a"), tile("block"), tile("a"), null],
  [null, null, null, null, null],
];
assert.equal(findConnectionPath(boundaryGrid, { row: 1, column: 1 }, { row: 1, column: 3 }).length, 4);
assert.equal(hasAvailableConnection(boundaryGrid), true);
assert.equal(findAvailableConnections(boundaryGrid).length, 1);

const blockedGrid = [
  [tile("wall"), tile("wall"), tile("wall"), tile("wall"), tile("wall")],
  [tile("wall"), tile("a"), tile("block"), tile("a"), tile("wall")],
  [tile("wall"), tile("wall"), tile("wall"), tile("wall"), tile("wall")],
];
assert.equal(findConnectionPath(blockedGrid, { row: 1, column: 1 }, { row: 1, column: 3 }), null);

assert.equal(getLinkModeLayout("hard").tileCount, 36);
assert.equal(getLinkChallengeLayout(10).tileCount, 60);
assert.equal(getLinkTimerDirection("endless"), "up");
assert.equal(calculateLinkMatchPoints(3), 16);
assert.equal(calculateLinkMatchPoints(3, { special: true }), 24);
assert.equal(calculateLinkThunderPairPoints(4, { countsCombo: true }), 19);
assert.equal(calculateLinkThunderPairPoints(4), 10);
assert.equal(calculateMatchCoinReward(1), 2);
assert.equal(calculateMatchCoinReward(2), 3);
assert.equal(calculateMatchCoinReward(4), 5);
assert.equal(getLinkPremiumType(() => 0.49), "cyan");
assert.equal(getLinkPremiumType(() => 0.5), "blue");
assert.equal(getLinkPremiumType(() => 0.8), "red");
assert.equal(getLinkPremiumSupplyItem("endless", () => 0.99), "reshuffle");
assert.deepEqual(getLinkStarScoreTargets(6, "easy"), { one: 72, two: 108, three: 150 });
assert.equal(calculateLinkCompletionTimeBonus("easy", 45), 45);
assert.equal(calculateLinkCompletionTimeBonus("endless", 45), 0);
assert.equal(calculateLinkStarRating(150, 6, "easy"), 3);
assert.equal(calculateLinkStarRating(149, 6, "easy"), 2);
const perfectEasyMatchScore = Array.from({ length: 6 }, (_, index) => calculateLinkMatchPoints(index + 1))
  .reduce((total, points) => total + points, 0);
assert.equal(perfectEasyMatchScore, 105);
assert.equal(calculateLinkStarRating(perfectEasyMatchScore + 45, 6, "easy"), 3);
assert.equal(getLinkComboWindowMs(8), 15000);
assert.equal(getLinkComboWindowMs(12), 20000);
assert.equal(getLinkComboWindowMs(16), 30000);
assert.equal(LINK_CONNECT_TIMING.frozenPairUnlockMs, 1000);
assert.equal(getLinkGravityShift(1), "static");
assert.equal(getLinkGravityShift(3), "down");
assert.equal(getLinkGravityShift(6), "up");
assert.equal(getLinkGravityShift(9), "left");
assert.equal(getLinkGravityShift(10), "right");
assert.equal(getLinkGravityShift(13, () => 0.51), "center");
assert.equal(getActiveLinkConnectionEffect({ linkPathEffect: "electric", linkExitEffect: "dissolve" }).pathClass, "link-path-overlay--electric");
assert.equal(LINK_PATH_EFFECTS.length, 21);
assert.equal(LINK_EXIT_EFFECTS.length, 21);
assert.equal(LINK_PATH_EFFECTS[0].id, "default");
assert.equal(LINK_PATH_EFFECTS[0].price, 0);
assert.equal(LINK_EXIT_EFFECTS[0].id, "default");
assert.equal(LINK_EXIT_EFFECTS[0].price, 0);
assert.equal(normalizeAppearance().linkExitEffect, "default");
linkGameState.isCompleted = true;
beginLinkRound({ mode: "easy", level: 1 });
assert.equal(linkGameState.isCompleted, false, "Màn mới phải xóa cờ hoàn thành để không lặp thưởng.");
assert.deepEqual(
  normalizeAppearance({ ownedLinkExitEffects: ["portal"] }).ownedLinkExitEffects,
  ["default", "portal"],
);
assert.deepEqual(
  normalizeAppearance({
    linkPathEffect: "hydro",
    linkExitEffect: "ghost",
    ownedLinkPathEffects: ["hydro", "meteor"],
    ownedLinkExitEffects: ["ghost", "split8"],
  }),
  {
    cardBack: "classic",
    flipEffect: "bounce",
    linkPathEffect: "hydro",
    linkExitEffect: "ghost",
    themes: { memoryMatch: "default", linkConnect: "default", tripleConnect: "default" },
    ownedCardBacks: ["classic"],
    ownedFlipEffects: ["bounce"],
    ownedLinkPathEffects: ["default", "hydro", "meteor"],
    ownedLinkExitEffects: ["default", "ghost", "split8"],
    ownedThemes: ["default"],
    ownedTripleThemes: ["default"],
    triplePathEffect: "default",
    tripleExitEffect: "default",
    ownedTriplePathEffects: ["default"],
    ownedTripleExitEffects: ["default"],
  },
);

console.log("Link Connect core checks passed.");
