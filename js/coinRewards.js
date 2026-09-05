import { createIcon } from "./icons.js";
import { GAMEPLAY_TIMING } from "./gameplayTuning.js";

export const MATCH_COIN_REWARD = Object.freeze({
  base: 2,
  comboStep: 1,
});

const counterAnimations = new WeakMap();

export function calculateMatchCoinReward(combo = 1) {
  return MATCH_COIN_REWARD.base
    + MATCH_COIN_REWARD.comboStep * Math.max(0, Math.floor(Number(combo) || 1) - 1);
}

export function playCoinRewardFlight(source, target, amount) {
  const coinCount = Math.max(0, Math.floor(Number(amount) || 0));
  if (!source || !target || coinCount < 1) return [];
  const stableSource = source.closest?.(".link-board__cell, .tile") || source;
  const targetIcon = target.querySelector?.(".ui-icon") || target;
  const sourceRect = stableSource.getBoundingClientRect();
  const targetRect = targetIcon.getBoundingClientRect();
  const startX = sourceRect.left + sourceRect.width / 2;
  const startY = sourceRect.top + sourceRect.height / 2;
  const targetX = targetRect.left + targetRect.width / 2 - startX;
  const targetY = targetRect.top + targetRect.height / 2 - startY;
  const safeInset = 14;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const durationMs = GAMEPLAY_TIMING.coinRewardFlightMs;
  const staggerMs = GAMEPLAY_TIMING.coinRewardStaggerMs;
  const fragment = document.createDocumentFragment();
  const effects = Array.from({ length: coinCount }, (_, index) => {
    const effect = document.createElement("span");
    effect.className = "game-coin-reward-flight";
    effect.setAttribute("aria-hidden", "true");
    effect.append(createIcon("coin"));
    const direction = index % 2 ? 1 : -1;
    const spread = direction * (18 + Math.random() * Math.min(48, Math.max(24, sourceRect.width * 0.55)));
    const landingX = clamp(startX + spread, safeInset, viewportWidth - safeInset) - startX;
    const landingDistanceY = Math.max(18, Math.min(46, sourceRect.height * (0.32 + Math.random() * 0.2)));
    const landingY = clamp(startY + landingDistanceY, safeInset, viewportHeight - safeInset) - startY;
    const apexX = landingX * (0.42 + Math.random() * 0.2);
    const apexY = clamp(startY - Math.max(24, landingDistanceY * (1.15 + Math.random() * 0.35)), safeInset, viewportHeight - safeInset) - startY;
    effect.style.left = `${startX}px`;
    effect.style.top = `${startY}px`;
    effect.style.setProperty("--game-coin-apex-x", `${Math.round(apexX)}px`);
    effect.style.setProperty("--game-coin-apex-y", `${Math.round(apexY)}px`);
    effect.style.setProperty("--game-coin-land-x", `${Math.round(landingX)}px`);
    effect.style.setProperty("--game-coin-land-y", `${Math.round(landingY)}px`);
    effect.style.setProperty("--game-coin-flight-x", `${Math.round(targetX)}px`);
    effect.style.setProperty("--game-coin-flight-y", `${Math.round(targetY)}px`);
    effect.style.setProperty("--game-coin-flight-duration", `${durationMs}ms`);
    effect.style.setProperty("--game-coin-delay", `${index * staggerMs}ms`);
    fragment.append(effect);
    return effect;
  });
  document.body.append(fragment);
  setTimeout(
    () => effects.forEach((effect) => effect.remove()),
    durationMs + Math.max(0, coinCount - 1) * staggerMs + 250,
  );
  return effects;
}

export function animateCoinCounter(container, counter, previousCoins, nextCoins) {
  if (!container || !counter) return;
  const activeFrame = counterAnimations.get(counter);
  if (activeFrame) cancelAnimationFrame(activeFrame);
  const displayedCoins = Number(counter.textContent);
  const startCoins = Number.isFinite(displayedCoins) ? displayedCoins : previousCoins;
  const duration = GAMEPLAY_TIMING.coinCounterAnimationMs;
  const startedAt = performance.now();
  container.style.setProperty("--game-coin-counter-duration", `${duration}ms`);
  container.classList.remove("is-gaining");
  void container.offsetWidth;
  container.classList.add("is-gaining");
  const updateFrame = (timestamp) => {
    if (!counter.isConnected) {
      counterAnimations.delete(counter);
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
  };
  counterAnimations.set(counter, requestAnimationFrame(updateFrame));
}

export function isCoinCounterAnimating(counter) {
  return Boolean(counter && counterAnimations.has(counter));
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}
