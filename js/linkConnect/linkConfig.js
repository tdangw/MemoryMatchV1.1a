export const LINK_CONNECT_CONFIG = Object.freeze({
  modes: Object.freeze({
    easy: Object.freeze({ tileCount: 12, columns: 4, timeSeconds: 60 }),
    normal: Object.freeze({ tileCount: 24, columns: 6, timeSeconds: 90 }),
    hard: Object.freeze({ tileCount: 36, columns: 6, timeSeconds: 120 }),
    superHard: Object.freeze({ tileCount: 60, columns: 6, timeSeconds: 180 }),
    endless: Object.freeze({ tileCount: 60, columns: 6, timeSeconds: 0 }),
    challenge: Object.freeze({ tileCount: 12, columns: 4, timeSeconds: 60 }),
  }),
  pathfinding: Object.freeze({ maxTurns: 2, boundaryPadding: 1 }),
  scoring: Object.freeze({ baseMatchPoints: 10, comboStepPoints: 3 }),
  levelProgression: Object.freeze({ timeBonusPerLevel: 2, timeBonusCap: 10 }),
  special: Object.freeze({
    scoreMultiplier: 1.5,
    progressTarget: 10,
    coinReward: Object.freeze({ min: 10, max: 50 }),
    timeReward: Object.freeze({ min: 3, max: 10 }),
    milestoneTenCoins: 100,
    frozenTilesFromLevel: 3,
    frozenTilesPerLevel: 1,
  }),
});

const CHALLENGE_LAYOUTS = Object.freeze([
  Object.freeze({ untilLevel: 3, tileCount: 12, columns: 4 }),
  Object.freeze({ untilLevel: 6, tileCount: 16, columns: 4 }),
  Object.freeze({ untilLevel: 9, tileCount: 20, columns: 4 }),
  Object.freeze({ untilLevel: 12, tileCount: 24, columns: 6 }),
  Object.freeze({ untilLevel: 15, tileCount: 30, columns: 6 }),
  Object.freeze({ untilLevel: 18, tileCount: 36, columns: 6 }),
  Object.freeze({ untilLevel: 21, tileCount: 42, columns: 6 }),
  Object.freeze({ untilLevel: Infinity, tileCount: 48, columns: 6 }),
]);

export function getLinkModeLayout(mode = "easy") {
  return LINK_CONNECT_CONFIG.modes[mode] || LINK_CONNECT_CONFIG.modes.easy;
}

export function getLinkChallengeLayout(level = 1) {
  return CHALLENGE_LAYOUTS.find((layout) => level <= layout.untilLevel)
    || CHALLENGE_LAYOUTS.at(-1);
}

export function isLinkEndlessMode(mode) {
  return mode === "endless";
}

export function isLinkChallengeMode(mode) {
  return mode === "challenge";
}

export function getLinkTimerDirection(mode) {
  return isLinkEndlessMode(mode) ? "up" : "down";
}

export function getLinkLevelTimeBonus(level = 1) {
  const progression = LINK_CONNECT_CONFIG.levelProgression;
  return Math.min(
    Math.max(0, level - 1) * progression.timeBonusPerLevel,
    progression.timeBonusCap,
  );
}

export function calculateLinkMatchPoints(combo = 1, { special = false } = {}) {
  const scoring = LINK_CONNECT_CONFIG.scoring;
  const points = scoring.baseMatchPoints
    + scoring.comboStepPoints * Math.max(0, combo - 1);
  return Math.round(points * (special ? LINK_CONNECT_CONFIG.special.scoreMultiplier : 1));
}

export function getLinkFrozenTileCount(level = 1) {
  const special = LINK_CONNECT_CONFIG.special;
  return level >= special.frozenTilesFromLevel ? special.frozenTilesPerLevel : 0;
}
