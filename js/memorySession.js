import { gameState } from "./gameState.js";
import { commitThemeSession, saveActiveSession, stageActiveSession } from "./sessionProgress.js";
import { snapshotPlayMetrics } from "./playMetrics.js";
import { getRankedRun, stageRankedAttempt } from "./rankingRules.js";
import { getEquippedThemeId } from './appearance.js';
import { memoryComboRemainingMs } from './logic.js';
let boardSeed = crypto.randomUUID();
let boardThemeId;
export function beginMemoryBoardIdentity(seed, themeId) { boardSeed = seed || crypto.randomUUID(); boardThemeId = themeId; }

export function getMemorySessionSnapshot(overrides = {}) {
  stageRankedAttempt("memory-match", gameState.settings.mode, gameState.score,
    gameState.wave?.phase === 'won');
  return {
    ...(gameState.wave ? { wave: gameState.wave } : {}),
    pairSnapshot: {
      version: 1, gameId: 'memory-match', seed: boardSeed, themeId: boardThemeId || getEquippedThemeId(gameState.appearance, 'memory-match'),
      score: gameState.score, moves: gameState.moves, misses: gameState.misses, combo: gameState.combo,
      capturedAt: Date.now(), comboRemainingMs: memoryComboRemainingMs(),
      matchedPairs: gameState.matchedPairs, totalPairs: gameState.totalPairs,
      tiles: [...document.querySelectorAll('#grid-container .tile')].map(tile => ({ id: tile.dataset.imageId, special: tile.dataset.special === 'true', matched: tile.classList.contains('matched') })),
      luckyRewards: [...gameState.luckyRewards.entries()], luckyAwards: structuredClone(gameState.luckyAwards),
    },
    mode: gameState.settings.mode,
    level: gameState.currentLevel,
    remainingTime: gameState.remainingTime,
    timeLimit: gameState.timeLimit,
    levelStartTime: gameState.levelStartTime,
    specialProgress: gameState.specialProgress,
    specialNoEnergyDropStreak: gameState.specialNoEnergyDropStreak,
    metrics: snapshotPlayMetrics({ gameId: "memory-match", mode: gameState.settings.mode, level: gameState.currentLevel }),
    run: getRankedRun("memory-match", gameState.settings.mode),
    ...overrides,
  };
}

export function stageMemorySession(overrides) {
  return stageActiveSession("memory-match", getMemorySessionSnapshot(overrides));
}

export async function saveMemorySession(overrides) {
  return (await saveActiveSession("memory-match", getMemorySessionSnapshot(overrides)));
}

export async function commitMemoryThemeSession(themeId, selectionIds) {
  return (await commitThemeSession("memory-match", getMemorySessionSnapshot({ assetPaths: selectionIds }), themeId, selectionIds));
}
