// 📦 Trạng thái thuần của game: không thao tác DOM hoặc localStorage ở đây.
import { GAME_CONFIG } from "./config.js";
import { normalizeAppearance } from "./appearance.js";
import { GAMEPLAY_LIMITS } from "./gameplayTuning.js";
import { GAME_MODES } from "./gameCatalog.js";
import { restoreSerializedTripleRoundState, serializeTripleRoundState } from "./tripleConnect/tripleState.js";
import { getTripleLayout } from "./tripleConnect/tripleBoard.js";
import { getTripleTrayCapacity, normalizeTripleTrayExpansionSlots, TRIPLE_PRODUCT_DECISIONS } from "./tripleConnect/tripleConfig.js";
import { normalizeTripleMilestones } from "./tripleConnect/tripleMilestones.js";
import { getThemeSelectionManifest } from "./themeCatalog.js";
import { appendThemeSelectionHistory, normalizeThemeSelectionHistory } from "./themeSelection.js";
import { getAdventureSummary, isCompletedLevelResult, isNormalAdventureMode, MAX_ADVENTURE_CHAPTER } from "./adventureProgress.js";
import { normalizePlayMetrics, getActivePlayMetrics } from "./playMetrics.js";
import { normalizeRankedRun, normalizeRunBestsV2, recordLevelCheckpoint } from "./rankingRules.js";
import { getRankingOwner } from './rankingOwner.js';
import { validateRankingResult } from './rankingResult.js';
import { normalizeProgressBests, normalizeProgressMigration } from './progressRankingModel.js';
import { MASTERY_DIFFICULTIES, hasCertifiedCompletion, getMasteryBlock } from './progression/difficultyProgress.js';
import { normalizePairSnapshot } from './pairSessionSnapshot.js';
import { normalizeWaveProgress } from './progression/waveProgress.js';
import { normalizeUiSkin } from './uiSkinController.js';
import { normalizeTutorialProgress } from './tutorial/tutorialModel.js';

const GAME_MODE_IDS = new Set(GAME_MODES.map(({ id }) => id));

const {
  hints: defaultHints,
  timeSeconds: remainingTime,
  score: defaultScore,
} = GAME_CONFIG.initialState;
export const gameState = {
  currentLevel: 1,
  score: defaultScore,
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
    themeSelectionHistory: {},
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
      items: { hint: TRIPLE_PRODUCT_DECISIONS.initialItems.hint, time: 0, undo: 0, shuffle: 0 },
      trayExpansionSlots: 0,
      trayExpansionOwned: false,
      sessionsByMode: {},
      milestones: { version: TRIPLE_PRODUCT_DECISIONS.milestones.version, progress: 0, cycleId: 0, claimedIds: [] },
    },
  },
  appearance: normalizeAppearance(),
  settings: {
    uiSkin: 'default',
    tutorialProgress: normalizeTutorialProgress(),
    mode: "easy",
    sound: true,
    music: true,
    soundVolume: 0.4,
    musicVolume: 0.35,
    meteorEffects: true,
    boardCoordinates: false,
    cardDescriptions: true,
    catalogTabs: {},
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
  gameState.progress.gameplaySeason = progress.gameplaySeason;
  const memoryMatch = progress?.memoryMatch || {};
  gameState.progress.themeSelectionHistory = normalizeThemeSelectionHistory(
    progress?.themeSelectionHistory,
    getThemeSelectionManifest(),
  );
  gameState.progress.levelRankingMigration = normalizeProgressMigration(progress.levelRankingMigration) || undefined;
  const memorySessions = normalizeSessions(memoryMatch.sessionsByMode, "memory-match");
  gameState.progress.memoryMatch = {
    totalStars: normalizeNonNegativeInteger(memoryMatch.totalStars),
    totalScore: normalizeNonNegativeInteger(memoryMatch.totalScore),
    bestByLevel: normalizeBestByLevel(memoryMatch.bestByLevel),
    sessionsByMode: memorySessions,
    items: normalizeMemoryItems(memoryMatch.items),
    ...normalizeAdventure(memoryMatch, "memory-match"),
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
    sessionsByMode: normalizeSessions(linkConnect.sessionsByMode, "link-connect"),
    ...normalizeAdventure(linkConnect, "link-connect"),
  };
  const tripleConnect = progress?.tripleConnect || {};
  const trayExpansionSlots = normalizeTripleTrayExpansionSlots(
    tripleConnect.trayExpansionSlots ?? (tripleConnect.trayExpansionOwned === true
      ? TRIPLE_PRODUCT_DECISIONS.trayExpansion.bonusCapacity
      : 0),
  );
  gameState.progress.tripleConnect = {
    totalStars: normalizeNonNegativeInteger(tripleConnect.totalStars),
    totalScore: normalizeNonNegativeInteger(tripleConnect.totalScore),
    bestByLevel: normalizeBestByLevel(tripleConnect.bestByLevel),
    items: normalizeTripleItems(tripleConnect.items),
    trayExpansionSlots,
    trayExpansionOwned: trayExpansionSlots === TRIPLE_PRODUCT_DECISIONS.trayExpansion.bonusCapacity,
    sessionsByMode: normalizeTripleSessions(
      tripleConnect.sessionsByMode,
      getTripleTrayCapacity(trayExpansionSlots),
    ),
    milestones: normalizeTripleMilestones(tripleConnect.milestones),
    ...normalizeAdventure(tripleConnect, "triple-connect"),
  };
  gameState.settings = normalizeSettings(settings, gameState.settings);
  gameState.appearance = normalizeAppearance(appearance);
}

