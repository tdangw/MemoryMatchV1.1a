import { gameState } from "./gameState.js";
import { saveActiveSession, stageActiveSession } from "./sessionProgress.js";

export function getMemorySessionSnapshot(overrides = {}) {
  return {
    mode: gameState.settings.mode,
    level: gameState.currentLevel,
    remainingTime: gameState.remainingTime,
    timeLimit: gameState.timeLimit,
    levelStartTime: gameState.levelStartTime,
    specialProgress: gameState.specialProgress,
    specialNoEnergyDropStreak: gameState.specialNoEnergyDropStreak,
    ...overrides,
  };
}

export function stageMemorySession(overrides) {
  return stageActiveSession("memory-match", getMemorySessionSnapshot(overrides));
}

export function saveMemorySession(overrides) {
  return saveActiveSession("memory-match", getMemorySessionSnapshot(overrides));
}
