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

export const TRIPLE_NORMAL_CONFIG = Object.freeze({ mode: "normal", tileCount: 24, layerCount: 3, timeSeconds: 90 });
const normalSlots = (layer, count, y) => Array.from({ length: count }, (_, index) => Object.freeze({
  id: `normal-${layer}-${index + 1}`, layer, x: .04 + (index % 4) * .24, y: y + Math.floor(index / 4) * .23,
}));
export const TRIPLE_NORMAL_LAYOUT = Object.freeze({ id: "normal-24-v1", tileWidth: .2, tileHeight: .22, overlapEpsilon: .000001,
  slots: Object.freeze([...normalSlots(0, 12, .08), ...normalSlots(1, 8, .18), ...normalSlots(2, 4, .3)]),
});
export const TRIPLE_HARD_CONFIG = Object.freeze({ mode: "hard", tileCount: 36, layerCount: 4, timeSeconds: 120 });
export const TRIPLE_HARD_SOLVER_BUDGET = Object.freeze({ maxNodes: 50000, maxMemo: 20000, deadlineMs: 100 });
const hardSlots = (layer, count, y) => Array.from({ length: count }, (_, index) => Object.freeze({ id: `hard-${layer}-${index + 1}`, layer, x: .03 + (index % 6) * .16, y: y + Math.floor(index / 6) * .18 }));
export const TRIPLE_HARD_LAYOUT = Object.freeze({ id: "hard-36-v1", tileWidth: .15, tileHeight: .17, overlapEpsilon: .000001,
  slots: Object.freeze([...hardSlots(0, 18, .05), ...hardSlots(1, 9, .14), ...hardSlots(2, 6, .25), ...hardSlots(3, 3, .36)]),
});

export function calculateTripleMatchScore(combo) {
  const normalizedCombo = Math.max(1, Math.floor(Number(combo) || 0));
  return TRIPLE_RULES.baseMatchScore + (normalizedCombo - 1) * TRIPLE_RULES.comboScoreStep;
}
