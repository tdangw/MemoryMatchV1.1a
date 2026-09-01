import { getThemeCards } from "../themeCatalog.js";
import { shuffleArray } from "../utils.js";
import { hasAvailableConnection } from "./pathfinder.js";

const MAX_SHUFFLE_ATTEMPTS = 100;

export function createLinkBoard({
  layout,
  themeId = "default",
  cardProvider = getThemeCards,
}) {
  const pairCount = layout.tileCount / 2;
  const cards = cardProvider(themeId, pairCount);
  if (cards.length !== pairCount) {
    throw new Error("Chủ đề không có đủ ảnh cho bàn Link Connect.");
  }
  const tiles = cards.flatMap((card) => [
    createTile(card),
    createTile(card),
  ]);
  const board = {
    columns: layout.columns,
    rows: layout.tileCount / layout.columns,
    grid: null,
  };
  board.grid = createPaddedGrid(board.rows, board.columns, tiles);
  shuffleIntoPlayableBoard(board);
  return board;
}

export function getLinkBoardTile(board, position) {
  return board?.grid?.[position.row]?.[position.column] || null;
}

export function removeLinkBoardPair(board, start, end) {
  if (!getLinkBoardTile(board, start) || !getLinkBoardTile(board, end)) return false;
  board.grid[start.row][start.column] = null;
  board.grid[end.row][end.column] = null;
  return true;
}

export function ensurePlayableBoard(board) {
  if (hasAvailableConnection(board.grid)) return false;
  shuffleIntoPlayableBoard(board);
  return true;
}

function shuffleIntoPlayableBoard(board) {
  const tiles = getInteriorTiles(board);
  if (tiles.length < 2) return;
  for (let attempt = 0; attempt < MAX_SHUFFLE_ATTEMPTS; attempt += 1) {
    shuffleArray(tiles);
    placeInteriorTiles(board, tiles);
    if (hasAvailableConnection(board.grid)) return;
  }
  throw new Error("Không thể tạo bàn Link Connect có nước đi hợp lệ.");
}

export function getRemainingLinkTiles(board) {
  return getInteriorTiles(board);
}

function createTile(card) {
  return Object.freeze({
    id: card.id,
    src: card.src,
    alt: card.alt,
    special: card.special === true,
  });
}

function createPaddedGrid(rows, columns, tiles) {
  const grid = Array.from(
    { length: rows + 2 },
    () => Array(columns + 2).fill(null),
  );
  tiles.forEach((tile, index) => {
    const row = Math.floor(index / columns) + 1;
    const column = (index % columns) + 1;
    grid[row][column] = tile;
  });
  return grid;
}

function getInteriorTiles(board) {
  return board.grid.slice(1, -1).flatMap((row) => row.slice(1, -1)).filter(Boolean);
}

function placeInteriorTiles(board, tiles) {
  board.grid.slice(1, -1).forEach((row) => {
    row.fill(null, 1, -1);
  });
  tiles.forEach((tile, index) => {
    const row = Math.floor(index / board.columns) + 1;
    const column = (index % board.columns) + 1;
    board.grid[row][column] = tile;
  });
}
