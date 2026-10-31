import { getEffectRegistry, trackEffect } from "./gameShell/gameShellEffects.js";
import { shellTimeout as setTimeout, shellFrame as requestAnimationFrame, cancelShellFrame as cancelAnimationFrame } from "./gameShell/gameShellLifecycle.js";
import { createIcon } from "./icons.js";
import { GAMEPLAY_TIMING, COIN_PARTICLE_LIMIT } from "./gameplayTuning.js";
import { prefersReducedMotion } from "./motion.js";
import { getActiveGameScope } from './gameShell/gameShellLifecycle.js';
import { gameState } from './gameState.js';
import { MATCH_COINS_PER_GROUP } from './progression/gameplayRules.js';

export const MATCH_COIN_REWARD = Object.freeze({
  base: MATCH_COINS_PER_GROUP,
  comboStep: 0,
});

const counterAnimations = new WeakMap();
const activeCoinCounters = new Set();
const activeCoinEffects = new Set();
const effectEntries = new WeakMap();
const counterPulseEntries = new WeakMap();
const coinSoundCleanups = new WeakMap();

export function calculateMatchCoinReward() {
  return MATCH_COINS_PER_GROUP;
}

export function playCoinRewardFlight(source, target, amount, options = {}) {
  const coinCount = Math.max(0, Math.floor(Number(amount) || 0));
  if (!source || !target || coinCount < 1) return [];
  const owner = options.owner || getActiveGameScope();
  if (owner && !owner.active) return [];
  const schedule = owner ? owner.timeout : setTimeout;
  let completed = false;
  const complete = () => {
    if (completed) return;
    completed = true;
    options.onArrival?.(coinCount);
    options.onComplete?.();
  };
  // Audio remains independent of wallet updates and animation completion.
  const audioReady = options.sound !== false && owner?.active ? import('./sound.js').catch(error => {
    console.warn('Coin sound unavailable', error);
    return null;
  }) : null;
  const playCue = (name, effect) => {
    if (!audioReady) return;
    void audioReady.then(audio => {
      if (audio && owner.active && (!effect || activeCoinEffects.has(effect))) {
        audio.playOwnedRewardCue(name, owner, gameState.settings);
      }
    });
  };
  if (prefersReducedMotion()) {
    playCue('coinCollect');
    complete();
    return [];
  }
  const stableSource = source.closest?.(".link-board__cell, .tile") || source;
  const targetIcon = target.querySelector?.(".ui-icon") || target;
  const sourceRect = stableSource.getBoundingClientRect();
  const targetRect = targetIcon.getBoundingClientRect();
  const sourceCenterX = sourceRect.left + sourceRect.width / 2;
  const sourceCenterY = sourceRect.top + sourceRect.height / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  const safeInset = 14;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const durationMs = options.flightDurationMs ?? GAMEPLAY_TIMING.coinRewardFlightMs;
  const staggerMs = options.staggerMs ?? GAMEPLAY_TIMING.coinRewardStaggerMs;
  const durationVarianceMs = options.durationVarianceMs ?? 140;
  const fragment = document.createDocumentFragment();
  let arrived = 0;
  const effects = Array.from({ length: Math.min(coinCount, COIN_PARTICLE_LIMIT) }, (_, index) => {
    const effect = document.createElement("span");
    const entry = trackEffect("coin", () => removeCoinEffect(effect));
    if (!entry) return null;
    effectEntries.set(effect, entry);
    if (options.owner) {
      const releaseOwner = options.owner.own(() => entry.dispose(), 'cleanup');
      entry.scope.own(() => releaseOwner.forget());
    }
    effect.className = "game-coin-reward-flight";
    effect.setAttribute("aria-hidden", "true");
    effect.append(createIcon("coin"));
    const startX = clamp(sourceCenterX + randomBetween(-7, 7), safeInset, viewportWidth - safeInset);
    const startY = clamp(sourceCenterY + randomBetween(-5, 5), safeInset, viewportHeight - safeInset);
    const horizontalRange = Math.min(58, Math.max(30, sourceRect.width * 0.68));
    const spread = randomBetween(-horizontalRange, horizontalRange);
    const downwardRange = Math.min(54, Math.max(30, sourceRect.height * 0.5));
    const landingX = clamp(startX + spread, safeInset, viewportWidth - safeInset) - startX;
    const landingY = clamp(startY + randomBetween(16, downwardRange), safeInset, viewportHeight - safeInset) - startY;
    const apexX = landingX * randomBetween(0.28, 0.68) + randomBetween(-7, 7);
    const apexY = clamp(startY - randomBetween(28, 54), safeInset, viewportHeight - safeInset) - startY;
    const bounceX = landingX + randomBetween(-3, 3);
    const bounceY = landingY - randomBetween(5, 10);
    const targetX = targetCenterX - startX;
    const targetY = targetCenterY - startY;
    const flightDuration = Math.round(durationMs + randomBetween(-durationVarianceMs, durationVarianceMs));
    const delay = Math.round(index * staggerMs + randomBetween(0, staggerMs * 0.65));
    effect.style.left = `${startX}px`;
    effect.style.top = `${startY}px`;
    effect.style.setProperty("--game-coin-apex-x", `${Math.round(apexX)}px`);
    effect.style.setProperty("--game-coin-apex-y", `${Math.round(apexY)}px`);
    effect.style.setProperty("--game-coin-land-x", `${Math.round(landingX)}px`);
    effect.style.setProperty("--game-coin-land-y", `${Math.round(landingY)}px`);
    effect.style.setProperty("--game-coin-bounce-x", `${Math.round(bounceX)}px`);
    effect.style.setProperty("--game-coin-bounce-y", `${Math.round(bounceY)}px`);
    effect.style.setProperty("--game-coin-flight-x", `${Math.round(targetX)}px`);
    effect.style.setProperty("--game-coin-flight-y", `${Math.round(targetY)}px`);
    effect.style.setProperty("--game-coin-start-rotation", `${Math.round(randomBetween(-28, 28))}deg`);
    effect.style.setProperty("--game-coin-apex-rotation", `${Math.round(randomBetween(-16, 24))}deg`);
    effect.style.setProperty("--game-coin-land-rotation", `${Math.round(randomBetween(-12, 12))}deg`);
    effect.style.setProperty("--game-coin-flight-duration", `${flightDuration}ms`);
    effect.style.setProperty("--game-coin-delay", `${delay}ms`);
    activeCoinEffects.add(effect);
    const onStart = event => {
      if (event.target === effect && event.animationName === 'game-coin-reward-loot') playCue('coinDrop', effect);
    };
    let landed = false;
    const onEnd = event => {
      if (event.target !== effect || event.animationName !== 'game-coin-reward-loot' || landed) return;
      landed = true;
      playCue('coinCollect', effect);
      arrived++;
      if (arrived === effects.length) complete();
      else options.onArrival?.(Math.floor(coinCount * arrived / effects.length));
    };
    effect.addEventListener('animationstart', onStart);
    effect.addEventListener('animationend', onEnd);
    coinSoundCleanups.set(effect, () => {
      effect.removeEventListener('animationstart', onStart);
      effect.removeEventListener('animationend', onEnd);
    });
    fragment.append(effect);
    return effect;
  }).filter(Boolean);
  document.body.append(fragment);
  if (!effects.length) { complete(); return effects; }
  const finalArrivalDelay = durationMs + Math.max(0, effects.length - 1) * staggerMs;
  if (options.showLabel !== false) schedule(() => showCoinGainLabel(target, coinCount), finalArrivalDelay);
  schedule(
    () => { effects.forEach(removeCoinEffect); complete(); },
    durationMs + durationVarianceMs + Math.max(0, effects.length - 1) * staggerMs + 300,
  );
  return effects;
}

