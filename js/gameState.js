// 📦 Trạng thái thuần của game: không thao tác DOM hoặc localStorage ở đây.
import { GAME_CONFIG } from "./config.js";

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
  matchedPairs: 0,
  totalPairs: GAME_CONFIG.modes.easy.tileCount / 2,
  isLocked: false,
  isPaused: false,
  roundId: 0,
  remainingTime: remainingTime,
  highScore: 0,
  coins: 0,
  settings: {
    mode: "easy",
    sound: true,
    music: true,
    soundVolume: 0.4,
    musicVolume: 0.35,
  },
  fromDefeat: false, // ➕ biến cờ xác định đang gọi từ trạng thái "thua"
};
gameState._timeRunningOutPlayed = false;

export function hydrateGameState({ highScore = 0, coins = 0, settings = {} } = {}) {
  gameState.highScore = Number.isFinite(highScore) ? highScore : 0;
  gameState.coins = Number.isFinite(coins) ? Math.max(0, Math.floor(coins)) : 0;
  Object.assign(gameState.settings, settings);
}

// Mỗi bàn chơi có mã riêng để timeout của bàn cũ không thể sửa UI bàn mới.
export function beginRound() {
  gameState.roundId += 1;
  gameState.isLocked = true;
  gameState.isPaused = false;
  gameState._timeRunningOutPlayed = false;
  return gameState.roundId;
}

export function invalidateRound() {
  gameState.roundId += 1;
  gameState.isLocked = true;
  gameState._timeRunningOutPlayed = false;
}

// 🔄 Reset toàn bộ game về trạng thái ban đầu
export function resetGame() {
  invalidateRound();
  gameState.currentLevel = 1;
  gameState.score = defaultScore;
  gameState.hints = defaultHints; // Lấy từ giá trị mặc định
  gameState.moves = 0;
  gameState.misses = 0;
  gameState.matchedPairs = 0;
  gameState.totalPairs = GAME_CONFIG.modes.easy.tileCount / 2;
  gameState.remainingTime = remainingTime;
  gameState.isLocked = true;
  gameState.isPaused = false;
  gameState.settings.mode = "easy";
}

// ➕ Cộng điểm + tự động cập nhật highscore
export function increaseScore(points) {
  gameState.score += points;
  let highScoreChanged = false;

  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    highScoreChanged = true;
  }

  return {
    score: gameState.score,
    highScore: gameState.highScore,
    highScoreChanged,
  };
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
