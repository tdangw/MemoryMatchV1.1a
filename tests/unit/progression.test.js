import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_ADVENTURE_LEVEL } from '../../js/adventureProgress.js';
import {
  GAMEPLAY_RULES_VERSION, getLevelWaveCount, calculateGroupScore, calculateVictoryCoins, getWavePatternIndex,
} from '../../js/progression/gameplayRules.js';
import {
  MASTERY_DIFFICULTIES, getDifficultyAccess, getMasteryBlock,
} from '../../js/progression/difficultyProgress.js';

const clear = () => ({ rulesVersion: GAMEPLAY_RULES_VERSION, cleared: true });

test('the first ten two-wave levels visit all twenty layouts without repeating', () => {
  const indexes = [];
  for (let level = 1; level <= 10; level++) for (let wave = 1; wave <= 2; wave++) indexes.push(getWavePatternIndex(level, wave));
  assert.deepEqual(indexes, Array.from({ length: 20 }, (_, i) => i));
  assert.equal(getWavePatternIndex(11, 1), 0);
  assert.equal(getWavePatternIndex(51, 1), 0);
  assert.equal(getWavePatternIndex(91, 1), 0);
  assert(Number.isInteger(getWavePatternIndex(MAX_ADVENTURE_LEVEL, 5)));
  assert.throws(() => getWavePatternIndex(1, 3));
});

test('wave boundaries remain bounded, including the highest supported level', () => {
  for (const [level, waves] of [[1, 2], [10, 2], [11, 3], [50, 3], [51, 4], [90, 4], [91, 5], [100000, 5], [MAX_ADVENTURE_LEVEL, 5]])
    assert.equal(getLevelWaveCount(level), waves);
  for (const invalid of [0, -1, 1.5, NaN, Infinity, '10', MAX_ADVENTURE_LEVEL + 1])
    assert.throws(() => getLevelWaveCount(invalid), RangeError);
});

test('score caps at combo five; automatic matches never inherit combo points', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 30].map(combo => calculateGroupScore({ combo })),
    [10, 10, 12, 14, 16, 18, 18, 18]);
  assert.equal(calculateGroupScore({ combo: 30, automatic: true }), 10);
  for (const combo of [-1, 1.5, NaN, Infinity, '2'])
    assert.throws(() => calculateGroupScore({ combo }), RangeError);
  assert.throws(() => calculateGroupScore({ combo: 2, automatic: 'yes' }), TypeError);
});

test('victory coin examples match the independent balance table for all three games', () => {
  const modes = ['easy', 'normal', 'hard', 'superHard'];
  for (const gameId of ['memory-match', 'link-connect']) {
    for (const [index, totalGroups] of [6, 12, 18, 30].entries())
      assert.equal(calculateVictoryCoins({ gameId, mode: modes[index], totalGroups, stars: 3 }), [22, 32, 48, 78][index]);
  }
  for (const [index, totalGroups] of [9, 18, 26, 40].entries())
    assert.equal(calculateVictoryCoins({ gameId: 'triple-connect', mode: modes[index], totalGroups, stars: 3 }), [27, 44, 68, 110][index]);
  for (const mode of ['challenge', 'endless'])
    assert.equal(calculateVictoryCoins({ gameId: 'link-connect', mode, totalGroups: 60, stars: 2 }), 95);
});

test('victory coins use all-wave groups once and reject invalid or unsafe inputs', () => {
  const input = { gameId: 'memory-match', mode: 'easy', totalGroups: 12, stars: 1 };
  assert.equal(calculateVictoryCoins(input), 24);
  assert.notEqual(calculateVictoryCoins(input), 2 * calculateVictoryCoins({ ...input, totalGroups: 6 }));
  for (const invalid of [{ gameId: 'other' }, { mode: 'other' }, { totalGroups: 0 }, { totalGroups: 1.5 }, { totalGroups: Number.MAX_SAFE_INTEGER }, { stars: 0 }, { stars: 4 }])
    assert.throws(() => calculateVictoryCoins({ ...input, ...invalid }), RangeError);
});

test('easy clears open the next level and higher difficulties open only at the same level', () => {
  const completed = {};
  assert.equal(getDifficultyAccess({ completed, level: 1, mode: 'easy' }).unlocked, true);
  assert.equal(getDifficultyAccess({ completed, level: 1, mode: 'normal' }).unlocked, false);
  assert.equal(getDifficultyAccess({ completed, level: 2, mode: 'easy' }).unlocked, false);
  completed['easy:1'] = clear();
  assert.equal(getDifficultyAccess({ completed, level: 2, mode: 'easy' }).unlocked, true);
  assert.equal(getDifficultyAccess({ completed, level: 1, mode: 'normal' }).unlocked, true);
  assert.equal(getDifficultyAccess({ completed, level: 1, mode: 'hard' }).unlocked, false);
  completed['normal:1'] = clear();
  completed['hard:1'] = clear();
  assert.equal(getDifficultyAccess({ completed, level: 1, mode: 'superHard' }).unlocked, true);
  assert.equal(getDifficultyAccess({ completed, level: 2, mode: 'normal' }).unlocked, false);
  assert.throws(() => getDifficultyAccess({ completed, level: 1, mode: 'challenge' }), RangeError);
});

test('legacy and incomplete records do not silently certify new multi-wave wins', () => {
  for (const result of [{ cleared: true }, { ...clear(), rulesVersion: 0 }, { ...clear(), cleared: false }]) {
    const completed = { 'easy:1': result };
    assert.equal(getDifficultyAccess({ completed, level: 2, mode: 'easy' }).unlocked, false);
  }
});

test('chest progress is separated by difficulty; easy progress alone grants no fragments', () => {
  const completed = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`easy:${i + 1}`, clear()]));
  completed['normal:1'] = clear();
  const result = getMasteryBlock({ completed, level: 10 });
  assert.deepEqual(result.tiers.map(tier => tier.exp), [100, 10, 0, 0]);
  assert.deepEqual(result.tiers.map(tier => tier.complete), [true, false, false, false]);
  assert.deepEqual(result.fragmentLevels, []);
  assert.equal(result.collectionComplete, false);
});

test('mastery needs four wins per level; completed sets are isolated in each ten-level block', () => {
  const completed = {};
  for (const mode of MASTERY_DIFFICULTIES) for (let level = 1; level <= 10; level++)
    completed[`${mode}:${level}`] = clear();
  const before = structuredClone(completed);
  const result = getMasteryBlock({ completed, level: 1 });
  assert.equal(result.collectionComplete, true);
  assert.deepEqual(result.fragmentLevels, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(result.tiers.map(tier => tier.exp), [100, 100, 100, 100]);
  assert.deepEqual(getMasteryBlock({ completed, level: 11 }).tiers.map(tier => tier.exp), [0, 0, 0, 0]);
  assert.deepEqual(getMasteryBlock({ completed, level: 1 }), result);
  assert.deepEqual(completed, before);
  assert.equal(Object.isFrozen(result.tiers[0]), true);
});

test('far-away progress inspects exactly forty records and never scans history', () => {
  let reads = 0;
  const completed = new Proxy({}, {
    get: () => { reads++; return undefined; },
    ownKeys: () => { throw new Error('Historical scans are forbidden.'); },
  });
  const result = getMasteryBlock({ completed, level: MAX_ADVENTURE_LEVEL });
  assert.equal(reads, 40);
  assert.equal(result.lastLevel, MAX_ADVENTURE_LEVEL);
});
