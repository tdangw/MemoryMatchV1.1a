import { createIcon } from "./icons.js";
import { prefersReducedMotion } from "./motion.js";
import { createGameShellLifecycle, getActiveGameScope } from "./gameShell/gameShellLifecycle.js";

const activeLoot = new Map();

export function playLootDrop(source, {
  icon = "energy",
  tier = "teal",
  target = null,
  holdMs = 900,
  onSettled,
  onCollected,
} = {}) {
  if (!source) return null;
  if (prefersReducedMotion()) {
    onSettled?.();
    onCollected?.();
    return null;
  }
  const sourceRect = (source.closest?.(".tile, .link-board__cell") || source).getBoundingClientRect();
  const startX = sourceRect.left + sourceRect.width / 2;
  const startY = sourceRect.top + sourceRect.height / 2;
  const inset = 18;
  const direction = Math.random() < 0.5 ? -1 : 1;
  const landX = clamp(startX + direction * (20 + Math.random() * 34), inset, innerWidth - inset) - startX;
  const landY = clamp(startY + 20 + Math.random() * 28, inset, innerHeight - inset) - startY;
  const apexX = landX * (0.45 + Math.random() * 0.25);
  const apexY = Math.min(-24, landY - 42 - Math.random() * 24);
  const element = document.createElement("span");
  element.className = `game-loot-drop game-loot-drop--${tier}`;
  element.setAttribute("aria-hidden", "true");
  element.append(createIcon(icon));
  element.style.left = `${startX}px`;
  element.style.top = `${startY}px`;
  document.body.append(element);
  const lifecycle = createGameShellLifecycle();
  const releaseOwner = getActiveGameScope()?.own(() => removeLoot(element), "node");
  activeLoot.set(element, { lifecycle, releaseOwner });

  const drop = element.animate([
    { opacity: 0, transform: "translate(0,0) scale(.55) rotate(-12deg)" },
    { opacity: 1, transform: `translate(${apexX}px,${apexY}px) scale(1.06) rotate(8deg)`, offset: .42 },
    { opacity: 1, transform: `translate(${landX}px,${landY}px) scale(1.04,.92) rotate(10deg)`, offset: .76 },
    { opacity: 1, transform: `translate(${landX}px,${landY - 7}px) scale(.98,1.03) rotate(6deg)`, offset: .88 },
    { opacity: 1, transform: `translate(${landX}px,${landY}px) scale(1) rotate(7deg)` },
  ], { duration: 900, easing: "linear", fill: "forwards" });
  lifecycle.animation(drop);
  drop.finished.then(lifecycle.guard(() => {
    if (!element.isConnected) return;
    onSettled?.();
    lifecycle.timeout(() => collectLoot(element, { startX, startY, landX, landY, target, onCollected }), holdMs);
  }), () => {});
  return element;
}

function collectLoot(element, { startX, startY, landX, landY, target, onCollected }) {
  const lifecycle = activeLoot.get(element)?.lifecycle;
  if (!element.isConnected || !lifecycle?.active) return;
  const targetRect = target?.getClientRects?.().length ? target.getBoundingClientRect() : null;
  const endX = targetRect ? targetRect.left + targetRect.width / 2 - startX : landX;
  const endY = targetRect ? targetRect.top + targetRect.height / 2 - startY : landY - 18;
  const animation = element.animate([
    { opacity: 1, transform: `translate(${landX}px,${landY}px) scale(1)` },
    { opacity: 1, transform: `translate(${landX}px,${landY}px) scale(1.08)`, offset: .16 },
    { opacity: 0, transform: `translate(${endX}px,${endY}px) scale(.48)` },
  ], { duration: targetRect ? 850 : 360, easing: "cubic-bezier(.32,.62,.38,1)", fill: "forwards" });
  lifecycle.animation(animation);
  animation.finished.then(lifecycle.guard(() => {
    onCollected?.();
    removeLoot(element);
  }), () => {});
}

export function clearLootEffects() {
  [...activeLoot.keys()].forEach(removeLoot);
}

function removeLoot(element) {
  const owned = activeLoot.get(element);
  owned?.releaseOwner?.forget();
  owned?.lifecycle.dispose();
  // Finished animations with fill:forwards still own a visual effect during hold.
  element.getAnimations().forEach(animation => animation.cancel());
  element.remove();
  activeLoot.delete(element);
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}
