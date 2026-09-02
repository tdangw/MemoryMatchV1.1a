import assert from "node:assert/strict";
import { GAME_CONFIG } from "../js/config.js";
import {
  GAME_DEFINITIONS,
  GAME_MODES,
  getGameModeIcon,
  getGameModeLabel,
  getGameProgressKey,
} from "../js/gameCatalog.js";
import { LINK_CONNECT_CONFIG } from "../js/linkConnect/linkConfig.js";
import { TIME_UP_PURCHASES } from "../js/shopCatalog.js";

const modeIds = GAME_MODES.map((mode) => mode.id);

assert.deepEqual(modeIds, [
  "easy",
  "normal",
  "hard",
  "superHard",
  "endless",
  "challenge",
]);
assert.equal(new Set(modeIds).size, modeIds.length, "Mode id phải là duy nhất.");
assert.equal(getGameModeLabel("superHard"), "Siêu khó");
assert.equal(getGameModeIcon("challenge"), "trophy");
assert.equal(getGameProgressKey("memory-match"), "memoryMatch");
assert.equal(getGameProgressKey("link-connect"), "linkConnect");
assert.equal(getGameProgressKey("unknown-game"), null);
assert.equal(new Set(GAME_DEFINITIONS.map((game) => game.id)).size, GAME_DEFINITIONS.length);

assert.deepEqual(Object.keys(GAME_CONFIG.modes), modeIds);
assert.deepEqual(Object.keys(LINK_CONNECT_CONFIG.modes), modeIds);

assert.deepEqual(TIME_UP_PURCHASES, [
  { seconds: 1, price: 2 },
  { seconds: 5, price: 10 },
]);
assert.equal(
  new Set(TIME_UP_PURCHASES.map((purchase) => purchase.seconds)).size,
  TIME_UP_PURCHASES.length,
  "Gói mua thời gian không được trùng số giây.",
);

console.log("Shared game catalog checks passed.");
