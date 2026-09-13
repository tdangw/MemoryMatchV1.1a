// 📦 Trạng thái thuần của game: không thao tác DOM hoặc localStorage ở đây.
import { GAME_CONFIG } from "./config.js";
import { normalizeAppearance } from "./appearance.js";
import { GAMEPLAY_LIMITS } from "./gameplayTuning.js";
import { GAME_MODES } from "./gameCatalog.js";
import { restoreSerializedTripleRoundState, serializeTripleRoundState } from "./tripleConnect/tripleState.js";

const GAME_MODE_IDS = new Set(GAME_MODES.map(({ id }) => id));

const {
  hints: defaultHints,
  timeSeconds: remainingTime,
  score: defaultScore,
} = GAME_CONFIG.initialState;
export const gameState = {
  currentLevel: 1,
  score: defaultScore,
  // Compatibility alias: gameplay and HUD always use the persistent inventory.
  get hints() { return this.progress.memoryMatch.items.hint; },
  set hints(value) { this.progress.memoryMatch.items.hint = normalizeItemCount(value); },
  moves: 0,
  misses: 0,
  combo: 0,
  specialProgress: 0,
  specialNoEnergyDropStreak: 0,
  pendingEnergyCollections: 0,
  matchedPairs: 0,
  totalPairs: GAME_CONFIG.modes.easy.tileCount / 2,
  isLocked: false,
  isPaused: false,
  roundId: 0,
  remainingTime: remainingTime,
  timeLimit: remainingTime,
  levelStartTime: remainingTime,
  coins: 0,
  progress: {
    memoryMatch: {
      totalStars: 0,
      totalScore: 0,
      bestByLevel: {},
      items: { hint: defaultHints, preview4: 0, preview8: 0, preview12: 0, previewAll: 0, time10: 0, time30: 0, time45: 0, time60: 0 },
    },
    linkConnect: {
      totalStars: 0,
      totalScore: 0,
      bestByLevel: {},
      items: { hint: 0, reshuffle: 0, thunder: 0, freeze: 0 },
    },
    tripleConnect: {
      totalStars: 0,
      totalScore: 0,
      bestByLevel: {},
      sessionsByMode: {},
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
    cardDescriptions: true,
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
  const memorySessions = normalizeSessions(memoryMatch.sessionsByMode, memoryMatch.activeSession);
  const legacyHints = Object.values(memorySessions).flatMap(session => Number.isFinite(session.hints) ? [session.hints] : []);
  // An explicit inventory count (including zero) is the migration marker.
  const hintCount = Object.hasOwn(memoryMatch.items || {}, "hint")
    ? normalizeItemCount(memoryMatch.items.hint)
    : legacyHints.length ? Math.max(...legacyHints) : defaultHints;
  for (const session of Object.values(memorySessions)) delete session.hints;
  gameState.progress.memoryMatch = {
    totalStars: normalizeNonNegativeInteger(memoryMatch.totalStars),
    totalScore: normalizeNonNegativeInteger(memoryMatch.totalScore),
    bestByLevel: normalizeBestByLevel(memoryMatch.bestByLevel),
    sessionsByMode: memorySessions,
    items: { ...normalizeMemoryItems(memoryMatch.items), hint: hintCount },
  };
  const linkConnect = progress?.linkConnect || {};
  const linkItems = linkConnect.items || {};
  gameState.progress.linkConnect = {
    totalStars: normalizeNonNegativeInteger(linkConnect.totalStars),
    totalScore: normalizeNonNegativeInteger(linkConnect.totalScore),
    bestByLevel: normalizeBestByLevel(linkConnect.bestByLevel),
    items: {
      hint: normalizeItemCount(linkItems.hint),
      reshuffle: normalizeItemCount(linkItems.reshuffle),
      thunder: normalizeItemCount(linkItems.thunder),
      freeze: normalizeItemCount(linkItems.freeze),
    },
    sessionsByMode: normalizeSessions(linkConnect.sessionsByMode, linkConnect.activeSession),
  };
  const tripleConnect = progress?.tripleConnect || {};
  gameState.progress.tripleConnect = {
    totalStars: normalizeNonNegativeInteger(tripleConnect.totalStars),
    totalScore: normalizeNonNegativeInteger(tripleConnect.totalScore),
    bestByLevel: normalizeBestByLevel(tripleConnect.bestByLevel),
    sessionsByMode: normalizeTripleSessions(tripleConnect.sessionsByMode),
  };
  gameState.settings = normalizeSettings(settings, gameState.settings);
  gameState.appearance = normalizeAppearance(appearance);
}

function normalizeMemoryItems(items = {}) {
  return Object.fromEntries(
    ["preview4", "preview8", "preview12", "previewAll", "time10", "time30", "time45", "time60"]
      .map((id) => [id, normalizeItemCount(items?.[id])]),
  );
}

function normalizeItemCount(value) {
  return Math.min(GAMEPLAY_LIMITS.itemCount, normalizeNonNegativeInteger(value));
}

function normalizeActiveSession(session) {
  if (!session || typeof session !== "object") return null;
  if (!GAME_MODE_IDS.has(session.mode)) return null;
  const level = Math.max(1, normalizeNonNegativeInteger(session.level) || 1);
  return {
    mode: session.mode,
    level,
    ...(typeof session.gravityShift === "string" ? { gravityShift: session.gravityShift } : {}),
    ...(Number.isFinite(session.specialProgress)
      ? { specialProgress: Math.max(0, Math.floor(session.specialProgress)) }
      : {}),
    ...(Number.isFinite(session.specialNoEnergyDropStreak)
      ? { specialNoEnergyDropStreak: Math.max(0, Math.floor(session.specialNoEnergyDropStreak)) }
      : {}),
    ...(Number.isFinite(session.remainingTime)
      ? { remainingTime: Math.max(0, Math.floor(session.remainingTime)) }
      : {}),
    ...(Number.isFinite(session.timeLimit)
      ? { timeLimit: Math.max(0, Math.floor(session.timeLimit)) }
      : {}),
    ...(Number.isFinite(session.levelStartTime)
      ? { levelStartTime: Math.max(0, Math.floor(session.levelStartTime)) }
      : {}),
    ...(Number.isFinite(session.hints)
      ? { hints: Math.min(GAMEPLAY_LIMITS.itemCount, Math.max(0, Math.floor(session.hints))) }
      : {}),
  };
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

function normalizeBestByLevel(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, result]) => {
    if (!result || typeof result !== "object" || Array.isArray(result)) return [];
    return [[key, {
      score: normalizeNonNegativeInteger(result.score),
      stars: Math.min(3, normalizeNonNegativeInteger(result.stars)),
    }]];
  }));
}

