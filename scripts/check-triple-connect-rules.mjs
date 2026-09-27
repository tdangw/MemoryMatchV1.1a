import assert from "node:assert/strict";
import { calculateTripleCoinReward, calculateTripleMatchScore, getTripleStarProgress, TRIPLE_EASY_CONFIG, TRIPLE_RULES } from "../js/tripleConnect/tripleConfig.js";
import { TRIPLE_PRODUCT_DECISIONS } from "../js/tripleConnect/tripleConfig.js";
import { reduceTripleCommand } from "../js/tripleConnect/tripleRules.js";
import { claimTripleMilestoneTiles, createTripleRoundState, getExposedTileIds, restoreSerializedTripleRoundState, serializeTripleRoundState } from "../js/tripleConnect/tripleState.js";
import { gameState, hydrateGameState } from "../js/gameState.js";
import { getTripleHintTileIds } from "../js/tripleConnect/tripleHint.js";
import { consumeTripleItem, getTripleItemCount } from "../js/tripleConnect/tripleItems.js";
import { normalizeTripleMilestones, resolveTripleMilestoneProgress } from "../js/tripleConnect/tripleMilestones.js";

function makeState(typeCounts, coverGraph = {}) {
  const tiles = [];
  for (const [type, count] of Object.entries(typeCounts)) {
    for (let index = 1; index <= count; index += 1) {
      tiles.push({ id: `${type}-${index}`, type, slotId: `${type}-slot-${index}`, layer: 0 });
    }
  }
  return createTripleRoundState({ roundId: 7, tiles, coverGraph });
}

function select(state, tileId) {
  const transition = reduceTripleCommand(state, { type: "select-tile", tileId });
  assert.equal(transition.result.ok, true, `Expected ${tileId} to be selectable.`);
  return transition;
}

