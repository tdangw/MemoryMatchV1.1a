import { MAX_ADVENTURE_LEVEL, NORMAL_MODE_IDS, isCompletedLevelResult } from './adventureProgress.js';
export const RANKING_FAMILIES = Object.freeze(['adventure', 'challenge', 'endless']);
const games = new Set(['memory-match', 'link-connect', 'triple-connect']);
export const sameRankingOwner = (a, b) => Boolean(a && b && a.profileId === b.profileId && a.uid === b.uid);
export const validProgressLevel = level => Number.isSafeInteger(level) && level >= 1 && level <= MAX_ADVENTURE_LEVEL;
export function validateProgressResult(result) {
  return Boolean(result?.rulesVersion === 3 && result.kind === 'progress' && games.has(result.gameId)
    && RANKING_FAMILIES.includes(result.family) && validProgressLevel(result.levelReached)
    && /^[a-f0-9-]{36}$/.test(result.id) && Number.isSafeInteger(result.recordedAt) && result.recordedAt > 0
    && typeof result.owner?.profileId === 'string' && result.owner.profileId.length > 0
    && (result.owner.uid === null || typeof result.owner.uid === 'string' && result.owner.uid.length > 0));
}
export function createProgressResult(gameId, family, levelReached, owner) {
  const result = { rulesVersion: 3, kind: 'progress', gameId, family, levelReached,
    id: crypto.randomUUID(), recordedAt: Date.now(), owner: owner && { ...owner } };
  if (!validateProgressResult(result)) throw new RangeError('Invalid level ranking result.');
  return result;
}
export function normalizeProgressBests(value, gameId) {
  return Object.fromEntries(RANKING_FAMILIES.flatMap(family => {
    const result = value?.[family];
    return validateProgressResult(result) && result.gameId === gameId && result.family === family ? [[family, { ...result, owner: { ...result.owner } }]] : [];
  }));
}
export function keepProgressBest(previous, next) {
  if (!validateProgressResult(next)) throw new RangeError('Invalid progress checkpoint.');
  if (previous && previous.gameId !== next.gameId || previous && previous.family !== next.family) throw new Error('Ranking board mismatch.');
  return !previous || !sameRankingOwner(previous.owner, next.owner) || next.levelReached > previous.levelReached ? next : previous;
}
export function createProgressRun(gameId, mode, level, owner) {
  if (!games.has(gameId) || !['challenge', 'endless'].includes(mode) || !validProgressLevel(level)) throw new RangeError('Invalid progress run.');
  return { version: 3, id: crypto.randomUUID(), gameId, mode, level, clearedLevels: 0,
    attemptCleared: false, finalized: false, rankable: level === 1, owner: owner && { ...owner } };
}
export function normalizeProgressRun(value, { gameId, mode, level }) {
  if (!value || value.version !== 3 || value.gameId !== gameId || value.mode !== mode || value.level !== level
    || !games.has(gameId) || !['challenge', 'endless'].includes(mode) || !validProgressLevel(level)
    || !/^[a-f0-9-]{36}$/.test(value.id) || !Number.isSafeInteger(value.clearedLevels) || value.clearedLevels < 0
    || value.clearedLevels > level || value.rankable === true && value.clearedLevels !== level - (value.attemptCleared === true ? 0 : 1)
    || typeof value.owner?.profileId !== 'string' || !(value.owner.uid === null || typeof value.owner.uid === 'string')) return null;
  return { version: 3, id: value.id, gameId, mode, level, clearedLevels: value.clearedLevels,
    attemptCleared: value.attemptCleared === true, finalized: value.finalized === true,
    rankable: value.rankable === true, owner: { ...value.owner } };
}
export function reduceProgressRun(run, event) {
  if (run.finalized) return run;
  if (event.type === 'score') return run;
  if (event.type === 'finalize') return { ...run, finalized: true };
  if (event.type === 'restart') return createProgressRun(run.gameId, run.mode, 1, run.owner);
  if (event.type === 'win') return run.attemptCleared ? run : { ...run, attemptCleared: true, clearedLevels: run.clearedLevels + 1 };
  if (event.type === 'advance') {
    if (!run.attemptCleared || event.level !== run.level + 1 || !validProgressLevel(event.level)) throw new Error('Invalid progress advance.');
    return { ...run, level: event.level, attemptCleared: false };
  }
  throw new RangeError('Unknown progress transition.');
}
export function highestOwnedAdventureLevel(records, owner, profileOwner) {
  let highest = 0;
  for (const [key, value] of Object.entries(records || {})) {
    const match = /^(easy|normal|hard|superHard):([1-9]\d*)$/.exec(key); const level = match && Number(match[2]);
    if (!match || !validProgressLevel(level) || !isCompletedLevelResult(value)) continue;
    const proof = value.rankingResult?.owner;
    const owned = proof ? sameRankingOwner(proof, owner) || proof.profileId === owner.profileId && proof.uid === null
      && profileOwner?.firstUid === owner.uid : profileOwner?.id === owner.profileId
      && (!profileOwner.firstUid || profileOwner.firstUid === owner.uid) && profileOwner.uid === owner.uid;
    if (owned) highest = Math.max(highest, level);
  }
  return highest;
}
