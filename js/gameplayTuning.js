export const GAMEPLAY_TIMING = Object.freeze({
  tileRevealAnimationMs: 600,
  tileHideAnimationMs: 180,
  mismatchRevealMs: 800,
  shopRevealDurationMs: 5000,
  levelIntroDurationMs: 2000,
  comboPopupVisibleMs: 1900,
  comboPopupFadeMs: 650,
  timePurchaseGraceMs: 1000,
  victoryFireworksDurationMs: 2500,
  victoryCelebration: Object.freeze({
    triggerLevel: 100,
    finalLevel: 100,
    flowerGrowthDurationMs: 6400,
  }),
});

const COMBO_TIERS = Object.freeze([
  { minimum: 6, id: "perfect", label: "Perfect!" },
  { minimum: 4, id: "excellent", label: "Excellent!" },
  { minimum: 3, id: "great", label: "Great!" },
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