export function stopCoinCounterAnimation(counter) {
  const frame = counterAnimations.get(counter);
  if (frame) cancelAnimationFrame(frame);
  counterAnimations.delete(counter);
  activeCoinCounters.delete(counter);
}

export function animateCoinCounter(container, counter, previousCoins, nextCoins) {
  if (!container || !counter) return;
  const activeFrame = counterAnimations.get(counter);
  if (activeFrame) cancelAnimationFrame(activeFrame);
  const displayedCoins = Number(counter.textContent);
  const startCoins = Number.isFinite(displayedCoins) ? displayedCoins : previousCoins;
  if (prefersReducedMotion()) {
    counter.textContent = String(nextCoins);
    const label = `Xu: ${nextCoins}`;
    container.setAttribute("aria-label", label);
    container.dataset.tooltip = label;
    counterAnimations.delete(counter);
    activeCoinCounters.delete(counter);
    return;
  }
  const duration = GAMEPLAY_TIMING.coinCounterAnimationMs;
  const startedAt = performance.now();
  playCoinCounterPulse(container, counter, duration);
  const updateFrame = (timestamp) => {
    if (!counter.isConnected) {
      counterAnimations.delete(counter);
      activeCoinCounters.delete(counter);
      return;
    }
    const progress = Math.max(0, Math.min(1, (timestamp - startedAt) / duration));
    const easedProgress = 1 - (1 - progress) ** 3;
    counter.textContent = String(Math.floor(startCoins + (nextCoins - startCoins) * easedProgress));
    const label = `Xu: ${counter.textContent}`;
    container.setAttribute("aria-label", label);
    container.dataset.tooltip = label;
    if (progress < 1) {
      counterAnimations.set(counter, requestAnimationFrame(updateFrame));
      return;
    }
    counter.textContent = String(nextCoins);
    counterAnimations.delete(counter);
    activeCoinCounters.delete(counter);
  };
  activeCoinCounters.add(counter);
  counterAnimations.set(counter, requestAnimationFrame(updateFrame));
}

