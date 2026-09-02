export const LINK_CONNECT_CONFIG = Object.freeze({
  gravity: Object.freeze({
    basicDirections: Object.freeze(["down", "up", "left", "right"]),
    randomFromLevel: 13,
  }),
  modes: Object.freeze({
    easy: Object.freeze({ tileCount: 12, columns: 4, timeSeconds: 60, coinReward: Object.freeze({ base: 25, speedMultiplier: 0.25 }) }),
    normal: Object.freeze({ tileCount: 24, columns: 6, timeSeconds: 90, coinReward: Object.freeze({ base: 40, speedMultiplier: 0.35 }) }),
    hard: Object.freeze({ tileCount: 36, columns: 6, timeSeconds: 120, coinReward: Object.freeze({ base: 55, speedMultiplier: 0.45 }) }),
    superHard: Object.freeze({ tileCount: 60, columns: 6, timeSeconds: 180, coinReward: Object.freeze({ base: 75, speedMultiplier: 0.55 }) }),
    endless: Object.freeze({ tileCount: 60, columns: 6, timeSeconds: 0, coinReward: Object.freeze({ base: 10, speedMultiplier: 0 }) }),
    challenge: Object.freeze({ tileCount: 12, columns: 4, timeSeconds: 60, coinReward: Object.freeze({ base: 30, speedMultiplier: 0.25 }) }),
  }),
  pathfinding: Object.freeze({ maxTurns: 2, boundaryPadding: 1 }),
  scoring: Object.freeze({ baseMatchPoints: 10, comboStepPoints: 3 }),
  levelProgression: Object.freeze({
    timeBonusPerLevel: 2,
    timeBonusCap: 10,
    hintBonusPerLevel: 1,
    hintCap: 10,
  }),
  challenge: Object.freeze({
    timeBonusPerLevel: 10,
    luckyPairCount: Object.freeze({ min: 1, max: 3 }),
    luckyRewards: Object.freeze({
      coins: Object.freeze({ min: 10, max: 50 }),
      time: Object.freeze({ min: 3, max: 10 }),
    }),
  }),
  special: Object.freeze({
    scoreMultiplier: 1.5,
    progressTarget: 10,
    coinReward: Object.freeze({ min: 10, max: 50 }),
    timeReward: Object.freeze({ min: 3, max: 10 }),
    milestoneTenCoins: 100,
    frozenTilesFromLevel: 3,
    frozenPairsPerLevel: 1,
  }),
});

// Một nguồn thời lượng duy nhất cho hiệu ứng và nhịp chuyển trạng thái của Link Connect.
export const LINK_CONNECT_TIMING = Object.freeze({
  pathAnimationMs: 760,
  tileExitDelayMs: 260,
  tileExitAnimationMs: 520,
  matchSettleMs: 20,
  hintPreviewMs: 1000,
  thunderStrikeMs: 620,
  thunderNextPairDelayMs: 130,
  countdownResumeDelayMs: 1000,
});

export function getLinkMatchResolveDelay() {
  const timing = LINK_CONNECT_TIMING;
  return Math.max(
    timing.pathAnimationMs,
    timing.tileExitDelayMs + timing.tileExitAnimationMs,
  ) + timing.matchSettleMs;
}

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

export function getLinkLevelHintBonus(level = 1, currentHints = 0) {
  const progression = LINK_CONNECT_CONFIG.levelProgression;
  if (level <= 1 || currentHints >= progression.hintCap) return 0;
  return Math.min(progression.hintBonusPerLevel, progression.hintCap - currentHints);
}

export function getLinkChallengeTime(level = 1) {
  return getLinkModeLayout("challenge").timeSeconds
    + Math.max(0, level - 1) * LINK_CONNECT_CONFIG.challenge.timeBonusPerLevel;
}

export function getLinkLuckyReward(mode) {
  const rewards = LINK_CONNECT_CONFIG.challenge.luckyRewards;
  const types = isLinkEndlessMode(mode) ? ["coins"] : Object.keys(rewards);
  const type = types[Math.floor(Math.random() * types.length)];
  const range = rewards[type];
  return { type, value: randomInteger(range.min, range.max) };
}

export function calculateLinkCoinReward(mode, remainingTime) {
  const reward = getLinkModeLayout(mode).coinReward;
  return reward.base + Math.floor(Math.max(0, remainingTime) * reward.speedMultiplier);
}

function randomInteger(minimum, maximum) {
  return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
}

export function calculateLinkMatchPoints(combo = 1, { special = false } = {}) {
  const scoring = LINK_CONNECT_CONFIG.scoring;
  const points = scoring.baseMatchPoints
    + scoring.comboStepPoints * Math.max(0, combo - 1);
  return Math.round(points * (special ? LINK_CONNECT_CONFIG.special.scoreMultiplier : 1));
}

export function getLinkFrozenPairCount(level = 1) {
  const special = LINK_CONNECT_CONFIG.special;
  return level >= special.frozenTilesFromLevel ? special.frozenPairsPerLevel : 0;
}

export function getLinkGravityShift(level = 1, random = Math.random) {
  const normalizedLevel = Math.max(1, Math.floor(level));
  if (normalizedLevel <= 2) return "static";
  if (normalizedLevel <= 5) return "down";
  if (normalizedLevel <= 8) return "up";
  if (normalizedLevel <= 12) return normalizedLevel % 2 === 1 ? "left" : "right";
  if (normalizedLevel >= LINK_CONNECT_CONFIG.gravity.randomFromLevel) {
    const directions = LINK_CONNECT_CONFIG.gravity.basicDirections;
    return directions[Math.floor(random() * directions.length)];
  }
  return "static";
}
