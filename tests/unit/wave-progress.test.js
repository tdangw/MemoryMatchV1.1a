import test from 'node:test';
import assert from 'node:assert/strict';
import { createWaveProgress, normalizeWaveProgress, completeWave, activateNextWave, waveTotalGroups } from '../../js/progression/waveProgress.js';
import { calculateWaveTime, calculateFastFinishBonus, calculateProgressionStars, getProgressionStarTargets } from '../../js/progression/gameplayRules.js';

test('Memory Match star targets are 80 percent across all modes without changing other games', () => {
  for (const mode of ['easy', 'normal', 'hard', 'superHard', 'challenge', 'endless']) {
    for (const totalGroups of [1, 3, 12, 18, 60, 150, 5000]) {
      const previous = getProgressionStarTargets({ mode, totalGroups });
      const memory = getProgressionStarTargets({ gameId: 'memory-match', mode, totalGroups });
      assert.deepEqual(memory, { two: Math.ceil(previous.two * 80 / 100), three: Math.ceil(previous.three * 80 / 100) });
      for (const gameId of ['link-connect', 'triple-connect']) {
        assert.deepEqual(getProgressionStarTargets({ gameId, mode, totalGroups }), previous);
      }
      const stars = (score, won = false) => calculateProgressionStars({ gameId: 'memory-match', mode, totalGroups, score, won });
      assert.equal(stars(memory.two - 1), 0);
      assert.equal(stars(memory.two - 1, true), 1);
      assert.equal(stars(memory.two), 2);
      assert.equal(stars(memory.three - 1), 2);
      assert.equal(stars(memory.three), 3);
    }
  }
  assert.throws(() => getProgressionStarTargets({ gameId: 'unknown', mode: 'easy', totalGroups: 12 }), RangeError);
});

const fresh = (overrides = {}) => createWaveProgress({ attemptId: 'attempt-1', gameId: 'memory-match', mode: 'easy', level: 1, groupsPerWave: 6, ...overrides });

test('adventure wave budgets match approved difficulties independently of board size', () => {
  for (const [gameId, expected] of [['memory-match', [75, 110, 150, 220]],
    ['link-connect', [60, 90, 120, 180]], ['triple-connect', [60, 90, 120, 180]]]) {
    for (const [index, mode] of ['easy', 'normal', 'hard', 'superHard'].entries())
      for (const totalGroups of [6, 9, 12, 18, 26, 30, 40, 1000])
        assert.equal(calculateWaveTime({ gameId, mode, totalGroups }), expected[index]);
    assert.equal(calculateWaveTime({ gameId, mode: 'endless', totalGroups: 6 }), 0);
  }
  assert.deepEqual(['memory-match', 'link-connect', 'triple-connect'].map(gameId =>
    calculateWaveTime({ gameId, mode: 'challenge', totalGroups: 6 })), [75, 60, 60]);
  for (const patch of [{ gameId: 'unknown' }, { mode: 'unknown' }, { totalGroups: 0 }, { totalGroups: 1.5 }])
    assert.throws(() => calculateWaveTime({ gameId: 'memory-match', mode: 'easy', totalGroups: 6, ...patch }));
});

test('original and mixed-budget checkpoints retain granted seconds through every remaining wave', () => {
  for (const [gameId, groups, oldBudgets] of [['memory-match', [6, 12, 18, 30], [65, 100, 130, 180]],
    ['link-connect', [6, 12, 18, 30], [50, 75, 90, 130]],
    ['triple-connect', [9, 18, 26, 40], [75, 120, 150, 200]]]) {
    for (const [index, mode] of ['easy', 'normal', 'hard', 'superHard'].entries()) {
      for (let savedIndex = 1; savedIndex <= 5; savedIndex++) {
        const snapshot = { ...fresh({ gameId, mode, level: 91, groupsPerWave: groups[index] }),
          index: savedIndex, allocatedSeconds: oldBudgets[index] * savedIndex };
        let progress = normalizeWaveProgress(JSON.parse(JSON.stringify(snapshot)));
        assert.deepEqual(progress, snapshot);
        assert.equal(normalizeWaveProgress({ ...snapshot, allocatedSeconds: snapshot.allocatedSeconds + 1 }), null);
        const budget = calculateWaveTime({ gameId, mode, totalGroups: groups[index] });
        for (let wave = savedIndex; wave <= 5; wave++) {
          const result = completeWave(progress, { score: wave * 100, moves: wave * 100,
            misses: 0, matchedGroups: groups[index] });
          assert.equal(result.bonusSeconds, wave === 5 ? 0 : budget);
          progress = normalizeWaveProgress(JSON.parse(JSON.stringify(result.progress)));
          assert(progress);
          if (wave < 5) progress = activateNextWave(progress);
        }
        assert.equal(progress.phase, 'won');
        assert.equal(progress.allocatedSeconds, oldBudgets[index] * savedIndex + budget * (5 - savedIndex));
      }
    }
  }
});