assert.deepEqual(TRIPLE_EASY_CONFIG, { mode: "easy", tileCount: 27, layerCount: 3, timeSeconds: 93 });
assert.equal(TRIPLE_RULES.trayCapacity, 7);
assert.equal(calculateTripleMatchScore(1), 10);
assert.equal(calculateTripleMatchScore(2), 13);
assert.deepEqual(getTripleStarProgress({ mode: "easy", score: 11 }).stars, 0);
assert.deepEqual(getTripleStarProgress({ mode: "easy", score: 12 }).stars, 1);
assert.deepEqual(getTripleStarProgress({ mode: "easy", score: 18 }).stars, 2);
assert.deepEqual(getTripleStarProgress({ mode: "easy", score: 25 }).stars, 3);
assert.deepEqual(getTripleStarProgress({ mode: "endless", score: 9 }).stars, 0);
assert.deepEqual(getTripleStarProgress({ mode: "endless", score: 10 }).stars, 1);
assert.deepEqual(getTripleStarProgress({ mode: "endless", score: 15 }).stars, 2);
assert.deepEqual(getTripleStarProgress({ mode: "endless", score: 20 }).stars, 3);
assert.equal(calculateTripleCoinReward({ mode: "easy", matchedTriples: 6, stars: 3, maxCombo: 9 }), 16);
assert.equal(calculateTripleCoinReward({ mode: "challenge", matchedTriples: 3, stars: 2, maxCombo: 1 }), 10);
assert.equal(calculateTripleCoinReward({ mode: "endless", matchedTriples: 25, stars: 1, maxCombo: 5 }), 25);
assert.deepEqual(TRIPLE_PRODUCT_DECISIONS.initialItems, { hint: 3 });
assert.deepEqual(TRIPLE_PRODUCT_DECISIONS.itemPrices, { hint: 8, timePerSecond: 2, undo: 15, shuffle: 15 });
assert.equal(TRIPLE_PRODUCT_DECISIONS.trayExpansion.releasePrice, 3000);
assert.deepEqual(TRIPLE_PRODUCT_DECISIONS.trayExpansion, { baseCapacity: 7, bonusCapacity: 3, experimentalPrice: 1, releasePrice: 3000 });
assert.deepEqual(TRIPLE_PRODUCT_DECISIONS.milestones.rewards, [
  { coins: 2 }, { hint: 1 }, { coins: 3, hint: 1 }, { time: 2, endlessCoins: 2 }, { undo: 1 },
  { coins: 5, hint: 1 }, { shuffle: 1 }, { time: 3, hint: 1, endlessCoins: 3 }, { coins: 8 }, { coins: 25, hint: 1, undo: 1 },
]);
let milestone = { version: 2, progress: 0, cycleId: 0, claimedIds: [] };
for (let index = 0; index < 3; index += 1) milestone = resolveTripleMilestoneProgress({ milestones: milestone, tileIds: [`m-${index}`], mode: "easy" }).next;
assert.equal(milestone.progress, 3);
assert.deepEqual(milestone.claimedIds, ["0:1"]);
assert.deepEqual(resolveTripleMilestoneProgress({ milestones: { version: 2, progress: 11, cycleId: 0, claimedIds: [] }, tileIds: ["x"], mode: "endless" }).rewards[0].reward, { coins: 2 });
assert.deepEqual(TRIPLE_PRODUCT_DECISIONS.milestones.itemFallbackCoins, { hint: 4, undo: 8, shuffle: 8 });
let rollover = { version: 2, progress: 29, cycleId: 4, claimedIds: ["4:1", "4:2", "4:3", "4:4", "4:5", "4:6", "4:7", "4:8", "4:9"] };
rollover = resolveTripleMilestoneProgress({ milestones: rollover, tileIds: ["last"], mode: "easy" }).next;
assert.deepEqual(rollover, { version: 2, progress: 0, cycleId: 5, claimedIds: [] });
let twentyCycles = { version: 2, progress: 0, cycleId: 0, claimedIds: [] };
const allClaims = [];
for (let index = 0; index < 600; index += 1) {
  const resolved = resolveTripleMilestoneProgress({ milestones: twentyCycles, tileIds: [`cycle-${index}`], mode: "easy" });
  twentyCycles = resolved.next;
  allClaims.push(...resolved.rewards.map((reward) => reward.claimId));
}
assert.equal(twentyCycles.cycleId, 20);
assert.equal(twentyCycles.progress, 0);
assert.equal(new Set(allClaims).size, 200, "Every milestone must be granted once in each cycle.");
assert.deepEqual(normalizeTripleMilestones({ progress: 0, cycleId: 3, claimedIds: [] }), { version: 2, progress: 0, cycleId: 3, claimedIds: [] });
assert.deepEqual(normalizeTripleMilestones({ progress: 1, cycleId: 3 }), { version: 2, progress: 0, cycleId: 3, claimedIds: [] });
assert.deepEqual(normalizeTripleMilestones({ progress: 29, cycleId: 3 }), { version: 2, progress: 19, cycleId: 3, claimedIds: ["3:1", "3:2", "3:3", "3:4", "3:5", "3:6"] });
assert.deepEqual(normalizeTripleMilestones({ progress: 30, cycleId: 3 }), { version: 2, progress: 20, cycleId: 3, claimedIds: ["3:1", "3:2", "3:3", "3:4", "3:5", "3:6"] });
assert.deepEqual(normalizeTripleMilestones({ progress: 44, cycleId: 3 }), { version: 2, progress: 29, cycleId: 3, claimedIds: ["3:1", "3:2", "3:3", "3:4", "3:5", "3:6", "3:7", "3:8", "3:9"] });
assert.deepEqual(normalizeTripleMilestones({ version: 2, progress: "bad", cycleId: -1, claimedIds: ["bad"] }), { version: 2, progress: 0, cycleId: 0, claimedIds: [] });

const covered = makeState(
  { a: 3, b: 3, c: 3, d: 3 },
  { "a-1": ["b-1"] },
);
assert.deepEqual(getExposedTileIds(covered).includes("a-1"), false);
const blocked = reduceTripleCommand(covered, { type: "select-tile", tileId: "a-1" });
assert.equal(blocked.result.reason, "tile-covered");
assert.equal(blocked.nextState, covered);
assert.equal(reduceTripleCommand(covered, { type: "select-tile", tileId: "missing" }).result.reason, "unknown-tile");

const piled = createTripleRoundState({
  roundId: 8,
  tiles: [
    { id: "pile-bottom", type: "a", slotId: "pile-slot", layer: 0 },
    { id: "pile-top", type: "a", slotId: "pile-slot", layer: 0 },
    { id: "a-3", type: "a", slotId: "a-slot", layer: 0 },
  ],
  coverGraph: { "pile-bottom": [], "pile-top": [], "a-3": [] },
  cornerStacks: { stack: { anchorSlotId: "pile-slot", tileIds: ["pile-bottom", "pile-top"] } },
});
assert.deepEqual(getExposedTileIds(piled).sort(), ["a-3", "pile-top"]);
assert.equal(reduceTripleCommand(piled, { type: "select-tile", tileId: "pile-bottom" }).result.reason, "tile-covered");
const pileRevealed = select(piled, "pile-top").nextState;
assert.equal(getExposedTileIds(pileRevealed).includes("pile-bottom"), true, "Selecting a pile top must reveal the next card.");
const pileUndone = reduceTripleCommand(pileRevealed, { type: "undo" }).nextState;
assert.equal(getExposedTileIds(pileUndone).includes("pile-top"), true, "Undo must restore the previous pile top.");
const pileSnapshot = serializeTripleRoundState(pileRevealed);
assert.equal(pileSnapshot.version, 3);
assert.deepEqual(restoreSerializedTripleRoundState(pileSnapshot).cornerStacks, pileRevealed.cornerStacks, "Corner-stack order must survive Continue serialization.");

