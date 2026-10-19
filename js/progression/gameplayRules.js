import { getGameDefinition, getGameMode } from '../gameCatalog.js';
import { MAX_ADVENTURE_LEVEL } from '../adventureProgress.js';

// Candidate rules are kept separate until persistence and gameplay can switch together.
export const GAMEPLAY_RULES_VERSION = 1;
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
