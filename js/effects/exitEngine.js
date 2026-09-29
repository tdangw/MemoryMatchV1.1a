import { trackEffect } from "../gameShell/gameShellEffects.js";
import { cancelShellFrame, shellFrame } from "../gameShell/gameShellLifecycle.js";
import { prefersReducedMotion } from "../motion.js";
import { LINK_CONNECT_TIMING } from "../linkConnect/linkConfig.js";
import { particleBudget, resolveEffectQuality } from "./effectQuality.js";

const FRAGMENT_LAYOUTS = Object.freeze({
  split2: Object.freeze({ columns: 2, rows: 1 }), split4: Object.freeze({ columns: 2, rows: 2 }),
  split8: Object.freeze({ columns: 4, rows: 2 }),
  crumble: Object.freeze({ columns: 6, rows: 6 }), pixel: Object.freeze({ columns: 5, rows: 5 }),
});
const PIXEL_PALETTE = Object.freeze(["#4df6ff", "#9b7bff", "#ff76ba", "#ffe16b", "#73f5a2"]);
const TRIANGLE_PALETTE = Object.freeze(["#76e7ff", "#8f7dff", "#66c9f5", "#b391ff"]);
// Canvas effects own their source-image requirement here. Keeping this beside
// the renderer prevents a new visual from being implemented but omitted from
// the runtime gate (which would otherwise fall back to the base CSS exit).
const CANVAS_EXIT_EFFECTS = Object.freeze({
  finedust: Object.freeze({ needsSourceImage: true }),
  split2: Object.freeze({ needsSourceImage: true }),
  split4: Object.freeze({ needsSourceImage: true }),
  split8: Object.freeze({ needsSourceImage: true }),
  triangles: Object.freeze({ needsSourceImage: false }),
  crumble: Object.freeze({ needsSourceImage: true }),
  pixel: Object.freeze({ needsSourceImage: true }),
  blackhole: Object.freeze({ needsSourceImage: true }),
  portal: Object.freeze({ needsSourceImage: true }),
  bubble: Object.freeze({ needsSourceImage: true }),
});
let canvas; let context; let frameId; let entry;

