import { shuffleArray } from "./utils.js";
import { GAME_CONFIG } from "./config.js";
import { gameState } from "./gameState.js";
import { getCardBackClass } from "./appearance.js";
import { initLogic } from "./logic.js";

const MOBILE_BREAKPOINT = 600;
const MAX_TILE_SIZE = 180;
const MIN_TILE_SIZE = 36;
let activeLayout = null;
let resizeFrame = null;

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
  const gap = isCompactViewport ? 1 : 3;
  const padding = isCompactViewport ? 2 : 6;
  const headerBottom =
    document.getElementById("game-title")?.getBoundingClientRect().bottom || 0;
  const availableWidth = Math.max(
    240,
    isCompactViewport ? window.innerWidth - 20 : window.innerWidth * 0.9,
  );
  const availableHeight = Math.max(
    180,
    window.innerHeight - headerBottom - 32,
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

  gridContainer.style.setProperty("--grid-columns", columns);
  gridContainer.style.setProperty("--grid-gap", `${gap}px`);
  gridContainer.style.setProperty("--grid-padding", `${padding}px`);
  gridContainer.style.setProperty("--tile-size", `${tileSize}px`);
  document
    .getElementById("game-title")
    ?.style.setProperty("--board-width", `${boardWidth}px`);
  document
    .getElementById("game-progress-hud")
    ?.style.setProperty("--board-width", `${boardWidth}px`);
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
  { roundId, onPreviewComplete } = {},
) {
  const totalTiles = tileCount;
  const numberOfPairs = Math.floor(totalTiles / 2);

  const availableImages = Array.from(
    { length: GAME_CONFIG.cardImages.count },
    (_, i) => i + 1,
  );
  shuffleArray(availableImages);

  // ✅ Chọn ảnh không trùng → mỗi ảnh dùng đúng 2 lần
  const selectedImages = availableImages.slice(0, numberOfPairs);
  let imageIds = [];
  selectedImages.forEach((id) => {
    imageIds.push(id, id);
  });

  // 🔀 Trộn mảng ảnh cuối cùng
  shuffleArray(imageIds);

  // Chuẩn bị DOM
  const gridContainer = document.getElementById("grid-container");
  if (!gridContainer) return;

  activeLayout = { tileCount, columns, mobileColumns };
  gridContainer.innerHTML = "";
  gridContainer.classList.add("is-locked");
  gameState.isLocked = true;
  updateGridLayout();
  requestAnimationFrame(updateGridLayout);

  imageIds.forEach((imageId, idx) => {
    const tileId = `tile-${idx}`;

    const tile = document.createElement("div");
    tile.classList.add("tile");
    tile.classList.add(getCardBackClass(gameState.appearance.cardBack));
    tile.id = tileId;

    const img = document.createElement("img");
    img.src = `${import.meta.env.BASE_URL}assets/images/themes/${GAME_CONFIG.cardImages.defaultTheme}/MM-image (${imageId}).webp`;
    img.alt = `MM-image ${imageId}`;
    img.draggable = false;
    img.classList.add("hidden");

    tile.dataset.imageId = imageId;
    tile.appendChild(img);
    gridContainer.appendChild(tile);
  });

  // ✅ Preview ảnh trước khi bắt đầu
  setTimeout(() => {
    if (gameState.roundId === roundId)
      revealAndHideTiles(roundId, onPreviewComplete);
  }, 0);
}

/**
 * Hiển thị tất cả ảnh trong 5s rồi ẩn lại nếu chưa matched
 */
function revealAndHideTiles(roundId, onPreviewComplete) {
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
  }, GAME_CONFIG.previewDurationMs);
}
