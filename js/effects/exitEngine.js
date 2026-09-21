import { trackEffect } from "../gameShell/gameShellEffects.js";
import { cancelShellFrame, shellFrame } from "../gameShell/gameShellLifecycle.js";
import { prefersReducedMotion } from "../motion.js";
import { LINK_CONNECT_TIMING } from "../linkConnect/linkConfig.js";
import { particleBudget, resolveEffectQuality } from "./effectQuality.js";

const FRAGMENT_LAYOUTS = Object.freeze({
  split2: Object.freeze({ columns: 2, rows: 1 }), split4: Object.freeze({ columns: 2, rows: 2 }),
  split8: Object.freeze({ columns: 4, rows: 2 }), triangles: Object.freeze({ columns: 2, rows: 2, triangular: true }),
  crumble: Object.freeze({ columns: 6, rows: 6 }), pixel: Object.freeze({ columns: 5, rows: 5 }),
});
const CANVAS_EXIT_EFFECTS = new Set(["finedust", ...Object.keys(FRAGMENT_LAYOUTS)]);
let canvas; let context; let frameId; let entry;

export function playCanvasExit({ frame, tiles, exitId, quality, diagnostics } = {}) {
  if (!CANVAS_EXIT_EFFECTS.has(exitId) || prefersReducedMotion() || !frame) return false;
  const rect = frame.getBoundingClientRect();
  const cards = tiles.flatMap(tile => {
    const image = tile.querySelector("img:not(.link-tile__frost-overlay)");
    if (!image?.complete || !image.naturalWidth) return [];
    const tileRect = tile.getBoundingClientRect();
    tile.classList.add("has-canvas-exit");
    return [{ image, bounds: { x: tileRect.left - rect.left, y: tileRect.top - rect.top, width: tileRect.width, height: tileRect.height }, timing: timing(tile) }];
  });
  if (!cards.length) return false;
  const surface = ensureCanvas(frame, rect);
  if (!surface.context) return false;
  entry?.dispose();
  const nextEntry = trackEffect("canvas", () => {
    if (frameId) cancelShellFrame(frameId);
    frameId = null;
    surface.context.clearRect(0, 0, rect.width, rect.height);
    tiles.forEach(tile => tile.classList.remove("has-canvas-exit"));
    if (entry === nextEntry) entry = null;
  });
  if (!nextEntry) { tiles.forEach(tile => tile.classList.remove("has-canvas-exit")); return false; }
  entry = nextEntry;
  const resolvedQuality = quality || resolveEffectQuality({ reducedMotion: false, coarsePointer: window.matchMedia?.("(pointer: coarse)").matches, deviceMemory: navigator.deviceMemory });
  for (let index = 0; index < cards.length; index += 1) cards[index].fragments = fragments(cards[index].bounds, exitId, particleBudget(resolvedQuality, exitId === "finedust" ? 1 : 2));
  const duration = Math.max(...cards.map(card => card.timing.delayMs + card.timing.durationMs));
  const startedAt = performance.now();
  const draw = now => {
    const drawStartedAt = diagnostics ? performance.now() : 0;
    const elapsed = now - startedAt;
    surface.context.clearRect(0, 0, rect.width, rect.height);
    for (let index = 0; index < cards.length; index += 1) {
      const card = cards[index];
      if (elapsed >= card.timing.delayMs) drawCard(surface.context, card, exitId, Math.min((elapsed - card.timing.delayMs) / card.timing.durationMs, 1));
    }
    if (elapsed < duration && surface.canvas.isConnected) frameId = shellFrame(draw);
    else nextEntry.dispose();
    if (diagnostics) diagnostics.recordFrame(performance.now() - drawStartedAt);
  };
  frameId = shellFrame(draw);
  return true;
}

export function clearCanvasExit() {
  entry?.dispose(); entry = null;
  canvas?.remove(); canvas = null; context = null; frameId = null;
}

