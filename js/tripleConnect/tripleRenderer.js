import { getTheme } from "../themeCatalog.js";
import { connectGameShellLayout } from "../gameShell/gameShellLayout.js";
import { TRIPLE_PRODUCT_DECISIONS } from "./tripleConfig.js";
import { createTripleBoardViewFromTrustedState } from "./tripleState.js";

const LEGACY_GRID_UNITS = 100;
const TRAY_LOGICAL_ROWS = 3;
const TRAY_VISIBLE_SLOT_COUNT = TRIPLE_PRODUCT_DECISIONS.trayExpansion.baseCapacity
  + TRIPLE_PRODUCT_DECISIONS.trayExpansion.bonusCapacity;
const layoutTopologyCache = new WeakMap();

export function createTripleRenderer(shell, { onLockedTraySlotClick } = {}) {
  const root = shell.refs.root;
  const board = root.querySelector(".triple-connect__board");
  const tray = root.querySelector(".triple-connect__tray");
  const nodes = new Map();
  const traySlots = [];
  const trayUnlockButtons = new WeakMap();
  const createTraySlot = (index) => {
    const slot = document.createElement("div");
    slot.className = "triple-connect__tray-slot";
    slot.dataset.tripleTraySlot = String(index);
    const unlockButton = document.createElement("button");
    unlockButton.type = "button";
    unlockButton.className = "triple-connect__tray-unlock";
    unlockButton.dataset.tripleTrayUnlock = "true";
    unlockButton.hidden = true;
    unlockButton.onclick = () => onLockedTraySlotClick?.();
    slot.append(unlockButton);
    trayUnlockButtons.set(slot, unlockButton);
    tray.append(slot);
    return slot;
  };
  const reconcileTraySlots = (activeCapacity) => {
    while (traySlots.length < TRAY_VISIBLE_SLOT_COUNT)
      traySlots.push(createTraySlot(traySlots.length));
    while (traySlots.length > TRAY_VISIBLE_SLOT_COUNT) traySlots.pop().remove();
    traySlots.forEach((slot, index) => {
      const locked = index >= activeCapacity;
      const unlockButton = trayUnlockButtons.get(slot);
      slot.classList.toggle("is-locked", locked);
      if (locked) {
        slot.dataset.tripleTrayLocked = "true";
        slot.title = "Ô khay chưa mở khóa";
        unlockButton.hidden = false;
        unlockButton.setAttribute(
          "aria-label",
          `Mở thêm 1 ô khay với ${TRIPLE_PRODUCT_DECISIONS.trayExpansion.releasePrice} Xu`,
        );
      } else {
        delete slot.dataset.tripleTrayLocked;
        slot.removeAttribute("title");
        unlockButton.hidden = true;
        unlockButton.removeAttribute("aria-label");
      }
    });
  };
  let layoutConnection = null;
  let activeLayout = null;
  const coverDepthCache = new WeakMap();

  function render(state, layout, themeId = "default", startup) {
    tray.dataset.tripleTrayCapacity = String(state.trayCapacity);
    const lockedCount = TRAY_VISIBLE_SLOT_COUNT - state.trayCapacity;
    tray.setAttribute(
      "aria-label",
      lockedCount > 0
        ? `Khay ${TRAY_VISIBLE_SLOT_COUNT} ô, ${lockedCount} ô đang khóa`
        : `Khay ${TRAY_VISIBLE_SLOT_COUNT} ô`,
    );
    reconcileTraySlots(state.trayCapacity);
    activeLayout = layout;
    const { geometry, slots } = getLayoutTopology(layout);
    const coverDepths = getCoverDepths(state, coverDepthCache);
    const boardView = createTripleBoardViewFromTrustedState(state);
    const live = new Set();
    const syncTile = tile => {
      if (!boardView.visibleTileIds.has(tile.id)) return;
      live.add(tile.id);
      let node = nodes.get(tile.id);
      if (!node) {
        node = document.createElement("button");
        node.type = "button";
        node.className = "triple-connect__tile";
        node.dataset.tileId = tile.id;
        const image = document.createElement("img");
        image.decoding = "async";
        image.alt = "";
        image.draggable = false;
        node.append(image);
        if (tile.location === "board" && boardView.remainingDepthByPileId.get(boardView.pileByTileId.get(tile.id)) > 1)
          node.classList.add("is-corner-stack-revealed");
        nodes.set(tile.id, node);
      }
      const image = node.firstElementChild;
      const assetPath = state.assetPathsByType?.[tile.type] || "";
      const imageKey = `${themeId}:${assetPath}`;
      if (image && image.dataset.themeId !== imageKey) {
        image.dataset.themeId = imageKey;
        setTileImageSource(image, tile.type, themeId, assetPath);
      }
      const coverDepth = tile.location === "board" ? coverDepths.get(tile.id) || 0 : 0;
      const exposed = tile.location === "board" && boardView.exposedTileIds.has(tile.id);
      const disabled = !exposed;
      if (node.disabled !== disabled) node.disabled = disabled;
      const ariaDisabled = String(disabled);
      if (node.getAttribute("aria-disabled") !== ariaDisabled)
        node.setAttribute("aria-disabled", ariaDisabled);
      const lucky = Boolean(tile.lucky);
      if (node.classList.contains("is-lucky") !== lucky)
        node.classList.toggle("is-lucky", lucky);
      const label = lucky ? "Thẻ may mắn" : "Thẻ";
      if (node.getAttribute("aria-label") !== label)
        node.setAttribute("aria-label", label);
      const occluded = tile.location === "board" && !exposed;
      if (node.classList.contains("is-occluded") !== occluded)
        node.classList.toggle("is-occluded", occluded);
      if (node.classList.contains("is-exposed") !== exposed)
        node.classList.toggle("is-exposed", exposed);
      node.dataset.tripleCoverDepth = String(Math.min(4, coverDepth));
      const pileId = boardView.pileByTileId.get(tile.id);
      const pileDepth = tile.location === "board" && pileId
        ? boardView.remainingDepthByPileId.get(pileId)
        : 1;
      node.classList.toggle("is-corner-stack", pileDepth > 1);
      if (tile.location === "tray") {
        const trayIndex = state.tray.indexOf(tile.id);
        const traySlot = traySlots[trayIndex];
        if (!traySlot) throw new Error("Triple tile is missing a tray slot.");
        if (node.parentElement !== traySlot) traySlot.append(node);
      }
      else {
        const slot = slots.get(tile.slotId) || getCornerStackSlot(tile.slotId, layout, geometry);
        if (!slot)
          throw new Error(`Missing Triple layout slot: ${tile.slotId}`);
        const geometryKey = `${layout.id}:${tile.slotId}`;
        if (node.dataset.tripleGeometry !== geometryKey) {
          node.dataset.tripleGeometry = geometryKey;
          node.style.setProperty("--x", String(geometry.x(slot.x)));
          node.style.setProperty("--y", String(geometry.y(slot.y)));
          node.style.setProperty("--tile-width", String(geometry.tileWidth));
          node.style.setProperty("--tile-height", String(geometry.tileHeight));
          node.style.zIndex = String(tile.layer + 1);
        }
        if (node.parentElement !== board) board.append(node);
      }
    };
    const commit = () => {
    if (startup) startup.check();
    for (const [id, node] of nodes)
      if (!live.has(id)) {
        node.remove();
        nodes.delete(id);
      }
    };
    if (startup) return startup.batch(Object.values(state.tiles), syncTile).then(commit);
    Object.values(state.tiles).forEach(syncTile);
    return commit();
  }

  function mountLayout(scope, layout) {
    activeLayout = layout;
    layoutConnection?.destroy();
    const {
      root: shellRoot,
      frame,
      board: surface,
      title,
      progress,
      hud,
      milestones,
    } = shell.refs;
    layoutConnection = connectGameShellLayout({
      root: shellRoot,
      frame,
      board: surface,
      chrome: [title, progress, hud, milestones],
      // Triple positions cards absolutely in half-card coordinates; it does
      // not consume the shared grid gap or padding that CSS-grid boards use.
      ui: {
        board: { gap: 0, narrowGap: 0, padding: 0, narrowPadding: 0 },
      },
      getShape: (visible) => {
        const geometry = getLayoutGeometry(activeLayout);
        return {
          columns: geometry.gridWidth,
          // The portrait tray and divider are fixed-height chrome, not board
          // cells. Reserve two additional logical rows so the measured board
          // plus tray fits the viewport instead of overflowing at the bottom.
          rows: geometry.gridHeight + TRAY_LOGICAL_ROWS
            + (visible.height >= visible.width ? 2 : 1),
          coordinates: false,
        };
      },
      apply: ({ tileSize, boardHeight }) => {
        const geometry = getLayoutGeometry(activeLayout);
        if (geometry.gridHeight >= 20)
          shellRoot.dataset.tripleLayoutDensity = "tall";
        else delete shellRoot.dataset.tripleLayoutDensity;
        surface.style.width = "100%";
        surface.style.height = `${boardHeight}px`;
        board.style.width = "100%";
        board.style.height = `${geometry.gridHeight * tileSize}px`;
        shellRoot.style.setProperty("--triple-layout-scale", `${tileSize}px`);
        shellRoot.style.setProperty(
          "--triple-layout-width",
          `${geometry.gridWidth * tileSize}px`,
        );
        frame.style.width = "100%";
        frame.style.visibility = tileSize > 0 ? "" : "hidden";
      },
    });
    const connection = layoutConnection;
    scope.own(() => {
      if (layoutConnection !== connection) return;
      connection.destroy();
      layoutConnection = null;
    }, "triple-board-layout");
  }
  return { render, mountLayout, nodes, traySlots };
}

