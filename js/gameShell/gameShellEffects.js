import { createGameShellLifecycle, getActiveGameScope } from "./gameShellLifecycle.js";
import { prefersReducedMotion } from "../motion.js";

export const EFFECT_LIMITS = Object.freeze({ loot: 16, coin: 32, score: 12, combo: 2, item: 12, highlight: 8, flip: 256, canvas: 4, connection: 1 });
const registries = new WeakMap();
let menuRegistry;

// A rejected visual must not reject a reward. Callers settle gameplay immediately.
export function createEffectRegistry(owner = null, limits = {}) {
  for (const [key, value] of Object.entries(limits)) {
    if (!(key in EFFECT_LIMITS) || !Number.isInteger(value) || value < 0 || value > 512) throw new TypeError(`Invalid effect limit: ${key}`);
  }
  const caps = { ...EFFECT_LIMITS, ...limits };
  const entries = new Set();
  return {
    track(type, cleanup, { allowReducedMotion = false } = {}) {
      if (!(type in caps)) throw new TypeError(`Unknown effect: ${type}`);
      if (owner && !owner.active || (!allowReducedMotion && prefersReducedMotion()) || [...entries].filter(entry => entry.type === type).length >= caps[type]) return null;
      const scope = createGameShellLifecycle();
      let releaseOwner;
      const entry = { type, scope, dispose() {
        if (!entries.delete(entry)) return;
        releaseOwner?.forget();
        scope.dispose();
        cleanup();
      } };
      entries.add(entry);
      releaseOwner = owner?.own(entry.dispose, "cleanup");
      return entry;
    },
    clear() { [...entries].forEach(entry => entry.dispose()); },
    diagnostics() { return Object.fromEntries(Object.keys(caps).map(type => [type, [...entries].filter(entry => entry.type === type).length])); },
  };
}
export function getEffectRegistry() {
  const owner = getActiveGameScope();
  if (!owner) return menuRegistry ||= createEffectRegistry();
  menuRegistry?.clear();
  if (!registries.has(owner)) registries.set(owner, createEffectRegistry(owner));
  return registries.get(owner);
}
export function trackEffect(type, cleanup) { return getEffectRegistry().track(type, cleanup); }

export function presentEffect(element, { type = "score", duration, parent = document.body } = {}) {
  const entry = trackEffect(type, () => element.remove());
  if (!entry) return null;
  parent.append(element);
  entry.scope.timeout(entry.dispose, duration);
  return entry;
}

// Keyframes deliberately accept only compositor properties; no layout/paint animation.
export function animateShellEffect(element, keyframes, options, { type = "flip", remove = false, onFinish } = {}) {
  for (const frame of keyframes) for (const key of Object.keys(frame)) {
    if (!["transform", "opacity", "offset", "easing", "composite"].includes(key)) throw new TypeError(`Unsupported motion property: ${key}`);
  }
  const entry = trackEffect(type, () => { animation?.cancel(); if (remove) element.remove(); });
  let animation;
  if (!entry) { if (remove) element.remove(); onFinish?.(); return null; }
  animation = element.animate(keyframes, options);
  entry.scope.animation(animation);
  animation.addEventListener("cancel", () => entry.dispose(), { once: true });
  animation.finished.then(entry.scope.guard(() => { entry.dispose(); onFinish?.(); }), () => entry.dispose());
  return animation;
}

export function flyToTarget(element, target, { duration = 780, onFinish } = {}) {
  const source = element.getBoundingClientRect();
  const destination = target.getBoundingClientRect();
  return animateShellEffect(element, [
    { transform: "translate(0,0) scale(1)", opacity: 1 },
    { transform: `translate(${destination.left + destination.width / 2 - source.left - source.width / 2}px,${destination.top + destination.height / 2 - source.top - source.height / 2}px) scale(.6)`, opacity: 0 },
  ], { duration, easing: "cubic-bezier(.32,.62,.38,1)" }, { type: "item", remove: true, onFinish });
}
export function pulseTarget(element, negative = false) {
  return animateShellEffect(element, [{ transform: "scale(1)", opacity: 1 },
    { transform: `scale(${negative ? .94 : 1.1})`, opacity: .7 }, { transform: "scale(1)", opacity: 1 }],
  { duration: 900, easing: "ease" }, { type: "highlight" });
}
