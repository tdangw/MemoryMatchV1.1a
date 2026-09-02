import { getActiveLinkConnectionEffect } from "./linkEffects.js";
import { gameState } from "../gameState.js";
import { measureLinkRender, recordLinkLayoutPass } from "./linkPerformance.js";

const PATH_VIEWBOX = "0 0 100 100";
const ELECTRIC_JITTER_PERCENT = 0.65;
const ELECTRIC_SEGMENT_LENGTH_PERCENT = 7;
const OUTER_ROUTE_INSET_PERCENT = 1.5;
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;
let layoutFrame;
let layoutObserver;
let observedGame;
let renderedBoardShape = "";
let renderedBoardContainer = null;
const boardCellsByPosition = new Map();
const tileElementsByKey = new Map();

window.addEventListener("resize", () => {
  scheduleLinkBoardLayout();
});

function scheduleLinkBoardLayout() {
  cancelAnimationFrame(layoutFrame);
  layoutFrame = requestAnimationFrame(updateLinkBoardLayout);
}

export function renderLinkBoard(board, { onTileClick } = {}) {
  return measureLinkRender("board patch", () => patchLinkBoard(board, onTileClick));
}

export function renderLinkBoardShift(board, { onTileClick } = {}) {
  return measureLinkRender("board shift", () => {
    const before = getLinkTileRects();
    patchLinkBoard(board, onTileClick);
    const after = getLinkTileRects();
    after.forEach(({ element, rect, key }) => {
      const previous = before.get(key);
      if (!previous) return;
      const deltaX = previous.left - rect.left;
      const deltaY = previous.top - rect.top;
      if (!deltaX && !deltaY) return;
      element.style.transition = "none";
      element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      requestAnimationFrame(() => {
        element.style.transition = "transform var(--link-board-shift-duration, 300ms) cubic-bezier(.2,.75,.25,1)";
        element.style.transform = "";
        element.addEventListener("transitionend", () => { element.style.transition = ""; }, { once: true });
      });
    });
  });
}

function patchLinkBoard(board, onTileClick) {
  const container = document.getElementById("link-board");
  if (!container) return;
  const rows = board.grid.length - 2;
  const shape = `${board.columns}x${rows}`;
  observeLinkBoardLayout(document.getElementById("link-connect-container"));
  container.style.setProperty("--link-columns", String(board.columns));
  container.style.setProperty("--link-rows", String(rows));
  if (renderedBoardContainer !== container || renderedBoardShape !== shape) {
    createLinkBoardCells(container, board.columns, rows);
  }

  const activeTileKeys = new Set();
  board.grid.slice(1, -1).forEach((row, rowIndex) => {
    row.slice(1, -1).forEach((tile, columnIndex) => {
      const position = { row: rowIndex + 1, column: columnIndex + 1 };
      const cell = boardCellsByPosition.get(positionKey(position));
      if (!cell) return;
      cell.classList.toggle("is-empty", !tile);
      if (!tile) {
        cell.replaceChildren();
        return;
      }

      activeTileKeys.add(tile.instanceId);
      const button = tileElementsByKey.get(tile.instanceId)
        || createLinkTileElement(tile.instanceId);
      syncLinkTileElement(button, tile, position, onTileClick);
      if (cell.firstElementChild !== button) cell.replaceChildren(button);
    });
  });

  tileElementsByKey.forEach((element, key) => {
    if (activeTileKeys.has(key)) return;
    element.remove();
    tileElementsByKey.delete(key);
  });
  updateLinkBoardLayout();
}

function createLinkBoardCells(container, columns, rows) {
  const fragment = document.createDocumentFragment();
  boardCellsByPosition.clear();
  tileElementsByKey.clear();
  for (let row = 1; row <= rows; row += 1) {
    for (let column = 1; column <= columns; column += 1) {
      const cell = document.createElement("div");
      const position = { row, column };
      cell.className = "link-board__cell is-empty";
      cell.dataset.row = String(row);
      cell.dataset.column = String(column);
      boardCellsByPosition.set(positionKey(position), cell);
      fragment.append(cell);
    }
  }
  container.replaceChildren(fragment);
  renderedBoardContainer = container;
  renderedBoardShape = `${columns}x${rows}`;
}

