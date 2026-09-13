import assert from "node:assert/strict";
import { calculateTripleMatchScore, TRIPLE_EASY_CONFIG, TRIPLE_RULES } from "../js/tripleConnect/tripleConfig.js";
import { TRIPLE_PRODUCT_DECISIONS } from "../js/tripleConnect/tripleConfig.js";
import { reduceTripleCommand } from "../js/tripleConnect/tripleRules.js";
import { createTripleRoundState, getExposedTileIds, restoreSerializedTripleRoundState, serializeTripleRoundState } from "../js/tripleConnect/tripleState.js";
import { gameState, hydrateGameState } from "../js/gameState.js";
import { getTripleHintTileIds } from "../js/tripleConnect/tripleHint.js";
import { consumeTripleItem, getTripleItemCount } from "../js/tripleConnect/tripleItems.js";

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

assert.deepEqual(TRIPLE_EASY_CONFIG, { mode: "easy", tileCount: 12, layerCount: 2, timeSeconds: 60 });
assert.equal(TRIPLE_RULES.trayCapacity, 7);
assert.equal(calculateTripleMatchScore(1), 10);
assert.equal(calculateTripleMatchScore(2), 13);
assert.deepEqual(TRIPLE_PRODUCT_DECISIONS.initialItems, { hint: 3 });
assert.deepEqual(TRIPLE_PRODUCT_DECISIONS.itemPrices, { hint: 8, timePerSecond: 2, undo: 15, shuffle: 15 });
assert.equal(TRIPLE_PRODUCT_DECISIONS.excludedItems.includes("tray-expand"), true);

const covered = makeState(
  { a: 3, b: 3, c: 3, d: 3 },
  { "a-1": ["b-1"] },
);
assert.deepEqual(getExposedTileIds(covered).includes("a-1"), false);
const blocked = reduceTripleCommand(covered, { type: "select-tile", tileId: "a-1" });
assert.equal(blocked.result.reason, "tile-covered");
assert.equal(blocked.nextState, covered);
assert.equal(reduceTripleCommand(covered, { type: "select-tile", tileId: "missing" }).result.reason, "unknown-tile");

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
assert.deepEqual({ combo: combo.combo, matchedTriples: combo.matchedTriples, score: combo.score, misses: combo.misses }, {
  combo: 2,
  matchedTriples: 2,
  score: 23,
  misses: 0,
});

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

let win = makeState({ a: 3 });
for (const tileId of ["a-1", "a-2", "a-3"]) win = select(win, tileId).nextState;
assert.equal(win.status, "won");
assert.equal(win.tray.length, 0);
assert.deepEqual(getTripleHintTileIds(grouped), ["a-3", "b-2"]);

const persisted = serializeTripleRoundState(matched.nextState);
assert.equal(Object.hasOwn(persisted, "undoHistory"), false);
assert.deepEqual(restoreSerializedTripleRoundState(persisted), restoreSerializedTripleRoundState(persisted));
assert.throws(() => restoreSerializedTripleRoundState({ ...persisted, tiles: persisted.tiles.slice(1) }));
hydrateGameState({ progress: { tripleConnect: { sessionsByMode: { easy: { mode: "easy", level: 1, snapshot: { ...persisted, tray: ["missing"] } } } } } });
assert.deepEqual(gameState.progress.tripleConnect.sessionsByMode, {}, "Invalid Triple saves must not reach runtime state.");
assert.equal(getTripleItemCount("hint"), 3, "Triple defaults must grant the approved initial Hint inventory.");
assert.equal(consumeTripleItem("unknown"), false);
assert.equal(consumeTripleItem("hint"), false, "A failed persistence transaction must not consume a Hint.");
assert.equal(getTripleItemCount("hint"), 3);

console.log("Triple Connect pure rules and state contracts passed.");
