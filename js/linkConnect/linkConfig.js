import { GAMEPLAY_LIMITS } from "../gameplayTuning.js";

export const LINK_CONNECT_HELP_CONTENT = `
  <ul class="app-feature-list">
    <li>Ghép hai hình giống nhau khi đường nối không quá hai lần rẽ.</li>
    <li>Sau mỗi cặp, các thẻ có thể dồn, tách, đổi chỗ hoặc xoay theo quy tắc của cấp.</li>
    <li>Thẻ cao cấp có thể mở băng, tặng công cụ hoặc gọi Sấm sét.</li>
    <li>Ghép thẻ cao cấp để thu thập năng lượng và mở các mốc thưởng.</li>
    <li>Hết đường nối, game sẽ tự xáo; nếu chỉ còn thẻ băng, tất cả sẽ tự mở.</li>
  </ul>
`;

export const LINK_CONNECT_CONFIG = Object.freeze({
  gravity: Object.freeze({
    basicDirections: Object.freeze(["down", "up", "left", "right"]),
    advancedDirections: Object.freeze([
      "center",
      "split-vertical",
      "split-horizontal",
      "swap",
      "rotate-clockwise",
      "rotate-counterclockwise",
    ]),
    progression: Object.freeze([
      Object.freeze({ fromLevel: 1, untilLevel: 2, directions: Object.freeze(["static"]) }),
      Object.freeze({ fromLevel: 3, untilLevel: 5, directions: Object.freeze(["down"]) }),
      Object.freeze({ fromLevel: 6, untilLevel: 8, directions: Object.freeze(["up"]) }),
      Object.freeze({ fromLevel: 9, untilLevel: 12, directions: Object.freeze(["left", "right"]), alternate: true }),
      Object.freeze({ fromLevel: 13, untilLevel: 15, directions: Object.freeze(["center"]) }),
      Object.freeze({ fromLevel: 16, untilLevel: 18, directions: Object.freeze(["split-vertical"]) }),
      Object.freeze({ fromLevel: 19, untilLevel: 21, directions: Object.freeze(["split-horizontal"]) }),
      Object.freeze({ fromLevel: 22, untilLevel: 24, directions: Object.freeze(["swap"]) }),
      Object.freeze({ fromLevel: 25, untilLevel: 27, directions: Object.freeze(["rotate-clockwise", "rotate-counterclockwise"]), alternate: true }),
      Object.freeze({ fromLevel: 28, untilLevel: Infinity, directions: Object.freeze([
        "down", "up", "left", "right", "center", "split-vertical",
        "split-horizontal", "swap", "rotate-clockwise", "rotate-counterclockwise",
      ]), random: true }),
    ]),
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
  scoring: Object.freeze({
    baseMatchPoints: 10,
    comboStepPoints: 3,
    starPointsPerPair: Object.freeze({ one: 12, two: 18, three: 25 }),
    endlessStarPointsPerPair: Object.freeze({ one: 10, two: 15, three: 20 }),
    comboWindows: Object.freeze([
      Object.freeze({ maxPairs: 8, seconds: 15 }),
      Object.freeze({ maxPairs: 15, seconds: 20 }),
      Object.freeze({ maxPairs: Infinity, seconds: 30 }),
    ]),
  }),
  levelProgression: Object.freeze({
    timeBonusPerLevel: 2,
    timeBonusCap: 10,
    hintBonusPerLevel: 1,
    hintCap: GAMEPLAY_LIMITS.itemCount,
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
    premiumTypes: Object.freeze([
      Object.freeze({ id: "cyan", label: "Phá Băng", weight: 0.5, effectChance: 1 }),
      Object.freeze({ id: "blue", label: "Tiếp Tế", weight: 0.3, effectChance: 0.5 }),
      Object.freeze({ id: "red", label: "Bùng Nổ", weight: 0.2, effectChance: 0.5 }),
    ]),
    supplyItems: Object.freeze({
      standard: Object.freeze(["hint", "reshuffle", "freeze"]),
      endless: Object.freeze(["hint", "reshuffle"]),
    }),
    pairGeneration: Object.freeze([
      Object.freeze({ maxPairs: 8, chance: 0.6, min: 1, max: 1 }),
      Object.freeze({ maxPairs: 15, chance: 0.7, min: 1, max: 2 }),
      Object.freeze({ maxPairs: Infinity, chance: 0.8, min: 2, max: 3 }),
    ]),
    frozenPairGeneration: Object.freeze([
      Object.freeze({ maxPairs: 8, count: 1 }),
      Object.freeze({ maxPairs: 15, count: 2 }),
      Object.freeze({ maxPairs: 24, count: 3 }),
      Object.freeze({ maxPairs: Infinity, count: 4 }),
    ]),
    frozenFallbackReward: Object.freeze({
      coin: Object.freeze({ min: 5, max: 15 }),
      time: Object.freeze({ min: 2, max: 5 }),
    }),
    // Tạm để 100% nhằm kiểm tra hiệu ứng bay năng lượng; trả về 0.2 khi kết thúc QA.
    energyDrop: Object.freeze({ chance: 1, guaranteeAfterMisses: 9 }),
    milestones: Object.freeze({
      breakCoins: 10,
      two: Object.freeze({ coins: 5 }),
      four: Object.freeze({ time: Object.freeze({ min: 2, max: 4 }), fallbackCoins: 5 }),
      six: Object.freeze({ frozenPairs: 1, fallbackCoins: 5 }),
      seven: Object.freeze({ time: Object.freeze({ min: 2, max: 5 }), coins: 10 }),
      eight: Object.freeze({ standardItem: "freeze", endlessItem: "reshuffle" }),
      ten: Object.freeze({ coins: 10 }),
    }),
  }),
});

export const LINK_SPECIAL_MILESTONE_TOOLTIPS = Object.freeze({
  1: "Phá hủy ngẫu nhiên 1 cặp thường.",
  2: "Nhận +5 Xu.",
  3: "Phá hủy ngẫu nhiên 1 cặp thường.",
  4: "Nhận +2–4 giây.",
  5: "Nhận ngẫu nhiên 1 Gợi ý hoặc 1 Xáo trộn.",
  6: "Mở 1 cặp băng; nếu hết băng nhận +5 Xu.",
  7: "Nhận +2–5 giây và +10 Xu.",
  8: "Nhận +1 Đóng băng thời gian; Vô tận nhận +1 Xáo trộn.",
  9: "Phá 1 cặp thường và nhận 1 Gợi ý.",
  10: "Phá 1 cặp thường, +10 Xu, +1 Xáo trộn, +1 Gợi ý.",
});

export function getLinkSpecialMilestoneTooltip(milestone) {
  return LINK_SPECIAL_MILESTONE_TOOLTIPS[milestone] || "Phần thưởng mốc đặc biệt.";
}

// Một nguồn thời lượng duy nhất cho hiệu ứng và nhịp chuyển trạng thái của Link Connect.
export const LINK_CONNECT_TIMING = Object.freeze({
  pathAnimationMs: 760,
  tileExitDelayMs: 260,
  tileExitAnimationMs: 520,
  matchSettleMs: 20,
  mismatchFeedbackMs: 300,
  hintPreviewMs: 1000,
  thunderStrikeMs: 520,
  thunderCardExitDelayMs: 190,
  thunderNextPairDelayMs: 130,
  countdownResumeDelayMs: 1000,
  specialPairTransformMs: 720,
  frozenPairUnlockMs: 2600,
  energyBurstMs: 1100,
  energyHoldMs: 1000,
  energyFlightMs: 1050,
  itemRewardBurstMs: 620,
  itemRewardHoldMs: 380,
  itemRewardFlightMs: 820,
  automaticPairMarkMs: 360,
  boardShiftMs: 540,
  boardShuffleMs: 720,
  boardShuffleStaggerMs: 12,
});

export function getLinkMatchResolveDelay() {
  const timing = LINK_CONNECT_TIMING;
  return Math.max(
    timing.pathAnimationMs,
    timing.tileExitDelayMs + timing.tileExitAnimationMs,
  ) + timing.matchSettleMs;
}

export function getLinkThunderResolveDelay() {
  const timing = LINK_CONNECT_TIMING;
  return Math.max(
    timing.thunderStrikeMs,
    timing.thunderCardExitDelayMs + timing.tileExitDelayMs + timing.tileExitAnimationMs,
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

function randomInteger(minimum, maximum, random = Math.random) {
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

export function calculateLinkMatchPoints(combo = 1, { special = false } = {}) {
  const scoring = LINK_CONNECT_CONFIG.scoring;
  const points = scoring.baseMatchPoints
    + scoring.comboStepPoints * Math.max(0, combo - 1);
  return Math.round(points * (special ? LINK_CONNECT_CONFIG.special.scoreMultiplier : 1));
}

export function calculateLinkThunderPairPoints(combo = 1, { countsCombo = false } = {}) {
  return calculateLinkMatchPoints(countsCombo ? combo : 1);
}

export function calculateLinkCompletionTimeBonus(mode, remainingTime) {
  if (isLinkEndlessMode(mode)) return 0;
  return Math.floor(Math.max(0, Number(remainingTime) || 0));
}

export function getLinkStarScoreTargets(totalPairs, mode = "easy") {
  const scoring = LINK_CONNECT_CONFIG.scoring;
  const pairs = Math.max(1, Number(totalPairs) || 1);
  const points = isLinkEndlessMode(mode)
    ? scoring.endlessStarPointsPerPair
    : scoring.starPointsPerPair;
  return Object.freeze({
    one: pairs * points.one,
    two: pairs * points.two,
    three: pairs * points.three,
  });
}

export function calculateLinkStarRating(score, totalPairs, mode) {
  const targets = getLinkStarScoreTargets(totalPairs, mode);
  return score >= targets.three ? 3
    : score >= targets.two ? 2
      : score >= targets.one ? 1 : 0;
}

export function getLinkComboWindowMs(pairCount) {
  const rule = LINK_CONNECT_CONFIG.scoring.comboWindows
    .find((entry) => pairCount <= entry.maxPairs);
  return (rule?.seconds || 5) * 1000;
}

export function getLinkSpecialPairCount(pairCount, random = Math.random) {
  const rule = LINK_CONNECT_CONFIG.special.pairGeneration
    .find((entry) => pairCount <= entry.maxPairs);
  if (!rule || random() > rule.chance) return 0;
  return randomInteger(rule.min, rule.max, random);
}

export function getLinkPremiumType(random = Math.random) {
  const types = LINK_CONNECT_CONFIG.special.premiumTypes;
  const roll = random();
  let cumulativeWeight = 0;
  for (const type of types) {
    cumulativeWeight += type.weight;
    if (roll < cumulativeWeight) return type.id;
  }
  return types.at(-1)?.id || "cyan";
}

export function getLinkPremiumTypeDefinition(id) {
  return LINK_CONNECT_CONFIG.special.premiumTypes.find((type) => type.id === id)
    || LINK_CONNECT_CONFIG.special.premiumTypes[0];
}

export function getLinkPremiumSupplyItem(mode, random = Math.random) {
  const pools = LINK_CONNECT_CONFIG.special.supplyItems;
  const items = isLinkEndlessMode(mode) ? pools.endless : pools.standard;
  return items[Math.floor(random() * items.length)] || items[0];
}

export function getLinkFrozenPairCount(pairCount) {
  const rule = LINK_CONNECT_CONFIG.special.frozenPairGeneration
    .find((entry) => pairCount <= entry.maxPairs);
  return rule?.count || 0;
}

export function getLinkGravityShift(level = 1, random = Math.random) {
  const normalizedLevel = Math.max(1, Math.floor(level));
  const rule = LINK_CONNECT_CONFIG.gravity.progression
    .find((entry) => normalizedLevel <= entry.untilLevel);
  if (!rule) return "static";
  if (rule.random) return rule.directions[Math.floor(random() * rule.directions.length)];
  if (rule.alternate) {
    return rule.directions[(normalizedLevel - rule.fromLevel) % rule.directions.length];
  }
  return rule.directions[0] || "static";
}
