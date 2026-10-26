import assert from "node:assert/strict";

class MemoryStorage {
  constructor(entries = {}) {
    this.values = new Map(Object.entries(entries));
    this.failWrites = false;
  }

  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) {
    if (this.failWrites) throw new Error("Quota exceeded");
    this.values.set(key, String(value));
  }
  removeItem(key) { this.values.delete(key); }
}

const createEnvelope = (revision, data = {}) => ({
  formatVersion: 1,
  revision,
  updatedAt: 1,
  data: { coins: 42, appearance: {}, progress: {}, settings: {}, ...data },
});
const storage = new MemoryStorage({ memoryMatchSave: JSON.stringify(createEnvelope(1)) });
globalThis.localStorage = storage;

const persistence = await import("../js/persistence.js");
const { gameState } = await import("../js/gameState.js");
const { commitThemeSession, saveActiveSession, getActiveSession } = await import("../js/sessionProgress.js");
const { buyLinkItem } = await import("../js/linkConnect/linkItems.js");

const current = await persistence.loadPersistentGameData();
assert.equal(current.coins, 42);
assert.equal(persistence.SAVE_FORMAT_VERSION, 2);
assert.equal(JSON.parse(storage.getItem("memoryMatchSave")).formatVersion, 1, "Loading must preserve the migration source.");

gameState.progress.memoryMatch.sessionsByMode = {};
assert.equal(await saveActiveSession("memory-match", {
  mode: "challenge", level: 4, remainingTime: 37, timeLimit: 55, levelStartTime: 48,
}), true);
assert.deepEqual(getActiveSession("memory-match", "challenge"), {
  mode: "challenge", level: 4, remainingTime: 37, timeLimit: 55, levelStartTime: 48,
});

gameState.progress.themeSelectionHistory = { alphabet: [["generated:alphabet:A"]] };
const beforeThemeCommit = structuredClone(gameState.progress);
storage.failWrites = true;
assert.equal(await commitThemeSession("memory-match", {
  mode: "easy", level: 1, assetPaths: ["generated:alphabet:B"],
}, "alphabet", ["generated:alphabet:B"]), false);
assert.deepEqual(gameState.progress, beforeThemeCommit, "Failed board persistence must roll back session and history together.");
storage.failWrites = false;
await persistence.loadPersistentGameData();
assert.equal(await commitThemeSession("memory-match", {
  mode: "easy", level: 1, assetPaths: ["generated:alphabet:B"],
}, "alphabet", ["generated:alphabet:B"]), true);
assert.deepEqual(gameState.progress.themeSelectionHistory.alphabet[0], ["generated:alphabet:B"]);
assert.deepEqual(getActiveSession("memory-match", "easy").assetPaths, ["generated:alphabet:B"]);

gameState.coins = 100;
gameState.progress.linkConnect.items.hint = 0;
storage.failWrites = true;
assert.equal(await buyLinkItem("hint"), false);
assert.equal(gameState.coins, 100);
assert.equal(gameState.progress.linkConnect.items.hint, 0);
storage.failWrites = false;
await persistence.loadPersistentGameData();
const revisionBeforePurchase = JSON.parse(storage.getItem("memoryMatchSave")).revision;
assert.equal(await buyLinkItem("hint"), true);
assert.equal(gameState.coins, 42);
assert.equal(gameState.progress.linkConnect.items.hint, 1);
assert.equal(JSON.parse(storage.getItem("memoryMatchSave")).revision, revisionBeforePurchase + 1);

const beforeFailedSave = storage.getItem("memoryMatchSave");
storage.failWrites = true;
assert.equal(await persistence.saveCoins(7), false);
assert.equal(storage.getItem("memoryMatchSave"), beforeFailedSave);
storage.failWrites = false;
await persistence.loadPersistentGameData();

const invalidCases = [
  "{bad json",
  JSON.stringify({ schemaVersion: 1, revision: 2, data: {} }),
  JSON.stringify({ formatVersion: 99, revision: 2, data: {} }),
  JSON.stringify({ formatVersion: 1, revision: 2, data: { coins: 2, appearance: {}, progress: {} } }),
];
for (const serialized of invalidCases) {
  storage.setItem("memoryMatchSave", serialized);
  assert.deepEqual(await persistence.loadPersistentGameData(), { coins: 0, appearance: {}, progress: {}, settings: {} });
  assert.equal(storage.getItem("memoryMatchSave"), serialized, "Invalid saves must not be rewritten during load.");
  assert.equal(await persistence.saveCoins(7), false, "Unknown or corrupt data must block writes instead of being overwritten.");
  assert.equal(await persistence.clearPersistentGameData(), true);
  await persistence.loadPersistentGameData();
  assert.equal(await persistence.saveCoins(7), true);
  const repaired = JSON.parse(storage.getItem("memoryMatchSave"));
  assert.equal(repaired.formatVersion, persistence.SAVE_FORMAT_VERSION);
  assert.equal(repaired.data.coins, 7);
}

const envelope = JSON.parse(storage.getItem("memoryMatchSave"));
const externalEnvelope = { ...envelope, revision: envelope.revision + 1, data: { ...envelope.data, coins: 777 } };
storage.setItem("memoryMatchSave", JSON.stringify(externalEnvelope));
assert.equal(await persistence.saveCoins(1), false);
assert.equal(JSON.parse(storage.getItem("memoryMatchSave")).data.coins, 777);

await persistence.loadPersistentGameData();
assert.equal(await persistence.savePersistentGameData({ settings: { sound: true, music: true } }), true);
assert.deepEqual(await Promise.all([persistence.saveSetting('sound', false), persistence.saveSetting('music', false)]), [true, true]);
assert.deepEqual((await persistence.loadPersistentGameData()).settings, { sound: false, music: false });
const durableBeforeFailure = storage.getItem('memoryMatchSave');
storage.failWrites = true;
assert.deepEqual(await Promise.all([persistence.saveCoins(1000), persistence.saveCoins(2000)]), [false, false]);
assert.equal(storage.getItem('memoryMatchSave'), durableBeforeFailure, 'Dependent queued snapshots cannot commit after their predecessor failed.');
assert.equal(persistence.getPersistenceStatus().blocked, true);
const authoritativeMarkerStorage = new MemoryStorage({
  memoryMatchSave: JSON.stringify(createEnvelope(1, { coins: 12 })),
  memoryMatchChapterBackend: "5",
});
globalThis.localStorage = authoritativeMarkerStorage;
const unavailablePrimary = await import("../js/persistence.js?unavailable-primary-check");
assert.equal((await unavailablePrimary.loadPersistentGameData()).coins, 0);
assert.equal(unavailablePrimary.getPersistenceStatus().blocked, true);
assert.equal(await unavailablePrimary.saveCoins(13), false);
assert.equal(JSON.parse(authoritativeMarkerStorage.getItem("memoryMatchSave")).data.coins, 12, "Unavailable primary must never resume writing a stale legacy backup.");
console.log('Persistence migration source preservation, failure recovery, queued settings and fail-closed transactions passed.');
