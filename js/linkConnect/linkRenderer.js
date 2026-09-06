import { getActiveLinkConnectionEffect } from "./linkEffects.js";
import { gameState } from "../gameState.js";
import { createIcon } from "../icons.js";
import { getLinkItemDefinition } from "./linkItems.js";
import {
  measureLinkRender,
  recordLinkLayoutPass,
  recordLinkPatch,
} from "./linkPerformance.js";

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
  const boardRebuilt = renderedBoardContainer !== container || renderedBoardShape !== shape;
  if (boardRebuilt) {
    createLinkBoardCells(container, board.columns, rows);
  }

  const desiredTiles = new Map();
  board.grid.slice(1, -1).forEach((row, rowIndex) => {
    row.slice(1, -1).forEach((tile, columnIndex) => {
      if (!tile) return;
      desiredTiles.set(tile.instanceId, {
        tile,
        position: { row: rowIndex + 1, column: columnIndex + 1 },
      });
    });
  });

  const changedCells = new Set();
  let updatedTiles = 0;
  let createdTiles = 0;
  tileElementsByKey.forEach((element, key) => {
    if (desiredTiles.has(key)) return;
    const previousCell = element.parentElement;
    if (previousCell) changedCells.add(previousCell);
    element.remove();
    tileElementsByKey.delete(key);
  });
  desiredTiles.forEach(({ tile, position }, key) => {
    const cell = boardCellsByPosition.get(positionKey(position));
    if (!cell) return;
    let button = tileElementsByKey.get(key);
    if (!button) {
      button = createLinkTileElement(key);
      createdTiles += 1;
    }
    if (syncLinkTileElement(button, tile, position, onTileClick)) updatedTiles += 1;
    if (cell.firstElementChild === button) return;
    if (button.parentElement) changedCells.add(button.parentElement);
    changedCells.add(cell);
    cell.replaceChildren(button);
  });
  changedCells.forEach((cell) => {
    cell.classList.toggle("is-empty", !cell.firstElementChild);
  });
  recordLinkPatch({
    changedCells: changedCells.size,
    updatedTiles,
    createdTiles,
  });
  if (boardRebuilt) scheduleLinkBoardLayout();
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
  button.setAttribute("aria-pressed", "false");
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
  const fingerprint = [
    tile.src,
    tile.alt,
    tile.special === true,
    tile.premiumType || "",
    tile.frozen === true,
    Boolean(tile.luckyReward),
  ].join("|");
  const positionChanged = button.dataset.row !== String(position.row)
    || button.dataset.column !== String(position.column);
  if (button._linkTileFingerprint === fingerprint && !positionChanged) return false;
  button._linkTileFingerprint = fingerprint;
  button.className = "link-tile";
  if (tile.special) button.classList.add("is-special", `is-special--${tile.premiumType || "cyan"}`);
  if (tile.luckyReward) button.classList.add("is-lucky");
  if (tile.frozen) button.classList.add("is-frozen");
  button.disabled = tile.frozen;
  button.dataset.row = String(position.row);
  button.dataset.column = String(position.column);
  if (tile.special) button.dataset.tooltip = `Thẻ Cao Cấp: ${getPremiumTypeLabel(tile.premiumType)}`;
  else delete button.dataset.tooltip;
  button.setAttribute(
    "aria-label",
    [
      tile.alt,
      tile.special && `Thẻ Cao Cấp · ${getPremiumTypeLabel(tile.premiumType)}`,
      tile.frozen && "thẻ đóng băng",
    ].filter(Boolean).join(" · "),
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
  return true;
}

function getPremiumTypeLabel(type) {
  if (type === "blue") return "Tiếp Tế";
  if (type === "red") return "Bùng Nổ";
  return "Phá Băng";
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
  const tile = getLinkTileButton(position);
  if (!tile) return;
  tile.classList.toggle("is-selected", selected);
  tile.setAttribute("aria-pressed", String(selected));
}

export function clearLinkTileSelection() {
  document.querySelectorAll(".link-tile.is-selected").forEach((tile) => {
    tile.classList.remove("is-selected");
    tile.setAttribute("aria-pressed", "false");
  });
}

export function setLinkTileHinted(position, hinted) {
  const tile = getLinkTileButton(position);
  if (!tile) return;
  tile.classList.toggle("is-hinted", hinted);
}