let grouped = makeState({ a: 3, b: 3, c: 3, d: 3 });
const original = grouped;
grouped = select(grouped, "a-1").nextState;
grouped = select(grouped, "b-1").nextState;
grouped = select(grouped, "a-2").nextState;
assert.deepEqual(grouped.tray, ["a-1", "a-2", "b-1"]);
assert.deepEqual({ misses: grouped.misses, combo: grouped.combo, streakType: grouped.streakType, streakCount: grouped.streakCount }, {
  misses: 2,
  combo: 0,
  streakType: "a",
  streakCount: 1,
});
assert.deepEqual(original.tray, []);
assert.equal(Object.isFrozen(grouped), true);

const matched = select(grouped, "a-3");
assert.deepEqual(matched.nextState.tray, ["b-1"]);
assert.equal(matched.nextState.tiles["a-1"].location, "removed");
assert.deepEqual(matched.nextState, matched.nextState, "State must be comparable without DOM identity.");
assert.deepEqual(
  { matchedTriples: matched.nextState.matchedTriples, combo: matched.nextState.combo, score: matched.nextState.score, streakType: matched.nextState.streakType },
  { matchedTriples: 1, combo: 1, score: 10, streakType: null },
);
assert.equal(matched.events.at(-1).type, "triple-resolved");

let combo = makeState({ a: 3, b: 3, c: 3, d: 3 });
for (const tileId of ["a-1", "a-2", "a-3", "b-1", "b-2", "b-3"]) combo = select(combo, tileId).nextState;
assert.deepEqual({ combo: combo.combo, maxCombo: combo.maxCombo, matchedTriples: combo.matchedTriples, score: combo.score, misses: combo.misses }, {
  combo: 2,
  maxCombo: 2,
  matchedTriples: 2,
  score: 23,
  misses: 0,
});
combo = select(combo, "c-1").nextState;
combo = select(combo, "d-1").nextState;
assert.deepEqual({ combo: combo.combo, maxCombo: combo.maxCombo }, { combo: 0, maxCombo: 2 });

const replayCommands = ["a-1", "b-1", "a-2", "c-1", "a-3"];
const replay = () => replayCommands.reduce(
  (state, tileId) => select(state, tileId).nextState,
  makeState({ a: 3, b: 3, c: 3, d: 3 }),
);
assert.deepEqual(replay(), replay(), "The same command replay must be deterministic.");

let resolveBeforeOverflow = makeState({ a: 3, b: 3, c: 3, d: 3 });
for (const tileId of ["a-1", "b-1", "c-1", "a-2", "b-2", "c-2", "a-3"]) {
  resolveBeforeOverflow = select(resolveBeforeOverflow, tileId).nextState;
}
assert.equal(resolveBeforeOverflow.status, "playing");
assert.deepEqual(resolveBeforeOverflow.tray, ["b-1", "b-2", "c-1", "c-2"]);

let loss = makeState({ a: 3, b: 3, c: 3, d: 3, e: 3, f: 3, g: 3 });
for (const tileId of ["a-1", "b-1", "c-1", "d-1", "e-1", "f-1", "g-1"]) loss = select(loss, tileId).nextState;
assert.equal(loss.status, "lost");
assert.equal(loss.tray.length, 7);
assert.equal(reduceTripleCommand(loss, { type: "select-tile", tileId: "a-2" }).result.reason, "round-not-playing");
assert.equal(reduceTripleCommand(loss, { type: "undo" }).result.reason, "round-not-playing");

let expanded = createTripleRoundState({
  roundId: 9,
  trayCapacity: 10,
  tiles: Array.from({ length: 33 }, (_, index) => ({
    id: `expanded-${index + 1}`,
    type: `type-${Math.floor(index / 3) + 1}`,
    slotId: `expanded-slot-${index + 1}`,
    layer: 0,
  })),
  coverGraph: {},
});
for (let index = 1; index <= 28; index += 3) expanded = select(expanded, `expanded-${index}`).nextState;
assert.equal(expanded.status, "lost", "An expanded tray loses only after its tenth unmatched tile.");
assert.equal(expanded.tray.length, 10);

