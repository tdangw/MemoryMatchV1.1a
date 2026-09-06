import assert from "node:assert/strict";

class MemoryStorage {
  constructor(entries = {}) {
    this.values = new Map(Object.entries(entries));
    this.failWrites = false;
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    if (this.failWrites) throw new Error("Quota exceeded");
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

const storage = new MemoryStorage({
  coins: "42",
  soundVolume: "0.6",
  progress: JSON.stringify({ memoryMatch: { totalStars: 3 } }),
});
globalThis.localStorage = storage;

const persistence = await import("../js/persistence.js");
const { gameState } = await import("../js/gameState.js");
const { saveActiveSession, getActiveSession } = await import("../js/sessionProgress.js");
const { buyLinkItem } = await import("../js/linkConnect/linkItems.js");

const migrated = persistence.loadPersistentGameData();
assert.equal(migrated.coins, 42);
assert.equal(migrated.settings.soundVolume, 0.6);
let envelope = JSON.parse(storage.getItem("memoryMatchSave"));
assert.equal(envelope.schemaVersion, persistence.SAVE_SCHEMA_VERSION);
assert.equal(envelope.revision, 1);

gameState.progress.memoryMatch.sessionsByMode = {};
assert.equal(saveActiveSession("memory-match", {
  mode: "challenge",
  level: 4,
  remainingTime: 37,
  timeLimit: 55,
  levelStartTime: 48,
}), true);
assert.deepEqual(getActiveSession("memory-match", "challenge"), {
  mode: "challenge",
  level: 4,
  remainingTime: 37,
  timeLimit: 55,
  levelStartTime: 48,
});
envelope = JSON.parse(storage.getItem("memoryMatchSave"));
assert.equal(envelope.data.progress.memoryMatch.sessionsByMode.challenge.remainingTime, 37);

gameState.coins = 100;
gameState.progress.linkConnect.items.hint = 0;
storage.failWrites = true;
assert.equal(buyLinkItem("hint"), false);
assert.equal(gameState.coins, 100);
assert.equal(gameState.progress.linkConnect.items.hint, 0);
storage.failWrites = false;
const revisionBeforePurchase = JSON.parse(storage.getItem("memoryMatchSave")).revision;
assert.equal(buyLinkItem("hint"), true);
assert.equal(gameState.coins, 92);
assert.equal(gameState.progress.linkConnect.items.hint, 1);
assert.equal(
  JSON.parse(storage.getItem("memoryMatchSave")).revision,
  revisionBeforePurchase + 1,
  "Mua vật phẩm phải ghi Xu và tồn kho trong cùng một revision.",
);

const beforeFailedSave = storage.getItem("memoryMatchSave");
storage.failWrites = true;
assert.equal(persistence.saveCoins(7), false);
assert.equal(storage.getItem("memoryMatchSave"), beforeFailedSave);
storage.failWrites = false;

envelope = JSON.parse(storage.getItem("memoryMatchSave"));
const externalEnvelope = { ...envelope, revision: envelope.revision + 1, data: { ...envelope.data, coins: 777 } };
storage.setItem("memoryMatchSave", JSON.stringify(externalEnvelope));
assert.equal(persistence.saveCoins(1), false);
assert.equal(JSON.parse(storage.getItem("memoryMatchSave")).data.coins, 777);

const futureStorage = new MemoryStorage({
  memoryMatchSave: JSON.stringify({ schemaVersion: 99, revision: 8, data: { coins: 900 } }),
});
globalThis.localStorage = futureStorage;
const futurePersistence = await import(`../js/persistence.js?future=${Date.now()}`);
futurePersistence.loadPersistentGameData();
assert.equal(futurePersistence.saveCoins(1), false);
assert.equal(JSON.parse(futureStorage.getItem("memoryMatchSave")).schemaVersion, 99);

console.log("Persistence and transaction checks passed.");