test('shared countdown keeps unused seconds and adds only the next wave budget', () => {
  const initial = fresh();
  assert.equal(initial.allocatedSeconds, 75);
  const { progress, bonusSeconds } = completeWave(initial, { score: 88, moves: 12, misses: 0, matchedGroups: 6 });
  assert.equal(bonusSeconds, 75);
  assert.equal(18 + bonusSeconds, 93);
  assert.equal(progress.phase, 'advance');
  assert.equal(progress.index, 2);
  assert.equal(progress.allocatedSeconds, 150);
  assert.throws(() => completeWave(progress, { score: 88, moves: 12, misses: 0, matchedGroups: 6 }));
  const restored = normalizeWaveProgress(JSON.parse(JSON.stringify(progress)));
  const next = activateNextWave(restored);
  const terminal = completeWave(next, { score: 176, moves: 24, misses: 0, matchedGroups: 6 });
  assert.equal(terminal.bonusSeconds, 0);
  assert.equal(terminal.progress.phase, 'won');
  assert.equal(terminal.progress.allocatedSeconds, 150);
  assert.equal(waveTotalGroups(terminal.progress), 12);
  assert.throws(() => activateNextWave(terminal.progress));
});

test('all games and modes complete exactly the requested wave count through serialized checkpoints', () => {
  for (const gameId of ['memory-match', 'link-connect', 'triple-connect'])
    for (const mode of ['easy', 'normal', 'hard', 'superHard', 'challenge', 'endless'])
      for (const level of [1, 11, 51, 91]) {
        let progress = fresh({ gameId, mode, level });
        const count = progress.count;
        for (let index = 1; index <= count; index++) {
          const result = completeWave(progress, { score: 60 * index, moves: 20 * index, misses: index, matchedGroups: 6 });
          progress = normalizeWaveProgress(JSON.parse(JSON.stringify(result.progress)), { gameId, mode, level });
          assert(progress);
          if (index < count) progress = activateNextWave(progress);
          else assert.equal(progress.phase, 'won');
          if (mode === 'endless') assert.equal(result.bonusSeconds, 0);
        }
        assert.equal(progress.allocatedSeconds, calculateWaveTime({ gameId, mode, totalGroups: 6 }) * count);
      }
});

test('corrupted checkpoints and incomplete or decreasing results are rejected', () => {
  const initial = fresh();
  for (const patch of [{ version: 99 }, { count: 5 }, { index: 0 }, { phase: 'advance' }, { phase: 'won' },
    { allocatedSeconds: 999 }, { attemptId: '' }, { groupsPerWave: 0 }, { level: Infinity }, { completedScore: NaN }])
    assert.equal(normalizeWaveProgress({ ...initial, ...patch }), null);
  assert.equal(normalizeWaveProgress(initial, { mode: 'hard' }), null);
  assert.throws(() => completeWave(initial, { score: 60, moves: 6, misses: 0, matchedGroups: 5 }));
  const next = activateNextWave(completeWave(initial, { score: 60, moves: 10, misses: 0, matchedGroups: 6 }).progress);
  assert.throws(() => completeWave(next, { score: 59, moves: 20, misses: 0, matchedGroups: 6 }));
});

test('fast completion uses real active duration and prescribed budgets, not purchased remaining time', () => {
  assert.equal(calculateFastFinishBonus({ totalGroups: 12, activeMs: 30000, allocatedSeconds: 90, mode: 'easy' }), 24);
  assert.equal(calculateFastFinishBonus({ totalGroups: 12, activeMs: 120000, allocatedSeconds: 90, mode: 'easy' }), 0);
  assert.equal(calculateFastFinishBonus({ totalGroups: 12, activeMs: 30000, allocatedSeconds: 0, mode: 'endless' }), 0);
  assert.equal(calculateProgressionStars({ totalGroups: 12, mode: 'easy', score: 156, won: true }), 2);
  assert.equal(calculateProgressionStars({ totalGroups: 12, mode: 'easy', score: 198, won: true }), 3);
  assert.equal(calculateProgressionStars({ totalGroups: 12, mode: 'easy', score: 120, won: true }), 1);
  assert.equal(calculateProgressionStars({ totalGroups: 12, mode: 'easy', score: 120, won: false }), 0);
});