function playCoinCounterPulse(container, counter, duration) {
  for (const element of [container.querySelector(".ui-icon"), counter]) {
    if (!element) continue;
    counterPulseEntries.get(element)?.dispose();
    const isIcon = element !== counter;
    let animation;
    const entry = getEffectRegistry().track("highlight", () => {
      animation?.cancel();
      if (counterPulseEntries.get(element) === entry) counterPulseEntries.delete(element);
    });
    if (!entry) continue;
    animation = element.animate(isIcon
      ? [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.2) rotate(-8deg)", opacity: .8, offset: .42 }, { transform: "scale(1)", opacity: 1 }]
      : [{ transform: "translateY(0) scale(1)" }, { transform: "translateY(-2px) scale(1.16)", offset: .42 }, { transform: "translateY(0) scale(1)" }],
    { duration, easing: "ease-out" });
    entry.scope.animation(animation);
    counterPulseEntries.set(element, entry);
    animation.finished.then(() => entry.dispose(), () => entry.dispose());
  }
}

export function isCoinCounterAnimating(counter) {
  return Boolean(counter && counterAnimations.has(counter));
}

function showCoinGainLabel(target, amount) {
  if (!target?.isConnected) return;
  const rect = target.getBoundingClientRect();
  const label = document.createElement("span");
  const entry = trackEffect("score", () => removeCoinEffect(label));
  if (!entry) return;
  effectEntries.set(label, entry);
  label.className = "game-coin-gain-label";
  label.setAttribute("aria-hidden", "true");
  label.textContent = `+${amount} Xu`;
  label.style.left = `${rect.left + rect.width / 2}px`;
  label.style.top = `${Math.max(8, rect.top - 4)}px`;
  label.style.setProperty("--game-coin-gain-duration", `${GAMEPLAY_TIMING.coinCounterAnimationMs + 420}ms`);
  activeCoinEffects.add(label);
  document.body.append(label);
  setTimeout(() => removeCoinEffect(label), GAMEPLAY_TIMING.coinCounterAnimationMs + 520);
}

export function clearCoinRewardEffects() {
  activeCoinCounters.forEach((counter) => {
    const frame = counterAnimations.get(counter);
    if (frame) cancelAnimationFrame(frame);
    counterAnimations.delete(counter);
  });
  activeCoinCounters.clear();
  activeCoinEffects.forEach(removeCoinEffect);
  activeCoinEffects.clear();
}

function removeCoinEffect(effect) {
  coinSoundCleanups.get(effect)?.();
  coinSoundCleanups.delete(effect);
  const entry = effectEntries.get(effect);
  effectEntries.delete(effect);
  entry?.dispose();
  effect.remove();
  activeCoinEffects.delete(effect);
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}
