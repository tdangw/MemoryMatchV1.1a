import { gameState } from "./gameState.js";
import { saveProgress } from "./persistence.js";
import { GAME_MODES, getGameProgressKey } from "./gameCatalog.js";

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

export function saveActiveSession(gameId, session) {
  const key = getGameProgressKey(gameId);
  if (!key || !session?.mode) return;
  gameState.progress[key].sessionsByMode ||= {};
  gameState.progress[key].sessionsByMode[session.mode] = {
    mode: session.mode,
    level: Math.max(1, Math.floor(session.level || 1)),
    ...(typeof session.gravityShift === "string" ? { gravityShift: session.gravityShift } : {}),
    ...(Number.isFinite(session.specialProgress)
      ? { specialProgress: Math.max(0, Math.floor(session.specialProgress)) }
      : {}),
    ...(Number.isFinite(session.specialNoEnergyDropStreak)
      ? { specialNoEnergyDropStreak: Math.max(0, Math.floor(session.specialNoEnergyDropStreak)) }
      : {}),
  };
  saveProgress(gameState.progress);
}

export function clearActiveSession(gameId, mode) {
  const key = getGameProgressKey(gameId);
  if (!key) return;
  if (!mode) gameState.progress[key].sessionsByMode = {};
  else delete gameState.progress[key].sessionsByMode?.[mode];
  saveProgress(gameState.progress);
}
