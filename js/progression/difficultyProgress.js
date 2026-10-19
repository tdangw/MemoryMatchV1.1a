import { GAMEPLAY_RULES_VERSION, requireProgressionLevel } from './gameplayRules.js';

export const MASTERY_DIFFICULTIES = Object.freeze(['easy', 'normal', 'hard', 'superHard']);
const CHEST_TIERS = Object.freeze(['C', 'B', 'A', 'S']);
const BLOCK_LEVELS = 10;
const COMPLETION_EXP = 10;

// Only records explicitly certified under these rules can unlock the new progression.
export function hasCertifiedCompletion(completed, mode, level) {
  requireProgressionLevel(level);
  if (!MASTERY_DIFFICULTIES.includes(mode)) throw new RangeError('Invalid mastery difficulty.');
  const result = completed[`${mode}:${level}`];
  return Boolean(result && result.rulesVersion === GAMEPLAY_RULES_VERSION && result.cleared === true);
}

export function getDifficultyAccess({ completed, level, mode }) {
  requireProgressionLevel(level);
  const difficulty = MASTERY_DIFFICULTIES.indexOf(mode);
  if (difficulty < 0) throw new RangeError('Invalid mastery difficulty.');
  if (level > 1 && !hasCertifiedCompletion(completed, 'easy', level - 1))
    return Object.freeze({ unlocked: false, requires: Object.freeze({ level: level - 1, mode: 'easy' }) });
  for (let index = 0; index < difficulty; index += 1) {
    const prerequisite = MASTERY_DIFFICULTIES[index];
    if (!hasCertifiedCompletion(completed, prerequisite, level))
      return Object.freeze({ unlocked: false, requires: Object.freeze({ level, mode: prerequisite }) });
  }
  return Object.freeze({ unlocked: true, requires: null });
}

export function getMasteryBlock({ completed, level }) {
  requireProgressionLevel(level);
  const block = Math.floor((level - 1) / BLOCK_LEVELS) + 1;
  const firstLevel = (block - 1) * BLOCK_LEVELS + 1;
  const counts = Object.fromEntries(MASTERY_DIFFICULTIES.map(mode => [mode, 0]));
  const fragmentLevels = [];
  for (let current = firstLevel; current < firstLevel + BLOCK_LEVELS; current += 1) {
    let mastered = true;
    for (const mode of MASTERY_DIFFICULTIES) {
      const cleared = hasCertifiedCompletion(completed, mode, current);
      if (cleared) counts[mode] += 1;
      else mastered = false;
    }
    if (mastered) fragmentLevels.push(current);
  }
  return Object.freeze({
    block, firstLevel, lastLevel: firstLevel + BLOCK_LEVELS - 1,
    tiers: Object.freeze(MASTERY_DIFFICULTIES.map((mode, index) => Object.freeze({
      tier: CHEST_TIERS[index], mode, completedLevels: counts[mode],
      exp: counts[mode] * COMPLETION_EXP, requiredExp: BLOCK_LEVELS * COMPLETION_EXP,
      complete: counts[mode] === BLOCK_LEVELS,
    }))),
    fragmentLevels: Object.freeze(fragmentLevels),
    collectionComplete: fragmentLevels.length === BLOCK_LEVELS,
  });
}
