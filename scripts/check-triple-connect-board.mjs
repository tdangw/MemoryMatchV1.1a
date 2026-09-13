import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import {
  createTripleCoverGraph,
  generateEasyTripleBoard,
  generateNormalTripleBoard,
  generateHardTripleBoard,
  getEasyTripleLayout,
  replayTripleWitness,
} from "../js/tripleConnect/tripleBoard.js";
import { TRIPLE_EASY_CONFIG, TRIPLE_EASY_FALLBACK_SEED } from "../js/tripleConnect/tripleConfig.js";
import { reduceTripleCommand } from "../js/tripleConnect/tripleRules.js";
import { createTripleRoundState } from "../js/tripleConnect/tripleState.js";
import { createTripleSolverKey, solveTripleBoard } from "../js/tripleConnect/tripleSolver.js";

const layout = getEasyTripleLayout();
assert.equal(layout.id, "easy-12-v1");
assert.equal(layout.slots.length, TRIPLE_EASY_CONFIG.tileCount);
assert.deepEqual(layout.slots.reduce((counts, slot) => {
  counts[slot.layer] = (counts[slot.layer] || 0) + 1;
  return counts;
}, {}), { 0: 8, 1: 4 });

const coverGraph = createTripleCoverGraph(layout);
assert.equal(Object.keys(coverGraph).length, 12);
assert.equal(Object.values(coverGraph).flat().length, 6);
for (const [slotId, blockerIds] of Object.entries(coverGraph)) {
  const slot = layout.slots.find(candidate => candidate.id === slotId);
  for (const blockerId of blockerIds) {
    const blocker = layout.slots.find(candidate => candidate.id === blockerId);
    assert.ok(blocker.layer > slot.layer, "Only higher slots may cover a lower slot.");
  }
}

const first = generateEasyTripleBoard({ seed: "contract-seed" });
const repeated = generateEasyTripleBoard({ seed: "contract-seed" });
assert.deepEqual(first, repeated, "A seed must generate the identical board and witness.");
assert.equal(first.layoutId, layout.id);
assert.equal(first.board.tiles.length, 12);
assert.equal(new Set(first.board.tiles.map(tile => tile.id)).size, 12);
assert.equal(new Set(first.board.tiles.map(tile => tile.slotId)).size, 12);
assert.deepEqual(replayTripleWitness(first.board, first.witness).ok, true);
const solved = solveTripleBoard({ board: first.board });
assert.equal(solved.status, "solved");
assert.deepEqual(replayTripleWitness(first.board, solved.witness).ok, true);

const fallback = generateEasyTripleBoard({ seed: "ignored", maxAttempts: 0 });
assert.equal(fallback.source, "fallback");
assert.equal(fallback.seed, TRIPLE_EASY_FALLBACK_SEED);
assert.equal(replayTripleWitness(fallback.board, fallback.witness).ok, true);
assert.throws(() => generateEasyTripleBoard({ maxAttempts: -1 }), /maxAttempts/);

const invalid = solveTripleBoard({ board: { tiles: [] } });
assert.equal(invalid.status, "invalid");
const timeout = solveTripleBoard({ board: first.board, maxNodes: 1 });
assert.equal(timeout.status, "timeout");
let clock = 0;
const deadlineTimeout = solveTripleBoard({ board: first.board, now: () => clock += 100 });
assert.equal(deadlineTimeout.status, "timeout");

const initialState = createTripleRoundState(first.board);
const afterOneMove = reduceTripleCommand(initialState, first.witness[0]).nextState;
assert.equal(createTripleSolverKey(afterOneMove), createTripleSolverKey({ ...afterOneMove, score: 999, combo: 999, misses: 999 }));

const timings = [];
for (let index = 0; index < 1000; index += 1) {
  const startedAt = performance.now();
  const generated = generateEasyTripleBoard({ seed: `property-${index}` });
  timings.push(performance.now() - startedAt);
  assert.equal(generated.source, "generated");
  assert.equal(replayTripleWitness(generated.board, generated.witness).ok, true);
}
timings.sort((left, right) => left - right);
const p95 = timings[Math.ceil(timings.length * 0.95) - 1];
assert.ok(p95 <= 20, `Easy generator + solver p95 ${p95.toFixed(2)} ms exceeded 20 ms.`);

const coreSources = await Promise.all([
  readFile(new URL("../js/tripleConnect/tripleBoard.js", import.meta.url), "utf8"),
  readFile(new URL("../js/tripleConnect/tripleSolver.js", import.meta.url), "utf8"),
]);
assert.equal(coreSources.some(source => source.includes("Math.random")), false, "Triple core randomness must be seeded.");

const normalTimings = [];
for (let index = 0; index < 100; index += 1) {
  const startedAt = performance.now();
  const normal = generateNormalTripleBoard({ seed: `normal-${index}` });
  normalTimings.push(performance.now() - startedAt);
  assert.equal(normal.board.tiles.length, 24);
  assert.equal(replayTripleWitness(normal.board, normal.witness).ok, true);
}
normalTimings.sort((left, right) => left - right);
const normalP95 = normalTimings[Math.ceil(normalTimings.length * .95) - 1];
assert.ok(normalP95 <= 100, `Normal generator + solver p95 ${normalP95.toFixed(2)} ms exceeded 100 ms.`);

const hardTimings = [];
for (let index = 0; index < 30; index += 1) {
  const startedAt = performance.now();
  const hard = generateHardTripleBoard({ seed: `hard-${index}` });
  hardTimings.push(performance.now() - startedAt);
  assert.equal(hard.board.tiles.length, 36);
  assert.equal(replayTripleWitness(hard.board, hard.witness).ok, true);
}
hardTimings.sort((left, right) => left - right);
const hardP95 = hardTimings[Math.ceil(hardTimings.length * .95) - 1];
assert.ok(hardP95 <= 100, `Hard generator + solver p95 ${hardP95.toFixed(2)} ms exceeded 100 ms.`);

console.log(`Triple Connect Easy board and solver contracts passed (p95 ${p95.toFixed(2)} ms).`);
