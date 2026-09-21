import { getEffectRegistry } from "../gameShell/gameShellEffects.js";
import { prefersReducedMotion } from "../motion.js";
import { particleBudget, resolveEffectQuality } from "./effectQuality.js";

export function createEffectRuntime({ quality } = {}) {
  const registry = getEffectRegistry();
  const resolvedQuality = quality || resolveEffectQuality({
    reducedMotion: prefersReducedMotion(),
    coarsePointer: window.matchMedia?.("(pointer: coarse)").matches,
    deviceMemory: navigator.deviceMemory,
  });
  return Object.freeze({
    quality: resolvedQuality,
    particleBudget: cost => particleBudget(resolvedQuality, cost),
    run({ type = "canvas", duration, start }) {
      let cancelled = false;
      let resolveFinished;
      const finished = new Promise(resolve => { resolveFinished = resolve; });
      const entry = registry.track(type, () => { cancelled = true; resolveFinished(); }, {
        allowReducedMotion: resolvedQuality === "reduced",
      });
      if (!entry) return Object.freeze({ cancel() {}, dispose() {}, finished: Promise.resolve(), cancelled: true });
      const handle = Object.freeze({
        get cancelled() { return cancelled; },
        finished,
        cancel: () => entry.dispose(),
        dispose: () => entry.dispose(),
      });
      start?.(handle);
      entry.scope.timeout(() => entry.dispose(), Math.max(0, duration));
      return handle;
    },
  });
}
