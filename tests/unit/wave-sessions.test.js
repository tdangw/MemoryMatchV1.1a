import test from 'node:test';
import assert from 'node:assert/strict';
import { gameState, hydrateGameState, recordMemoryMatchResult } from '../../js/gameState.js';
import { stageActiveSession, getActiveSession } from '../../js/sessionProgress.js';
import { createWaveProgress, completeWave, activateNextWave } from '../../js/progression/waveProgress.js';
import { indexedDB } from 'fake-indexeddb';
import { openChapterDatabase, writeChapterProfile, hydrateChapterProfile, readChapterProfile } from '../../js/chapterStore.js';

const wave = (gameId = 'memory-match') => createWaveProgress({ attemptId: 'attempt-session', gameId, mode: 'easy', level: 1, groupsPerWave: 6 });

test('wave checkpoint survives the normal persistence/hydration boundary without losing phase or budget', () => {
  hydrateGameState();
  const advanced = completeWave(wave(), { score: 60, moves: 12, misses: 0, matchedGroups: 6 }).progress;
  assert.equal(stageActiveSession('memory-match', { mode: 'easy', level: 1, wave: advanced, remainingTime: 80 }), true);
  hydrateGameState({ progress: JSON.parse(JSON.stringify(gameState.progress)) });
  const restored = getActiveSession('memory-match', 'easy');
  assert.deepEqual(restored.wave, advanced);
  assert.equal(restored.remainingTime, 80);
  assert.equal(restored.wave.phase, 'advance');
  assert.equal(stageActiveSession('memory-match', { ...restored, wave: { ...advanced, allocatedSeconds: 999 } }), false);
  assert.deepEqual(getActiveSession('memory-match', 'easy'), restored);
  assert.equal(stageActiveSession('link-connect', { mode: 'easy', level: 1, wave: advanced }), false);
});

test('corrupt wave input blocks resume rather than silently replacing it with a single-wave game', () => {
  hydrateGameState({ progress: { memoryMatch: { sessionsByMode: { easy: { mode: 'easy', level: 1, wave: { ...wave(), version: 99 } } } } } });
  assert.equal(getActiveSession('memory-match', 'easy').waveInvalid, true);
  hydrateGameState({ progress: JSON.parse(JSON.stringify(gameState.progress)) });
  assert.equal(getActiveSession('memory-match', 'easy').waveInvalid, true);
  assert.equal(stageActiveSession('memory-match', getActiveSession('memory-match', 'easy')), false);
});

test('wave and its granted budget share the durable chapter-profile revision', async () => {
  globalThis.indexedDB = indexedDB;
  hydrateGameState();
  const advanced = completeWave(wave(), { score: 60, moves: 12, misses: 0, matchedGroups: 6 }).progress;
  assert(stageActiveSession('memory-match', { mode: 'easy', level: 1, wave: advanced, remainingTime: 83 }));
  const database = await openChapterDatabase();
  try {
    const envelope = { formatVersion: 2, revision: 1, data: structuredClone({ coins: gameState.coins,
      settings: gameState.settings, appearance: gameState.appearance, progress: gameState.progress }) };
    await writeChapterProfile(database, envelope, 0);
    const restored = await hydrateChapterProfile(database, await readChapterProfile(database));
    assert.deepEqual(restored.progress.memoryMatch.sessionsByMode.easy.wave, advanced);
    assert.equal(restored.progress.memoryMatch.sessionsByMode.easy.remainingTime, 83);
    await assert.rejects(writeChapterProfile(database, { ...envelope, revision: 2 }, 0));
    const durable = await readChapterProfile(database);
    const afterFailure = await hydrateChapterProfile(database, durable);
    assert.equal(durable.revision, 1);
    assert.equal(afterFailure.progress.memoryMatch.sessionsByMode.easy.remainingTime, 83);
  } finally { database.close(); }
});

test('only terminal multi-wave results certify progress, and duplicate settlements are rejected', () => {
  hydrateGameState();
  const first = completeWave(wave(), { score: 60, moves: 12, misses: 0, matchedGroups: 6 }).progress;
  assert.throws(() => recordMemoryMatchResult({ mode: 'easy', level: 1, score: 60, stars: 1, wave: first }));
  const terminal = completeWave(activateNextWave(first), { score: 120, moves: 24, misses: 0, matchedGroups: 6 }).progress;
  recordMemoryMatchResult({ mode: 'easy', level: 1, score: 120, stars: 1, wave: terminal });
  assert.equal(gameState.progress.memoryMatch.bestByLevel['easy:1'].completedWaves, 2);
  const previous = structuredClone(gameState.progress.memoryMatch);
  assert.throws(() => recordMemoryMatchResult({ mode: 'easy', level: 1, score: 120, stars: 1, wave: terminal }));
  assert.deepEqual(gameState.progress.memoryMatch, previous);
  hydrateGameState({ progress: JSON.parse(JSON.stringify(gameState.progress)) });
  assert.equal(gameState.progress.memoryMatch.bestByLevel['easy:1'].rulesVersion, 1);
  assert.equal(gameState.progress.memoryMatch.settledAttempts.easy, terminal.attemptId);
});
