import { getTheme } from "../themeCatalog.js";
import { connectGameShellLayout } from "../gameShell/gameShellLayout.js";

const LEGACY_GRID_UNITS = 100;
const TRAY_LOGICAL_ROWS = 3;

export function createTripleRenderer(shell) {
  const root = shell.refs.root;
  const board = root.querySelector(".triple-connect__board");
  const tray = root.querySelector(".triple-connect__tray");
  const nodes = new Map();
  const traySlots = Array.from({ length: 7 }, (_, index) => {
    const slot = document.createElement("div");
    slot.className = "triple-connect__tray-slot";
    slot.dataset.tripleTraySlot = String(index);
    tray.append(slot);
    return slot;
  });
  let layoutConnection = null;
  let activeLayout = null;

  function render(state, layout, themeId = "default") {
    activeLayout = layout;
    const geometry = getLayoutGeometry(layout);
    const slots = new Map(layout.slots.map((slot) => [slot.id, slot]));
    const live = new Set();
    for (const tile of Object.values(state.tiles)) {
      if (tile.location === "removed") continue;
      live.add(tile.id);
      let node = nodes.get(tile.id);
      if (!node) {
        node = document.createElement("button");
        node.type = "button";
        node.className = "triple-connect__tile";
        node.dataset.tileId = tile.id;
        const image = document.createElement("img");
        image.alt = "";
        image.draggable = false;
        node.append(image);
        nodes.set(tile.id, node);
      }
      const image = node.querySelector("img");
      if (image && image.dataset.themeId !== themeId) {
        image.dataset.themeId = themeId;
        setTileImageSource(image, tile.type, themeId);
      }
      const exposed =
        tile.location === "board" &&
        state.coverGraph[tile.id].every(
          (id) => state.tiles[id].location !== "board",
        );
      node.disabled = !exposed;
      node.setAttribute("aria-disabled", String(!exposed));
      node.classList.toggle("is-lucky", Boolean(tile.lucky));
      node.setAttribute("aria-label", tile.lucky ? "Thẻ may mắn" : "Thẻ");
      node.classList.toggle(
        "is-occluded",
        tile.location === "board" && !exposed,
      );
      if (tile.location === "tray") {
        const trayIndex = state.tray.indexOf(tile.id);
        const traySlot = traySlots[trayIndex];
        if (!traySlot) throw new Error("Triple tile is missing a tray slot.");
        traySlot.append(node);
      }
      else {
        const slot = slots.get(tile.slotId);
        if (!slot)
          throw new Error(`Missing Triple layout slot: ${tile.slotId}`);
        node.style.setProperty("--x", String(geometry.x(slot.x)));
        node.style.setProperty("--y", String(geometry.y(slot.y)));
        node.style.setProperty("--tile-width", String(geometry.tileWidth));
        node.style.setProperty("--tile-height", String(geometry.tileHeight));
        node.style.zIndex = String(tile.layer + 1);
        board.append(node);
      }
    }
    for (const [id, node] of nodes)
      if (!live.has(id)) {
        node.remove();
        nodes.delete(id);
      }
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
      getShape: () => {
        const geometry = getLayoutGeometry(activeLayout);
        return {
          columns: geometry.gridWidth,
          rows: geometry.gridHeight + TRAY_LOGICAL_ROWS,
          coordinates: false,
        };
      },
      apply: ({ tileSize, boardHeight }) => {
        const geometry = getLayoutGeometry(activeLayout);
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

function getTileImageSource(type, themeId) {
  const theme = getTheme(themeId);
  const asset =
    theme.kind === "image"
      ? theme.assets[
          Math.max(0, Number(type.match(/\d+$/)?.[0] || 1) - 1) %
            theme.assets.length
        ]
      : null;
  return asset
    ? `${import.meta.env.BASE_URL}assets/images/themes/${theme.assetFolder}/${asset.path}`
    : createTileFallback(type);
}
function setTileImageSource(image, type, themeId) {
  image.onerror = () => {
    image.onerror = null;
    image.src = createTileFallback(type);
  };
  image.src = getTileImageSource(type, themeId);
}
function createTileFallback(type) {
  const label = String(type).match(/\d+$/)?.[0] || "?";
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="18" fill="#16395f"/><text x="50" y="62" text-anchor="middle" fill="#eff8ff" font-family="sans-serif" font-size="48" font-weight="700">${label}</text></svg>`)}`;
}
