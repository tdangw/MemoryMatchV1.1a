import { shellTimeout as setTimeout } from "./gameShell/gameShellLifecycle.js";
import { shuffleArray } from "./utils.js";
import { GAME_CONFIG, getLuckyReward, isChallengeMode } from "./config.js";
import { gameState, setLuckyRewards } from "./gameState.js";
import { getCardBackClass } from "./appearance.js";
import { initLogic } from "./logic.js";
import { getEquippedThemeId } from "./appearance.js";
import { getThemeCards } from "./themeCatalog.js";
import { connectGameShellLayout, getCompactLandscapeColumns } from "./gameShell/gameShellLayout.js";
import { getMemoryShell } from "./memoryMatch/memoryShell.js";

// Only coordinate labels need a game-specific presentation override.
const MEMORY_SHELL_UI = { layout: {
  coordinateGutter: 10,
} };
let activeLayout = null;
let memoryLayout = null;
let renderedCoordinateShape = "";
function updateCoordinateLabels(columns, rows, visible) {
  const columnLabels = document.getElementById("grid-coordinate-columns");
  const rowLabels = document.getElementById("grid-coordinate-rows");
  if (!columnLabels || !rowLabels) return;

  const nextShape = visible ? `${columns}x${rows}` : "";
  if (nextShape === renderedCoordinateShape) return;
  renderedCoordinateShape = nextShape;

  if (!visible) {
    columnLabels.replaceChildren();
    rowLabels.replaceChildren();
    return;
  }

  columnLabels.replaceChildren(
    ...Array.from({ length: columns }, (_, index) => {
      const label = document.createElement("span");
      label.textContent = String.fromCharCode(65 + index);
      return label;
    }),
  );
  rowLabels.replaceChildren(
    ...Array.from({ length: rows }, (_, index) => {
      const label = document.createElement("span");
      label.textContent = String(index);
      return label;
    }),
  );
}

function mountMemoryLayout() {
  const { root, frame, board, title, progress, hud, milestones } = getMemoryShell().refs;
  const chrome = [title, progress, hud, milestones];
  let shape;
  memoryLayout = connectGameShellLayout({
    root, frame, board, chrome, ui: MEMORY_SHELL_UI,
    getShape: (viewport, config) => {
      if (!activeLayout) return null;
      const landscape = viewport.width > viewport.height;
      const columns = landscape
        ? getCompactLandscapeColumns({
          tileCount: activeLayout.tileCount,
          columns: activeLayout.columns,
          maxRows: config.layout.compactLandscapeMaxRows,
        })
        : viewport.width <= config.breakpoints.mobile ? activeLayout.mobileColumns : activeLayout.columns;
      shape = { columns, rows: Math.ceil(activeLayout.tileCount / columns), coordinates: Boolean(gameState.settings.boardCoordinates) };
      return shape;
    },
    apply: ({ tileSize, boardWidth, boardHeight, gap, padding }) => {
      const gutter = shape.coordinates ? MEMORY_SHELL_UI.layout.coordinateGutter : 0;
      for (const [name, value] of [
        ["--grid-columns", shape.columns], ["--grid-rows", shape.rows],
        ["--grid-gap", `${gap}px`], ["--grid-padding", `${padding}px`], ["--tile-size", `${tileSize}px`],
      ]) {
        board.style.setProperty(name, value);
        frame.style.setProperty(name, value);
      }
      frame.style.visibility = tileSize > 0 ? "" : "hidden";
      for (const element of chrome.slice(1)) element.style.setProperty("--board-width", `${boardWidth + gutter}px`);
      frame.style.setProperty("--coordinate-gutter", `${gutter}px`);
      frame.classList.toggle("is-coordinate-visible", shape.coordinates);
      updateCoordinateLabels(shape.columns, shape.rows, shape.coordinates);
    },
  });
}

