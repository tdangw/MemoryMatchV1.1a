import { gameState } from "./gameState.js";
import { getGameDefinition } from "./gameCatalog.js";
import { saveSetting } from "./persistence.js";

export function getRecentGameId() {
  return getGameDefinition(gameState.settings.lastPlayedGameId)?.id || "memory-match";
}
export async function rememberRecentGame(gameId) {
  if (!getGameDefinition(gameId)) throw new RangeError("Unknown played game.");
  if (getRecentGameId() === gameId) return true;
  if (!await saveSetting("lastPlayedGameId", gameId)) return false;
  gameState.settings.lastPlayedGameId = gameId;
  return true;
}