export function clearLinkTileHints() {
  document.querySelectorAll(".link-tile.is-hinted").forEach((tile) => tile.classList.remove("is-hinted"));
}

// Dùng phần tử con tạm thay vì pseudo-element để vẫn tương thích với lớp băng,
// vốn đã sử dụng cả ::before lẫn ::after trên cùng một thẻ.
export function playLinkSpecialPairTransform(tileKeys) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  tileKeys.forEach((tileKey) => {
    const tile = tileElementsByKey.get(tileKey);
    if (!tile?.isConnected) return;
    tile.classList.remove("is-becoming-special");
    const burst = document.createElement("span");
    burst.className = "link-tile__special-burst";
    burst.setAttribute("aria-hidden", "true");
    tile.append(burst);
    tile.classList.add("is-becoming-special");
    burst.addEventListener("animationend", () => {
      burst.remove();
      tile.classList.remove("is-becoming-special");
    }, { once: true });
  });
}

export function playLinkFrozenPairUnlock(tileKeys) {
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  tileKeys.forEach((tileKey) => {
    const tile = tileElementsByKey.get(tileKey);
    if (!tile?.isConnected) return;
    const finishUnlock = () => {
      tile.classList.remove("is-frozen", "is-unlocking-frozen");
      tile.disabled = false;
      tile.querySelector(".link-tile__frost-overlay")?.remove();
    };
    if (reducedMotion) {
      finishUnlock();
      return;
    }
    const wipe = document.createElement("span");
    wipe.className = "link-tile__frost-wipe";
    wipe.setAttribute("aria-hidden", "true");
    const veil = document.createElement("span");
    veil.className = "link-tile__frost-wipe-veil";
    const line = document.createElement("span");
    line.className = "link-tile__frost-wipe-line";
    wipe.append(veil, line);
    tile.classList.add("is-unlocking-frozen");
    tile.append(wipe);
    line.addEventListener("animationend", () => {
      wipe.remove();
      finishUnlock();
    }, { once: true });
  });
}

export function playLinkMismatch(start, end) {
  return [start, end].flatMap((position) => {
    const tile = getLinkTileButton(position);
    if (!tile) return [];
    tile.classList.add("is-wrong");
    return [tile];
  });
}

export function playLinkMatchExit(start, end) {
  const effect = getActiveLinkConnectionEffect(gameState.appearance);
  const tiles = [start, end].flatMap((position) => {
    const tile = getLinkTileButton(position);
    if (!tile) return [];
    tile.classList.add("is-removing", effect.exitClass);
    return [tile];
  });
  playLinkCardExitEffects(tiles, effect.exitId);
  return tiles;
}