export function stopGridLayout() {
  memoryLayout?.destroy();
  memoryLayout = null;
  activeLayout = null;
}

export function setBoardCoordinatesVisible(visible) {
  gameState.settings.boardCoordinates = Boolean(visible);
  memoryLayout?.schedule();
}
/**
 * Tạo lưới theo chế độ; level chỉ quyết định tiến trình và phần thưởng.
 * Mỗi lần tạo màn sẽ chọn ngẫu nhiên ảnh từ kho chung của chủ đề.
 */
export function createGrid(
  { tileCount, columns, mobileColumns },
  { roundId, onPreviewComplete, previewDurationMs = GAME_CONFIG.previewDurationMs, assetPaths, history } = {},
) {
  const totalTiles = tileCount;
  const numberOfPairs = Math.floor(totalTiles / 2);

  const selectedCards = getThemeCards(getEquippedThemeId(gameState.appearance), numberOfPairs, { assetPaths, history });
  if (selectedCards.length !== numberOfPairs) throw new Error("Chủ đề không có đủ ảnh cho bàn Memory Match.");
  let cards = [];
  selectedCards.forEach((card) => {
    cards.push(card, card);
  });

  if (isChallengeMode(gameState.settings.mode)) {
    const maximum = Math.min(
      GAME_CONFIG.specialModes.luckyTileCount.maximum,
      selectedCards.length,
    );
    const minimum = Math.min(GAME_CONFIG.specialModes.luckyTileCount.minimum, maximum);
    const luckyCount = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
    const luckyCards = shuffleArray([...selectedCards]).slice(0, luckyCount);
    setLuckyRewards(luckyCards.map((card) => [card.id, getLuckyReward()]));
  } else {
    setLuckyRewards([]);
  }

  shuffleArray(cards);

  // Chuẩn bị DOM
  const gridContainer = document.getElementById("grid-container");
  if (!gridContainer) return null;

  activeLayout = { tileCount, columns, mobileColumns };
  gridContainer.classList.add("is-locked");
  gameState.isLocked = true;
  mountMemoryLayout();

  const tiles = document.createDocumentFragment();
  cards.forEach((cardData, idx) => {
    const tileId = `tile-${idx}`;

    const tile = document.createElement("div");
    tile.classList.add("tile");
    tile.classList.add(getCardBackClass(gameState.appearance.cardBack));
    tile.id = tileId;

    const img = document.createElement("img");
    img.src = cardData.src;
    img.alt = cardData.alt;
    img.decoding = "async";
    img.draggable = false;
    img.classList.add("hidden");

    tile.dataset.imageId = cardData.id;
    tile.dataset.special = String(cardData.special === true);
    tile.appendChild(img);
    tiles.appendChild(tile);
  });
  gridContainer.querySelectorAll("img").forEach(image => image.removeAttribute("src"));
  gridContainer.replaceChildren(tiles);

  // ✅ Preview ảnh trước khi bắt đầu
  setTimeout(() => {
    if (gameState.roundId === roundId)
      revealAndHideTiles(roundId, onPreviewComplete, previewDurationMs);
  }, 0);
  return selectedCards;
}

/**
 * Hiển thị tất cả ảnh trong 5s rồi ẩn lại nếu chưa matched
 */
function revealAndHideTiles(roundId, onPreviewComplete, previewDurationMs) {
  if (gameState.roundId !== roundId) return;

  const allImgs = document.querySelectorAll(".tile img");
  allImgs.forEach((img) => img.classList.remove("hidden"));

  setTimeout(() => {
    if (gameState.roundId !== roundId) return;

    allImgs.forEach((img) => {
      const parent = img.parentElement;
      if (!parent.classList.contains("matched")) {
        img.classList.add("hidden");
      }
    });

    gameState.isLocked = false;
    document.getElementById("grid-container")?.classList.remove("is-locked");
    initLogic();
    onPreviewComplete?.(roundId);
  }, previewDurationMs);
}