function getCornerStackSlot(slotId, layout, geometry) {
  const corner = String(slotId).replace("corner-stack-", "");
  if (!/[a-z-]+/.test(corner)) return null;
  const configuredAnchor = layout.cornerStackAnchors?.[corner];
  if (configuredAnchor) return { ...configuredAnchor, layer: 0 };
  return null;
}

function getCoverDepths(state, cache) {
  const cached = cache?.get(state);
  if (cached) return cached;
  const depths = new Map();
  const visiting = new Set();
  const visit = (tileId) => {
    if (depths.has(tileId)) return depths.get(tileId);
    if (visiting.has(tileId)) return 0;
    visiting.add(tileId);
    const blockers = state.coverGraph[tileId]
      .filter((blockerId) => state.tiles[blockerId].location === "board");
    const depth = blockers.length ? 1 + Math.max(...blockers.map(visit)) : 0;
    visiting.delete(tileId);
    depths.set(tileId, depth);
    return depth;
  };
  Object.keys(state.tiles).forEach(visit);
  cache?.set(state, depths);
  return depths;
}

function getLayoutGeometry(layout) {
  if (layout?.coordinateUnit === "half-card")
    return {
      gridWidth: layout.gridWidth,
      gridHeight: layout.gridHeight,
      tileWidth: layout.tileWidth,
      tileHeight: layout.tileHeight,
      x: (value) => value,
      y: (value) => value,
    };
  if (!layout) throw new TypeError("Triple renderer requires a layout.");
  return {
    gridWidth: LEGACY_GRID_UNITS,
    gridHeight: LEGACY_GRID_UNITS,
    tileWidth: layout.tileWidth * LEGACY_GRID_UNITS,
    tileHeight: layout.tileHeight * LEGACY_GRID_UNITS,
    x: (value) => value * LEGACY_GRID_UNITS,
    y: (value) => value * LEGACY_GRID_UNITS,
  };
}

