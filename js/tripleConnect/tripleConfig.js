export const TRIPLE_RULES = Object.freeze({
  trayCapacity: 7,
  matchSize: 3,
  baseMatchScore: 10,
  comboScoreStep: 3,
});

export const TRIPLE_EASY_CONFIG = Object.freeze({
  mode: "easy",
  tileCount: 12,
  layerCount: 2,
  timeSeconds: 60,
});

export function calculateTripleMatchScore(combo) {
  const normalizedCombo = Math.max(1, Math.floor(Number(combo) || 0));
  return TRIPLE_RULES.baseMatchScore + (normalizedCombo - 1) * TRIPLE_RULES.comboScoreStep;
}