export function commitThemeSelectionHistory(themeId, assets) {
  gameState.progress.themeSelectionHistory = appendThemeSelectionHistory(
    gameState.progress.themeSelectionHistory,
    themeId,
    assets,
  );
  return gameState.progress.themeSelectionHistory;
}

function normalizeMemoryItems(items = {}) {
  return Object.fromEntries(
    ["hint", "preview4", "preview8", "preview12", "previewAll", "time10", "time30", "time45", "time60"]
      .map((id) => [id, normalizeItemCount(items?.[id])]),
  );
}

function normalizeItemCount(value) {
  return Math.min(GAMEPLAY_LIMITS.itemCount, normalizeNonNegativeInteger(value));
}

function normalizeActiveSession(session, gameId) {
  if (!session || typeof session !== "object") return null;
  if (!GAME_MODE_IDS.has(session.mode)) return null;
  const level = Math.max(1, normalizeNonNegativeInteger(session.level) || 1);
  const pairSnapshot = normalizePairSnapshot(session.pairSnapshot, gameId);
  const wave = session.wave ? normalizeWaveProgress(session.wave, { gameId, mode: session.mode, level, groupsPerWave: pairSnapshot?.totalPairs }) : null;
  return {
    mode: session.mode,
    ...(session.waveInvalid ? { waveInvalid: true } : session.wave ? (wave
      ? { wave }
      : { waveInvalid: true }) : {}),
    ...(session.pairSnapshotInvalid || session.pairSnapshot && !normalizePairSnapshot(session.pairSnapshot, gameId) ? { pairSnapshotInvalid: true, pairSnapshotSource: structuredClone(session.pairSnapshotSource || session.pairSnapshot) } : {}),
    ...(pairSnapshot ? { pairSnapshot } : {}),
    ...(normalizePlayMetrics(session.metrics) ? { metrics: normalizePlayMetrics(session.metrics) } : {}),
    ...(normalizeRankedRun(session.run, { gameId, mode: session.mode, level })
      ? { run: normalizeRankedRun(session.run, { gameId, mode: session.mode, level }) } : {}),
    level,
    ...(typeof session.gravityShift === "string" ? { gravityShift: session.gravityShift } : {}),
    ...(Number.isFinite(session.hints) ? { hints: normalizeItemCount(session.hints) } : {}),
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
    ...(Array.isArray(session.assetPaths)
      ? { assetPaths: normalizeAssetPaths(session.assetPaths) }
      : {}),
  };
}

