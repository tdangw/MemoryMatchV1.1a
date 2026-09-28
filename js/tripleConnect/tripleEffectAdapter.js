import { clearConnectionV2, renderConnectionV2 } from "../effects/connectionEngine.js";
import { getEffectV2Exit, getEffectV2Path } from "../effects/effectCatalog.js";
import { clearCanvasExit, playCanvasExit } from "../effects/exitEngine.js";

export function presentTripleConnection({ surface, targets, effectId }) {
  const bounds = surface.parentElement.getBoundingClientRect();
  const points = targets.map(target => { const rect = target.getBoundingClientRect(); return { x: ((rect.left + rect.width / 2 - bounds.left) / bounds.width) * 100, y: ((rect.top + rect.height / 2 - bounds.top) / bounds.height) * 100 }; });
  const rendered = renderConnectionV2({ surface, points, effect: getEffectV2Path(effectId || "default"), seed: targets.length * 2654435761 });
  surface.classList.add("triple-connect__line");
  return rendered;
}

export function presentTripleExit({ surface, targets, effectId }) {
  const effect = getEffectV2Exit(effectId || "default");
  applyGroupExitVectors(targets, effect.id);
  targets.forEach(target => target.classList.add(
    "is-removing",
    effect.className,
    `triple-connect__exit--${effect.id}`,
  ));
  return playCanvasExit({
    frame: surface,
    tiles: targets,
    exitId: effect.id,
    quality: "medium",
  });
}

function applyGroupExitVectors(targets, effectId) {
  if (!targets.length || !["blackhole", "collide"].includes(effectId)) return;
  const centers = targets.map((target) => {
    const rect = target.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
  const center = centers.reduce(
    (total, point) => ({ x: total.x + point.x, y: total.y + point.y }),
    { x: 0, y: 0 },
  );
  center.x /= centers.length;
  center.y /= centers.length;
  targets.forEach((target, index) => {
    const x = `${center.x - centers[index].x}px`;
    const y = `${center.y - centers[index].y}px`;
    target.style.setProperty("--link-exit-pull-x", x);
    target.style.setProperty("--link-exit-pull-y", y);
    target.style.setProperty("--link-exit-collide-x", x);
    target.style.setProperty("--link-exit-collide-y", y);
  });
}

export function clearTripleEffects(surface) {
  surface?.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
  surface?.style.removeProperty("opacity");
  clearConnectionV2(surface);
  clearCanvasExit();
  surface?.replaceChildren();
}
