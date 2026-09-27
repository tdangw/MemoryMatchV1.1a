import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import {
  createTripleCoverGraph,
  generateEasyTripleBoard,
  generateChallengeTripleBoard,
  generateNormalTripleBoard,
  generateHardTripleBoard,
  generateSuperHardTripleBoard,
  generateEndlessTripleBoard,
  getEasyTripleLayout,
  getTripleLayout,
  replayTripleWitness,
  validateTripleLayout,
} from "../js/tripleConnect/tripleBoard.js";
import {
  TRIPLE_EASY_CONFIG,
  TRIPLE_EASY_FALLBACK_SEED,
} from "../js/tripleConnect/tripleConfig.js";
import {
  TRIPLE_CHALLENGE_STAGES,
  TRIPLE_ENDLESS_CONFIG,
  getTripleChallengeStage,
} from "../js/tripleConnect/tripleConfig.js";
import { reduceTripleCommand } from "../js/tripleConnect/tripleRules.js";
import { createTripleRoundState } from "../js/tripleConnect/tripleState.js";
import {
  claimTripleLuckyRewards,
  restoreSerializedTripleRoundState,
  serializeTripleRoundState,
} from "../js/tripleConnect/tripleState.js";
import {
  createTripleSolverKey,
  solveTripleBoard,
} from "../js/tripleConnect/tripleSolver.js";
import { shuffleTripleBoardState } from "../js/tripleConnect/tripleShuffle.js";

const layout = getEasyTripleLayout();
assert.equal(layout.id, "easy-27-v5");
assert.equal(layout.slots.length, TRIPLE_EASY_CONFIG.tileCount);
assert.deepEqual(
  layout.slots.reduce((counts, slot) => {
    counts[slot.layer] = (counts[slot.layer] || 0) + 1;
    return counts;
  }, {}),
  { 0: 12, 1: 9, 2: 6 },
);
for (const [layoutId, expectedCounts] of Object.entries({
  "easy-27-v5": [12, 9, 6],
  "normal-45-v5": [18, 12, 9, 6],
  "hard-63-v5": [24, 15, 12, 6, 6],
  "super-hard-96-v5": [30, 21, 18, 12, 9, 6],
  "easy-18-v4": [12, 6],
  "normal-36-v4": [18, 12, 6],
  "hard-54-v4": [24, 15, 9, 6],
  "super-hard-75-v4": [30, 18, 15, 9, 3],
})) {
  const template = getTripleLayout(layoutId);
  assert.equal(template.coordinateUnit, "half-card");
  assert.deepEqual(template.layerCounts, expectedCounts);
  assert.doesNotThrow(() => validateTripleLayout(template));
}
for (const layoutId of [
  "easy-12-v1",
  "normal-24-v1",
  "hard-36-v1",
  "super-hard-60-v1",
  "easy-12-v2",
  "normal-24-v2",
  "hard-36-v2",
  "super-hard-60-v2",
  "easy-12-v3",
  "normal-24-v3",
  "hard-36-v3",
  "super-hard-60-v3",
]) {
  const legacyLayout = getTripleLayout(layoutId);
  assert.equal(legacyLayout.id, layoutId);
  assert.doesNotThrow(() => validateTripleLayout(legacyLayout));
}

const coverGraph = createTripleCoverGraph(layout);
assert.equal(Object.keys(coverGraph).length, 27);
assert.ok(
  Object.values(coverGraph).flat().length > 0,
  "Easy template must include useful blockers.",
);
for (const [slotId, blockerIds] of Object.entries(coverGraph)) {
  const slot = layout.slots.find((candidate) => candidate.id === slotId);
  for (const blockerId of blockerIds) {
    const blocker = layout.slots.find(
      (candidate) => candidate.id === blockerId,
    );
    assert.ok(
      blocker.layer > slot.layer,
      "Only higher slots may cover a lower slot.",
    );
  }
}

const first = generateEasyTripleBoard({ seed: "contract-seed" });
const repeated = generateEasyTripleBoard({ seed: "contract-seed" });
assert.deepEqual(
  first,
  repeated,
  "A seed must generate the identical board and witness.",
);
assert.equal(first.layoutId, layout.id);
assert.equal(first.board.tiles.length, 27);
assert.equal(new Set(first.board.tiles.map((tile) => tile.id)).size, 27);
assert.equal(new Set(first.board.tiles.map((tile) => tile.slotId)).size, 27);
assert.deepEqual(replayTripleWitness(first.board, first.witness).ok, true);
const solved = solveTripleBoard({ board: first.board });
assert.equal(solved.status, "solved");
assert.deepEqual(replayTripleWitness(first.board, solved.witness).ok, true);