function createLinkTileElement(tileKey) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "link-tile";
  button.dataset.tileKey = tileKey;
  const image = document.createElement("img");
  image.alt = "";
  button.append(image);
  button.addEventListener("click", () => {
    const onTileClick = button._onLinkTileClick;
    if (!onTileClick) return;
    onTileClick({
      row: Number(button.dataset.row),
      column: Number(button.dataset.column),
    });
  });
  tileElementsByKey.set(tileKey, button);
  return button;
}

function syncLinkTileElement(button, tile, position, onTileClick) {
  button._onLinkTileClick = onTileClick;
  button.className = "link-tile";
  if (tile.special) button.classList.add("is-special");
  if (tile.luckyReward) button.classList.add("is-lucky");
  if (tile.frozen) button.classList.add("is-frozen");
  button.disabled = tile.frozen;
  button.dataset.row = String(position.row);
  button.dataset.column = String(position.column);
  button.setAttribute(
    "aria-label",
    tile.frozen ? `${tile.alt} · thẻ đóng băng` : tile.alt,
  );

  const image = button.querySelector("img:not(.link-tile__frost-overlay)");
  if (image?.getAttribute("src") !== tile.src) image.src = tile.src;
  let frostOverlay = button.querySelector(".link-tile__frost-overlay");
  if (tile.frozen && !frostOverlay) {
    frostOverlay = document.createElement("img");
    frostOverlay.className = "link-tile__frost-overlay";
    frostOverlay.src = assetUrl("assets/images/ui/frozen-card-overlay.png");
    frostOverlay.alt = "";
    frostOverlay.setAttribute("aria-hidden", "true");
    button.append(frostOverlay);
  } else if (!tile.frozen) {
    frostOverlay?.remove();
  }
}

function positionKey({ row, column }) {
  return `${row}:${column}`;
}

function getLinkTileRects() {
  return new Map(
    [...tileElementsByKey.entries()]
      .filter(([, element]) => element.isConnected)
      .map(([key, element]) => [key, { element, rect: element.getBoundingClientRect(), key }]),
  );
}

export function setLinkTileSelected(position, selected) {
  getLinkTileButton(position)?.classList.toggle("is-selected", selected);
}

export function clearLinkTileSelection() {
  document.querySelectorAll(".link-tile.is-selected").forEach((tile) => {
    tile.classList.remove("is-selected");
  });
}

export function playLinkMatchExit(start, end) {
  const effect = getActiveLinkConnectionEffect(gameState.appearance);
  [start, end].forEach((position) => {
    const tile = getLinkTileButton(position);
    if (!tile) return;
    tile.classList.add("is-removing", effect.exitClass);
    playLinkCardExitEffect(tile, effect.exitId);
  });
}

const FRAGMENT_LAYOUTS = Object.freeze({
  split2: Object.freeze({ columns: 2, rows: 1 }),
  split4: Object.freeze({ columns: 2, rows: 2 }),
  split8: Object.freeze({ columns: 4, rows: 2 }),
  triangles: Object.freeze({ columns: 2, rows: 2, triangular: true }),
  crumble: Object.freeze({ columns: 6, rows: 6 }),
  pixel: Object.freeze({ columns: 5, rows: 5 }),
});

function playLinkCardExitEffect(tile, exitId) {
  const source = tile.querySelector("img:not(.link-tile__frost-overlay)");
  const frame = document.getElementById("link-board-frame");
  if (!source?.complete || !source.naturalWidth || !frame) return;
  const frameRect = frame.getBoundingClientRect();
  const tileRect = tile.getBoundingClientRect();
  const density = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  canvas.className = "link-card-exit-effect";
  canvas.width = Math.round(frameRect.width * density);
  canvas.height = Math.round(frameRect.height * density);
  canvas.style.width = `${frameRect.width}px`;
  canvas.style.height = `${frameRect.height}px`;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.scale(density, density);
  const bounds = {
    x: tileRect.left - frameRect.left,
    y: tileRect.top - frameRect.top,
    width: tileRect.width,
    height: tileRect.height,
  };
  const timing = readExitEffectTiming(tile);
  const fragments = createCardExitFragments(bounds, exitId);
  tile.classList.add("has-canvas-exit");
  frame.append(canvas);
  const startedAt = performance.now();
  const draw = (now) => {
    const elapsed = now - startedAt;
    context.clearRect(0, 0, frameRect.width, frameRect.height);
    if (elapsed >= timing.delayMs) {
      const progress = Math.min((elapsed - timing.delayMs) / timing.durationMs, 1);
      renderCardExitEffect(context, source, fragments, bounds, exitId, progress);
    }
    if (elapsed < timing.delayMs + timing.durationMs) requestAnimationFrame(draw);
    else canvas.remove();
  };
  requestAnimationFrame(draw);
}

