import { gameState } from "./gameState.js";
import { commitThemeSession, saveActiveSession, stageActiveSession } from "./sessionProgress.js";
import { snapshotPlayMetrics } from "./playMetrics.js";
import { getRankedRun, stageRankedAttempt } from "./rankingRules.js";

export function getMemorySessionSnapshot(overrides = {}) {
  stageRankedAttempt("memory-match", gameState.settings.mode, gameState.score,
    gameState.totalPairs > 0 && gameState.matchedPairs >= gameState.totalPairs);
  return {
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