const fallback = generateEasyTripleBoard({ seed: "ignored", maxAttempts: 0 });
assert.equal(fallback.source, "fallback");
assert.equal(fallback.seed, TRIPLE_EASY_FALLBACK_SEED);
assert.equal(replayTripleWitness(fallback.board, fallback.witness).ok, true);
assert.throws(
  () => generateEasyTripleBoard({ maxAttempts: -1 }),
  /maxAttempts/,
);

const invalid = solveTripleBoard({ board: { tiles: [] } });
assert.equal(invalid.status, "invalid");
const timeout = solveTripleBoard({ board: first.board, maxNodes: 1 });
assert.equal(timeout.status, "timeout");
let clock = 0;
const deadlineTimeout = solveTripleBoard({
  board: first.board,
  now: () => (clock += 100),
});
assert.equal(deadlineTimeout.status, "timeout");

const initialState = createTripleRoundState(first.board);
const afterOneMove = reduceTripleCommand(
  initialState,
  first.witness[0],
).nextState;
assert.equal(
  createTripleSolverKey(afterOneMove),
  createTripleSolverKey({
    ...afterOneMove,
    score: 999,
    combo: 999,
    misses: 999,
  }),
);
const mappedAssets = Object.fromEntries(
  [...new Set(first.board.tiles.map((tile) => tile.type))].map((type, index) => [type, `nested/${index}.webp`]),
);
const mappedState = createTripleRoundState({ ...first.board, assetPathsByType: mappedAssets });
assert.deepEqual(
  restoreSerializedTripleRoundState(serializeTripleRoundState(mappedState)).assetPathsByType,
  mappedAssets,
  "New Triple sessions must retain the type-to-asset mapping for Continue.",
);
assert.deepEqual(
  restoreSerializedTripleRoundState(serializeTripleRoundState(initialState)).assetPathsByType,
  {},
  "Legacy Triple sessions without an asset mapping remain restorable.",
);
const shuffledMappedState = shuffleTripleBoardState(mappedState, layout, "asset-map-shuffle");
assert.deepEqual(
  shuffledMappedState?.state.assetPathsByType,
  mappedAssets,
  "Triple shuffle must preserve the type-to-asset mapping.",
);

const timings = [];
for (let index = 0; index < 1000; index += 1) {
  const startedAt = performance.now();
  const generated = generateEasyTripleBoard({ seed: `property-${index}` });
  timings.push(performance.now() - startedAt);
  assert.equal(generated.source, "generated");
  assert.equal(
    replayTripleWitness(generated.board, generated.witness).ok,
    true,
  );
}
timings.sort((left, right) => left - right);
const p95 = timings[Math.ceil(timings.length * 0.95) - 1];
assert.ok(
  p95 <= 20,
  `Easy generator + solver p95 ${p95.toFixed(2)} ms exceeded 20 ms.`,
);

const coreSources = await Promise.all([
  readFile(
    new URL("../js/tripleConnect/tripleBoard.js", import.meta.url),
    "utf8",
  ),
  readFile(
    new URL("../js/tripleConnect/tripleSolver.js", import.meta.url),
    "utf8",
  ),
]);
assert.equal(
  coreSources.some((source) => source.includes("Math.random")),
  false,
  "Triple core randomness must be seeded.",
);

const normalTimings = [];
for (let index = 0; index < 20; index += 1) {
  const startedAt = performance.now();
  const normal = generateNormalTripleBoard({ seed: `normal-${index}` });
  normalTimings.push(performance.now() - startedAt);
  assert.equal(normal.board.tiles.length, 54);
  assert.deepEqual(Object.values(normal.board.cornerStacks).map((pile) => pile.tileIds.length), [9]);
  assert.ok(Object.values(normal.board.cornerStacks).every((pile) => new Set(pile.tileIds.map((id) => normal.board.tiles.find((tile) => tile.id === id).type)).size === pile.tileIds.length), "A corner stack must reveal a varied sequence of card types.");
  assert.equal(replayTripleWitness(normal.board, normal.witness).ok, true);
}
normalTimings.sort((left, right) => left - right);
const normalP95 = normalTimings[Math.ceil(normalTimings.length * 0.95) - 1];
assert.ok(
  normalP95 <= 100,
  `Normal generator + solver p95 ${normalP95.toFixed(2)} ms exceeded 100 ms.`,
);