// Năng lượng chỉ là hiệu ứng tạm trên lớp phủ; không tạo hay lưu vật phẩm.
export function playLinkEnergyFlight(start, end, {
  onArrive,
  targetProgress = 1,
  progressTarget = 10,
} = {}) {
  const sourceTile = getLinkTileButton(end) || getLinkTileButton(start);
  const target = document.querySelector(".link-special-hud__milestones");
  if (!sourceTile || !target) {
    onArrive?.();
    return null;
  }
  const sourceRect = sourceTile.getBoundingClientRect();
  const effect = document.createElement("span");
  effect.className = "link-energy-flight";
  effect.setAttribute("aria-hidden", "true");
  effect.append(createIcon("energy"));
  const startX = sourceRect.left + sourceRect.width / 2;
  const startY = sourceRect.top + sourceRect.height / 2;
  const safeInset = 18;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const dropDistance = sourceRect.width * (.55 + Math.random() * .55);
  const leftRoom = startX - safeInset;
  const rightRoom = viewportWidth - safeInset - startX;
  const direction = leftRoom < dropDistance ? 1
    : rightRoom < dropDistance ? -1
      : Math.random() < .5 ? -1 : 1;
  const landingX = clamp(startX + direction * dropDistance, safeInset, viewportWidth - safeInset) - startX;
  const desiredLandingY = Math.max(20, sourceRect.height * (.34 + Math.random() * .16));
  const landingY = clamp(startY + desiredLandingY, safeInset, viewportHeight - safeInset) - startY;
  const apexX = landingX * (.45 + Math.random() * .18);
  const desiredApexY = -sourceRect.height * (.68 + Math.random() * .38);
  const apexY = clamp(startY + desiredApexY, safeInset, viewportHeight - safeInset) - startY;
  effect.style.left = `${startX}px`;
  effect.style.top = `${startY}px`;
  effect.style.setProperty("--link-energy-apex-x", `${Math.round(apexX)}px`);
  effect.style.setProperty("--link-energy-apex-y", `${Math.round(apexY)}px`);
  effect.style.setProperty("--link-energy-land-x", `${Math.round(landingX)}px`);
  effect.style.setProperty("--link-energy-land-y", `${Math.round(landingY)}px`);
  effect.style.setProperty("--link-energy-bounce-y", `${Math.round(landingY - Math.max(6, sourceRect.height * .08))}px`);
  const game = document.getElementById("link-connect-container");
  const styles = game ? getComputedStyle(game) : null;
  const burstDuration = styles?.getPropertyValue("--link-energy-burst-duration").trim() || "1100ms";
  const holdDuration = styles?.getPropertyValue("--link-energy-hold-duration").trim() || "1000ms";
  const flightDuration = styles?.getPropertyValue("--link-energy-flight-duration").trim() || "1050ms";
  effect.style.setProperty("--link-energy-burst-duration", burstDuration);
  effect.style.setProperty("--link-energy-flight-duration", flightDuration);
  document.body.append(effect);
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    effect.remove();
    onArrive?.();
  };
  effect.addEventListener("animationend", (event) => {
    if (event.animationName === "link-energy-fly-to-hud") finish();
  });
  const collectDelayMs = readCssTimeMs(burstDuration, 1100) + readCssTimeMs(holdDuration, 1000);
  setTimeout(() => {
    if (!effect.isConnected) return;
    const currentTarget = document.querySelector(".link-special-hud__milestones");
    if (!currentTarget) return finish();
    const targetRect = currentTarget.getBoundingClientRect();
    const targetRatio = clamp((targetProgress - 1) / Math.max(1, progressTarget - 1), 0, 1);
    const targetX = targetRect.left + targetRect.width * (0.05 + targetRatio * 0.9);
    effect.style.setProperty("--link-energy-flight-x", `${Math.round(targetX - startX)}px`);
    effect.style.setProperty("--link-energy-flight-y", `${Math.round(targetRect.top + targetRect.height / 2 - startY)}px`);
    effect.classList.add("is-collecting");
  }, collectDelayMs);
  setTimeout(finish, collectDelayMs + readCssTimeMs(flightDuration, 1050) + 350);
  return effect;
}

export function playLinkItemRewardFlight(source, itemId, { delayMs = 0 } = {}) {
  const item = getLinkItemDefinition(itemId);
  if (!source || !item) return null;
  const launch = () => {
    if (!source.isConnected) return;
    const sourceRect = source.getBoundingClientRect();
    const startX = sourceRect.left + sourceRect.width / 2;
    const startY = sourceRect.top + sourceRect.height / 2;
    const viewportWidth = document.documentElement.clientWidth;
    const direction = Math.random() < 0.5 ? -1 : 1;
    const desiredBurstX = direction * (24 + Math.random() * 20);
    const burstX = clamp(startX + desiredBurstX, 18, viewportWidth - 18) - startX;
    const burstDistanceY = 18 + Math.random() * 18;
    const burstY = startY - burstDistanceY * 1.18 < 18 ? burstDistanceY : -burstDistanceY;
    const effect = document.createElement("span");
    effect.className = `link-item-reward-flight link-item-reward-flight--${itemId}`;
    effect.setAttribute("aria-hidden", "true");
    effect.append(createIcon(item.icon));
    effect.style.left = `${startX}px`;
    effect.style.top = `${startY}px`;
    effect.style.setProperty("--link-item-reward-burst-x", `${Math.round(burstX)}px`);
    effect.style.setProperty("--link-item-reward-burst-y", `${Math.round(burstY)}px`);
    effect.style.setProperty("--link-item-reward-apex-x", `${Math.round(burstX * 0.72)}px`);
    effect.style.setProperty("--link-item-reward-apex-y", `${Math.round(burstY * 1.18)}px`);
    const game = document.getElementById("link-connect-container");
    const styles = game ? getComputedStyle(game) : null;
    const burstDuration = styles?.getPropertyValue("--link-item-reward-burst-duration").trim() || "620ms";
    const holdDuration = styles?.getPropertyValue("--link-item-reward-hold-duration").trim() || "380ms";
    const flightDuration = styles?.getPropertyValue("--link-item-reward-flight-duration").trim() || "820ms";
    effect.style.setProperty("--link-item-reward-burst-duration", burstDuration);
    effect.style.setProperty("--link-item-reward-flight-duration", flightDuration);
    document.body.append(effect);
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      effect.remove();
    };
    effect.addEventListener("animationend", (event) => {
      if (event.animationName === "link-item-reward-collect") finish();
    });
    const collectDelayMs = readCssTimeMs(burstDuration, 620) + readCssTimeMs(holdDuration, 380);
    setTimeout(() => {
      if (!effect.isConnected) return;
      const itemTarget = document.querySelector(`#link-item-actions [data-item="${itemId}"] .ui-icon`);
      const target = itemTarget?.getClientRects().length
        ? itemTarget
        : document.querySelector("#link-tools-toggle .ui-icon");
      if (!target) return finish();
      const targetRect = target.getBoundingClientRect();
      effect.style.setProperty("--link-item-reward-flight-x", `${Math.round(targetRect.left + targetRect.width / 2 - startX)}px`);
      effect.style.setProperty("--link-item-reward-flight-y", `${Math.round(targetRect.top + targetRect.height / 2 - startY)}px`);
      effect.classList.add("is-collecting");
    }, collectDelayMs);
    setTimeout(finish, collectDelayMs + readCssTimeMs(flightDuration, 820) + 300);
  };
  if (delayMs > 0) return setTimeout(launch, delayMs);
  launch();
  return null;
}

