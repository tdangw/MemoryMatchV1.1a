import { MAX_ADVENTURE_LEVEL, NORMAL_MODE_IDS } from './adventureProgress.js';
import { getLevelWaveCount } from './progression/gameplayRules.js';
import { normalizeWaveProgress } from './progression/waveProgress.js';
import { sameRankingOwner } from './progressRankingModel.js';

export const ADVENTURE_RANKING_VERSION = 4;
export const ADVENTURE_RANKING_KIND = 'adventure';
const games = new Set(['memory-match', 'link-connect', 'triple-connect']);
const uuid = value => typeof value === 'string' && /^[a-f0-9-]{36}$/.test(value);
const integer = value => Number.isSafeInteger(value) && value >= 0;
const ownerValid = value => typeof value?.profileId === 'string' && value.profileId.length > 0
  && (value.uid === null || typeof value.uid === 'string' && value.uid.length > 0);
export const sameAdventureOwner = sameRankingOwner;

export function validateAdventureRecord(value) {
  return Boolean(value?.rulesVersion === ADVENTURE_RANKING_VERSION && value.kind === ADVENTURE_RANKING_KIND
    && value.family === 'adventure' && games.has(value.gameId) && NORMAL_MODE_IDS.includes(value.mode)
    && Number.isSafeInteger(value.levelReached) && value.levelReached > 0 && value.levelReached <= MAX_ADVENTURE_LEVEL
    && uuid(value.id) && integer(value.recordedAt) && value.recordedAt > 0 && ownerValid(value.owner)
    && (value.metricsComplete === true ? integer(value.score) && integer(value.moves) && integer(value.misses)
      && value.misses <= value.moves : value.metricsComplete === false && value.score === -1 && value.moves === 0 && value.misses === 0));
}

// Missing metrics sort BELOW every measured score at the same level. The zero
// counters in this projection are sentinels, never player-facing measurements.
export function compareAdventureRecords(a, b) {
  return b.levelReached - a.levelReached || b.score - a.score || a.misses - b.misses || a.moves - b.moves;
}

export function keepAdventureRecord(previous, next) {
  if (!validateAdventureRecord(next)) throw new RangeError('Invalid adventure ranking record.');
  if (previous && (previous.gameId !== next.gameId || previous.mode !== next.mode)) throw new Error('Adventure board mismatch.');
  return !validateAdventureRecord(previous) || !sameAdventureOwner(previous.owner, next.owner)
    || compareAdventureRecords(next, previous) < 0 ? next : previous;
}

export function normalizeAdventureBests(value, gameId) {
  return Object.fromEntries(NORMAL_MODE_IDS.flatMap(mode => {
    const result = value?.[mode];
    return validateAdventureRecord(result) && result.gameId === gameId && result.mode === mode
      ? [[mode, structuredClone(result)]] : [];
  }));
}

/** Merge only this owner's records; never inherit another account's best. */
export function mergeAdventureBests(incoming, durable, gameId, owner = null) {
  const result = normalizeAdventureBests(incoming, gameId);
  for (const [mode, record] of Object.entries(normalizeAdventureBests(durable, gameId))) {
    if (owner && !sameAdventureOwner(record.owner, owner)) continue;
    const next = result[mode];
    if (!next || sameAdventureOwner(next.owner, record.owner) && compareAdventureRecords(record, next) <= 0) result[mode] = record;
  }
  return result;
}

/** Capture the tuple from the completed multi-wave attempt, including its final score bonus. */
export function createAdventureRecord({ gameId, mode, level, score, wave, owner }) {
  const proof = normalizeWaveProgress(wave, { gameId, mode, level });
  if (!proof || proof.phase !== 'won' || !Number.isSafeInteger(score) || score < proof.completedScore)
    throw new Error('Adventure ranking needs a completed attempt.');
  const result = { rulesVersion: 4, kind: 'adventure', family: 'adventure', gameId, mode, levelReached: level,
    score, moves: proof.completedMoves, misses: proof.completedMisses, metricsComplete: true,
    id: uuid(proof.attemptId) ? proof.attemptId : crypto.randomUUID(), recordedAt: Date.now(), owner: owner && { ...owner } };
  if (!validateAdventureRecord(result)) throw new RangeError('Invalid adventure completion.');
  return result;
}

/** Old aggregate bests never prove a moves/misses tuple. Preserve only certified levels by mode. */
export function migrateAdventureBests(bests, records, gameId, owner, profileOwner) {
  const next = normalizeAdventureBests(bests, gameId);
  if (!ownerValid(owner)) return next;
  for (const [key, record] of Object.entries(records || {})) {
    const [mode, rawLevel] = key.split(':'); const level = Number(rawLevel);
    if (!NORMAL_MODE_IDS.includes(mode) || !Number.isSafeInteger(level) || level < 1 || level > MAX_ADVENTURE_LEVEL
      || record?.rulesVersion !== 1 || record.cleared !== true || record.completedWaves !== getLevelWaveCount(level)) continue;
    const proof = record.adventureRecord || record.rankingResult;
    const owned = proof ? sameAdventureOwner(proof.owner, owner) || proof.owner?.profileId === owner.profileId
      && proof.owner.uid === null && profileOwner?.firstUid === owner.uid
      : profileOwner?.id === owner.profileId && profileOwner.uid === owner.uid && (!profileOwner.firstUid || profileOwner.firstUid === owner.uid);
    if (!owned) continue;
    const complete = validateAdventureRecord(record.adventureRecord) && record.adventureRecord.gameId === gameId
      && record.adventureRecord.mode === mode && record.adventureRecord.levelReached === level;
    const candidate = complete ? { ...record.adventureRecord, owner: { ...owner } }
      : { rulesVersion: 4, kind: 'adventure', family: 'adventure', gameId, mode, levelReached: level,
        metricsComplete: false, score: -1, moves: 0, misses: 0,
        id: uuid(proof?.id) ? proof.id : crypto.randomUUID(), recordedAt: integer(proof?.recordedAt) && proof.recordedAt > 0 ? proof.recordedAt : Date.now(), owner: { ...owner } };
    next[mode] = keepAdventureRecord(next[mode], candidate);
  }
  return next;
}
