import { gameState } from "./gameState.js";
import { saveProgress } from "./persistence.js";

const PROGRESS_KEYS = Object.freeze({
  "memory-match": "memoryMatch",
  "link-connect": "linkConnect",
});

export function getActiveSession(gameId) {
  const key = PROGRESS_KEYS[gameId];
  return key ? gameState.progress[key]?.activeSession || null : null;
}

export function saveActiveSession(gameId, session) {
  const key = PROGRESS_KEYS[gameId];
  if (!key || !session?.mode) return;
  gameState.progress[key].activeSession = {
    mode: session.mode,
    level: Math.max(1, Math.floor(session.level || 1)),
  };
  saveProgress(gameState.progress);
}

export function clearActiveSession(gameId) {
  const key = PROGRESS_KEYS[gameId];
  if (!key) return;
  gameState.progress[key].activeSession = null;
  saveProgress(gameState.progress);
}