function normalizeSessions(sessions, gameId) {
  const source = sessions && typeof sessions === "object" ? sessions : {};
  const normalized = Object.fromEntries(
    Object.entries(source)
      .map(([mode, session]) => [mode, normalizeActiveSession(session, gameId)])
      .filter(([, session]) => session),
  );
  return normalized;
}

function normalizeBestByLevel(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, result]) => {
    if (!result || typeof result !== "object" || Array.isArray(result)) return [];
    if (isNormalAdventureMode(key.split(":")[0]) && !isCompletedLevelResult(result)) return [];
    return [[key, {
      score: normalizeNonNegativeInteger(result.score),
      stars: Math.min(3, normalizeNonNegativeInteger(result.stars)),
      ...(result.cleared === true ? { cleared: true } : {}),
      ...(result.rulesVersion === 1 && Number.isInteger(result.completedWaves) && result.completedWaves >= 2 && result.completedWaves <= 5
        ? { rulesVersion: 1, completedWaves: result.completedWaves } : {}),
      ...(Number.isSafeInteger(result.durationMs) && result.durationMs > 0 ? { durationMs: result.durationMs } : {}),
      ...(validateRankingResult(result.rankingResult) ? { rankingResult: structuredClone(result.rankingResult) } : {}),
    }]];
  }));
}

function normalizeAdventure(progress, gameId) {
  const currentChapter = Number.isSafeInteger(progress.adventure?.currentChapter) && progress.adventure.currentChapter > 0
    && progress.adventure.currentChapter <= MAX_ADVENTURE_CHAPTER
    ? progress.adventure.currentChapter : 1;
  return {
    adventure: getAdventureSummary(normalizeBestByLevel(progress.bestByLevel), currentChapter),
    ...(progress.settledAttempts ? { settledAttempts: Object.fromEntries(Object.entries(progress.settledAttempts)
      .filter(([mode, id]) => GAME_MODE_IDS.has(mode) && typeof id === 'string' && id.length > 0 && id.length <= 120)) } : {}),
    claimedChests: progress.claimedChests && typeof progress.claimedChests === "object" && !Array.isArray(progress.claimedChests)
      ? structuredClone(progress.claimedChests) : {},
    startedLevels: progress.startedLevels && typeof progress.startedLevels === "object" && !Array.isArray(progress.startedLevels)
      ? Object.fromEntries(Object.entries(progress.startedLevels).filter(([, value]) => value === true)) : {},
    activeRankedRuns: Object.fromEntries(Object.entries(progress.activeRankedRuns || {}).flatMap(([mode, run]) => {
      if (!Number.isSafeInteger(run?.level) || run.level < 1) return [];
      const normalized = normalizeRankedRun(run, { gameId, mode, level: run.level });
      return normalized ? [[mode, normalized]] : [];
    })),
    runBestsV2: normalizeRunBestsV2(progress, gameId),
    levelBestsV3: normalizeProgressBests(progress.levelBestsV3, gameId),
    runBests: Object.fromEntries(Object.entries(progress.runBests || {}).filter(([mode, result]) => ["challenge", "endless"].includes(mode)
      && result && Number.isSafeInteger(result.levelReached) && result.levelReached > 0 && Number.isSafeInteger(result.totalScore) && result.totalScore >= 0)),
  };
}

