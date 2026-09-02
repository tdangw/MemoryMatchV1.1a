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
  timeLimit: remainingTime,
  coins: 0,
  progress: {
    memoryMatch: { totalStars: 0, totalScore: 0, bestByLevel: {} },
    linkConnect: {
      totalStars: 0,
      totalScore: 0,
      bestByLevel: {},
      items: { hint: 0, reshuffle: 0, thunder: 0, freeze: 0 },
    },
  },
  appearance: normalizeAppearance(),
  settings: {
    mode: "easy",
    sound: true,
    music: true,
    soundVolume: 0.4,
    musicVolume: 0.35,
    meteorEffects: true,
    boardCoordinates: false,
  },
  fromDefeat: false, // ➕ biến cờ xác định đang gọi từ trạng thái "thua"
  luckyRewards: new Map(),
  luckyAwards: [],
};
gameState._timeRunningOutPlayed = false;

export function hydrateGameState({
  coins = 0,
  progress = {},
  settings = {},
  appearance = {},
} = {}) {
  gameState.coins = Number.isFinite(coins) ? Math.max(0, Math.floor(coins)) : 0;
  const memoryMatch = progress?.memoryMatch || {};
  gameState.progress.memoryMatch = {
    totalStars: Math.max(0, Math.floor(memoryMatch.totalStars || 0)),
    totalScore: Math.max(0, Math.floor(memoryMatch.totalScore || 0)),
    bestByLevel: typeof memoryMatch.bestByLevel === "object" && memoryMatch.bestByLevel ? memoryMatch.bestByLevel : {},
    sessionsByMode: normalizeSessions(memoryMatch.sessionsByMode, memoryMatch.activeSession),
  };
  const linkConnect = progress?.linkConnect || {};
  const linkItems = linkConnect.items || {};
  gameState.progress.linkConnect = {
    totalStars: Math.max(0, Math.floor(linkConnect.totalStars || 0)),
    totalScore: Math.max(0, Math.floor(linkConnect.totalScore || 0)),
    bestByLevel: typeof linkConnect.bestByLevel === "object" && linkConnect.bestByLevel ? linkConnect.bestByLevel : {},
    items: {
      hint: Math.max(0, Math.floor(linkItems.hint || 0)),
      reshuffle: Math.max(0, Math.floor(linkItems.reshuffle || 0)),
      thunder: Math.max(0, Math.floor(linkItems.thunder || 0)),
      freeze: Math.max(0, Math.floor(linkItems.freeze || 0)),
    },
    sessionsByMode: normalizeSessions(linkConnect.sessionsByMode, linkConnect.activeSession),
  };
  Object.assign(gameState.settings, settings);
  gameState.appearance = normalizeAppearance(appearance);
}

function normalizeActiveSession(session) {
  if (!session || typeof session !== "object") return null;
  if (typeof session.mode !== "string") return null;
  const level = Math.max(1, Math.floor(session.level || 1));
  return { mode: session.mode, level };
}

function normalizeSessions(sessions, legacySession) {
  const source = sessions && typeof sessions === "object" ? sessions : {};
  const normalized = Object.fromEntries(
    Object.entries(source)
      .map(([mode, session]) => [mode, normalizeActiveSession(session)])
      .filter(([, session]) => session),
  );
  const legacy = normalizeActiveSession(legacySession);
  if (legacy && !normalized[legacy.mode]) normalized[legacy.mode] = legacy;
  return normalized;
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
  gameState.timeLimit = remainingTime;
  gameState.isLocked = true;
  gameState.isPaused = false;
  gameState.settings.mode = "easy";
}

// ➕ Cộng điểm trong lượt chơi hiện tại.
export function increaseScore(points) {
  gameState.score += points;
  return gameState.score;
}

export function recordMemoryMatchResult({ mode, level, score, stars }) {
  const progress = gameState.progress.memoryMatch;
  const key = `${mode}:${level}`;
  const previous = progress.bestByLevel[key] || { score: 0, stars: 0 };
  const nextScore = Math.max(previous.score || 0, score);
  const nextStars = Math.max(previous.stars || 0, stars);
  progress.totalScore += nextScore - (previous.score || 0);
  progress.totalStars += nextStars - (previous.stars || 0);
  progress.bestByLevel[key] = { score: nextScore, stars: nextStars };
  return { totalStars: progress.totalStars, isNewBest: score > (previous.score || 0) || stars > (previous.stars || 0) };
}

export function recordLinkConnectResult({ mode, level, score, stars }) {
  const progress = gameState.progress.linkConnect;
  const key = `${mode}:${level}`;
  const previous = progress.bestByLevel[key] || { score: 0, stars: 0 };
  const nextScore = Math.max(previous.score || 0, score);
  const nextStars = Math.max(previous.stars || 0, stars);
  progress.totalScore += nextScore - (previous.score || 0);
  progress.totalStars += nextStars - (previous.stars || 0);
  progress.bestByLevel[key] = { score: nextScore, stars: nextStars };
  return { totalStars: progress.totalStars, isNewBest: score > (previous.score || 0) || stars > (previous.stars || 0) };
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