function createCardExitFragments(bounds, exitId) {
  const layout = FRAGMENT_LAYOUTS[exitId];
  if (layout) {
    return Array.from({ length: layout.columns * layout.rows }, (_, index) => {
      const column = index % layout.columns;
      const row = Math.floor(index / layout.columns);
      return {
        x: bounds.x + (column * bounds.width) / layout.columns,
        y: bounds.y + (row * bounds.height) / layout.rows,
        width: bounds.width / layout.columns,
        height: bounds.height / layout.rows,
        column,
        row,
        columns: layout.columns,
        rows: layout.rows,
        triangle: layout.triangular && index % 2 === 1,
        velocityX: (column - (layout.columns - 1) / 2) * 3.4 + randomFragmentOffset(1.8),
        velocityY: (row - (layout.rows - 1) / 2) * 3.4 + randomFragmentOffset(1.8),
        rotation: randomFragmentOffset(0.24),
      };
    });
  }
  const particleCount = exitId === "finedust" ? 64 : exitId === "dissolve" ? 42 : 1;
  return Array.from({ length: particleCount }, () => ({
    x: bounds.x + Math.random() * bounds.width,
    y: bounds.y + Math.random() * bounds.height,
    size: 1.5 + Math.random() * (exitId === "finedust" ? 3.5 : 6),
    velocityX: randomFragmentOffset(3.6),
    velocityY: -1.6 - Math.random() * 3.8,
  }));
}

function renderCardExitEffect(context, image, fragments, bounds, exitId, progress) {
  context.save();
  if (exitId === "finedust" || exitId === "dissolve") {
    fragments.forEach((fragment) => {
      context.globalAlpha = Math.max(0, 1 - progress);
      context.fillStyle = exitId === "finedust" ? "#d7f6ff" : "#7ee9ff";
      context.shadowBlur = 8;
      context.shadowColor = context.fillStyle;
      context.beginPath();
      context.arc(fragment.x + fragment.velocityX * progress * 16, fragment.y + fragment.velocityY * progress * 20, Math.max(.5, fragment.size * (1 - progress * .55)), 0, Math.PI * 2);
      context.fill();
    });
  } else if (FRAGMENT_LAYOUTS[exitId]) {
    fragments.forEach((fragment) => drawImageFragment(context, image, fragment, progress));
  } else {
    drawWholeCardEffect(context, image, bounds, exitId, progress);
  }
  context.restore();
}

function drawImageFragment(context, image, fragment, progress) {
  const x = fragment.x + fragment.velocityX * progress * 15;
  const y = fragment.y + fragment.velocityY * progress * 15 + (fragment.rows >= 6 ? progress * progress * 38 : 0);
  context.save();
  context.globalAlpha = Math.max(0, 1 - progress * 1.14);
  context.translate(x + fragment.width / 2, y + fragment.height / 2);
  context.rotate(fragment.rotation * progress * 12);
  if (fragment.triangle) {
    context.beginPath();
    context.moveTo(-fragment.width / 2, -fragment.height / 2);
    context.lineTo(fragment.width / 2, -fragment.height / 2);
    context.lineTo(-fragment.width / 2, fragment.height / 2);
    context.closePath();
    context.clip();
  }
  context.drawImage(
    image,
    (fragment.column * image.naturalWidth) / fragment.columns,
    (fragment.row * image.naturalHeight) / fragment.rows,
    image.naturalWidth / fragment.columns,
    image.naturalHeight / fragment.rows,
    -fragment.width / 2,
    -fragment.height / 2,
    fragment.width,
    fragment.height,
  );
  context.restore();
}