function normalizeSettings(value, fallback) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    mode: GAME_MODE_IDS.has(source.mode) ? source.mode : fallback.mode,
    uiSkin: normalizeUiSkin(source.uiSkin),
    tutorialProgress: normalizeTutorialProgress(source.tutorialProgress),
    sound: typeof source.sound === "boolean" ? source.sound : fallback.sound,
    music: typeof source.music === "boolean" ? source.music : fallback.music,
    soundVolume: normalizeRange(source.soundVolume, fallback.soundVolume, 0, 1),
    musicVolume: normalizeRange(source.musicVolume, fallback.musicVolume, 0, 1),
    meteorEffects: typeof source.meteorEffects === "boolean" ? source.meteorEffects : fallback.meteorEffects,
    boardCoordinates: typeof source.boardCoordinates === "boolean" ? source.boardCoordinates : fallback.boardCoordinates,
    cardDescriptions: typeof source.cardDescriptions === "boolean" ? source.cardDescriptions : fallback.cardDescriptions,
    catalogTabs: normalizeCatalogTabs(source.catalogTabs),
    lastPlayedGameId: ["memory-match", "link-connect", "triple-connect"].includes(source.lastPlayedGameId) ? source.lastPlayedGameId : "memory-match",
  };
}

function normalizeCatalogTabs(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([key, tab]) => /^(memory-match|link-connect|triple-connect):(shop|collection)$/.test(key)
      && ["items", "appearance", "flip", "themes", "path", "exit", "pictures"].includes(tab)));
}

function normalizeTripleItems(items = {}) {
  const source = items && typeof items === "object" ? items : {};
  return {
    hint: Object.hasOwn(source, "hint")
      ? normalizeItemCount(source.hint)
      : TRIPLE_PRODUCT_DECISIONS.initialItems.hint,
    time: normalizeItemCount(source.time),
    undo: normalizeItemCount(source.undo),
    shuffle: normalizeItemCount(source.shuffle),
  };
}

function normalizeTripleSessions(sessions, trayCapacity = TRIPLE_PRODUCT_DECISIONS.trayExpansion.baseCapacity) {
  const source = sessions && typeof sessions === "object" ? sessions : {};
  return Object.fromEntries(Object.entries(source).flatMap(([mode, session]) => {
    if (!GAME_MODE_IDS.has(mode) || !session || typeof session !== "object") return [];
    try {
      if (typeof session.layoutId !== "string" || !session.layoutId) return [];
      getTripleLayout(session.layoutId);
      const restored = restoreSerializedTripleRoundState(session.snapshot, { trayCapacity });
      const wave = session.wave ? normalizeWaveProgress(session.wave, { gameId: 'triple-connect', mode, level: session.level, groupsPerWave: restored.initialTileCount / 3 }) : null;
      if (session.wave && !wave) return [];
      if (restored.status !== "playing" && !(restored.status === 'won' && wave && restored.matchedTriples === wave.groupsPerWave)) return [];
      const snapshot = serializeTripleRoundState(restored);
      return [[mode, {
        ...(wave ? { wave } : {}),
        mode,
        ...(normalizePlayMetrics(session.metrics) ? { metrics: normalizePlayMetrics(session.metrics) } : {}),
        ...(normalizeRankedRun(session.run, { gameId: "triple-connect", mode, level: session.level })
          ? { run: normalizeRankedRun(session.run, { gameId: "triple-connect", mode, level: session.level }) } : {}),
        level: Math.max(1, normalizeNonNegativeInteger(session.level) || 1),
        ...(typeof session.seed === "string" && session.seed ? { seed: session.seed } : {}),
        layoutId: session.layoutId,
        ...(Number.isFinite(session.remainingTime) ? { remainingTime: Math.max(0, Math.floor(session.remainingTime)) } : {}),
        snapshot,
      }]];
    } catch { return []; }
  }));
}

function normalizeNonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}

