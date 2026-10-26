import { getGameDefinition, getGameMode } from '../gameCatalog.js';
import { MAX_ADVENTURE_LEVEL } from '../adventureProgress.js';
import { STANDARD_WAVE_SECONDS, calculateChallengeWaveTime, calculateOriginalWaveTime } from './waveTiming.js';

// Shared rules for multi-wave sessions, settlement and certified progression.
export const GAMEPLAY_RULES_VERSION = 1;
export const MATCH_COINS_PER_GROUP = 2;
const COIN_EFFORT_TENTHS = Object.freeze({
  'memory-match': 10,
  'link-connect': 10,
  'triple-connect': 12,
});
const COIN_DIFFICULTY_TENTHS = Object.freeze({
  easy: 10, normal: 12, hard: 15, superHard: 18, challenge: 13, endless: 13,
});

export function requireProgressionLevel(level) {
  if (!Number.isSafeInteger(level) || level < 1 || level > MAX_ADVENTURE_LEVEL)
    throw new RangeError('Invalid progression level.');
  return level;
}

export function getLevelWaveCount(level) {
  requireProgressionLevel(level);
  if (level <= 10) return 2;
  if (level <= 50) return 3;
  if (level <= 90) return 4;
  return 5;
}

export function getWavePatternIndex(level, waveIndex) {
  const count = getLevelWaveCount(level);
  if (!Number.isInteger(waveIndex) || waveIndex < 1 || waveIndex > count) throw new RangeError('Invalid wave index.');
  const previous = level - 1;
  const lengths = [Math.min(previous, 10), Math.max(0, Math.min(previous, 50) - 10),
    Math.max(0, Math.min(previous, 90) - 50), Math.max(0, previous - 90)];
  return (lengths.reduce((sum, length, index) => sum + (length % 20) * (index + 2), 0) + waveIndex - 1) % 20;
}

export function calculateGroupScore({ combo, automatic = false }) {
  if (!Number.isSafeInteger(combo) || combo < 0)
    throw new RangeError('Invalid combo.');
  if (typeof automatic !== 'boolean') throw new TypeError('Invalid automatic match.');
  return automatic ? 10 : 10 + 2 * Math.min(Math.max(combo - 1, 0), 4);
}

export function calculateVictoryCoins({ gameId, mode, totalGroups, stars }) {
  if (!getGameDefinition(gameId)) throw new RangeError('Unknown game.');
  if (!getGameMode(mode)) throw new RangeError('Unknown mode.');
  if (!Number.isSafeInteger(totalGroups) || totalGroups < 1)
    throw new RangeError('Invalid group count.');
  if (!Number.isInteger(stars) || stars < 1 || stars > 3)
    throw new RangeError('A victory requires one to three stars.');
  // Integer ratios avoid rounding differences from multiplying decimal coefficients.
  const scaled = (100 + totalGroups * COIN_EFFORT_TENTHS[gameId])
    * COIN_DIFFICULTY_TENTHS[mode];
  if (!Number.isSafeInteger(scaled)) throw new RangeError('Coin calculation exceeds safe range.');
  return Math.round(scaled / 100) + 2 * stars;
}

export function calculateWaveTime({ gameId, mode, totalGroups }) {
  if (!getGameDefinition(gameId) || !getGameMode(mode)) throw new RangeError('Unknown game or mode.');
  if (!Number.isSafeInteger(totalGroups) || totalGroups < 1 || totalGroups > 1000)
    throw new RangeError('Invalid board group count.');
  return mode === 'challenge' ? calculateChallengeWaveTime({ gameId, totalGroups })
    : STANDARD_WAVE_SECONDS[gameId][mode] ?? calculateOriginalWaveTime({ gameId, mode, totalGroups });
}

export function calculateFastFinishBonus({ totalGroups, activeMs, allocatedSeconds, mode }) {
  if (!getGameMode(mode)) throw new RangeError('Unknown mode.');
  if (!Number.isSafeInteger(totalGroups) || totalGroups < 1 || totalGroups > 5000
    || !Number.isSafeInteger(activeMs) || activeMs < 0
    || !Number.isSafeInteger(allocatedSeconds) || allocatedSeconds < 0)
    throw new RangeError('Invalid completion metrics.');
  if (mode === 'endless') return 0;
  if (allocatedSeconds === 0) throw new RangeError('Timed games require a positive budget.');
  return Math.round(3 * totalGroups * Math.max(0, 1 - activeMs / (allocatedSeconds * 1000)));
}

export function getProgressionStarTargets({ totalGroups, mode }) {
  if (!getGameMode(mode) || !Number.isSafeInteger(totalGroups) || totalGroups < 1 || totalGroups > 5000)
    throw new RangeError('Invalid star target.');
  const endless = mode === 'endless';
  return Object.freeze({ two: Math.ceil(totalGroups * (endless ? 12.5 : 13)),
    three: Math.ceil(totalGroups * (endless ? 15.5 : 16.5)) });
}

export function calculateProgressionStars({ totalGroups, mode, score, won }) {
  const targets = getProgressionStarTargets({ totalGroups, mode });
  if (!Number.isSafeInteger(score) || score < 0 || typeof won !== 'boolean')
    throw new RangeError('Invalid result.');
  return score >= targets.three ? 3 : score >= targets.two ? 2 : won ? 1 : 0;
}
