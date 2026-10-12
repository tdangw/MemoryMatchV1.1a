import assert from "node:assert/strict";
import { drawAdventureReward, claimAdventureChest } from "../js/adventureRewards.js";
import { gameState, hydrateGameState } from "../js/gameState.js";
import { loadPersistentGameData } from "../js/persistence.js";
const bestByLevel = Object.fromEntries(Array.from({ length: 20 }, (_, index) => [`easy:${index + 1}`, { score: 100, stars: 0 }]));
let failWrites = false;
const values = new Map([["memoryMatchSave", JSON.stringify({ formatVersion: 1, revision: 1, updatedAt: 1, data: {
  coins: 10, appearance: {}, settings: {}, progress: { memoryMatch: { bestByLevel } },
} })]]);
globalThis.localStorage = {
  getItem: key => values.get(key) || null,
  setItem: (key, value) => { if (failWrites) throw new Error("Quota exceeded"); values.set(key, value); },
};
hydrateGameState(await loadPersistentGameData());
const sample = values => () => values.shift();
assert.equal(drawAdventureReward(sample([0, 0])).grants[0].amount, 80);
assert.equal(drawAdventureReward(sample([0.7, 0.999])).grants[0].amount, 160);
assert.equal(drawAdventureReward(sample([0.95, 0])).grants[0].amount, 200);
assert.equal(drawAdventureReward(sample([0.999, 0.999])).grants[0].amount, 250);
assert.throws(() => drawAdventureReward(() => 1), RangeError);
const [first, duplicate] = await Promise.all([claimAdventureChest("memory-match", 1), claimAdventureChest("memory-match", 1)]);
assert.ok(first);
assert.equal(duplicate, null);
assert.equal(gameState.coins, 10 + first.grants[0].amount);
const savedOutcome = structuredClone(gameState.progress.memoryMatch.claimedChests[1]);
hydrateGameState(await loadPersistentGameData());
assert.deepEqual(gameState.progress.memoryMatch.claimedChests[1], savedOutcome);
assert.equal(await claimAdventureChest("memory-match", 1), null, "Reopening must not reroll a durable claim.");
const coins = gameState.coins;
failWrites = true;
assert.equal(await claimAdventureChest("memory-match", 2), null);
assert.equal(gameState.coins, coins);
assert.equal(gameState.progress.memoryMatch.claimedChests[2], undefined);
console.log("Reward weights/bounds, zero-star eligibility, duplicate claim, stored outcome and failed-claim rollback checks passed.");
