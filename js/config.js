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
      tileCount: 48,
      columns: 6,
      mobileColumns: 6,
      timeSeconds: 180,
      coinReward: Object.freeze({ base: 90, speedMultiplier: 0.8 }),
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
});

export function getModeLayout(mode = "easy") {
  const layout = GAME_CONFIG.modes[mode] || GAME_CONFIG.modes.easy;
  return layout;
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
