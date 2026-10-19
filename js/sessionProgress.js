import { gameState } from "./gameState.js";
import { saveProgress } from "./persistence.js";
import { GAME_MODES, getGameProgressKey } from "./gameCatalog.js";
import { appendThemeSelectionHistory } from "./themeSelection.js";
import { normalizePlayMetrics } from "./playMetrics.js";
import { normalizeRankedRun } from "./rankingRules.js";
import { normalizePairSnapshot } from './pairSessionSnapshot.js';
import { normalizeWaveProgress } from './progression/waveProgress.js';

export function getActiveSession(gameId, mode) {
  const key = getGameProgressKey(gameId);
  if (!key || !mode) return null;
  return gameState.progress[key]?.sessionsByMode?.[mode] || null;
}

export function getActiveSessions(gameId) {
  const key = getGameProgressKey(gameId);
  if (!key) return [];
  const sessions = gameState.progress[key]?.sessionsByMode || {};
  return GAME_MODES.map((mode) => sessions[mode.id]).filter(Boolean);
}

export async function saveActiveSession(gameId, session) {
  const key = getGameProgressKey(gameId);
  if (!key || !session?.mode) return false;
  if (session.waveInvalid) return false;
  const sessions = (gameState.progress[key].sessionsByMode ||= {});
  const previous = sessions[session.mode]
    ? { ...sessions[session.mode] }
    : null;
  if (!stageActiveSession(gameId, session)) return false;
  if ((await saveProgress(gameState.progress))) return true;
  if (previous) sessions[session.mode] = previous;
  else delete sessions[session.mode];
  return false;
}

/**
 * A newly selected board has one durability boundary: its session and the
 * anti-repeat history either both persist or both remain untouched in RAM.
 */
export async function commitThemeSession(gameId, session, themeId, selections) {
  const key = getGameProgressKey(gameId);
  if (!key || !session?.mode || !themeId || !Array.isArray(selections) || !selections.length) return false;
  const previousSessions = { ...(gameState.progress[key].sessionsByMode || {}) };
  const previousHistory = gameState.progress.themeSelectionHistory;
  if (!stageActiveSession(gameId, session)) return false;
  gameState.progress.themeSelectionHistory = appendThemeSelectionHistory(
    previousHistory,
    themeId,
    selections,
  );
  if ((await saveProgress(gameState.progress))) return true;
  gameState.progress[key].sessionsByMode = previousSessions;
  gameState.progress.themeSelectionHistory = previousHistory;
  return false;
}

export function stageActiveSession(gameId, session) {
  const key = getGameProgressKey(gameId);
  if (!key || !session?.mode) return false;
  if (session.waveInvalid) return false;
  const wave = session.wave ? normalizeWaveProgress(session.wave, { gameId, mode: session.mode, level: session.level }) : null;
  if (session.wave && !wave) return false;
  gameState.progress[key].sessionsByMode ||= {};
  const run = normalizeRankedRun(session.run, { gameId, mode: session.mode, level: session.level });
  if (gameId !== 'triple-connect' && session.pairSnapshot && !normalizePairSnapshot(session.pairSnapshot, gameId)) return false;
  if (gameId === "triple-connect" && session.snapshot) {
    gameState.progress[key].sessionsByMode[session.mode] = {
      ...(wave ? { wave } : {}),
      mode: session.mode,
      level: Math.max(1, Math.floor(session.level || 1)),
      ...(typeof session.seed === "string" && session.seed
        ? { seed: session.seed }
        : {}),
      ...(typeof session.layoutId === "string"
        ? { layoutId: session.layoutId }
        : {}),
      ...(Number.isFinite(session.remainingTime)
        ? { remainingTime: Math.max(0, Math.floor(session.remainingTime)) }
        : {}),
      snapshot: session.snapshot,
      ...(run ? { run } : {}),
      ...(normalizePlayMetrics(session.metrics) ? { metrics: normalizePlayMetrics(session.metrics) } : {}),
    };
    return true;
  }
  gameState.progress[key].sessionsByMode[session.mode] = {
    ...(wave ? { wave } : {}),
    ...(normalizePairSnapshot(session.pairSnapshot, gameId) ? { pairSnapshot: normalizePairSnapshot(session.pairSnapshot, gameId) } : {}),
    ...(run ? { run } : {}),
    ...(normalizePlayMetrics(session.metrics) ? { metrics: normalizePlayMetrics(session.metrics) } : {}),
    mode: session.mode,
    level: Math.max(1, Math.floor(session.level || 1)),
    ...(typeof session.gravityShift === "string"
      ? { gravityShift: session.gravityShift }
      : {}),
    ...(Number.isFinite(session.specialProgress)
      ? { specialProgress: Math.max(0, Math.floor(session.specialProgress)) }
      : {}),
    ...(Number.isFinite(session.specialNoEnergyDropStreak)
      ? {
          specialNoEnergyDropStreak: Math.max(
            0,
            Math.floor(session.specialNoEnergyDropStreak),
          ),
        }
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
      ? { hints: Math.max(0, Math.floor(session.hints)) }
      : {}),
    ...(Array.isArray(session.assetPaths)
      ? { assetPaths: [...new Set(session.assetPaths.filter((path) => typeof path === "string" && path))] }
      : {}),
  };
  return true;
}

export async function clearActiveSession(gameId, mode) {
  const key = getGameProgressKey(gameId);
  if (!key) return false;
  const previous = { ...(gameState.progress[key].sessionsByMode || {}) };
  if (!mode) gameState.progress[key].sessionsByMode = {};
  else delete gameState.progress[key].sessionsByMode?.[mode];
  if ((await saveProgress(gameState.progress))) return true;
  gameState.progress[key].sessionsByMode = previous;
  return false;
}
