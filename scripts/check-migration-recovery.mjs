import assert from "node:assert/strict";
import { IDBFactory, IDBObjectStore } from "fake-indexeddb";
import { openChapterDatabase, readChapterProfile } from "../js/chapterStore.js";

function fixture(coins) {
  const original = JSON.stringify({ formatVersion: 1, revision: 9, updatedAt: 1, data: {
    coins, settings: {}, appearance: {}, progress: { memoryMatch: { bestByLevel: { "easy:3": { score: 10, stars: 0 } } } },
  } });
  const values = new Map([["memoryMatchSave", original]]);
  globalThis.localStorage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  globalThis.indexedDB = new IDBFactory();
  return { values, original, factory: globalThis.indexedDB };
}

const first = fixture(42);
const put = IDBObjectStore.prototype.put;
IDBObjectStore.prototype.put = function (...args) {
  if (this.name === "profile") throw new DOMException("Migration quota failure", "QuotaExceededError");
  return put.apply(this, args);
};
const failed = await import("../js/persistence.js?migration-abort");
assert.equal((await failed.loadPersistentGameData()).coins, 0);
assert.equal(failed.getPersistenceStatus().blocked, true);
assert.equal(first.values.get("memoryMatchSave"), first.original);
assert.equal(first.values.get("memoryMatchChapterBackend"), "migrating");
IDBObjectStore.prototype.put = put;
const retried = await import("../js/persistence.js?migration-retry");
const recovered = await retried.loadPersistentGameData();
assert.equal(recovered.coins, 42);
assert.equal(recovered.progress.memoryMatch.adventure.unlockedThrough, 1);
assert.equal(first.values.get("memoryMatchSave"), first.original);
assert.equal(first.values.get("memoryMatchChapterBackend"), "1");
const repeated = await import("../js/persistence.js?migration-idempotent");
assert.equal((await repeated.loadPersistentGameData()).coins, 42);
assert.equal(repeated.getPersistenceStatus().revision, 1, "Loading an already migrated profile must not migrate/write it again.");

const second = fixture(77);
globalThis.localStorage.setItem = (key, value) => {
  if (key === "memoryMatchChapterBackend" && value === "1") throw new Error("Marker acknowledgment failure");
  second.values.set(key, value);
};
const incompleteAcknowledgment = await import("../js/persistence.js?marker-acknowledgment-failure");
await incompleteAcknowledgment.loadPersistentGameData();
assert.equal(incompleteAcknowledgment.getPersistenceStatus().blocked, true);
const database = await openChapterDatabase();
assert.equal((await readChapterProfile(database)).data.coins, 77, "The completed IDB transaction is retained despite a later marker acknowledgment failure.");
database.close();
assert.equal(second.values.get("memoryMatchChapterBackend"), "migrating", "The fallback barrier must already be durable before committing IDB.");
globalThis.indexedDB = undefined;
const unavailable = await import("../js/persistence.js?after-marker-acknowledgment-failure");
assert.equal((await unavailable.loadPersistentGameData()).coins, 0);
assert.equal(await unavailable.saveCoins(99), false);
assert.equal(second.values.get("memoryMatchSave"), second.original);
globalThis.indexedDB = second.factory;
globalThis.localStorage.setItem = (key, value) => second.values.set(key, value);
const resumed = await import("../js/persistence.js?authoritative-recovery");
assert.equal((await resumed.loadPersistentGameData()).coins, 77);
console.log("Interrupted migration, idempotent retry, durable primary barrier and marker acknowledgment failure checks passed.");
