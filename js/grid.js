import { shuffleArray } from "./utils.js";
import { GAME_CONFIG, getLuckyReward, isChallengeMode } from "./config.js";
import { gameState, setLuckyRewards } from "./gameState.js";
import { getCardBackClass } from "./appearance.js";
import { initLogic } from "./logic.js";
import { getEquippedThemeId } from "./appearance.js";
import { getThemeCards } from "./themeCatalog.js";

const MOBILE_BREAKPOINT = 600;
const MAX_TILE_SIZE = 180;
const MIN_TILE_SIZE = 36;
const COORDINATE_GUTTER_PX = 10;
let activeLayout = null;
let resizeFrame = null;
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

function updateGridLayout() {
  if (!activeLayout) return;

  const gridContainer = document.getElementById("grid-container");
  if (!gridContainer) return;

  const isPortraitMobile = window.innerWidth <= MOBILE_BREAKPOINT;
  const isCompactViewport = isPortraitMobile || window.innerHeight <= 500;
  const columns = isPortraitMobile
    ? activeLayout.mobileColumns
    : activeLayout.columns;
  const rows = Math.ceil(activeLayout.tileCount / columns);
  const showCoordinates = Boolean(gameState.settings.boardCoordinates);
  const gap = isCompactViewport ? 1 : 3;
  const padding = isCompactViewport ? 2 : 6;
  const headerBottom =
    document.getElementById("game-title")?.getBoundingClientRect().bottom || 0;
  const availableWidth = Math.max(
    240,
    (isCompactViewport ? window.innerWidth - 20 : window.innerWidth * 0.9)
      - (showCoordinates ? COORDINATE_GUTTER_PX : 0),
  );
  const availableHeight = Math.max(
    180,
    window.innerHeight - headerBottom - 32
      - (showCoordinates ? COORDINATE_GUTTER_PX : 0),
  );
  const widthPerTile =
    (availableWidth - padding * 2 - gap * (columns - 1)) / columns;
  const heightPerTile =
    (availableHeight - padding * 2 - gap * (rows - 1)) / rows;
  const tileSize = Math.max(
    MIN_TILE_SIZE,
    Math.floor(Math.min(widthPerTile, heightPerTile, MAX_TILE_SIZE)),
  );
  const boardWidth = tileSize * columns + gap * (columns - 1) + padding * 2;
  const boardFrame = document.getElementById("grid-board-frame");
  const layoutVariables = [
    ["--grid-columns", columns],
    ["--grid-rows", rows],
    ["--grid-gap", `${gap}px`],
    ["--grid-padding", `${padding}px`],
    ["--tile-size", `${tileSize}px`],
  ];

  layoutVariables.forEach(([name, value]) => {
    gridContainer.style.setProperty(name, value);
    boardFrame?.style.setProperty(name, value);
  });
  document
    .getElementById("game-title")
    ?.style.setProperty("--board-width", `${boardWidth + (showCoordinates ? COORDINATE_GUTTER_PX : 0)}px`);
  document
    .getElementById("game-progress-hud")
    ?.style.setProperty("--board-width", `${boardWidth + (showCoordinates ? COORDINATE_GUTTER_PX : 0)}px`);
  document
    .getElementById("memory-time-hud")
    ?.style.setProperty("--board-width", `${boardWidth + (showCoordinates ? COORDINATE_GUTTER_PX : 0)}px`);
  document
    .getElementById("memory-special-hud")
    ?.style.setProperty("--board-width", `${boardWidth + (showCoordinates ? COORDINATE_GUTTER_PX : 0)}px`);
  boardFrame?.classList.toggle("is-coordinate-visible", showCoordinates);
  boardFrame?.style.setProperty("--coordinate-gutter", showCoordinates ? `${COORDINATE_GUTTER_PX}px` : "0px");
  updateCoordinateLabels(columns, rows, showCoordinates);
}

export function setBoardCoordinatesVisible(visible) {
  gameState.settings.boardCoordinates = Boolean(visible);
  updateGridLayout();
}

window.addEventListener("resize", () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(updateGridLayout);
});

/**
 * Tạo lưới theo chế độ; level chỉ quyết định tiến trình và phần thưởng.
 * Mỗi lần tạo màn sẽ chọn ngẫu nhiên ảnh từ kho chung của chủ đề.
 */
export function createGrid(
  { tileCount, columns, mobileColumns },
  { roundId, onPreviewComplete, previewDurationMs = GAME_CONFIG.previewDurationMs } = {},
) {
  const totalTiles = tileCount;
  const numberOfPairs = Math.floor(totalTiles / 2);

  const selectedCards = getThemeCards(getEquippedThemeId(gameState.appearance), numberOfPairs);
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
  if (!gridContainer) return;

  activeLayout = { tileCount, columns, mobileColumns };
  gridContainer.classList.add("is-locked");
  gameState.isLocked = true;
  updateGridLayout();
  requestAnimationFrame(updateGridLayout);

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
  gridContainer.replaceChildren(tiles);

  // ✅ Preview ảnh trước khi bắt đầu
  setTimeout(() => {
    if (gameState.roundId === roundId)
      revealAndHideTiles(roundId, onPreviewComplete, previewDurationMs);
  }, 0);
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
