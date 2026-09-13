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

export const TRIPLE_EASY_LAYOUT = Object.freeze({
  id: "easy-12-v1",
  tileWidth: 0.2,
  tileHeight: 0.24,
  overlapEpsilon: 0.000001,
  slots: Object.freeze([
    { id: "bottom-1", layer: 0, x: 0.08, y: 0.12 },
    { id: "bottom-2", layer: 0, x: 0.3, y: 0.12 },
    { id: "bottom-3", layer: 0, x: 0.52, y: 0.12 },
    { id: "bottom-4", layer: 0, x: 0.74, y: 0.12 },
    { id: "bottom-5", layer: 0, x: 0.08, y: 0.58 },
    { id: "bottom-6", layer: 0, x: 0.3, y: 0.58 },
    { id: "bottom-7", layer: 0, x: 0.52, y: 0.58 },
    { id: "bottom-8", layer: 0, x: 0.74, y: 0.58 },
    { id: "top-1", layer: 1, x: 0.19, y: 0.19 },
    { id: "top-2", layer: 1, x: 0.41, y: 0.19 },
    { id: "top-3", layer: 1, x: 0.52, y: 0.31 },
    { id: "top-4", layer: 1, x: 0.74, y: 0.31 },
  ].map(Object.freeze)),
});

export const TRIPLE_EASY_SOLVER_BUDGET = Object.freeze({
  maxNodes: 5000,
  maxMemo: 2000,
  deadlineMs: 20,
});

export const TRIPLE_EASY_GENERATOR_BUDGET = Object.freeze({
  maxAttempts: 12,
});

export const TRIPLE_EASY_FALLBACK_SEED = "triple-easy-v1-fallback";

export function calculateTripleMatchScore(combo) {
  const normalizedCombo = Math.max(1, Math.floor(Number(combo) || 0));
  return TRIPLE_RULES.baseMatchScore + (normalizedCombo - 1) * TRIPLE_RULES.comboScoreStep;
}
