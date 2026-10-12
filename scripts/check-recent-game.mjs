import assert from "node:assert/strict";
import "fake-indexeddb/auto";

const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) };
const { loadPersistentGameData } = await import("../js/persistence.js");
const { hydrateGameState, gameState } = await import("../js/gameState.js");
const { getRecentGameId, rememberRecentGame } = await import("../js/recentGame.js");
const { setCatalogTab } = await import("../js/catalogPreferences.js");
hydrateGameState(await loadPersistentGameData());
assert.equal(getRecentGameId(), "memory-match");
assert.deepEqual(await Promise.all([
  rememberRecentGame("link-connect"),
  setCatalogTab("link-connect", "shop", "themes"),
]), [true, true]);
const data = await loadPersistentGameData();
assert.equal(data.settings.lastPlayedGameId, "link-connect");
assert.equal(data.settings.catalogTabs["link-connect:shop"], "themes");
assert.equal(gameState.settings.lastPlayedGameId, "link-connect");
await rememberRecentGame("triple-connect");
hydrateGameState(await loadPersistentGameData());
assert.equal(getRecentGameId(), "triple-connect");
console.log("Recent game defaults, reload and concurrent catalog settings writes passed.");
