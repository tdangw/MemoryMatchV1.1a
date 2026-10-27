import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { ACHIEVEMENT_ITEMS, achievementAt, settleAchievementInventory, normalizeAchievementLedger,
  ownedProfileCosmeticItems, normalizeProfileCosmetics } from '../../js/progression/achievementModel.js';
import { normalizeAcquisitions, mergeAcquisitions } from '../../js/progression/acquisitionModel.js';
import { normalizeAppearance } from '../../js/appearance.js';
import { normalizePublicCosmetics, publicCosmeticSelection } from '../../js/progression/publicCosmeticModel.js';
const modes = ['easy', 'normal', 'hard', 'superHard'];
const certified = (levels, difficulties = modes) => Object.fromEntries(levels.flatMap(level => difficulties.map(mode =>
  [`${mode}:${level}`, { cleared: true, rulesVersion: 1, score: 0, stars: 0 }])));
const games = bestByLevel => Object.fromEntries(['memoryMatch', 'linkConnect', 'tripleConnect'].map(key => [key, { bestByLevel }]));
const range = length => Array.from({ length }, (_, i) => i + 1);
const receipt = { receiptId: 'user1:event:firefly-festival-01:100', ownerUid: 'user1', sourceKind: 'event',
  sourceId: 'firefly-festival-01', milestone: 100, grantedAt: 100,
  items: ['event-avatar-lantern-otter', 'event-frame-firefly-glow'] };

test('A2 boundaries 10/11/20/21/30 grant once, level31 has no catalog grant', () => {
  const levels = [10, 11, 20, 21, 30];
  const a = settleAchievementInventory({}, {}, games(certified([...levels, 31])), { now: 123 });
  assert.equal(Object.keys(a.achievements.grants).length, 15);
  for (const item of ACHIEVEMENT_ITEMS) if (levels.includes(item.level))
    assert.equal(a.achievements.grants[`${item.gameId}:${item.level}`].itemId, item.id);
  assert.equal(achievementAt('memory-match', 31), null);
  assert.deepEqual(settleAchievementInventory(a, a, games(certified([...levels, 31])), { now: 999 }), a);
  assert.deepEqual(a.profileCosmetics, { avatar: null, frame: null, badge: null });
});

test('A2 coverage extends old marker without changing grant identity or announcement', () => {
  const old = settleAchievementInventory({}, {}, games(certified(range(10))), { backfill: true, now: 10 });
  delete old.achievements.coverageRevision;
  old.achievements.grants['memory-match:1'].announced = false;
  assert.equal(normalizeAchievementLedger(old.achievements).coverageRevision, 1);
  const next = settleAchievementInventory(old, old, games(certified(range(30))), { backfill: true, now: 20 });
  assert.equal(next.achievements.coverageRevision, 2); assert.equal(next.achievements.backfillVersion, 1);
  assert.equal(Object.keys(next.achievements.grants).length, 90);
  for (const [key, grant] of Object.entries(old.achievements.grants)) assert.deepEqual(next.achievements.grants[key], grant);
  assert.equal(next.achievements.grants['memory-match:11'].announced, true);
  assert.equal(next.achievements.grants['memory-match:11'].catalogVersion, 1);
  assert.deepEqual(settleAchievementInventory(next, old), next);
  assert.throws(() => normalizeAchievementLedger({ ...next.achievements, coverageRevision: 99 }));
});

