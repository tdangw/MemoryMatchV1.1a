import { GAME_DEFINITIONS, getGameDefinition } from "./gameCatalog.js";

const entries = new Map(GAME_DEFINITIONS.map(definition => [definition.id, {
  definition,
  released: definition.released !== false,
  openMenu: null,
}]));

/** Register only the navigation behavior of a released game. */
export function registerGameNavigation(gameId, openMenu) {
  const entry = entries.get(gameId);
  if (!entry || !entry.released || typeof openMenu !== "function") {
    throw new TypeError(`Cannot register navigation for game: ${gameId}`);
  }
  entry.openMenu = openMenu;
}

export function getReleasedGames() {
  return [...entries.values()]
    .filter(entry => entry.released)
    .map(entry => entry.definition);
}

export function getGameNavigation(gameId) {
  const entry = entries.get(gameId);
  return entry?.released && typeof entry.openMenu === "function" ? entry : null;
}

export function isKnownGame(gameId) {
  return getGameDefinition(gameId) !== null;
}