export function playCanvasExit({ frame, tiles, exitId, quality, diagnostics } = {}) {
  const effect = CANVAS_EXIT_EFFECTS[exitId];
  if (!effect || prefersReducedMotion() || !frame) return false;
  const rect = frame.getBoundingClientRect();
  const cards = tiles.flatMap(tile => {
    const image = tile.querySelector("img:not(.link-tile__frost-overlay)");
    if (effect.needsSourceImage && (!image?.complete || !image.naturalWidth)) return [];
    const tileRect = tile.getBoundingClientRect();
    tile.classList.add("has-canvas-exit");
    const bounds = { x: tileRect.left - rect.left, y: tileRect.top - rect.top, width: tileRect.width, height: tileRect.height };
    return [{ image, bounds, pull: exitVector(tile), timing: timing(tile) }];
  });
  if (!cards.length) return false;
  const surface = ensureCanvas(frame, rect);
  if (!surface.context) return false;
  entry?.dispose();
  const nextEntry = trackEffect("canvas", () => {
    if (frameId) cancelShellFrame(frameId);
    frameId = null;
    surface.context.clearRect(0, 0, rect.width, rect.height);
    // Keep the source image hidden until the match owner removes its tile.
    // Removing this class when the canvas finishes would restart the base
    // exit animation at opacity 1 during the resolve gap, producing a flash.
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
    if (exitId === "blackhole" && cards.length) {
      const lead = cards[0];
      const local = Math.min(Math.max((elapsed - lead.timing.delayMs) / lead.timing.durationMs, 0), 1);
      drawBlackHoleCore(surface.context, lead, local);
    }
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
function exitVector(tile) {
  const style = getComputedStyle(tile);
  return {
    x: Number.parseFloat(style.getPropertyValue("--link-exit-pull-x")) || 0,
    y: Number.parseFloat(style.getPropertyValue("--link-exit-pull-y")) || 0,
  };
}
function fragments(bounds, exitId, budget) {
  const random = range => (Math.random() * 2 - 1) * range;
  if (exitId === "triangles") return triangleFragments(bounds, random);
  if (exitId === "blackhole") return blackHoleParticles(bounds, budget, random);
  if (exitId === "portal") return portalParticles(bounds, budget, random);
  if (exitId === "bubble") return bubbleParticles(bounds, budget, random);
  const layout = resolveFragmentLayout(exitId, budget);
  if (layout) return Array.from({ length: layout.columns * layout.rows }, (_, index) => {
    const column = index % layout.columns; const row = Math.floor(index / layout.columns);
    const horizontal = column - (layout.columns - 1) / 2;
    const vertical = row - (layout.rows - 1) / 2;
    const splitStrength = exitId === "split2" ? 5.2 : exitId === "split4" ? 4.4 : 3.25;
    const lift = exitId === "split2" ? -1.1 : exitId === "split4" ? -0.7 : 0;
    return {
      x: bounds.x + column * bounds.width / layout.columns,
      y: bounds.y + row * bounds.height / layout.rows,
      width: bounds.width / layout.columns,
      height: bounds.height / layout.rows,
      column, row, columns: layout.columns, rows: layout.rows,
      velocityX: exitId === "pixel" ? random(2.8) : horizontal * splitStrength + random(0.7),
      velocityY: exitId === "pixel" ? random(2.8) : vertical * splitStrength + lift + random(0.7),
      rotation: exitId === "pixel" ? 0 : horizontal * .1 + vertical * .075 + random(.07),
      delay: exitId === "pixel" ? Math.random() * .08 : exitId === "split8" ? (Math.abs(horizontal) + Math.abs(vertical)) * .035 : 0,
      crumble: exitId === "crumble",
      pixel: exitId === "pixel",
      pixelColor: exitId === "pixel" ? PIXEL_PALETTE[index % PIXEL_PALETTE.length] : null,
    };
  });
  const count = budget;
  return Array.from({ length: count }, () => ({
    x: bounds.x + Math.random() * bounds.width,
    y: bounds.y + Math.random() * bounds.height,
    size: 2.8 + Math.random() * 4.4,
    velocityX: random(2.7), velocityY: -1.1 - Math.random() * 2.9,
    sourceX: Math.random(), sourceY: Math.random(), delay: Math.random() * .2,
  }));
}

function resolveFragmentLayout(exitId, budget) {
  const layout = FRAGMENT_LAYOUTS[exitId];
  if (!layout || (exitId !== "crumble" && exitId !== "pixel")) return layout;
  // Grid effects must remain recognizable without producing dozens of
  // fragments per card on low-end devices. The quality budget owns the cap.
  if (exitId === "pixel") {
    const cells = budget < 10 ? 3 : budget < 20 ? 4 : 5;
    return { columns: cells, rows: cells };
  }
  const cells = Math.max(2, Math.floor(Math.sqrt(Math.max(4, Math.min(25, budget)))));
  return { columns: cells, rows: cells };
}

function triangleFragments(bounds, random) {
  const directions = [
    { shape: "top", x: 0, y: -1 },
    { shape: "right", x: 1, y: 0 },
    { shape: "bottom", x: 0, y: 1 },
    { shape: "left", x: -1, y: 0 },
  ];
  return directions.map(({ shape, x, y }, index) => ({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    column: 0,
    row: 0,
    columns: 1,
    rows: 1,
    shape,
    velocityX: x * 6.15 + random(.45),
    velocityY: y * 6.15 + random(.45),
    rotation: (x || y) * .24 + (index % 2 ? .08 : -.08),
    delay: index * .018,
    color: TRIANGLE_PALETTE[index],
  }));
}

function blackHoleParticles(bounds, budget, random) {
  const count = Math.max(5, budget);
  return Array.from({ length: count }, (_, index) => ({
    angle: (Math.PI * 2 * index) / count + random(.28),
    radius: Math.max(bounds.width, bounds.height) * (.24 + Math.random() * .46),
    size: .7 + Math.random() * 1.6,
    spin: 4.2 + Math.random() * 2.4,
    phase: Math.random() * .3,
  }));
}

function portalParticles(bounds, budget, random) {
  const count = Math.max(5, budget);
  return Array.from({ length: count }, (_, index) => ({
    angle: (Math.PI * 2 * index) / count + random(.22),
    radius: Math.max(bounds.width, bounds.height) * (.26 + Math.random() * .34),
    size: .6 + Math.random() * 1.25,
    spin: 3.6 + Math.random() * 2.2,
    phase: Math.random() * .16,
  }));
}

function bubbleParticles(bounds, budget, random) {
  const count = Math.max(6, budget);
  return Array.from({ length: count }, () => ({
    startX: bounds.x + bounds.width * (.12 + Math.random() * .76),
    startY: bounds.y + bounds.height * (.16 + Math.random() * .72),
    radius: Math.max(2.4, Math.min(bounds.width, bounds.height) * (.055 + Math.random() * .075)),
    driftX: random(1.5),
    lift: 1.4 + Math.random() * 2.8,
    phase: Math.random() * .22,
    tint: Math.random() > .5 ? "#8cefff" : "#a88fff",
  }));
}
function drawCard(ctx, card, exitId, progress) {
  ctx.save();
  if (exitId === "finedust") drawFineDust(ctx, card, progress);
  else if (exitId === "blackhole") drawBlackHole(ctx, card, progress);
  else if (exitId === "portal") drawPortal(ctx, card, progress);
  else if (exitId === "bubble") drawBubble(ctx, card, progress);
  else if (exitId === "triangles") drawTriangles(ctx, card.fragments, progress);
  else for (let index = 0; index < card.fragments.length; index += 1) drawFragment(ctx, card.image, card.fragments[index], progress);
  ctx.restore();
}

function drawTriangles(ctx, fragments, progress) {
  for (let index = 0; index < fragments.length; index += 1) {
    const fragment = fragments[index];
    const local = Math.max(0, Math.min(1, (progress - fragment.delay) / (1 - fragment.delay)));
    const ease = 1 - (1 - local) ** 3;
    const x = fragment.x + fragment.velocityX * ease * 22;
    const y = fragment.y + fragment.velocityY * ease * 22;
    const fade = Math.max(0, 1 - Math.max(0, local - .58) / .42);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(x + fragment.width / 2, y + fragment.height / 2);
    ctx.rotate(fragment.rotation * ease * 13);
    traceTriangle(ctx, fragment);
    ctx.fillStyle = fragment.color;
    ctx.fill();
    ctx.globalAlpha = fade * .92;
    ctx.strokeStyle = "#efffff";
    ctx.lineWidth = 1.15;
    ctx.stroke();
    ctx.restore();
  }
}

function drawBlackHoleCore(ctx, card, progress) {
  const centerX = card.bounds.x + card.bounds.width / 2 + card.pull.x;
  const centerY = card.bounds.y + card.bounds.height / 2 + card.pull.y;
  const radius = Math.max(8, Math.min(card.bounds.width, card.bounds.height) * (.16 + progress * .12));
  ctx.save();
  ctx.globalAlpha = Math.min(1, progress * 4) * (1 - progress * .25);
  ctx.fillStyle = "#05071c";
  ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 1.15;
  ctx.strokeStyle = "rgba(121, 91, 255, .8)";
  ctx.beginPath(); ctx.arc(centerX, centerY, radius * 1.38, progress * 7, progress * 7 + Math.PI * 1.58); ctx.stroke();
  ctx.strokeStyle = "rgba(91, 219, 255, .76)";
  ctx.beginPath(); ctx.arc(centerX, centerY, radius * 1.82, -progress * 8, -progress * 8 + Math.PI * 1.22); ctx.stroke();
  ctx.restore();
}

function drawBlackHole(ctx, card, progress) {
  const ease = 1 - (1 - progress) ** 3;
  const originX = card.bounds.x + card.bounds.width / 2;
  const originY = card.bounds.y + card.bounds.height / 2;
  const targetX = originX + card.pull.x;
  const targetY = originY + card.pull.y;
  const distance = Math.hypot(card.pull.x, card.pull.y) || 1;
  const sideX = -card.pull.y / distance;
  const sideY = card.pull.x / distance;
  const swirl = Math.sin(ease * Math.PI) * Math.min(15, distance * .13);
  const centerX = originX + card.pull.x * ease + sideX * swirl;
  const centerY = originY + card.pull.y * ease + sideY * swirl;
  const scale = Math.max(.025, 1 - ease * .96);
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - Math.max(0, ease - .58) / .42);
  ctx.translate(centerX, centerY);
  ctx.rotate(ease * Math.PI * 2.35);
  ctx.scale(scale, scale);
  ctx.drawImage(card.image, -card.bounds.width / 2, -card.bounds.height / 2, card.bounds.width, card.bounds.height);
  ctx.restore();
  for (let index = 0; index < card.fragments.length; index += 1) {
    const particle = card.fragments[index];
    if (progress < particle.phase) continue;
    const local = Math.max(0, Math.min(1, (progress - particle.phase) / (1 - particle.phase)));
    const radius = particle.radius * (1 - local) + 1;
    const angle = particle.angle + local * particle.spin;
    ctx.globalAlpha = Math.max(0, .78 * (1 - local));
    ctx.fillStyle = index % 2 ? "#9d86ff" : "#8feeff";
    ctx.beginPath();
    ctx.arc(targetX + Math.cos(angle) * radius, targetY + Math.sin(angle) * radius, particle.size * (1 - local * .35), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPortal(ctx, card, progress) {
  const ease = 1 - (1 - progress) ** 3;
  const centerX = card.bounds.x + card.bounds.width / 2;
  const centerY = card.bounds.y + card.bounds.height / 2;
  const baseRadius = Math.max(9, Math.min(card.bounds.width, card.bounds.height) * .21);
  ctx.save();
  ctx.globalAlpha = Math.min(1, progress * 4) * (1 - progress * .18);
  ctx.lineWidth = 1.05;
  for (let ring = 0; ring < 3; ring += 1) {
    const radius = baseRadius * (1.05 + ring * .58 - ease * .48);
    ctx.strokeStyle = ring === 1 ? "rgba(170, 104, 255, .9)" : "rgba(88, 228, 255, .84)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.max(2, radius), progress * (6 + ring) + ring * 2.1, progress * (6 + ring) + ring * 2.1 + Math.PI * 1.42);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - Math.max(0, ease - .58) / .42);
  ctx.translate(centerX, centerY);
  ctx.rotate(ease * Math.PI * 2.1);
  const scale = Math.max(.03, 1 - ease * .95);
  ctx.scale(scale, scale);
  ctx.drawImage(card.image, -card.bounds.width / 2, -card.bounds.height / 2, card.bounds.width, card.bounds.height);
  ctx.restore();
  for (let index = 0; index < card.fragments.length; index += 1) {
    const particle = card.fragments[index];
    if (progress < particle.phase) continue;
    const local = Math.max(0, Math.min(1, (progress - particle.phase) / (1 - particle.phase)));
    const radius = particle.radius * (1 - local) + 1;
    const angle = particle.angle - local * particle.spin;
    ctx.globalAlpha = Math.max(0, .72 * (1 - local));
    ctx.fillStyle = index % 2 ? "#b18aff" : "#83edff";
    ctx.beginPath();
    ctx.arc(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius, particle.size * (1 - local * .25), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBubble(ctx, card, progress) {
  const imageAlpha = Math.max(0, 1 - Math.min(1, progress / .38));
  if (imageAlpha > 0) {
    ctx.globalAlpha = imageAlpha;
    ctx.drawImage(card.image, card.bounds.x, card.bounds.y, card.bounds.width, card.bounds.height);
  }
  for (let index = 0; index < card.fragments.length; index += 1) {
    const bubble = card.fragments[index];
    if (progress < bubble.phase) continue;
    const local = Math.max(0, Math.min(1, (progress - bubble.phase) / (1 - bubble.phase)));
    const ease = 1 - (1 - local) ** 3;
    const radius = bubble.radius * (.45 + ease * .8);
    const x = bubble.startX + bubble.driftX * ease * 18 + Math.sin(ease * Math.PI * 2 + index) * 1.4;
    const y = bubble.startY - bubble.lift * ease * 22;
    ctx.globalAlpha = Math.max(0, .78 * (1 - local));
    ctx.fillStyle = bubble.tint;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = Math.max(0, .94 * (1 - local));
    ctx.lineWidth = .75;
    ctx.strokeStyle = "#edffff";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = Math.max(0, .82 * (1 - local));
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x - radius * .3, y - radius * .32, Math.max(.55, radius * .17), 0, Math.PI * 2);
    ctx.fill();
  }
}
function drawFineDust(ctx, card, progress) {
  // Let the card dissolve into readable motes before the particles disperse.
  const imageAlpha = Math.max(0, 1 - Math.min(1, Math.max(0, progress - .16) / .56));
  if (imageAlpha > 0) {
    ctx.globalAlpha = imageAlpha;
    ctx.drawImage(card.image, card.bounds.x, card.bounds.y, card.bounds.width, card.bounds.height);
  }
  for (let index = 0; index < card.fragments.length; index += 1) {
    const particle = card.fragments[index];
    const local = Math.max(0, Math.min(1, (progress - particle.delay) / (1 - particle.delay)));
    if (local === 0) continue;
    const ease = 1 - (1 - local) ** 3;
    const size = Math.max(.8, particle.size * (1 - local * .3));
    const sourceWidth = Math.max(1, size * card.image.naturalWidth / card.bounds.width);
    const sourceHeight = Math.max(1, size * card.image.naturalHeight / card.bounds.height);
    ctx.globalAlpha = Math.max(0, .94 * (1 - local) ** .72);
    ctx.drawImage(card.image, particle.sourceX * (card.image.naturalWidth - sourceWidth), particle.sourceY * (card.image.naturalHeight - sourceHeight), sourceWidth, sourceHeight, particle.x + particle.velocityX * ease * 13 - size / 2, particle.y + particle.velocityY * ease * 16 - size / 2, size, size);
  }
}
function drawFragment(ctx, image, fragment, progress) {
  const local = Math.max(0, Math.min(1, (progress - (fragment.delay || 0)) / (1 - (fragment.delay || 0))));
  const ease = 1 - (1 - local) ** 3;
  const x = fragment.x + fragment.velocityX * ease * 12;
  const y = fragment.y + fragment.velocityY * ease * 12 + (fragment.crumble ? local * local * 38 : 0);
  const fade = fragment.pixel
    ? Math.max(0, 1 - Math.max(0, local - .62) / .38)
    : Math.max(0, 1 - Math.max(0, local - .62) / .38);
  ctx.save(); ctx.globalAlpha = fade; ctx.translate(x + fragment.width / 2, y + fragment.height / 2); ctx.rotate(fragment.rotation * ease * 10);
  if (fragment.shape) clipTriangle(ctx, fragment);
  ctx.drawImage(image, fragment.column * image.naturalWidth / fragment.columns, fragment.row * image.naturalHeight / fragment.rows, image.naturalWidth / fragment.columns, image.naturalHeight / fragment.rows, -fragment.width / 2, -fragment.height / 2, fragment.width, fragment.height);
  if (fragment.shape) {
    ctx.globalAlpha = fade * .68;
    ctx.strokeStyle = "#d3f9ff";
    ctx.lineWidth = .85;
    ctx.stroke();
  }
  if (fragment.pixel) {
    ctx.globalAlpha = fade * .42;
    ctx.fillStyle = fragment.pixelColor;
    ctx.fillRect(-fragment.width / 2, -fragment.height / 2, fragment.width, fragment.height);
  }
  ctx.restore();
}

function clipTriangle(ctx, fragment) {
  traceTriangle(ctx, fragment);
  ctx.clip();
}

function traceTriangle(ctx, fragment) {
  const halfWidth = fragment.width / 2;
  const halfHeight = fragment.height / 2;
  ctx.beginPath();
  if (fragment.shape === "top") {
    ctx.moveTo(-halfWidth, -halfHeight); ctx.lineTo(halfWidth, -halfHeight); ctx.lineTo(0, 0);
  } else if (fragment.shape === "right") {
    ctx.moveTo(halfWidth, -halfHeight); ctx.lineTo(halfWidth, halfHeight); ctx.lineTo(0, 0);
  } else if (fragment.shape === "bottom") {
    ctx.moveTo(halfWidth, halfHeight); ctx.lineTo(-halfWidth, halfHeight); ctx.lineTo(0, 0);
  } else {
    ctx.moveTo(-halfWidth, halfHeight); ctx.lineTo(-halfWidth, -halfHeight); ctx.lineTo(0, 0);
  }
  ctx.closePath();
}