function drawWholeCardEffect(context, image, bounds, exitId, progress) {
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const effect = getWholeCardEffectTransform(exitId, progress, bounds);
  context.save();
  context.globalAlpha = effect.opacity;
  context.translate(centerX + effect.x, centerY + effect.y);
  context.rotate(effect.rotation);
  context.scale(effect.scaleX, effect.scaleY);
  context.filter = effect.filter;
  context.drawImage(image, -bounds.width / 2, -bounds.height / 2, bounds.width, bounds.height);
  context.restore();
  if (["portal", "blackhole", "electric-shock", "bubble"].includes(exitId)) {
    context.save();
    context.globalAlpha = Math.max(0, 1 - progress);
    context.strokeStyle = exitId === "electric-shock" ? "#c8f7ff" : "#b493ff";
    context.lineWidth = Math.max(1, 4 * (1 - progress));
    context.beginPath();
    context.arc(centerX, centerY, Math.max(bounds.width, bounds.height) * progress, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }
}

function getWholeCardEffectTransform(exitId, progress, bounds) {
  const standard = { x: 0, y: 0, rotation: 0, scaleX: 1 - progress * .42, scaleY: 1 - progress * .42, opacity: 1 - progress, filter: "none" };
  if (exitId === "gravity") return { ...standard, y: progress * progress * bounds.height * 2.6, rotation: progress * .45 };
  if (exitId === "ghost") return { ...standard, y: -progress * bounds.height * 1.5, scaleX: 1 - progress * .2, scaleY: 1 - progress * .2, filter: "blur(2px) saturate(.45)" };
  if (exitId === "slice") return { ...standard, x: progress * bounds.width * .42, y: -progress * bounds.height * .32, rotation: progress * .3 };
  if (exitId === "portal" || exitId === "blackhole" || exitId === "implode") return { ...standard, rotation: progress * Math.PI * 4, scaleX: Math.max(0, 1 - progress * 1.35), scaleY: Math.max(0, 1 - progress * 1.35) };
  if (exitId === "burn") return { ...standard, y: -progress * bounds.height * .55, filter: "sepia(1) saturate(2.3) hue-rotate(-24deg) brightness(1.5)" };
  if (exitId === "freeze") return { ...standard, scaleX: 1 + Math.sin(progress * 30) * .06, scaleY: 1 + Math.cos(progress * 27) * .06, filter: "saturate(.35) brightness(1.7)" };
  if (exitId === "bubble") return { ...standard, scaleX: 1 + progress * .7, scaleY: 1 + progress * .7 };
  if (exitId === "origami") return { ...standard, rotation: progress * Math.PI / 2, scaleX: Math.max(0, 1 - progress * .8) };
  if (exitId === "electric-shock") return { ...standard, x: Math.sin(progress * 46) * bounds.width * .08, filter: "brightness(2) saturate(1.7)" };
  return standard;
}

function readExitEffectTiming(tile) {
  const style = getComputedStyle(tile);
  return {
    delayMs: Number.parseFloat(style.getPropertyValue("--link-tile-exit-delay")) || 0,
    durationMs: Number.parseFloat(style.getPropertyValue("--link-tile-exit-duration")) || 520,
  };
}

function randomFragmentOffset(range) {
  return (Math.random() * 2 - 1) * range;
}

const THUNDER_COLORS = Object.freeze({
  yellow: Object.freeze({ main: "#facc15", glow: "#fde047", shadow: "#eab308" }),
  blue: Object.freeze({ main: "#22d3ee", glow: "#67e8f9", shadow: "#0891b2" }),
  red: Object.freeze({ main: "#ef4444", glow: "#fca5a5", shadow: "#dc2626" }),
});

export function playLinkThunderStrike(positions, colorId = "yellow") {
  const frame = document.getElementById("link-board-frame");
  if (!frame) return null;
  const frameRect = frame.getBoundingClientRect();
  const density = Math.min(window.devicePixelRatio || 1, 2);
  const effect = document.createElement("canvas");
  effect.className = "link-thunder-strike";
  effect.width = Math.round(frameRect.width * density);
  effect.height = Math.round(frameRect.height * density);
  effect.style.width = `${frameRect.width}px`;
  effect.style.height = `${frameRect.height}px`;
  const context = effect.getContext("2d");
  if (!context) return null;
  context.scale(density, density);
  const targets = positions.flatMap((position) => {
    const tile = getLinkTileButton(position);
    if (!tile) return [];
    const tileRect = tile.getBoundingClientRect();
    return [{
      x: tileRect.left - frameRect.left + tileRect.width / 2,
      y: tileRect.top - frameRect.top + tileRect.height / 2,
      size: Math.min(tileRect.width, tileRect.height),
      arcDirection: Math.random() < .5 ? -1 : 1,
    }];
  });
  if (!targets.length) return null;
  const palette = THUNDER_COLORS[colorId] || THUNDER_COLORS.yellow;
  const startedAt = performance.now();
  const duration = readThunderDuration(frame);
  const draw = (now) => {
    const progress = Math.min((now - startedAt) / duration, 1);
    context.clearRect(0, 0, frameRect.width, frameRect.height);
    targets.forEach((target) => drawThunderBolt(context, target, palette, progress));
    if (progress < 1 && effect.isConnected) requestAnimationFrame(draw);
  };
  frame.append(effect);
  requestAnimationFrame(draw);
  return effect;
}

export function clearLinkThunderStrikes() {
  document.querySelectorAll(".link-thunder-strike").forEach((effect) => effect.remove());
}

function drawThunderBolt(context, target, palette, progress) {
  const intensity = Math.max(0, 1 - progress * .72) * (.82 + Math.random() * .18);
  const points = createThunderCanvasPath(target);
  drawThunderStroke(context, points, palette.glow, target.size * .21, intensity * .38, 24, palette.shadow);
  drawThunderStroke(context, points, palette.main, Math.max(4, target.size * .085), intensity, 12, palette.shadow);
  drawThunderStroke(context, points, "#ffffff", Math.max(1.5, target.size * .031), intensity, 0);
  drawThunderBranches(context, points, target, palette, intensity);
  drawThunderImpact(context, target, palette, progress, intensity);
}

function createThunderCanvasPath(target) {
  const steps = Math.max(9, Math.round(target.y / 16));
  const curve = target.arcDirection * target.size * .32;
  return Array.from({ length: steps + 1 }, (_, index) => {
    const progress = index / steps;
    if (index === 0) return { x: target.x + randomThunderOffset(target.size * .12), y: 0 };
    if (index === steps) return { x: target.x, y: target.y };
    const taper = Math.sin(progress * Math.PI);
    return {
      x: target.x + curve * taper + randomThunderOffset(target.size * .16 * taper),
      y: target.y * progress,
    };
  });
}

function drawThunderStroke(context, points, color, width, alpha, blur, shadowColor = color) {
  context.save();
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = shadowColor;
  context.shadowBlur = blur;
  context.globalAlpha = alpha;
  context.stroke();
  context.restore();
}

function drawThunderBranches(context, points, target, palette, intensity) {
  points.slice(2, -2).forEach((point, index) => {
    if (index % 3 || Math.random() > .58) return;
    const length = target.size * (.25 + Math.random() * .24);
    const end = { x: point.x + target.arcDirection * length, y: point.y + target.size * (.12 + Math.random() * .2) };
    drawThunderStroke(context, [point, { x: (point.x + end.x) / 2 + randomThunderOffset(7), y: (point.y + end.y) / 2 }, end], palette.main, Math.max(1.2, target.size * .035), intensity * .7, 5, palette.shadow);
  });
}

function drawThunderImpact(context, target, palette, progress, intensity) {
  const radius = target.size * (.16 + progress * .48);
  context.save();
  context.globalAlpha = intensity * .8;
  context.fillStyle = "#ffffff";
  context.shadowColor = palette.main;
  context.shadowBlur = 18;
  context.beginPath();
  context.arc(target.x, target.y, Math.max(4, target.size * .115 * (1 - progress * .45)), 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = palette.glow;
  context.lineWidth = Math.max(1, target.size * .025);
  context.beginPath();
  context.arc(target.x, target.y, radius, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function readThunderDuration(frame) {
  return Number.parseFloat(getComputedStyle(frame).getPropertyValue("--link-thunder-strike-duration")) || 620;
}

function randomThunderOffset(range) { return (Math.random() * 2 - 1) * range; }

// Giữ nguyên các thẻ còn lại sau khi ghép đúng để tránh nháy do dựng lại ảnh.
export function clearLinkMatchedPair(start, end) {
  [start, end].forEach((position) => {
    const cell = getLinkBoardCell(position);
    if (!cell) return;
    const tile = cell.querySelector(".link-tile[data-tile-key]");
    if (tile?.dataset.tileKey) tileElementsByKey.delete(tile.dataset.tileKey);
    cell.replaceChildren();
    cell.classList.add("is-empty");
  });
}

export function drawLinkPath(path, board) {
  const svg = document.getElementById("link-path-overlay");
  const boardElement = document.getElementById("link-board");
  if (!svg || !boardElement || !path) return;
  const points = path.map((position) => toPercentPoint(position, board, boardElement));
  if (points.some((point) => !point)) return;
  const electricPoints = createElectricPoints(points);
  const effect = getActiveLinkConnectionEffect(gameState.appearance);
  const serializedPoints = electricPoints.map(({ x, y }) => `${x},${y}`).join(" ");
  svg.setAttribute("viewBox", PATH_VIEWBOX);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("class", `link-path-overlay ${effect.pathClass}`);
  svg.replaceChildren();
  const glow = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  glow.setAttribute("points", serializedPoints);
  glow.setAttribute("pathLength", "1");
  glow.classList.add("link-path-overlay__glow");
  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", serializedPoints);
  polyline.setAttribute("pathLength", "1");
  polyline.classList.add("link-path-overlay__beam");
  svg.append(glow, polyline);
  svg.classList.add("is-visible");
}

export function clearLinkPath() {
  const svg = document.getElementById("link-path-overlay");
  if (!svg) return;
  svg.replaceChildren();
  svg.classList.remove("is-visible");
}

function getLinkTileButton(position) {
  return getLinkBoardCell(position)?.querySelector(".link-tile") || null;
}

function toPercentPoint(position, board, boardElement) {
  const boardRect = boardElement.getBoundingClientRect();
  const cell = getLinkBoardCell(position);
  if (cell) return toPercent(cell.getBoundingClientRect(), boardRect);

  const firstCell = getLinkBoardCell({ row: 1, column: 1 });
  if (!firstCell) return null;
  const cellRect = firstCell.getBoundingClientRect();
  const gap = readBoardGap(boardElement);
  const x = cellRect.left + (position.column - 1) * (cellRect.width + gap) + cellRect.width / 2;
  const y = cellRect.top + (position.row - 1) * (cellRect.height + gap) + cellRect.height / 2;
  return clampPathPoint({
    x: ((x - boardRect.left) / boardRect.width) * 100,
    y: ((y - boardRect.top) / boardRect.height) * 100,
  });
}

function getLinkBoardCell(position) {
  return boardCellsByPosition.get(positionKey(position)) || document.querySelector(
    `.link-board__cell[data-row="${position.row}"][data-column="${position.column}"]`,
  );
}

function toPercent(cellRect, boardRect) {
  return {
    x: ((cellRect.left + cellRect.width / 2 - boardRect.left) / boardRect.width) * 100,
    y: ((cellRect.top + cellRect.height / 2 - boardRect.top) / boardRect.height) * 100,
  };
}

function clampPathPoint(point) {
  return {
    x: clamp(point.x, OUTER_ROUTE_INSET_PERCENT, 100 - OUTER_ROUTE_INSET_PERCENT),
    y: clamp(point.y, OUTER_ROUTE_INSET_PERCENT, 100 - OUTER_ROUTE_INSET_PERCENT),
  };
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function createElectricPoints(points) {
  return points.flatMap((point, index) => {
    if (index === points.length - 1) return [point];
    const next = points[index + 1];
    const horizontal = Math.abs(next.x - point.x) >= Math.abs(next.y - point.y);
    const distance = horizontal ? Math.abs(next.x - point.x) : Math.abs(next.y - point.y);
    const steps = Math.max(2, Math.round(distance / ELECTRIC_SEGMENT_LENGTH_PERCENT));
    const segmentPoints = index === 0 ? [point] : [];
    for (let step = 1; step < steps; step += 1) {
      const progress = step / steps;
      const jitter = (Math.random() * 2 - 1) * ELECTRIC_JITTER_PERCENT;
      segmentPoints.push(horizontal
        ? { x: interpolate(point.x, next.x, progress), y: point.y + jitter }
        : { x: point.x + jitter, y: interpolate(point.y, next.y, progress) });
    }
    segmentPoints.push(next);
    return segmentPoints;
  });
}

function interpolate(start, end, progress) {
  return start + (end - start) * progress;
}

function readBoardGap(boardElement) {
  return Number.parseFloat(getComputedStyle(boardElement).gap) || 0;
}

function observeLinkBoardLayout(game) {
  if (!game || observedGame === game || typeof ResizeObserver === "undefined") return;
  layoutObserver?.disconnect();
  layoutObserver = new ResizeObserver(scheduleLinkBoardLayout);
  layoutObserver.observe(game);
  observedGame = game;
}

function updateLinkBoardLayout() {
  recordLinkLayoutPass();
  const game = document.getElementById("link-connect-container");
  const board = document.getElementById("link-board");
  const frame = document.getElementById("link-board-frame");
  if (!game || !board || !frame || game.hidden) return;

  const columns = Number.parseInt(board.style.getPropertyValue("--link-columns"), 10);
  const rows = Number.parseInt(board.style.getPropertyValue("--link-rows"), 10);
  if (!columns || !rows) return;

  const boardStyles = getComputedStyle(board);
  const gameStyles = getComputedStyle(game);
  const gap = readBoardGap(board);
  const boardHorizontalInsets = readHorizontalInsets(boardStyles);
  const boardVerticalInsets = readVerticalInsets(boardStyles);
  const gameVerticalPadding = (Number.parseFloat(gameStyles.paddingTop) || 0)
    + (Number.parseFloat(gameStyles.paddingBottom) || 0);
  const boardSafeInset = Number.parseFloat(gameStyles.getPropertyValue("--link-board-safe-inset")) || 0;
  const gameGap = Number.parseFloat(gameStyles.rowGap) || 0;
  const chromeHeight = [
    ".link-game-name",
    ".link-game-progress-hud",
    ".link-game-hud",
    ".link-special-hud",
  ].reduce((total, selector) => total + (game.querySelector(selector)?.getBoundingClientRect().height || 0), 0);
  const horizontalGamePadding = (Number.parseFloat(gameStyles.paddingLeft) || 0)
    + (Number.parseFloat(gameStyles.paddingRight) || 0);
  const maxBoardWidth = Number.parseFloat(gameStyles.getPropertyValue("--link-content-max-width")) || Infinity;
  const availableWidth = Math.min(
    maxBoardWidth,
    Math.max(0, game.clientWidth - horizontalGamePadding - boardSafeInset * 2),
  );
  const gridGapCount = Math.max(0, game.children.length - 1);
  const availableHeight = Math.max(
    0,
    game.clientHeight - gameVerticalPadding - chromeHeight - gameGap * gridGapCount,
  );
  const tileByWidth = (availableWidth - boardHorizontalInsets - gap * (columns - 1)) / columns;
  const tileByHeight = (availableHeight - boardVerticalInsets - gap * (rows - 1)) / rows;
  const tileSize = Math.min(tileByWidth, tileByHeight);
  if (!Number.isFinite(tileSize) || tileSize <= 0) return;
  const fittedTileSize = Math.floor(tileSize * 1000) / 1000;
  const boardWidth = fittedTileSize * columns + gap * (columns - 1) + boardHorizontalInsets;

  board.style.setProperty("--link-tile-size", `${fittedTileSize}px`);
  frame.style.width = `${boardWidth}px`;
}

function readHorizontalInsets(styles) {
  return (Number.parseFloat(styles.paddingLeft) || 0)
    + (Number.parseFloat(styles.paddingRight) || 0)
    + (Number.parseFloat(styles.borderLeftWidth) || 0)
    + (Number.parseFloat(styles.borderRightWidth) || 0);
}

function readVerticalInsets(styles) {
  return (Number.parseFloat(styles.paddingTop) || 0)
    + (Number.parseFloat(styles.paddingBottom) || 0)
    + (Number.parseFloat(styles.borderTopWidth) || 0)
    + (Number.parseFloat(styles.borderBottomWidth) || 0);
}
