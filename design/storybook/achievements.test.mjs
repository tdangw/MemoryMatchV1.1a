import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { ACHIEVEMENT_ITEMS, settleAchievementInventory, normalizeAchievementLedger, pendingAchievements } from '../../js/progression/achievementModel.js';
import { normalizeAppearance } from '../../js/appearance.js';
const certified = (levels = [1], modes = ['easy', 'normal', 'hard', 'superHard']) => Object.fromEntries(levels.flatMap(level => modes.map(mode => [`${mode}:${level}`, { cleared: true, rulesVersion: 1, score: 0, stars: 0 }])));
const allGames = bestByLevel => Object.fromEntries(['memoryMatch', 'linkConnect', 'tripleConnect'].map(key => [key, { bestByLevel }]));
test('F1 deterministic catalog has 30 distinct game/level rewards and exact type counts', () => {
  assert.equal(new Set(ACHIEVEMENT_ITEMS.map(item => item.id)).size, 30);
  assert.equal(new Set(ACHIEVEMENT_ITEMS.map(item => item.gameId + ':' + item.level)).size, 30);
  for (const gameId of ['memory-match', 'link-connect', 'triple-connect']) {
    const items = ACHIEVEMENT_ITEMS.filter(item => item.gameId === gameId);
    assert.deepEqual(items.map(item => item.level), [1,2,3,4,5,6,7,8,9,10]);
    assert.deepEqual(['avatar', 'frame', 'badge', 'effect-cover'].map(type => items.filter(item => item.type === type).length), [3,3,2,2]);
  }
});
test('F1 certification rather than stars/S, independent games, replay and no auto-equip', () => {
  let a = settleAchievementInventory({}, {}, allGames(certified([1], ['superHard'])));
  assert.equal(Object.keys(a.achievements.grants).length, 0);
  a = settleAchievementInventory(a, a, allGames(certified([1])));
  assert.equal(Object.keys(a.achievements.grants).length, 3); assert.equal(pendingAchievements(a).length, 3);
  assert.deepEqual(a.profileCosmetics, { avatar: null, frame: null, badge: null });
  assert.deepEqual(settleAchievementInventory(a, a, allGames(certified([1])), { now: 99 }), a);
  assert.equal(Object.keys(settleAchievementInventory({}, {}, allGames(certified([11]))).achievements.grants).length, 0);
  const invalid = certified([1]); invalid['easy:1'] = { stars: 3, cleared: true };
  assert.equal(Object.keys(settleAchievementInventory({}, {}, allGames(invalid)).achievements.grants).length, 0);
});
test('F1 legacy inventory, per-game effect slots, receipt ownership and announced monotonicity', () => {
  let a = settleAchievementInventory({}, { ownedCardBacks: ['classic', 'midnight'], flipEffect: 'bounce', ownedFlipEffects: ['bounce'] }, allGames(certified([4, 10])));
  a = normalizeAppearance(a);
  assert(a.ownedCardBacks.includes('midnight')); assert.equal(a.flipEffect, 'bounce');
  assert(a.ownedLinkPathEffects.includes('link-effect-meteor-route'));
  assert(!a.ownedLinkPathEffects.includes('triple-effect-triad-converge'));
  assert(a.ownedTriplePathEffects.includes('triple-effect-triad-converge'));
  const stale = structuredClone(a); a.achievements.grants['memory-match:4'].announced = true;
  assert.equal(settleAchievementInventory(a, stale).achievements.grants['memory-match:4'].announced, true);
  const forged = normalizeAppearance({ ownedFlipEffects: ['bounce', 'memory-effect-moonflip'], flipEffect: 'memory-effect-moonflip' });
  assert.equal(forged.flipEffect, 'bounce');
  const cross = normalizeAppearance({ ...a, ownedLinkPathEffects: ['default', 'triple-effect-triad-converge'], linkPathEffect: 'triple-effect-triad-converge' });
  assert.equal(cross.linkPathEffect, 'default');
});
test('F1 corrupt or future ledger cannot be accepted or used to grant a different reward', () => {
  for (const value of [null, [], { version: 2, grants: {} }, { version: 1, grants: { 'memory-match:1': { itemId: 'future' } } }])
    assert.throws(() => normalizeAchievementLedger(value));
});
test('F1 backfill is silent, bounded and idempotent', () => {
  const progress = allGames(certified([1,2,3,4,5,6,7,8,9,10]));
  const a = settleAchievementInventory({}, {}, progress, { backfill: true, now: 123 });
  assert.equal(Object.keys(a.achievements.grants).length, 30); assert.equal(pendingAchievements(a).length, 0);
  assert.deepEqual(settleAchievementInventory(a, a, progress, { backfill: true, now: 999 }), a);
});
function storage(seed = new Map()) {
  return { seed, fail: false, getItem: key => seed.get(key) ?? null, removeItem: key => seed.delete(key),
    setItem(key, value) { if (this.fail) throw Error('quota'); seed.set(key, value); } };
}
test('F1 failed settlement leaves durable result, wallet and grants at their previous transaction', async () => {
  globalThis.indexedDB = undefined; globalThis.localStorage = storage();
  const p = await import('../../js/persistence.js?achievements-failure');
  await p.loadPersistentGameData();
  assert(await p.savePersistentGameData({ coins: 20, appearance: {}, progress: allGames(certified([1], ['easy', 'normal', 'hard'])) }));
  const before = [...localStorage.seed.entries()]; localStorage.fail = true;
  assert.equal(await p.savePersistentGameData({ coins: 40, progress: allGames(certified([1])) }), false);
  assert.deepEqual([...localStorage.seed.entries()], before); assert.equal(p.getPersistenceStatus().blocked, true);
});
test('F1 archived chapter backfill and restore keep 300-coin receipts and bought items', async () => {
  globalThis.indexedDB = new IDBFactory(); globalThis.localStorage = storage();
  const bestByLevel = { ...certified(Array.from({ length: 100 }, (_, i) => i + 1), ['easy']), ...certified([1,2,3,4,5,6,7,8,9,10]) };
  const progress = allGames(bestByLevel); progress.gameplaySeason = 1;
  progress.memoryMatch.claimedChests = { 1: { rulesVersion: 1, tiers: {}, collection: { coins: 300 } } };
  localStorage.setItem('memoryMatchSave', JSON.stringify({ formatVersion: 1, revision: 1, data: {
    coins: 777, appearance: { ownedCardBacks: ['classic', 'midnight'] }, settings: {}, progress,
  } }));
  const p = await import('../../js/persistence.js?achievements-archive');
  const before = await p.loadPersistentGameData();
  assert.equal(before.progress.memoryMatch.adventure.currentChapter, 2);
  assert.equal(before.progress.memoryMatch.bestByLevel['normal:1'], undefined);
  assert(await p.backfillAchievementInventory());
  const first = await p.exportPersistentSnapshot();
  assert.equal(Object.keys(first.profile.data.appearance.achievements.grants).length, 30);
  assert.equal(first.profile.data.coins, 777);
  assert(first.profile.data.appearance.ownedCardBacks.includes('midnight'));
  assert.equal(first.chapters.find(entry => entry.key === 'memoryMatch:1').value.claimedChests[1].collection.coins, 300);
  assert(await p.backfillAchievementInventory()); assert.equal((await p.exportPersistentSnapshot()).profile.revision, first.profile.revision);
  assert(await p.importPersistentSnapshot(first, 'test', {}));
  const restored = await p.exportPersistentSnapshot();
  assert.deepEqual(restored.profile.data.appearance.achievements, first.profile.data.appearance.achievements);
  const old = structuredClone(first); delete old.profile.data.appearance.achievements; delete old.profile.data.appearance.profileCosmetics;
  assert(await p.importPersistentSnapshot(old, 'test', {}));
  assert.equal(pendingAchievements((await p.exportPersistentSnapshot()).profile.data.appearance).length, 0);
  const future = structuredClone(first); future.profile.data.appearance.achievements.version = 99;
  const revision = (await p.exportPersistentSnapshot()).profile.revision;
  await assert.rejects(() => p.importPersistentSnapshot(future, 'test', {}));
  assert.equal((await p.exportPersistentSnapshot()).profile.revision, revision);
});
