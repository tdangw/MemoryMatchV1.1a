const pendingByImage = new WeakMap();
const activeImages = new Set();

export function cancelMemoryTileAnimation(image) {
  const pending = pendingByImage.get(image);
  if (!pending) return;
  if (pending.frame !== null) cancelAnimationFrame(pending.frame);
  if (pending.timeout !== null) clearTimeout(pending.timeout);
  pendingByImage.delete(image);
  activeImages.delete(image);
}

export function clearMemoryTileAnimations() {
  [...activeImages].forEach(cancelMemoryTileAnimation);
}

// CSS animations restart on the following frame, not through a synchronous
// layout read. The record makes a rapid reselect/restart cancel-safe.
export function restartMemoryTileAnimation(image, {
  remove = [],
  animationClass,
  durationMs,
  onFinish,
} = {}) {
  cancelMemoryTileAnimation(image);
  image.classList.remove(...remove, animationClass);
  if (prefersReducedMotion()) {
    onFinish?.();
    return;
  }
  const pending = { frame: null, timeout: null };
  pending.frame = requestAnimationFrame(() => {
    if (pendingByImage.get(image) !== pending) return;
    pending.frame = null;
    image.classList.add(animationClass);
    pending.timeout = setTimeout(() => {
      if (pendingByImage.get(image) !== pending) return;
      image.classList.remove(animationClass);
      pendingByImage.delete(image);
      activeImages.delete(image);
      onFinish?.();
    }, durationMs);
  });
  pendingByImage.set(image, pending);
  activeImages.add(image);
}
import { prefersReducedMotion } from "../motion.js";