function normalizeAssetPaths(value) {
  return [...new Set(value.filter((path) => typeof path === "string" && path))];
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

export function recordMemoryMatchResult(result) { return recordGameResult(gameState.progress.memoryMatch, result, 'memory-match'); }
export function recordLinkConnectResult(result) { return recordGameResult(gameState.progress.linkConnect, result, 'link-connect'); }
export function recordTripleConnectResult(result) { return recordGameResult(gameState.progress.tripleConnect, result, 'triple-connect'); }

function recordGameResult(progress, { mode, level, score, stars, durationMs, wave }, gameId) {
  if (gameState.progress.gameplaySeason === 1 && !wave) throw new Error('A multi-wave result requires its completed wave proof.');
  if (wave) {
    const normalized = normalizeWaveProgress(wave, { gameId, mode, level });
    if (!normalized || normalized.phase !== 'won') throw new Error('Cannot record an incomplete multi-wave result.');
    progress.settledAttempts ||= {};
    if (progress.settledAttempts[mode] === wave.attemptId) throw new Error('Attempt was already settled.');
    progress.settledAttempts[mode] = wave.attemptId;
  }
  const key = `${mode}:${level}`;
  const previous = progress.bestByLevel[key] || { score: 0, stars: 0 };
  const beforeMastery = wave && isNormalAdventureMode(mode) ? getMasteryBlock({completed:progress.bestByLevel,level}) : null;
  const firstMasteryWin = Boolean(wave && isNormalAdventureMode(mode) && !hasCertifiedCompletion(progress.bestByLevel, mode, level));
  const nextScore = Math.max(previous.score || 0, score);
  const nextStars = Math.max(previous.stars || 0, stars);
  progress.totalScore += nextScore - (previous.score || 0);
  progress.totalStars += nextStars - (previous.stars || 0);
  const previousTime = previous.durationMs;
  const measuredTime = Number.isSafeInteger(durationMs) && durationMs > 0 ? durationMs : null;
  const bestTime = measuredTime ? Math.min(previousTime || Infinity, measuredTime) : previousTime;
  progress.bestByLevel[key] = { score: nextScore, stars: nextStars, cleared: true, ...(bestTime ? { durationMs: bestTime } : {}) };
  if (wave) Object.assign(progress.bestByLevel[key], { rulesVersion: 1, completedWaves: wave.count });
  if (previous.rankingResult) progress.bestByLevel[key].rankingResult = previous.rankingResult;
  const metrics = getActivePlayMetrics();
  const owner = metrics ? metrics.owner : getRankingOwner();
  if (owner && isNormalAdventureMode(mode)) recordLevelCheckpoint(gameId, 'adventure', level, owner);
  const sameRankingOwner = previous.rankingResult && (owner?.uid ? owner.uid === previous.rankingResult.owner.uid : owner?.profileId === previous.rankingResult.owner.profileId);
  if (owner && isNormalAdventureMode(mode) && measuredTime && (!sameRankingOwner || measuredTime < previous.rankingResult.durationMs)) {
    progress.bestByLevel[key].rankingResult = { rulesVersion: 1, id: crypto.randomUUID(), gameId, mode, level, kind: 'time', durationMs: measuredTime, score, stars, outcome: 'won', recordedAt: Date.now(), owner };
  }
  if (isNormalAdventureMode(mode)) progress.adventure = getAdventureSummary(progress.bestByLevel, progress.adventure?.currentChapter || 1);
  return { totalStars: progress.totalStars, isNewBest: score > (previous.score || 0) || stars > (previous.stars || 0),
    mastery: { expGained: firstMasteryWin ? 10 : 0,
      ...(firstMasteryWin ? { gameId, block: beforeMastery.block,
        tier: beforeMastery.tiers.find(tier => tier.mode === mode).tier,
        beforeExp: beforeMastery.tiers.find(tier => tier.mode === mode).exp,
        afterExp: beforeMastery.tiers.find(tier => tier.mode === mode).exp + 10 } : {}),
      fragmentGained: firstMasteryWin && MASTERY_DIFFICULTIES.every(difficulty => hasCertifiedCompletion(progress.bestByLevel, difficulty, level)) } };
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
