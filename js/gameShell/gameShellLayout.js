import { GAME_SHELL_DEFAULTS, normalizeGameShellConfig } from "./gameShellConfig.js";

/** Fit the board border-box. Coordinates are reserved outside this box by the caller. */
export function calculateBoardLayout({ width, height, columns, rows, gap, padding, borderX = 0, borderY = 0, maxTileSize = GAME_SHELL_DEFAULTS.layout.maxTileSize, precision = GAME_SHELL_DEFAULTS.layout.tilePrecision }) {
  if (![width, height, gap, padding, borderX, borderY, maxTileSize, precision].every(Number.isFinite)
    || ![columns, rows].every(value => Number.isInteger(value) && value > 0)
    || Math.min(gap, padding, borderX, borderY) < 0 || maxTileSize <= 0 || !Number.isInteger(precision) || precision < 1) return null;
  if (width <= borderX || height <= borderY) return { tileSize: 0, boardWidth: 0, boardHeight: 0, gap: 0, padding: 0 };
  // Never force a minimum tile size beyond the viewport. On extremely small surfaces,
  // spacing gives way before the tiles; gameplay remains the renderer's responsibility.
  const fittedPadding = Math.min(padding, (width - borderX) / 2, (height - borderY) / 2);
  const innerWidth = width - borderX - fittedPadding * 2;
  const innerHeight = height - borderY - fittedPadding * 2;
  const fittedGap = Math.max(0, Math.min(gap,
    columns > 1 ? innerWidth / (columns - 1) : gap,
    rows > 1 ? innerHeight / (rows - 1) : gap));
  const tileSize = Math.max(0, Math.floor(Math.min(maxTileSize,
    (innerWidth - fittedGap * (columns - 1)) / columns,
    (innerHeight - fittedGap * (rows - 1)) / rows) * precision) / precision);
  return {
    tileSize,
    boardWidth: tileSize * columns + fittedGap * (columns - 1) + fittedPadding * 2 + borderX,
    boardHeight: tileSize * rows + fittedGap * (rows - 1) + fittedPadding * 2 + borderY,
    gap: fittedGap, padding: fittedPadding,
  };
}

/** Choose a full, landscape-friendly grid without exceeding the configured row budget. */
export function getCompactLandscapeColumns({ tileCount, columns, maxRows }) {
  if (![tileCount, columns, maxRows].every(Number.isInteger)
    || Math.min(tileCount, columns, maxRows) < 1) return null;
  const minimum = Math.max(columns, Math.ceil(Math.sqrt(tileCount)), Math.ceil(tileCount / maxRows));
  for (let candidate = minimum; candidate <= tileCount; candidate += 1) {
    if (tileCount % candidate === 0) return candidate;
  }
  return tileCount;
}

let activeConnection = null;
const diagnostics = { passes: 0, writes: 0, mounts: 0, maxPassesPerFrame: 0 };
let previousFrame = -1;
let passesInFrame = 0;
const debug = import.meta.env?.DEV ?? false;
const px = value => Number.parseFloat(value) || 0;

export function getGameShellLayoutDiagnostics() {
  return { ...diagnostics, active: activeConnection ? 1 : 0, observers: 0, listeners: 0, pendingFrames: 0, ...activeConnection?.resources() };
}