function readCssTimeMs(value, fallback) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  return value.endsWith("s") && !value.endsWith("ms") ? parsed * 1000 : parsed;
}

const FRAGMENT_LAYOUTS = Object.freeze({
  split2: Object.freeze({ columns: 2, rows: 1 }),
  split4: Object.freeze({ columns: 2, rows: 2 }),
  split8: Object.freeze({ columns: 4, rows: 2 }),
  triangles: Object.freeze({ columns: 2, rows: 2, triangular: true }),
  crumble: Object.freeze({ columns: 6, rows: 6 }),
  pixel: Object.freeze({ columns: 5, rows: 5 }),
});

const CANVAS_EXIT_EFFECTS = new Set(["finedust", ...Object.keys(FRAGMENT_LAYOUTS)]);

function playLinkCardExitEffects(tiles, exitId) {
  if (!CANVAS_EXIT_EFFECTS.has(exitId)) return;
  const frame = document.getElementById("link-board-frame");
  if (!frame) return;
  const frameRect = frame.getBoundingClientRect();
  const density = Math.min(window.devicePixelRatio || 1, 2);
  const cards = tiles.flatMap((tile) => {
    const source = tile.querySelector("img:not(.link-tile__frost-overlay)");
    if (!source?.complete || !source.naturalWidth) return [];
    const tileRect = tile.getBoundingClientRect();
    const bounds = {
      x: tileRect.left - frameRect.left,
      y: tileRect.top - frameRect.top,
      width: tileRect.width,
      height: tileRect.height,
    };
    tile.classList.add("has-canvas-exit");
    return [{ source, bounds, fragments: createCardExitFragments(bounds, exitId), timing: readExitEffectTiming(tile) }];
  });
  if (!cards.length) return;
  const canvas = document.createElement("canvas");
  canvas.className = "link-card-exit-effect";
  canvas.width = Math.round(frameRect.width * density);
  canvas.height = Math.round(frameRect.height * density);
  canvas.style.width = `${frameRect.width}px`;
  canvas.style.height = `${frameRect.height}px`;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.scale(density, density);
  frame.append(canvas);
  const startedAt = performance.now();
  const draw = (now) => {
    const elapsed = now - startedAt;
    context.clearRect(0, 0, frameRect.width, frameRect.height);
    cards.forEach(({ source, bounds, fragments, timing }) => {
      if (elapsed < timing.delayMs) return;
      const progress = Math.min((elapsed - timing.delayMs) / timing.durationMs, 1);
      renderCardExitEffect(context, source, fragments, bounds, exitId, progress);
    });
    const duration = Math.max(...cards.map(({ timing }) => timing.delayMs + timing.durationMs));
    if (elapsed < duration) requestAnimationFrame(draw);
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
  const particleCount = isCoarsePointer() ? 42 : 60;
  return Array.from({ length: particleCount }, () => ({
    x: bounds.x + Math.random() * bounds.width,
    y: bounds.y + Math.random() * bounds.height,
    size: 1.4 + Math.random() * 3.2,
    velocityX: randomFragmentOffset(3.6),
    velocityY: -1.6 - Math.random() * 3.8,
  }));
}

function renderCardExitEffect(context, image, fragments, bounds, exitId, progress) {
  context.save();
  if (exitId === "finedust") {
    context.fillStyle = "#d7f6ff";
    context.shadowBlur = 5;
    context.shadowColor = context.fillStyle;
    fragments.forEach((fragment) => {
      context.globalAlpha = Math.max(0, 1 - progress);
      context.beginPath();
      context.arc(fragment.x + fragment.velocityX * progress * 16, fragment.y + fragment.velocityY * progress * 20, Math.max(.5, fragment.size * (1 - progress * .55)), 0, Math.PI * 2);
      context.fill();
    });
  } else {
    fragments.forEach((fragment) => drawImageFragment(context, image, fragment, progress));
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

function readExitEffectTiming(tile) {
  const style = getComputedStyle(tile);
  return {
    delayMs: Number.parseFloat(style.getPropertyValue("--link-tile-exit-delay")) || 0,
    durationMs: Number.parseFloat(style.getPropertyValue("--link-tile-exit-duration")) || 520,
  };
}

function isCoarsePointer() {
  return window.matchMedia?.("(hover: none) and (pointer: coarse)").matches;
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
      points: createThunderCanvasPath({
        x: tileRect.left - frameRect.left + tileRect.width / 2,
        y: tileRect.top - frameRect.top + tileRect.height / 2,
        size: Math.min(tileRect.width, tileRect.height),
      }),
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
  const flash = progress < .16 ? 1 : Math.max(0, 1 - (progress - .16) / .84);
  const intensity = flash * .94;
  drawThunderStroke(context, target.points, palette.glow, Math.max(5, target.size * .09), intensity * .18, 12, palette.shadow);
  drawThunderStroke(context, target.points, palette.main, Math.max(2.1, target.size * .036), intensity, 5, palette.shadow);
  drawThunderStroke(context, target.points, "#f8feff", Math.max(1, target.size * .014), intensity, 0);
  drawThunderBranches(context, target, palette, intensity);
  drawThunderImpact(context, target, palette, progress, intensity);
}

function createThunderCanvasPath(target) {
  const steps = Math.max(7, Math.round(target.y / 28));
  const startX = target.x + randomThunderOffset(Math.min(target.size * .32, 24));
  return Array.from({ length: steps + 1 }, (_, index) => {
    const progress = index / steps;
    if (index === 0) return { x: startX, y: 0 };
    if (index === steps) return { x: target.x, y: target.y };
    const drift = (target.x - startX) * progress;
    return {
      x: startX + drift + randomThunderOffset(Math.max(4, target.size * .11)),
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

function drawThunderBranches(context, target, palette, intensity) {
  const branchStart = target.points[Math.max(2, Math.floor(target.points.length * .46))];
  const previous = target.points[Math.max(1, Math.floor(target.points.length * .46) - 1)];
  if (!branchStart || !previous) return;
  const direction = branchStart.x - previous.x >= 0 ? -1 : 1;
  const end = {
    x: branchStart.x + direction * target.size * .24,
    y: branchStart.y + target.size * .17,
  };
  const branch = [branchStart, { x: (branchStart.x + end.x) / 2, y: branchStart.y + target.size * .08 }, end];
  drawThunderStroke(context, branch, palette.main, Math.max(1, target.size * .014), intensity * .52, 3, palette.shadow);
}

function drawThunderImpact(context, target, palette, progress, intensity) {
  const radius = target.size * (.07 + progress * .14);
  context.save();
  context.globalAlpha = intensity * .8;
  context.fillStyle = "#ffffff";
  context.shadowColor = palette.main;
  context.shadowBlur = 10;
  context.beginPath();
  context.arc(target.x, target.y, Math.max(2.5, target.size * .052 * (1 - progress * .35)), 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = palette.glow;
  context.lineWidth = Math.max(1, target.size * .012);
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
  const effect = getActiveLinkConnectionEffect(gameState.appearance);
  const renderedPoints = ["electric", "spiral"].includes(effect.pathId)
    ? createElectricPoints(points, effect.pathId === "spiral" ? 1.3 : 1)
    : points;
  const serializedPoints = renderedPoints.map(({ x, y }) => `${x},${y}`).join(" ");
  const pathData = `M ${renderedPoints.map(({ x, y }) => `${x} ${y}`).join(" L ")}`;
  svg.setAttribute("viewBox", PATH_VIEWBOX);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("class", `link-path-overlay ${effect.pathClass}`);
  svg.replaceChildren();
  const motionPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const motionPathId = `link-motion-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  motionPath.setAttribute("id", motionPathId);
  motionPath.setAttribute("d", pathData);
  motionPath.classList.add("link-path-overlay__motion-path");
  const glow = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  glow.setAttribute("points", serializedPoints);
  glow.setAttribute("pathLength", "1");
  glow.classList.add("link-path-overlay__glow");
  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", serializedPoints);
  polyline.setAttribute("pathLength", "1");
  polyline.classList.add("link-path-overlay__beam");
  svg.append(motionPath, glow, polyline);
  appendLinkPathDecoration(svg, effect.pathId, motionPathId, renderedPoints.at(-1));
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

function createElectricPoints(points, intensity = 1) {
  return points.flatMap((point, index) => {
    if (index === points.length - 1) return [point];
    const next = points[index + 1];
    const horizontal = Math.abs(next.x - point.x) >= Math.abs(next.y - point.y);
    const distance = horizontal ? Math.abs(next.x - point.x) : Math.abs(next.y - point.y);
    const steps = Math.max(2, Math.round(distance / ELECTRIC_SEGMENT_LENGTH_PERCENT));
    const segmentPoints = index === 0 ? [point] : [];
    for (let step = 1; step < steps; step += 1) {
      const progress = step / steps;
      const jitter = (Math.random() * 2 - 1) * ELECTRIC_JITTER_PERCENT * intensity;
      segmentPoints.push(horizontal
        ? { x: interpolate(point.x, next.x, progress), y: point.y + jitter }
        : { x: point.x + jitter, y: interpolate(point.y, next.y, progress) });
    }
    segmentPoints.push(next);
    return segmentPoints;
  });
}

function appendLinkPathDecoration(svg, pathId, motionPathId, destination) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  if (pathId === "magic") {
    appendMovingPathNode(svg, motionPathId, "link-path-overlay__spark", 3, .14);
  } else if (pathId === "fire") {
    appendMovingPathNode(svg, motionPathId, "link-path-overlay__ember", 2, .18);
  } else if (pathId === "cyber") {
    appendMovingPathNode(svg, motionPathId, "link-path-overlay__packet", 3, .16);
  } else if (pathId === "sonic") {
    appendMovingPathNode(svg, motionPathId, "link-path-overlay__pulse", 2, .24);
  } else if (pathId === "matrix") {
    appendMovingPathNode(svg, motionPathId, "link-path-overlay__arrow", 3, .16, "polygon");
  } else if (pathId === "bullet" || pathId === "meteor") {
    appendMovingPathNode(svg, motionPathId, "link-path-overlay__firework", 3, .12);
    if (destination && pathId === "meteor") appendFireworkBurst(svg, destination);
  }
}

function appendMovingPathNode(svg, motionPathId, className, count, delay, tagName = "circle") {
  for (let index = 0; index < count; index += 1) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tagName);
    node.classList.add(className);
    if (tagName === "polygon") node.setAttribute("points", "-1.8,-1.35 2.2,0 -1.8,1.35 -.55,0");
    else node.setAttribute("r", "1.15");
    const motion = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
    motion.setAttribute("dur", "620ms");
    motion.setAttribute("begin", `${index * delay}s`);
    motion.setAttribute("repeatCount", "indefinite");
    motion.setAttribute("rotate", tagName === "polygon" ? "auto" : "0");
    const pathRef = document.createElementNS("http://www.w3.org/2000/svg", "mpath");
    pathRef.setAttribute("href", `#${motionPathId}`);
    motion.append(pathRef);
    node.append(motion);
    svg.append(node);
  }
}

function appendFireworkBurst(svg, destination) {
  const burst = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  burst.setAttribute("cx", destination.x);
  burst.setAttribute("cy", destination.y);
  burst.setAttribute("r", "2.2");
  burst.classList.add("link-path-overlay__firework-burst");
  svg.append(burst);
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
