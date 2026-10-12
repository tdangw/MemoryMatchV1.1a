import assert from "node:assert/strict";
import { indexedDB } from "fake-indexeddb";
import { openChapterDatabase, writeChapterProfile, readChapterProfile, hydrateChapterProfile, readChapter } from "../js/chapterStore.js";
globalThis.indexedDB = indexedDB;
const database = await openChapterDatabase();
const bestByLevel = {};
for (let level = 1; level <= 1200; level++) bestByLevel[`easy:${level}`] = { score: level, stars: level % 4 };
bestByLevel["challenge:7"] = { score: 777, stars: 3 };
bestByLevel["easy:900000"] = { score: 10, stars: 1 };
const legacy = {
  formatVersion: 2, revision: 1, updatedAt: 1,
  data: { coins: 777, appearance: { ownedThemes: ["retained"] }, settings: { sound: false }, progress: {
    themeSelectionHistory: { retained: [["a", "b"]] },
    memoryMatch: { totalScore: 12345, totalStars: 3000, bestByLevel, items: { hint: 8 }, sessionsByMode: {
      easy: null, normal: { mode: "normal", level: 300, remainingTime: 99 },
    }, claimedChests: { 1: { packId: "small", grants: [{ type: "coins", amount: 83 }] } } },
  } },
};
await writeChapterProfile(database, legacy, 0, { migration: true });
const profile = await readChapterProfile(database);
assert.equal(profile.data.progress.memoryMatch.adventure.currentChapter, 13);
assert.equal(profile.data.progress.memoryMatch.totalScore, 12345);
assert.equal(profile.data.progress.memoryMatch.bestByLevel, undefined, "Root profile must not contain historical records.");
const hydrated = await hydrateChapterProfile(database, profile);
assert.equal(hydrated.coins, 777);
assert.deepEqual(hydrated.appearance, legacy.data.appearance);
assert.equal(Object.keys(hydrated.progress.memoryMatch.bestByLevel).length, 100, "Only frontier/session chapters are resident; sparse far-future history is not hydrated.");
assert.equal((await readChapter(database, "memoryMatch", 1)).bestByLevel["challenge:7"].score, 777);
assert.deepEqual((await readChapter(database, "memoryMatch", 1)).claimedChests[1], legacy.data.progress.memoryMatch.claimedChests[1]);
assert.equal((await readChapter(database, "memoryMatch", 9000)).bestByLevel["easy:900000"].stars, 1);

const patch = structuredClone(profile);
patch.revision = 2;
patch.data.coins += 90;
patch.data.progress.memoryMatch.bestByLevel = {};
patch.data.progress.memoryMatch.claimedChests = { 2: { packId: "small", grants: [{ type: "coins", amount: 90 }] } };
await writeChapterProfile(database, patch, 1);
assert.equal((await readChapterProfile(database)).data.coins, 867);
assert.equal((await readChapter(database, "memoryMatch", 1)).claimedChests[2].grants[0].amount, 90);
assert.equal((await readChapter(database, "memoryMatch", 1)).bestByLevel["easy:1"].score, 1, "Saving a sparse cache must preserve archived records.");
const stale = structuredClone(patch);
stale.revision = 3;
stale.data.coins = 99999;
await assert.rejects(writeChapterProfile(database, stale, 1), /tab khác/);
assert.equal((await readChapterProfile(database)).data.coins, 867, "Conflict must abort the entire profile/chapter transaction.");
const corruptTransaction = database.transaction("profile", "readwrite");
const corruptDone = new Promise((resolve, reject) => { corruptTransaction.oncomplete = resolve; corruptTransaction.onabort = reject; });
corruptTransaction.objectStore("profile").put({ ...profile, formatVersion: 1 }, "active");
await corruptDone;
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const corruptPrimary = await import("../js/persistence.js?corrupt-primary-check");
assert.equal((await corruptPrimary.loadPersistentGameData()).coins, 0);
assert.equal(corruptPrimary.getPersistenceStatus().blocked, true);
assert.equal(await corruptPrimary.saveCoins(99999), false);
assert.equal((await readChapterProfile(database)).formatVersion, 1, "An unsupported primary profile is preserved and cannot be unblocked by reading it again.");
database.close();
console.log("Chapter migration, bounded hydration, archived records, atomic wallet/claim and revision conflict checks passed.");