/** One live shell, one observer, one queued frame. No game IDs or gameplay imports. */
export function connectGameShellLayout({ root, frame, board, chrome, getShape, apply, ui = {}, onMeasure = () => {}, onCompactLandscapeChange = () => {} }) {
  const config = normalizeGameShellConfig(ui);
  activeConnection?.destroy();
  diagnostics.maxPassesPerFrame = 0;
  previousFrame = -1;
  passesInFrame = 0;
  let alive = true;
  let pending = null;
  let lastMeasurementTimestamp = null;
  let signature = "";
  let assetPasses = 0;
  let assetPending = false;
  let landscape = null;
  const viewport = window.visualViewport;
  const listeners = [];
  const listen = (target, type, callback, options) => {
    if (!target) return;
    target.addEventListener(type, callback, options);
    listeners.push(() => target.removeEventListener(type, callback, options));
  };

  function schedule() {
    if (!alive || document.hidden || pending !== null) return;
    pending = requestAnimationFrame(measureAndApply);
  }

  function measureAndApply(timestamp) {
    pending = null;
    if (!alive || document.hidden || !root.isConnected || root.hidden || root.style.display === "none") return;
    if (lastMeasurementTimestamp === timestamp) {
      // A ResizeObserver callback can arrive in the same visual frame as the first
      // layout write. Defer it so every pass measures stable post-CSS geometry.
      schedule();
      return;
    }
    lastMeasurementTimestamp = timestamp;
    if (assetPending) { assetPasses += 1; assetPending = false; }
    const visible = {
      width: viewport?.width ?? window.innerWidth,
      height: viewport?.height ?? window.innerHeight,
      left: viewport?.offsetLeft ?? 0, top: viewport?.offsetTop ?? 0,
    };
    const shape = getShape(visible, config);
    if (!shape) return;
    const nextLandscape = visible.width > visible.height;
    const compactLandscape = nextLandscape
      && visible.height <= config.breakpoints.landscapeHeight;
    const compactLandscapeChanged = root.classList.contains("shell-compact-landscape") !== compactLandscape;
    const landscapeChanged = landscape !== nextLandscape;
    landscape = nextLandscape;
    root.classList.toggle("shell-compact-landscape", compactLandscape);
    if (compactLandscapeChanged || landscapeChanged) {
      // CSS hides chrome and changes HUD width; measure its settled geometry next frame.
      onCompactLandscapeChange({ compact: compactLandscape, landscape: nextLandscape, config, viewport: visible });
      schedule();
      return;
    }
    // All layout reads are in this block. apply() is a write-only board adapter.
    const rootRect = root.getBoundingClientRect();
    const boardTop = frame.getBoundingClientRect().top + root.scrollTop;
    const chromeRects = chrome.map(element => element.getBoundingClientRect());
    const rootStyle = getComputedStyle(root);
    const boardStyle = getComputedStyle(board);
    const rootPaddingX = px(rootStyle.paddingLeft) + px(rootStyle.paddingRight);
    const center = rootRect.left + px(rootStyle.paddingLeft) + (rootRect.width - rootPaddingX) / 2;
    const centeredWidth = 2 * Math.max(0, Math.min(
      center - visible.left - px(rootStyle.getPropertyValue("--shell-viewport-safe-left")),
      visible.left + visible.width - px(rootStyle.getPropertyValue("--shell-viewport-safe-right")) - center));
    const mobile = visible.width <= config.breakpoints.mobile;
    const narrow = visible.width <= config.breakpoints.narrow;
    const edgeInset = Math.min(config.layout.edgeInsetMax, Math.max(config.layout.edgeInsetMin, visible.width * config.layout.edgeInsetRatio));
    const gutter = shape.coordinates ? config.layout.coordinateGutter : 0;
    const width = Math.min(config.layout.contentMaxWidth, centeredWidth, rootRect.width - rootPaddingX,
      visible.width * (mobile ? config.layout.mobileWidthRatio : config.layout.widthRatio)
        - 2 * (mobile ? config.layout.mobileSideInset : config.layout.sideInset)) - edgeInset * 2 - gutter;
    const dock = root.querySelector(".adventure-dock--playing");
    const bottom = dock ? Math.min(visible.top + visible.height, dock.getBoundingClientRect().top) : visible.top + visible.height;
    const height = bottom - boardTop - config.layout.bottomInset
      - px(rootStyle.getPropertyValue("--shell-viewport-safe-bottom")) - gutter;
    const scrollHeight = Math.max(height, (shape.minimumTileSize || 0) * shape.rows);
    const result = calculateBoardLayout({ width, height: scrollHeight, columns: shape.columns, rows: shape.rows,
      gap: narrow ? config.board.narrowGap : config.board.gap,
      padding: narrow ? config.board.narrowPadding : config.board.padding,
      borderX: px(boardStyle.borderLeftWidth) + px(boardStyle.borderRightWidth),
      borderY: px(boardStyle.borderTopWidth) + px(boardStyle.borderBottomWidth),
      maxTileSize: config.layout.maxTileSize, precision: config.layout.tilePrecision,
    });
    if (debug) {
      diagnostics.passes += 1;
      passesInFrame = timestamp === previousFrame ? passesInFrame + 1 : 1;
      previousFrame = timestamp;
      diagnostics.maxPassesPerFrame = Math.max(diagnostics.maxPassesPerFrame, passesInFrame);
    }
    onMeasure({ boardTop, chromeRects });
    if (!result) return;
    const nextSignature = [shape.columns, shape.rows, gutter, ...Object.values(result)].join(":");
    if (nextSignature === signature) return;
    signature = nextSignature;
    apply(result);
    root.classList.toggle("shell-scroll-playing", scrollHeight > height);
    if (debug) diagnostics.writes += 1;
  }

  const observer = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
  observer?.observe(root);
  listen(window, "resize", schedule);
  listen(viewport, "resize", schedule);
  listen(viewport, "scroll", schedule);
  listen(document, "visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(pending); pending = null; }
    else schedule();
  });
  // Fixed-size images normally do not alter layout. Limit asset-driven retries to two
  // frames; observer/viewport events remain available for real geometry changes.
  listen(board, "load", () => {
    if (assetPasses >= 2) return;
    assetPending = true;
    schedule();
  }, true);
  document.fonts?.ready.then(() => { if (alive) schedule(); });
  const connection = {
    get active() { return alive; },
    schedule,
    resources: () => ({ observers: observer ? 1 : 0, listeners: listeners.length, pendingFrames: pending === null ? 0 : 1 }),
    destroy() {
      if (!alive) return;
      alive = false;
      cancelAnimationFrame(pending);
      pending = null;
      observer?.disconnect();
      root.classList.remove("shell-scroll-playing");
      listeners.forEach(remove => remove());
      if (activeConnection === connection) activeConnection = null;
    },
  };
  activeConnection = connection;
  if (debug) diagnostics.mounts += 1;
  schedule();
  return connection;
}
