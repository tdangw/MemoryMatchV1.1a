export const TUTORIAL_VERSION = 1;
export const TUTORIAL_GAMES = Object.freeze(['memory-match', 'link-connect', 'triple-connect']);
export const TUTORIAL_TOPICS = Object.freeze([...TUTORIAL_GAMES.flatMap(game => [`wave:${game}`, `tools:${game}`]), 'exp', 'chests', 'pieces']);
export function normalizeTutorialProgress(value) {
  const current = value && typeof value === 'object' && !Array.isArray(value) && value.version === TUTORIAL_VERSION ? value : {};
  const flags = (source, keys) => Object.fromEntries(keys.filter(key => source?.[key] === true).map(key => [key, true]));
  return { version: TUTORIAL_VERSION, completed: flags(current.completed, TUTORIAL_GAMES), skipped: flags(current.skipped, TUTORIAL_GAMES), seen: flags(current.seen, TUTORIAL_TOPICS) };
}

/** Per-game activity only: a wallet balance or visiting Home does not count. */
export function hasTutorialPlayEvidence(profile = {}) {
  // Older completed chapters may be archived outside the resident chapter.
  if ([profile.totalScore, profile.totalStars, profile.adventure?.unlockedThrough - 1].some(value => Number.isSafeInteger(value) && value > 0)) return true;
  if (Object.values(profile.startedLevels || {}).some(value => value === true)) return true;
  if (Object.keys(profile.bestByLevel || {}).some(key => /^(easy|normal|hard|superHard|endless|challenge):[1-9]\d*$/.test(key))) return true;
  return ['sessionsByMode','activeRankedRuns','runBests','runBestsV2','levelBestsV3'].some(key => Object.values(profile[key] || {}).some(value => value && typeof value === 'object' && Object.keys(value).length > 0));
}