function ensureCanvas(frame, rect) {
  if (!canvas?.isConnected || canvas.parentElement !== frame) { canvas = document.createElement("canvas"); canvas.className = "link-card-exit-effect"; frame.append(canvas); context = null; }
  const density = Math.min(window.devicePixelRatio || 1, 2); const width = Math.round(rect.width * density); const height = Math.round(rect.height * density);
  if (canvas.width !== width || canvas.height !== height || !context) { canvas.width = width; canvas.height = height; canvas.style.width = `${rect.width}px`; canvas.style.height = `${rect.height}px`; context = canvas.getContext("2d"); context?.scale(density, density); }
  return { canvas, context };
}
function timing(tile) { const style = getComputedStyle(tile); return { delayMs: Number.parseFloat(style.getPropertyValue("--link-tile-exit-delay")) || 0, durationMs: Number.parseFloat(style.getPropertyValue("--link-tile-exit-duration")) || LINK_CONNECT_TIMING.tileExitAnimationMs }; }
function fragments(bounds, exitId, budget) {
  const layout = FRAGMENT_LAYOUTS[exitId]; const random = range => (Math.random() * 2 - 1) * range;
  if (layout) return Array.from({ length: layout.columns * layout.rows }, (_, index) => { const column = index % layout.columns; const row = Math.floor(index / layout.columns); return { x: bounds.x + column * bounds.width / layout.columns, y: bounds.y + row * bounds.height / layout.rows, width: bounds.width / layout.columns, height: bounds.height / layout.rows, column, row, columns: layout.columns, rows: layout.rows, triangle: layout.triangular && index % 2 === 1, velocityX: (column - (layout.columns - 1) / 2) * 3.4 + random(1.8), velocityY: (row - (layout.rows - 1) / 2) * 3.4 + random(1.8), rotation: random(.24) }; });
  const count = budget;
  return Array.from({ length: count }, () => ({ x: bounds.x + Math.random() * bounds.width, y: bounds.y + Math.random() * bounds.height, size: 1.4 + Math.random() * 3.2, velocityX: random(3.6), velocityY: -1.6 - Math.random() * 3.8 }));
}
function drawCard(ctx, card, exitId, progress) {
  ctx.save();
  if (exitId === "finedust") { ctx.fillStyle = "#d7f6ff"; ctx.shadowBlur = 5; ctx.shadowColor = ctx.fillStyle; for (let index = 0; index < card.fragments.length; index += 1) { const particle = card.fragments[index]; ctx.globalAlpha = Math.max(0, 1 - progress); ctx.beginPath(); ctx.arc(particle.x + particle.velocityX * progress * 16, particle.y + particle.velocityY * progress * 20, Math.max(.5, particle.size * (1 - progress * .55)), 0, Math.PI * 2); ctx.fill(); } }
  else for (let index = 0; index < card.fragments.length; index += 1) drawFragment(ctx, card.image, card.fragments[index], progress);
  ctx.restore();
}
function drawFragment(ctx, image, fragment, progress) {
  const x = fragment.x + fragment.velocityX * progress * 15; const y = fragment.y + fragment.velocityY * progress * 15 + (fragment.rows >= 6 ? progress * progress * 38 : 0);
  ctx.save(); ctx.globalAlpha = Math.max(0, 1 - progress * 1.14); ctx.translate(x + fragment.width / 2, y + fragment.height / 2); ctx.rotate(fragment.rotation * progress * 12);
  if (fragment.triangle) { ctx.beginPath(); ctx.moveTo(-fragment.width / 2, -fragment.height / 2); ctx.lineTo(fragment.width / 2, -fragment.height / 2); ctx.lineTo(-fragment.width / 2, fragment.height / 2); ctx.closePath(); ctx.clip(); }
  ctx.drawImage(image, fragment.column * image.naturalWidth / fragment.columns, fragment.row * image.naturalHeight / fragment.rows, image.naturalWidth / fragment.columns, image.naturalHeight / fragment.rows, -fragment.width / 2, -fragment.height / 2, fragment.width, fragment.height); ctx.restore();
}