test('A2 event acquisition and starter ownership use no fabricated achievement grants', () => {
  const initial = normalizeAppearance({});
  assert.equal(ownedProfileCosmeticItems(initial).length, 3);
  assert.equal(Object.keys(initial.achievements.grants).length, 0);
  const acquisitions = normalizeAcquisitions({ version: 1, grants: { [receipt.receiptId]: receipt } });
  const appearance = normalizeAppearance({ acquisitions, profileCosmetics: { avatar: receipt.items[0], frame: receipt.items[1], badge: 'starter-badge-first-leaf' } });
  assert.equal(ownedProfileCosmeticItems(appearance).length, 5);
  assert.equal(Object.keys(appearance.achievements.grants).length, 0);
  assert.deepEqual(mergeAcquisitions(acquisitions, acquisitions), acquisitions);
  assert.deepEqual(normalizeProfileCosmetics({ avatar: receipt.items[0] }, initial.achievements), { avatar: null, frame: null, badge: null });
  for (const bad of [null, { version: 2, grants: {} }, { version: 1, grants: { fake: receipt } },
    { version: 1, grants: { [receipt.receiptId]: { ...receipt, sourceKind: 'achievement' } } },
    { version: 1, grants: { [receipt.receiptId]: { ...receipt, items: ['memory-avatar-scholar-squirrel'] } } }])
    assert.throws(() => normalizeAcquisitions(bad));
  assert.throws(() => mergeAcquisitions(acquisitions, { version: 1, grants: { [receipt.receiptId]: { ...receipt, grantedAt: 101 } } }));
  const projected = publicCosmeticSelection(appearance);
  assert.deepEqual(Object.keys(projected).sort(), ['avatar', 'badge', 'frame', 'version']);
  assert.deepEqual(normalizePublicCosmetics(projected), appearance.profileCosmetics);
});

test('A2 old marker in archived chapter1 backfills90 once, restores and preserves300Xu', async () => {
  globalThis.indexedDB = new IDBFactory();
  const seed = new Map(); globalThis.localStorage = { getItem: key => seed.get(key) ?? null,
    setItem: (key, value) => seed.set(key, value), removeItem: key => seed.delete(key) };
  const old = settleAchievementInventory({}, {}, games(certified(range(10))), { backfill: true, now: 10 });
  delete old.achievements.coverageRevision;
  const progress = games({ ...certified(range(100), ['easy']), ...certified(range(30)) });
  progress.gameplaySeason = 1;
  for (const game of Object.values(games({}))) assert(game.bestByLevel);
  progress.memoryMatch.claimedChests = { 1: { rulesVersion: 1, tiers: {}, collection: { coins: 300 } } };
  localStorage.setItem('memoryMatchSave', JSON.stringify({ formatVersion: 1, revision: 1,
    data: { coins: 777, appearance: old, progress, settings: {} } }));
  const p = await import('../../js/persistence.js?expansion-archive');
  const loaded = await p.loadPersistentGameData();
  assert.equal(loaded.progress.memoryMatch.adventure.currentChapter, 2);
  assert.equal(loaded.progress.memoryMatch.bestByLevel['normal:11'], undefined);
  assert(await p.backfillAchievementInventory());
  const snapshot = await p.exportPersistentSnapshot();
  assert.equal(Object.keys(snapshot.profile.data.appearance.achievements.grants).length, 90);
  assert.equal(snapshot.profile.data.coins, 777);
  assert.deepEqual(snapshot.profile.data.appearance.achievements.grants['memory-match:1'], old.achievements.grants['memory-match:1']);
  assert.equal(snapshot.chapters.find(c => c.key === 'memoryMatch:1').value.claimedChests[1].collection.coins, 300);
  assert(await p.backfillAchievementInventory());
  assert.equal((await p.exportPersistentSnapshot()).profile.revision, snapshot.profile.revision);
  const legacy = structuredClone(snapshot); legacy.profile.data.appearance = old;
  assert(await p.importPersistentSnapshot(legacy, 'test', {}));
  const restored = await p.exportPersistentSnapshot();
  assert.equal(Object.keys(restored.profile.data.appearance.achievements.grants).length, 90);
  assert.equal(restored.profile.data.coins, 777);
  const future = structuredClone(snapshot); future.profile.data.appearance.acquisitions = { version: 99, grants: {} };
  await assert.rejects(() => p.importPersistentSnapshot(future, 'test', {}));
  assert.equal((await p.exportPersistentSnapshot()).profile.revision, restored.profile.revision);
});
