import assert from 'node:assert/strict';
import { indexedDB, IDBKeyRange, IDBObjectStore } from 'fake-indexeddb';
import { createProgressRun, reduceProgressRun, normalizeProgressRun, createProgressResult, keepProgressBest, highestOwnedAdventureLevel } from '../js/progressRankingModel.js';
import { rankingBoardId, validateRankingResult } from '../js/rankingResult.js';
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
console.log('Progress ranking v3: six runs, max-only checkpoints, owner-safe bounded migration, retry/rollback and 100000 archived level passed.');
