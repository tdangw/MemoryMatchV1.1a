export const GAMEPLAY_TIMING = Object.freeze({
  secondMs: 1000,
  tileRevealAnimationMs: 600,
  tileHideAnimationMs: 180,
  mismatchRevealMs: 800,
  shopRevealDurationMs: 5000,
  levelIntroDurationMs: 2000,
  rewardPopupVisibleMs: 760,
  rewardPopupExitMs: 260,
  scoreEffectDurationMs: 1900,
  timePurchaseGraceMs: 1000,
  victoryFireworksDurationMs: 2500,
  victoryCelebration: Object.freeze({
    triggerLevel: 100,
    finalLevel: 100,
    flowerGrowthDurationMs: 6400,
  }),
});

const COMBO_TIERS = Object.freeze([
  { minimum: 26, id: "ultimate", label: "ULTIMATE!" },
  { minimum: 22, id: "godlike", label: "GODLIKE!" },
  { minimum: 18, id: "mythic", label: "MYTHIC!" },
  { minimum: 15, id: "legendary", label: "LEGENDARY!" },
  { minimum: 12, id: "supreme", label: "Supreme!" },
  { minimum: 10, id: "unbelievable", label: "Unbelievable!" },
  { minimum: 8, id: "peak", label: "Peak!" },
  { minimum: 6, id: "perfect", label: "Perfect!" },
  { minimum: 5, id: "excellent", label: "Excellent!" },
  { minimum: 4, id: "great", label: "Great!" },
  { minimum: 3, id: "good", label: "Good!" },
  { minimum: 2, id: "nice", label: "Nice!" },
]);

export function getComboTimeBonus(combo) {
  return combo >= 2 ? combo : 0;
}

export function getComboPresentation(combo) {
  return COMBO_TIERS.find((tier) => combo >= tier.minimum) || null;
}

export function shouldShowVictoryCelebration(level) {
  return level === GAMEPLAY_TIMING.victoryCelebration.triggerLevel;
}
