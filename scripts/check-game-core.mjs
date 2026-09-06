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
import { formatClockTime, UI_COPY, UI_TIMING } from "../js/uiCatalog.js";
import { gameState, hydrateGameState, recordLinkConnectResult } from "../js/gameState.js";
import { GAMEPLAY_LIMITS } from "../js/gameplayTuning.js";
import { calculateMotionDelta, readCssTimeMs } from "../js/motion.js";

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
assert.equal(GAMEPLAY_LIMITS.itemCount, 999);
assert.equal(GAME_CONFIG.levelProgression.hintCap, 999);
assert.equal(LINK_CONNECT_CONFIG.levelProgression.hintCap, 999);

hydrateGameState({
  progress: {
    linkConnect: {
      totalStars: 2,
      totalScore: 120,
      bestByLevel: { "easy:1": { score: 120, stars: 2 } },
      items: { hint: 1200 },
      sessionsByMode: {
        easy: {
          mode: "easy",
          level: 4,
          gravityShift: "down",
          specialProgress: 7,
          specialNoEnergyDropStreak: 6,
        },
      },
    },
  },
});
assert.equal(gameState.progress.linkConnect.items.hint, 999);
assert.deepEqual(gameState.progress.linkConnect.sessionsByMode.easy, {
  mode: "easy",
  level: 4,
  gravityShift: "down",
  specialProgress: 7,
  specialNoEnergyDropStreak: 6,
});
const linkProgress = recordLinkConnectResult({ mode: "easy", level: 1, score: 150, stars: 3 });
assert.equal(linkProgress.totalStars, 3, "Link Connect chỉ cộng phần sao tăng thêm khi chơi lại màn.");
assert.equal(gameState.progress.linkConnect.totalScore, 150);
const repeatedLinkProgress = recordLinkConnectResult({ mode: "easy", level: 1, score: 140, stars: 2 });
assert.equal(repeatedLinkProgress.totalStars, 3, "Link Connect không được cộng trùng sao khi thành tích thấp hơn.");

assert.deepEqual(TIME_UP_PURCHASES, [
  { seconds: 1, price: 2 },
  { seconds: 5, price: 10 },
]);
assert.equal(
  new Set(TIME_UP_PURCHASES.map((purchase) => purchase.seconds)).size,
  TIME_UP_PURCHASES.length,
  "Gói mua thời gian không được trùng số giây.",
);
assert.equal(UI_TIMING.modalCloseMs, 180);
assert.deepEqual(
  calculateMotionDelta({ left: 120, top: 80 }, { left: 45, top: 20 }),
  { x: 75, y: 60 },
  "FLIP phải tính độ lệch từ DOMRect cũ sang DOMRect mới.",
);
assert.deepEqual(calculateMotionDelta(undefined, { left: 45, top: 20 }), { x: 0, y: 0 });
assert.equal(readCssTimeMs("1.5s", 0), 1500);
assert.equal(readCssTimeMs("720ms", 0), 720);
assert.equal(UI_COPY.timeUpPrompt, "<p>Chọn một cách để tiếp tục hành trình của bạn.</p>");
assert.equal(formatClockTime(65), "01:05");
assert.equal(formatClockTime(-1), "00:00");

console.log("Shared game catalog checks passed.");
