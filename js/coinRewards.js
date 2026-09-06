import { createIcon } from "./icons.js";
import { GAMEPLAY_TIMING } from "./gameplayTuning.js";
import { prefersReducedMotion } from "./motion.js";

export const MATCH_COIN_REWARD = Object.freeze({
  base: 2,
  comboStep: 1,
});

const counterAnimations = new WeakMap();
const activeCoinCounters = new Set();
const activeCoinEffects = new Set();

export function calculateMatchCoinReward(combo = 1) {
  return MATCH_COIN_REWARD.base
    + MATCH_COIN_REWARD.comboStep * Math.max(0, Math.floor(Number(combo) || 1) - 1);
}

export function playCoinRewardFlight(source, target, amount) {
  const coinCount = Math.max(0, Math.floor(Number(amount) || 0));
  if (!source || !target || coinCount < 1) return [];
  if (prefersReducedMotion()) return [];
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
  const durationMs = GAMEPLAY_TIMING.coinRewardFlightMs;
  const staggerMs = GAMEPLAY_TIMING.coinRewardStaggerMs;
  const durationVarianceMs = 140;
  const fragment = document.createDocumentFragment();
  const effects = Array.from({ length: coinCount }, (_, index) => {
    const effect = document.createElement("span");
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
    fragment.append(effect);
    return effect;
  });
  document.body.append(fragment);
  const finalArrivalDelay = durationMs + Math.max(0, coinCount - 1) * staggerMs;
  setTimeout(() => showCoinGainLabel(target, coinCount), finalArrivalDelay);
  setTimeout(
    () => effects.forEach(removeCoinEffect),
    durationMs + durationVarianceMs + Math.max(0, coinCount - 1) * staggerMs + 300,
  );
  return effects;
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
  container.style.setProperty("--game-coin-counter-duration", `${duration}ms`);
  container.classList.remove("is-gaining");
  void container.offsetWidth;
  container.classList.add("is-gaining");
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

export function isCoinCounterAnimating(counter) {
  return Boolean(counter && counterAnimations.has(counter));
}

function showCoinGainLabel(target, amount) {
  if (!target?.isConnected) return;
  const rect = target.getBoundingClientRect();
  const label = document.createElement("span");
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
    counter.closest?.(".game-coin-hud")?.classList.remove("is-gaining");
  });
  activeCoinCounters.clear();
  activeCoinEffects.forEach((effect) => effect.remove());
  activeCoinEffects.clear();
}

function removeCoinEffect(effect) {
  effect.remove();
  activeCoinEffects.delete(effect);
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}
