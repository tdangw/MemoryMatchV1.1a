import { clearConnectionV2, renderConnectionV2 } from "../effects/connectionEngine.js";
import { clearCanvasExit, playCanvasExit } from "../effects/exitEngine.js";
import { getActiveLinkConnectionEffect } from "./linkEffects.js";

export function presentLinkConnection({ surface, points, appearance, seed }) {
  const effect = getActiveLinkConnectionEffect(appearance);
  return renderConnectionV2({ surface, points, effect: { id: effect.pathId }, seed });
}

export function presentLinkExit({ frame, tiles, appearance }) {
  const effect = getActiveLinkConnectionEffect(appearance);
  tiles.forEach(tile => tile.classList.add("is-removing", effect.exitClass));
  if (["blackhole", "collide"].includes(effect.exitId) && tiles.length === 2) {
    const centers = tiles.map(tile => { const rect = tile.getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; });
    const center = { x: (centers[0].x + centers[1].x) / 2, y: (centers[0].y + centers[1].y) / 2 };
    tiles.forEach((tile, index) => {
      const x = `${center.x - centers[index].x}px`; const y = `${center.y - centers[index].y}px`;
      tile.style.setProperty("--link-exit-pull-x", x); tile.style.setProperty("--link-exit-pull-y", y);
      if (effect.exitId === "collide") { tile.style.setProperty("--link-exit-collide-x", x); tile.style.setProperty("--link-exit-collide-y", y); }
    });
  }
  playCanvasExit({ frame, tiles, exitId: effect.exitId });
  return tiles;
}

export function clearLinkEffectSurfaces(surface) { clearConnectionV2(surface); clearCanvasExit(); }