const hardTimings = [];
for (let index = 0; index < 10; index += 1) {
  const startedAt = performance.now();
  const hard = generateHardTripleBoard({ seed: `hard-${index}` });
  hardTimings.push(performance.now() - startedAt);
  assert.equal(hard.board.tiles.length, 78);
  assert.deepEqual(Object.values(hard.board.cornerStacks).map((pile) => pile.tileIds.length).sort(), [7, 8]);
  assert.ok(Object.values(hard.board.cornerStacks).every((pile) => new Set(pile.tileIds.map((id) => hard.board.tiles.find((tile) => tile.id === id).type)).size === pile.tileIds.length), "Hard corner stacks must not repeat a type.");
  assert.equal(replayTripleWitness(hard.board, hard.witness).ok, true);
}
hardTimings.sort((left, right) => left - right);
const hardP95 = hardTimings[Math.ceil(hardTimings.length * 0.95) - 1];
assert.ok(
  hardP95 <= 200,
  `Hard generator + solver p95 ${hardP95.toFixed(2)} ms exceeded 200 ms.`,
);

const superHardTimings = [];
for (let index = 0; index < 5; index += 1) {
  const startedAt = performance.now();
  const superHard = generateSuperHardTripleBoard({
    seed: `super-hard-${index}`,
  });
  superHardTimings.push(performance.now() - startedAt);
  assert.equal(superHard.board.tiles.length, 120);
  assert.deepEqual(Object.values(superHard.board.cornerStacks).map((pile) => pile.tileIds.length).sort(), [6, 6, 6, 6]);
  assert.equal(
    replayTripleWitness(superHard.board, superHard.witness).ok,
    true,
  );
}
superHardTimings.sort((left, right) => left - right);
const superHardP95 =
  superHardTimings[Math.ceil(superHardTimings.length * 0.95) - 1];
assert.ok(
  superHardP95 <= 700,
  `SuperHard generator + solver p95 ${superHardP95.toFixed(2)} ms exceeded 700 ms.`,
);

const endless = generateEndlessTripleBoard({ seed: "endless" });
assert.equal(TRIPLE_ENDLESS_CONFIG.timeSeconds, 0);
assert.equal(endless.board.tiles.length, 120);
assert.equal(replayTripleWitness(endless.board, endless.witness).ok, true);

for (const stage of TRIPLE_CHALLENGE_STAGES) {
  const generated = generateChallengeTripleBoard({
    level: stage.level,
    seed: `challenge-${stage.level}`,
  });
  const repeatedChallenge = generateChallengeTripleBoard({
    level: stage.level,
    seed: `challenge-${stage.level}`,
  });
  const challengeLayout = getTripleLayout(stage.layoutId);
  assert.equal(getTripleChallengeStage(stage.level), stage);
  assert.equal(generated.layoutId, stage.layoutId);
  assert.equal(generated.board.tiles.length, stage.tileCount);
  assert.equal(challengeLayout.layerCounts.length, stage.layerCount);
  assert.deepEqual(generated, repeatedChallenge, "Challenge seed must be deterministic.");
  assert.equal(replayTripleWitness(generated.board, generated.witness).ok, true);
}
assert.throws(() => generateChallengeTripleBoard({ level: 8 }), /Challenge level/);
for (const luckyCount of [1, 2, 3]) {
  const luckyBoard = generateChallengeTripleBoard({ level: 7, seed: `lucky-${luckyCount}`, luckyCount });
  const luckyTiles = luckyBoard.board.tiles.filter((tile) => tile.lucky);
  assert.equal(luckyTiles.length, luckyCount);
  assert.equal(new Set(luckyTiles.map((tile) => tile.type)).size, luckyCount);
  assert.equal(replayTripleWitness(luckyBoard.board, luckyBoard.witness).ok, true);
  const claimed = claimTripleLuckyRewards(createTripleRoundState(luckyBoard.board), luckyTiles.map((tile) => tile.lucky.id));
  assert.deepEqual(restoreSerializedTripleRoundState(serializeTripleRoundState(claimed)).claimedLuckyIds, luckyTiles.map((tile) => tile.lucky.id));
}

console.log(
  `Triple Connect Easy board and solver contracts passed (p95 ${p95.toFixed(2)} ms).`,
);