function normalizeSettings(value, fallback) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    mode: GAME_MODE_IDS.has(source.mode) ? source.mode : fallback.mode,
    sound: typeof source.sound === "boolean" ? source.sound : fallback.sound,
    music: typeof source.music === "boolean" ? source.music : fallback.music,
    soundVolume: normalizeRange(source.soundVolume, fallback.soundVolume, 0, 1),
    musicVolume: normalizeRange(source.musicVolume, fallback.musicVolume, 0, 1),
    meteorEffects: typeof source.meteorEffects === "boolean" ? source.meteorEffects : fallback.meteorEffects,
    boardCoordinates: typeof source.boardCoordinates === "boolean" ? source.boardCoordinates : fallback.boardCoordinates,
    cardDescriptions: typeof source.cardDescriptions === "boolean" ? source.cardDescriptions : fallback.cardDescriptions,
  };
}

function normalizeTripleSessions(sessions) {
  const source = sessions && typeof sessions === "object" ? sessions : {};
  return Object.fromEntries(Object.entries(source).flatMap(([mode, session]) => {
    if (!GAME_MODE_IDS.has(mode) || !session || typeof session !== "object") return [];
    try {
      const snapshot = serializeTripleRoundState(restoreSerializedTripleRoundState(session.snapshot));
      return [[mode, { mode, level: Math.max(1, normalizeNonNegativeInteger(session.level) || 1), snapshot }]];
    } catch { return []; }
  }));
}

function normalizeNonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}

function normalizeRange(value, fallback, minimum, maximum) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
}

// Mỗi bàn chơi có mã riêng để timeout của bàn cũ không thể sửa UI bàn mới.
export function beginRound() {
  gameState.roundId += 1;
  gameState.pendingEnergyCollections = 0;
  gameState.isLocked = true;
  gameState.isPaused = false;
  gameState._timeRunningOutPlayed = false;
  gameState.luckyAwards = [];
  return gameState.roundId;
}

export function invalidateRound() {
  gameState.roundId += 1;
  gameState.pendingEnergyCollections = 0;
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
  gameState.moves = 0;
  gameState.misses = 0;
  gameState.combo = 0;
  gameState.specialProgress = 0;
  gameState.specialNoEnergyDropStreak = 0;
  gameState.pendingEnergyCollections = 0;
  gameState.matchedPairs = 0;
  gameState.totalPairs = GAME_CONFIG.modes.easy.tileCount / 2;
  gameState.remainingTime = remainingTime;
  gameState.timeLimit = remainingTime;
  gameState.levelStartTime = remainingTime;
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
