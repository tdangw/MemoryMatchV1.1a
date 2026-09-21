import { getEffectRegistry } from "./gameShellEffects.js";

const activeEntries = new WeakMap();

export function playComboWindow(card, duration) {
  const bar = card?.querySelector(".combo-window-progress");
  if (!bar) return;
  activeEntries.get(bar)?.dispose();
  bar.style.opacity = "1";
  let animation;
  const entry = getEffectRegistry().track("combo", () => {
    animation?.cancel();
    if (activeEntries.get(bar) === entry) activeEntries.delete(bar);
    bar.style.opacity = "0";
  });
  if (!entry) { bar.style.opacity = "0"; return; }
  animation = bar.animate([
    { transform: "scaleX(1)", opacity: 1 },
    { transform: "scaleX(0)", opacity: 1 },
  ], { duration, easing: "linear", fill: "forwards" });
  entry.scope.animation(animation);
  activeEntries.set(bar, entry);
  animation.finished.then(() => entry.dispose(), () => entry.dispose());
}

export function clearComboWindow(card) {
  const bar = card?.querySelector(".combo-window-progress");
  if (!bar) return;
  activeEntries.get(bar)?.dispose();
  activeEntries.delete(bar);
  bar.style.removeProperty("transform");
  bar.style.opacity = "0";
}
