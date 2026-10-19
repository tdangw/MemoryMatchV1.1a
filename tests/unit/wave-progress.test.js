import test from 'node:test';
import assert from 'node:assert/strict';
import { createWaveProgress, normalizeWaveProgress, completeWave, activateNextWave, waveTotalGroups } from '../../js/progression/waveProgress.js';
import { calculateWaveTime, calculateFastFinishBonus, calculateProgressionStars } from '../../js/progression/gameplayRules.js';

const fresh = (overrides = {}) => createWaveProgress({ attemptId: 'attempt-1', gameId: 'memory-match', mode: 'easy', level: 1, groupsPerWave: 6, ...overrides });

test('shared countdown keeps unused seconds and adds only the next wave budget', () => {
  const initial = fresh();
  assert.equal(initial.allocatedSeconds, 65);
  const { progress, bonusSeconds } = completeWave(initial, { score: 88, moves: 12, misses: 0, matchedGroups: 6 });
  assert.equal(bonusSeconds, 65);
  assert.equal(18 + bonusSeconds, 83);
  assert.equal(progress.phase, 'advance');
  assert.equal(progress.index, 2);
  assert.equal(progress.allocatedSeconds, 130);
  assert.throws(() => completeWave(progress, { score: 88, moves: 12, misses: 0, matchedGroups: 6 }));
  const restored = normalizeWaveProgress(JSON.parse(JSON.stringify(progress)));
  const next = activateNextWave(restored);
  const terminal = completeWave(next, { score: 176, moves: 24, misses: 0, matchedGroups: 6 });
  assert.equal(terminal.bonusSeconds, 0);
  assert.equal(terminal.progress.phase, 'won');
  assert.equal(terminal.progress.allocatedSeconds, 130);
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