function getLayoutTopology(layout) {
  const cached = layoutTopologyCache.get(layout);
  if (cached) return cached;
  const topology = Object.freeze({
    geometry: getLayoutGeometry(layout),
    slots: new Map(layout.slots.map((slot) => [slot.id, slot])),
  });
  layoutTopologyCache.set(layout, topology);
  return topology;
}

function getTileImageSource(type, themeId, assetPath = "") {
  const theme = getTheme(themeId);
  const asset =
    theme.kind === "image"
      ? assetPath
        ? theme.assets.find((candidate) => candidate.path === assetPath)
        : theme.assets[Math.max(0, Number(type.match(/\d+$/)?.[0] || 1) - 1) % theme.assets.length]
      : null;
  return asset
    ? `${import.meta.env.BASE_URL}assets/images/themes/${theme.assetFolder}/${asset.path}`
    : createTileFallback(type);
}
function setTileImageSource(image, type, themeId, assetPath) {
  image.onerror = () => {
    image.onerror = null;
    image.src = createTileFallback(type);
  };
  image.src = getTileImageSource(type, themeId, assetPath);
}
function createTileFallback(type) {
  const label = String(type).match(/\d+$/)?.[0] || "?";
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="18" fill="#16395f"/><text x="50" y="62" text-anchor="middle" fill="#eff8ff" font-family="sans-serif" font-size="48" font-weight="700">${label}</text></svg>`)}`;
}
