import assert from 'node:assert/strict';
import { resolveMemoryPairRewards } from '../js/memoryMatch/pairRewards.js';
import { resolveLinkPairRewards } from '../js/linkConnect/pairRewards.js';
import { createLinkBoard, removeRandomLinkPair, getRemainingLinkTiles } from '../js/linkConnect/linkBoard.js';
import { createLinkGameState } from '../js/linkConnect/linkState.js';
import { GAMEPLAY_LIMITS } from '../js/gameplayTuning.js';

const memory = { coins: 0, remainingTime: 60, specialProgress: 3, specialNoEnergyDropStreak: 0, pendingEnergyCollections: 0,
  luckyRewards: new Map([['a', { type: 'coins', value: 10 }]]), luckyAwards: [], progress: { memoryMatch: { items: { hint: 0 } } } };
let calls = 0;
const memoryPresentation = resolveMemoryPairRewards(memory, { imageId: 'a', special: true }, () => calls++ === 0 ? 0 : .99);
assert.equal(memory.coins, 15); assert.equal(memory.specialProgress, 4); assert.equal(memory.pendingEnergyCollections, 0);
assert.equal(memoryPresentation.energyProgress, 4); assert.equal(memory.luckyRewards.size, 0); assert.equal(memory.luckyAwards.length, 1);
memory.progress.memoryMatch.items.hint = GAMEPLAY_LIMITS.itemCount;
memory.luckyRewards.set('b', { type: 'hints', value: 2 });
resolveMemoryPairRewards(memory, { imageId: 'b' }, () => 0);
assert.equal(memory.remainingTime, 63); assert.equal(memory.progress.memoryMatch.items.hint, GAMEPLAY_LIMITS.itemCount);

const cards = Array.from({ length: 6 }, (_, i) => ({ id: `c-${i}`, src: `/assets/c-${i}.webp`, alt: `C ${i}` }));
const board = structuredClone(createLinkBoard({ layout: { tileCount: 12, columns: 4 }, cardProvider: () => cards }));
for (const tile of board.grid.flat().filter(Boolean)) { tile.special = false; tile.luckyReward = null; tile.frozen = false; }
for (const mode of ['challenge', 'endless']) for (const progress of Array.from({ length: 10 }, (_, i) => i)) for (const premiumType of ['cyan', 'blue', 'red']) {
  const state = createLinkGameState(); state.mode = mode; state.board = structuredClone(board); state.specialProgress = progress;
  state.totalPairs = 6; state.matchedPairs = 1; removeRandomLinkPair(state.board);
  const items = { hint: 0, reshuffle: 0, freeze: 0 };
  const presentation = resolveLinkPairRewards(state, items, { special: true, premiumType, luckyReward: { type: 'coins', value: 10 } }, () => 0);
  assert.equal(state.specialProgress, (progress + 1) % 10);
  assert.equal(state.pendingEnergyCollections, 0); assert.deepEqual(state.pendingSpecialMilestones, []);
  assert.equal(getRemainingLinkTiles(state.board).length, (state.totalPairs - state.matchedPairs) * 2);
  assert(presentation.coins >= 10); assert.equal(state.luckyAwards.length, 1);
  if (premiumType === 'blue') assert(items.hint >= 1);
  if (progress === 9) { assert(items.hint >= 1); assert.equal(items.reshuffle, 1); }
}
console.log('Pair rewards: Memory lucky/caps/milestone and 60 Link mode/milestone/premium cases settle without pending animation-owned mutations.');
