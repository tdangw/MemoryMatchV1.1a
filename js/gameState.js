// 📦 Trạng thái thuần của game: không thao tác DOM hoặc localStorage ở đây.
import { GAME_CONFIG } from "./config.js";
import { normalizeAppearance } from "./appearance.js";

const {
  hints: defaultHints,
  timeSeconds: remainingTime,
  score: defaultScore,
} = GAME_CONFIG.initialState;
export const gameState = {
  currentLevel: 1,
  score: defaultScore,
  hints: defaultHints, // Gắn theo biến gốc
  moves: 0,
  misses: 0,
  combo: 0,
  matchedPairs: 0,
  totalPairs: GAME_CONFIG.modes.easy.tileCount / 2,
  isLocked: false,
  isPaused: false,
  roundId: 0,
  remainingTime: remainingTime,
  coins: 0,
  appearance: normalizeAppearance(),
  settings: {
    mode: "easy",
    sound: true,
    music: true,
    soundVolume: 0.4,
    musicVolume: 0.35,
    meteorEffects: true,
  },
  fromDefeat: false, // ➕ biến cờ xác định đang gọi từ trạng thái "thua"
  luckyRewards: new Map(),
  luckyAwards: [],
};
gameState._timeRunningOutPlayed = false;

export function hydrateGameState({
  coins = 0,
  settings = {},
  appearance = {},
} = {}) {
  gameState.coins = Number.isFinite(coins) ? Math.max(0, Math.floor(coins)) : 0;
  Object.assign(gameState.settings, settings);
  gameState.appearance = normalizeAppearance(appearance);
}

// Mỗi bàn chơi có mã riêng để timeout của bàn cũ không thể sửa UI bàn mới.
export function beginRound() {
  gameState.roundId += 1;
  gameState.isLocked = true;
  gameState.isPaused = false;
  gameState._timeRunningOutPlayed = false;
  gameState.luckyAwards = [];
  return gameState.roundId;
}

export function invalidateRound() {
  gameState.roundId += 1;
  gameState.isLocked = true;
  gameState._timeRunningOutPlayed = false;
  gameState.luckyRewards.clear();
}

export function setLuckyRewards(rewards) {
  gameState.luckyRewards = new Map(rewards);
}

export function consumeLuckyReward(imageId) {
  const reward = gameState.luckyRewards.get(imageId);
  if (!reward) return null;
  gameState.luckyRewards.delete(imageId);
  return reward;
}

export function recordLuckyAward(reward) {
  gameState.luckyAwards.push(reward);
}

// 🔄 Reset toàn bộ game về trạng thái ban đầu
export function resetGame() {
  invalidateRound();
  gameState.currentLevel = 1;
  gameState.score = defaultScore;
  gameState.hints = defaultHints; // Lấy từ giá trị mặc định
  gameState.moves = 0;
  gameState.misses = 0;
  gameState.combo = 0;
  gameState.matchedPairs = 0;
  gameState.totalPairs = GAME_CONFIG.modes.easy.tileCount / 2;
  gameState.remainingTime = remainingTime;
  gameState.isLocked = true;
  gameState.isPaused = false;
  gameState.settings.mode = "easy";
}

// ➕ Cộng điểm trong lượt chơi hiện tại.
export function increaseScore(points) {
  gameState.score += points;
  return gameState.score;
}

export function increaseCoins(amount) {
  gameState.coins += Math.max(0, Math.floor(amount));
  return gameState.coins;
}

export function spendCoins(amount) {
  const cost = Math.max(0, Math.floor(amount));
  if (gameState.coins < cost) return false;
  gameState.coins -= cost;
  return true;
}
