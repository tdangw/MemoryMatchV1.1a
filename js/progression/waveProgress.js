import { getGameDefinition, getGameMode } from '../gameCatalog.js';
import { GAMEPLAY_RULES_VERSION, getLevelWaveCount, calculateWaveTime } from './gameplayRules.js';

const PHASES = new Set(['playing', 'advance', 'won']);
const KEYS = ['version', 'attemptId', 'gameId', 'mode', 'level', 'count', 'index', 'phase',
  'groupsPerWave', 'completedScore', 'completedMoves', 'completedMisses', 'allocatedSeconds'];

export function createWaveProgress({ attemptId, gameId, mode, level, groupsPerWave }) {
  const budget = calculateWaveTime({ gameId, mode, totalGroups: groupsPerWave });
  const result = { version: GAMEPLAY_RULES_VERSION, attemptId, gameId, mode, level,
    count: getLevelWaveCount(level), index: 1, phase: 'playing', groupsPerWave,
    completedScore: 0, completedMoves: 0, completedMisses: 0, allocatedSeconds: budget };
  return requireWaveProgress(result);
}

export function normalizeWaveProgress(value, identity = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || value.version !== GAMEPLAY_RULES_VERSION
    || typeof value.attemptId !== 'string' || !value.attemptId || value.attemptId.length > 120
    || !getGameDefinition(value.gameId) || !getGameMode(value.mode)) return null;
  if (!Number.isSafeInteger(value.level) || value.level < 1) return null;
  // Use the same bound as the public level contract without accepting unknown versions.
  let count;
  try { count = getLevelWaveCount(value.level); } catch (error) {
    if (error instanceof RangeError) return null;
    throw error;
  }
  if (value.count !== count || !Number.isInteger(value.index) || value.index < 1 || value.index > count
    || !PHASES.has(value.phase) || value.phase === 'advance' && value.index < 2
    || value.phase === 'won' && value.index !== count
    || !Number.isInteger(value.groupsPerWave) || value.groupsPerWave < 1 || value.groupsPerWave > 1000)
    return null;
  for (const key of ['completedScore', 'completedMoves', 'completedMisses', 'allocatedSeconds'])
    if (!Number.isSafeInteger(value[key]) || value[key] < 0) return null;
  const budget = calculateWaveTime({ gameId: value.gameId, mode: value.mode, totalGroups: value.groupsPerWave });
  if (value.allocatedSeconds !== budget * value.index) return null;
  if (['gameId', 'mode', 'level'].some(key => identity[key] !== undefined && identity[key] !== value[key])) return null;
  return Object.freeze(Object.fromEntries(KEYS.map(key => [key, value[key]])));
}

export function requireWaveProgress(value) {
  const normalized = normalizeWaveProgress(value);
  if (!normalized) throw new TypeError('Invalid wave progression.');
  return normalized;
}

export function completeWave(progress, { score, moves, misses, matchedGroups }) {
  const current = requireWaveProgress(progress);
  if (current.phase !== 'playing') throw new Error('Wave was already completed.');
  if (matchedGroups !== current.groupsPerWave) throw new Error('Wave is incomplete.');
  for (const [value, previous] of [[score, current.completedScore], [moves, current.completedMoves], [misses, current.completedMisses]])
    if (!Number.isSafeInteger(value) || value < previous) throw new RangeError('Invalid cumulative wave result.');
  const last = current.index === current.count;
  const bonusSeconds = last ? 0 : calculateWaveTime({
    gameId: current.gameId, mode: current.mode, totalGroups: current.groupsPerWave,
  });
  return Object.freeze({
    progress: requireWaveProgress({ ...current, index: last ? current.index : current.index + 1,
      phase: last ? 'won' : 'advance', completedScore: score, completedMoves: moves,
      completedMisses: misses, allocatedSeconds: current.allocatedSeconds + bonusSeconds }),
    bonusSeconds,
  });
}

export function activateNextWave(progress) {
  const current = requireWaveProgress(progress);
  if (current.phase !== 'advance') throw new Error('No wave is waiting to start.');
  return requireWaveProgress({ ...current, phase: 'playing' });
}

export function waveTotalGroups(progress) {
  const current = requireWaveProgress(progress);
  return current.groupsPerWave * current.count;
}
