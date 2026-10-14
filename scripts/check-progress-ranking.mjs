import assert from 'node:assert/strict';
import { indexedDB, IDBKeyRange, IDBObjectStore } from 'fake-indexeddb';
import { createProgressRun, reduceProgressRun, normalizeProgressRun, createProgressResult, keepProgressBest, highestOwnedAdventureLevel } from '../js/progressRankingModel.js';
import { rankingBoardId, validateRankingResult } from '../js/rankingResult.js';
import { gameState, recordMemoryMatchResult } from '../js/gameState.js';
import { beginRankedAttempt, stageRankedAttempt, checkpointRankedRun } from '../js/rankingRules.js';
import { setRankingOwner } from '../js/rankingOwner.js';
import { normalizePairSnapshot } from '../js/pairSessionSnapshot.js';
import { openChapterDatabase, writeChapterProfile, readChapterProfile, migrateChapterLevelRankings, ensureChapterProfileOwner } from '../js/chapterStore.js';
globalThis.indexedDB = indexedDB; globalThis.IDBKeyRange = IDBKeyRange;
const owner = { profileId: 'fixture', uid: null };
for (const game of ['memory-match', 'link-connect', 'triple-connect']) for (const mode of ['challenge', 'endless']) {
  let run = createProgressRun(game, mode, 1, owner);
  for (let n = 1; n <= 10; n++) {
    run = reduceProgressRun(run, { type: 'win' }); assert.equal(run.clearedLevels, n);
    assert.equal(reduceProgressRun(run, { type: 'win' }), run);
    run = reduceProgressRun(run, { type: 'advance', level: n + 1 });
  }
  assert(normalizeProgressRun(run, { gameId: game, mode, level: 11 }));
  assert.equal(normalizeProgressRun({ ...run, clearedLevels: 11 }, { gameId: game, mode, level: 11 }), null);
  const restarted = reduceProgressRun(run, { type: 'restart' });
  assert.equal(reduceProgressRun(reduceProgressRun(run, { type: 'finalize' }), { type: 'restart' }).level, 1);
  assert.equal(normalizeProgressRun({ ...run, owner: { profileId: '', uid: null } }, { gameId: game, mode, level: 11 }), null);
  assert.equal(restarted.level, 1); assert.equal(restarted.clearedLevels, 0); assert.notEqual(restarted.id, run.id);
  const best = createProgressResult(game, mode, 10, owner);
  assert(validateRankingResult(best)); assert.equal(rankingBoardId(best), `v3_${game}_${mode}`);
  assert.equal(keepProgressBest(best, createProgressResult(game, mode, 9, owner)), best);
  assert.equal(keepProgressBest(best, createProgressResult(game, mode, 10, owner)), best);
  assert.equal(keepProgressBest(best, createProgressResult(game, mode, 11, owner)).levelReached, 11);
}
assert.equal(highestOwnedAdventureLevel({ 'easy:100000': { score: 10, stars: 1 }, 'hard:100001': { score: 20, stars: 2, cleared: false }, 'challenge:200000': { score: 1, stars: 1 } }, owner, { id: 'fixture', uid: null }), 100000);
const db = await openChapterDatabase();
const records = Object.fromEntries(Array.from({ length: 31 }, (_, n) => [`easy:${n * 100 + 1}`, { score: n, stars: 1 }]));
records['hard:100000'] = { score: 100, stars: 2 };
const envelope = { formatVersion: 2, revision: 1, data: { coins: 99, appearance: {}, settings: {}, progress: { memoryMatch: { totalScore: 99, bestByLevel: records, sessionsByMode: { challenge: { mode: 'challenge', level: 9 } } } } } };
await writeChapterProfile(db, envelope, 0, { migration: true });
const metadata = await ensureChapterProfileOwner(db); const identity = { profileId: metadata.id, uid: metadata.uid };
const corrupted = await readChapterProfile(db);
corrupted.data.progress.levelRankingMigration = { version: 3, owner: identity, complete: 'corrupt' };
const corruptTransaction = db.transaction('profile', 'readwrite'); corruptTransaction.objectStore('profile').put(corrupted, 'active');
await new Promise((resolve, reject) => { corruptTransaction.oncomplete = resolve; corruptTransaction.onabort = () => reject(corruptTransaction.error); });
let migrated = await migrateChapterLevelRankings(db, identity, 1, () => true, 3);
assert.equal(migrated.complete, false); assert.equal(migrated.envelope.revision, 2);
const put = IDBObjectStore.prototype.put;
try {
  IDBObjectStore.prototype.put = function(...args) { if (this.name === 'profile') throw new DOMException('Quota', 'QuotaExceededError'); return put.apply(this, args); };
  await assert.rejects(migrateChapterLevelRankings(db, identity, 2, () => true, 3), { name: 'QuotaExceededError' });
} finally { IDBObjectStore.prototype.put = put; }
assert.equal((await readChapterProfile(db)).revision, 2);
await assert.rejects(migrateChapterLevelRankings(db, { ...identity, uid: 'another' }, 2), /owner changed/);
while (!migrated.complete) migrated = await migrateChapterLevelRankings(db, identity, migrated.envelope.revision, () => true, 3);
assert.equal(migrated.envelope.data.progress.memoryMatch.levelBestsV3.adventure.levelReached, 100000);
assert.equal(migrated.envelope.data.coins, 99); assert.equal(migrated.envelope.data.progress.memoryMatch.totalScore, 99);
assert.equal(migrated.envelope.data.progress.memoryMatch.sessionsByMode.challenge.level, 9);
assert.equal(migrated.envelope.data.progress.memoryMatch.levelBestsV3.challenge, undefined);
assert.equal((await migrateChapterLevelRankings(db, identity, migrated.envelope.revision)).envelope.revision, migrated.envelope.revision);
db.close();
setRankingOwner({ id: 'new-policy', uid: 'new-policy-owner' });
for (const gameId of ['memory-match', 'link-connect', 'triple-connect']) for (const mode of ['challenge', 'endless']) {
  beginRankedAttempt(gameId, mode, 1); stageRankedAttempt(gameId, mode, 100, true);
  const result = checkpointRankedRun(gameId, mode); assert.equal(result.rulesVersion, 3); assert.equal(result.levelReached, 1);
  assert.equal(checkpointRankedRun(gameId, mode), null);
  beginRankedAttempt(gameId, mode, 2, { reason: 'advance' }); stageRankedAttempt(gameId, mode, 999999);
  assert.equal(checkpointRankedRun(gameId, mode), null, 'An unfinished high-score board never adds a cleared level.');
  stageRankedAttempt(gameId, mode, 1, true); assert.equal(checkpointRankedRun(gameId, mode).levelReached, 2);
}
recordMemoryMatchResult({ mode: 'hard', level: 3, score: 10, stars: 1 });
recordMemoryMatchResult({ mode: 'easy', level: 2, score: 10000, stars: 3 });
assert.equal(gameState.progress.memoryMatch.levelBestsV3.adventure.levelReached, 3);
const pairSnapshot = { version: 1, gameId: 'memory-match', seed: 'saved-board', themeId: 'default', score: 30, moves: 4, misses: 0, combo: 0,
  matchedPairs: 1, totalPairs: 2, tiles: [{ id: 'a', special: false, matched: true }, { id: 'a', special: false, matched: true }, { id: 'b', special: false, matched: false }, { id: 'b', special: false, matched: false }], luckyRewards: [], luckyAwards: [] };
assert(normalizePairSnapshot(pairSnapshot, 'memory-match'));
assert.equal(normalizePairSnapshot({ ...pairSnapshot, matchedPairs: 0 }, 'memory-match'), null);
assert.equal(normalizePairSnapshot({ ...pairSnapshot, luckyRewards: [null] }, 'memory-match'), null);
assert.equal(normalizePairSnapshot({ ...pairSnapshot, tiles: [null, ...pairSnapshot.tiles.slice(1)] }, 'memory-match'), null);
console.log('Progress ranking v3: six runs, max-only checkpoints, owner-safe bounded migration, retry/rollback and 100000 archived level passed.');