const undo = reduceTripleCommand(matched.nextState, { type: "undo" });
assert.equal(undo.result.ok, true);
assert.deepEqual(undo.nextState.tray, ["a-1", "a-2", "b-1"]);
assert.deepEqual(
  { moves: undo.nextState.moves, misses: undo.nextState.misses, combo: undo.nextState.combo, score: undo.nextState.score, matchedTriples: undo.nextState.matchedTriples },
  { moves: 3, misses: 2, combo: 0, score: 0, matchedTriples: 0 },
);
assert.equal(undo.nextState.tiles["a-3"].location, "board");
assert.equal(undo.nextState.undoHistory.length, matched.nextState.undoHistory.length - 1);
assert.equal(reduceTripleCommand(makeState({ a: 3, b: 3, c: 3, d: 3 }), { type: "undo" }).result.reason, "undo-empty");
const milestoneMatched = claimTripleMilestoneTiles(matched.nextState, ["a-1", "a-2", "a-3"]);
const milestoneUndo = reduceTripleCommand(milestoneMatched, { type: "undo" });
assert.deepEqual(milestoneUndo.nextState.milestoneTileIds, ["a-1", "a-2", "a-3"], "Undo must retain the durable milestone attribution ledger.");

let win = makeState({ a: 3 });
for (const tileId of ["a-1", "a-2", "a-3"]) win = select(win, tileId).nextState;
assert.equal(win.status, "won");
assert.equal(win.tray.length, 0);
assert.equal(reduceTripleCommand(win, { type: "undo" }).result.reason, "round-not-playing");
assert.deepEqual(getTripleHintTileIds(grouped), ["a-3", "b-2"]);

const persisted = serializeTripleRoundState(matched.nextState);
assert.equal(Object.hasOwn(persisted, "undoHistory"), false);
assert.equal(Object.hasOwn(persisted, "trayCapacity"), false, "Capacity is profile-derived, not saved in a round snapshot.");
assert.deepEqual(restoreSerializedTripleRoundState(persisted), restoreSerializedTripleRoundState(persisted));
assert.equal(restoreSerializedTripleRoundState({ ...persisted, maxCombo: undefined }).maxCombo, matched.nextState.combo);
assert.doesNotThrow(() => restoreSerializedTripleRoundState({ ...persisted, version: 1, cornerStacks: undefined }), "Legacy v1 snapshots must still restore.");
assert.throws(() => restoreSerializedTripleRoundState({ ...persisted, tiles: persisted.tiles.slice(1) }));
assert.equal(restoreSerializedTripleRoundState(persisted, { trayCapacity: 10 }).trayCapacity, 10);
assert.equal(restoreSerializedTripleRoundState(persisted).trayCapacity, 7);
const expandedSession = serializeTripleRoundState(createTripleRoundState({
  roundId: 10,
  trayCapacity: 10,
  tiles: Array.from({ length: 33 }, (_, index) => ({
    id: `session-${index + 1}`,
    type: `session-type-${Math.floor(index / 3) + 1}`,
    slotId: `session-slot-${index + 1}`,
    layer: 0,
  })),
  coverGraph: {},
}));
// A valid persisted expanded session can contain up to ten unmatched types.
let expandedSessionState = restoreSerializedTripleRoundState(expandedSession, { trayCapacity: 10 });
for (let index = 1; index <= 22; index += 3) expandedSessionState = select(expandedSessionState, `session-${index}`).nextState;
const persistedExpandedSession = serializeTripleRoundState(expandedSessionState);
hydrateGameState({ progress: { tripleConnect: { trayExpansionOwned: true, sessionsByMode: { easy: { mode: "easy", level: 1, remainingTime: 20, snapshot: persistedExpandedSession } } } } });
assert.equal(gameState.progress.tripleConnect.sessionsByMode.easy.snapshot.tray.length, 8, "Owned expansion must preserve a session with more than seven tray tiles.");
hydrateGameState({ progress: { tripleConnect: { sessionsByMode: { easy: { mode: "easy", level: 1, snapshot: { ...persisted, tray: ["missing"] } } } } } });
assert.deepEqual(gameState.progress.tripleConnect.sessionsByMode, {}, "Invalid Triple saves must not reach runtime state.");
assert.equal(getTripleItemCount("hint"), 3, "Triple defaults must grant the approved initial Hint inventory.");
assert.equal(consumeTripleItem("unknown"), false);
assert.equal(consumeTripleItem("hint"), false, "A failed persistence transaction must not consume a Hint.");
assert.equal(getTripleItemCount("hint"), 3);
assert.equal(gameState.progress.tripleConnect.trayExpansionOwned, false, "Old profiles default to the base tray entitlement.");

console.log("Triple Connect pure rules and state contracts passed.");
