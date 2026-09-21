export const EFFECT_QUALITY = Object.freeze({ low: 12, medium: 28, high: 48, reduced: 0 });

export function resolveEffectQuality({ reducedMotion = false, coarsePointer = false, deviceMemory = 4 } = {}) {
  if (reducedMotion) return "reduced";
  if (coarsePointer || deviceMemory <= 2) return "low";
  return deviceMemory >= 8 ? "high" : "medium";
}

export function particleBudget(quality, cost = 1) {
  const budget = EFFECT_QUALITY[quality];
  if (budget === undefined) throw new TypeError(`Unknown effect quality: ${quality}`);
  return Math.max(0, Math.floor(budget / Math.max(1, cost)));
}
