export const GAME_CONFIG = Object.freeze({
  cardImages: Object.freeze({
    count: 1000,
    defaultTheme: "default",
  }),
  modes: Object.freeze({
    easy: Object.freeze({
      tileCount: 12,
      columns: 4,
      mobileColumns: 3,
      // Mốc thử nghiệm để kiểm tra nhanh luồng hết giờ; phát hành đổi lại 60.
      timeSeconds: 6,
      coinReward: Object.freeze({ base: 30, speedMultiplier: 0.35 }),
    }),
    normal: Object.freeze({
      tileCount: 24,
      columns: 6,
      mobileColumns: 4,
      timeSeconds: 90,
      coinReward: Object.freeze({ base: 50, speedMultiplier: 0.5 }),
    }),
    hard: Object.freeze({
      tileCount: 36,
      columns: 6,
      mobileColumns: 6,
      timeSeconds: 120,
      coinReward: Object.freeze({ base: 70, speedMultiplier: 0.65 }),
    }),
    superHard: Object.freeze({
      tileCount: 60,
      columns: 6,
      mobileColumns: 6,
      timeSeconds: 180,
      coinReward: Object.freeze({ base: 90, speedMultiplier: 0.8 }),
    }),
    endless: Object.freeze({
      tileCount: 60,
      columns: 6,
      mobileColumns: 6,
      timeSeconds: 0,
      coinReward: Object.freeze({ base: 10, speedMultiplier: 0 }),
    }),
    challenge: Object.freeze({
      tileCount: 12,
      columns: 4,
      mobileColumns: 3,
      timeSeconds: 60,
      coinReward: Object.freeze({ base: 30, speedMultiplier: 0.35 }),
    }),
  }),
  initialState: Object.freeze({
    hints: 3,
    score: 0,
    timeSeconds: 180,
  }),
  levelProgression: Object.freeze({
    timeBonusPerLevel: 3,
    timeBonusCap: 30,
    hintBonusPerLevel: 1,
    hintCap: 10,
  }),
  previewDurationMs: 5000,
  hintRevealDurationMs: 2500,
  specialModes: Object.freeze({
    endlessPreviewDurationMs: 8000,
    challengeTimeBonusSeconds: 10,
    luckyTileCount: Object.freeze({ minimum: 1, maximum: 3 }),
    luckyRewards: Object.freeze({
      time: Object.freeze({ minimum: 3, maximum: 5 }),
      hints: Object.freeze({ minimum: 1, maximum: 2 }),
      coins: Object.freeze({ minimum: 1, maximum: 10 }),
    }),
  }),
});

const CHALLENGE_LAYOUTS = Object.freeze([
  Object.freeze({ untilLevel: 3, tileCount: 12, columns: 4, mobileColumns: 3 }),
  Object.freeze({ untilLevel: 6, tileCount: 16, columns: 4, mobileColumns: 4 }),
  Object.freeze({ untilLevel: 9, tileCount: 20, columns: 4, mobileColumns: 4 }),
  Object.freeze({ untilLevel: 12, tileCount: 24, columns: 6, mobileColumns: 4 }),
  Object.freeze({ untilLevel: 15, tileCount: 30, columns: 6, mobileColumns: 5 }),
  Object.freeze({ untilLevel: 18, tileCount: 36, columns: 6, mobileColumns: 6 }),
  Object.freeze({ untilLevel: 21, tileCount: 42, columns: 6, mobileColumns: 6 }),
  Object.freeze({ untilLevel: Infinity, tileCount: 48, columns: 6, mobileColumns: 6 }),
]);

export function getModeLayout(mode = "easy") {
  const layout = GAME_CONFIG.modes[mode] || GAME_CONFIG.modes.easy;
  return layout;
}

export function getChallengeLayout(level = 1) {
  return CHALLENGE_LAYOUTS.find((layout) => level <= layout.untilLevel)
    || CHALLENGE_LAYOUTS.at(-1);
}

export function isEndlessMode(mode) {
  return mode === "endless";
}

export function isChallengeMode(mode) {
  return mode === "challenge";
}

export function getTimerDirection(mode) {
  return isEndlessMode(mode) ? "up" : "down";
}

export function getPreviewDurationMs(mode) {
  return isEndlessMode(mode)
    ? GAME_CONFIG.specialModes.endlessPreviewDurationMs
    : GAME_CONFIG.previewDurationMs;
}

export function getLuckyReward() {
  const rewards = GAME_CONFIG.specialModes.luckyRewards;
  const types = Object.keys(rewards);
  const type = types[Math.floor(Math.random() * types.length)];
  const range = rewards[type];
  const value = Math.floor(Math.random() * (range.maximum - range.minimum + 1)) + range.minimum;
  return { type, value };
}

export function calculateCoinReward(mode, remainingTime) {
  const layout = GAME_CONFIG.modes[mode] || GAME_CONFIG.modes.easy;
  const reward = layout.coinReward;
  return (
    reward.base +
    Math.floor(Math.max(0, remainingTime) * reward.speedMultiplier)
  );
}

export function getLevelTimeBonus(level = 1) {
  const { timeBonusPerLevel, timeBonusCap } = GAME_CONFIG.levelProgression;
  return Math.min(Math.max(0, level - 1) * timeBonusPerLevel, timeBonusCap);
}

export function getLevelHintBonus(level = 1, currentHints = 0) {
  const { hintBonusPerLevel, hintCap } = GAME_CONFIG.levelProgression;
  if (level <= 1 || currentHints >= hintCap) return 0;
  return Math.min(hintBonusPerLevel, hintCap - currentHints);
}
