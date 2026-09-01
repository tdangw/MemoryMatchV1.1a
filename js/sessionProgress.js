import { gameState } from "./gameState.js";
import { saveProgress } from "./persistence.js";

const PROGRESS_KEYS = Object.freeze({
  "memory-match": "memoryMatch",
  "link-connect": "linkConnect",
});
const MODE_ORDER = Object.freeze(["easy", "normal", "hard", "superHard", "endless", "challenge"]);

export function getActiveSession(gameId, mode) {
  const key = PROGRESS_KEYS[gameId];
  if (!key || !mode) return null;
  return gameState.progress[key]?.sessionsByMode?.[mode] || null;
}

export function getActiveSessions(gameId) {
  const key = PROGRESS_KEYS[gameId];
  if (!key) return [];
  const sessions = gameState.progress[key]?.sessionsByMode || {};
  return MODE_ORDER.map((mode) => sessions[mode]).filter(Boolean);
}

export function saveActiveSession(gameId, session) {
  const key = PROGRESS_KEYS[gameId];
  if (!key || !session?.mode) return;
  gameState.progress[key].sessionsByMode ||= {};
  gameState.progress[key].sessionsByMode[session.mode] = {
    mode: session.mode,
    level: Math.max(1, Math.floor(session.level || 1)),
  };
  saveProgress(gameState.progress);
}

export function clearActiveSession(gameId, mode) {
  const key = PROGRESS_KEYS[gameId];
  if (!key) return;
  if (!mode) gameState.progress[key].sessionsByMode = {};
  else delete gameState.progress[key].sessionsByMode?.[mode];
  saveProgress(gameState.progress);
}
