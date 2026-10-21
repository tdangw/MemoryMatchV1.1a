export const TUTORIAL_VERSION = 1;
export const TUTORIAL_GAMES = Object.freeze(['memory-match', 'link-connect', 'triple-connect']);
export const TUTORIAL_TOPICS = Object.freeze([...TUTORIAL_GAMES.flatMap(game => [`wave:${game}`, `tools:${game}`]), 'exp', 'chests', 'pieces']);
export function normalizeTutorialProgress(value) {
  const current = value && typeof value === 'object' && !Array.isArray(value) && value.version === TUTORIAL_VERSION ? value : {};
  const flags = (source, keys) => Object.fromEntries(keys.filter(key => source?.[key] === true).map(key => [key, true]));
  return { version: TUTORIAL_VERSION, completed: flags(current.completed, TUTORIAL_GAMES), seen: flags(current.seen, TUTORIAL_TOPICS) };
}
