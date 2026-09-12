import { getThemeCards } from "../themeCatalog.js";
import { shuffleArray } from "../utils.js";
import { getLinkFrozenPairCount, getLinkLuckyReward, getLinkPremiumType, getLinkSpecialPairCount, isLinkChallengeMode, LINK_CONNECT_CONFIG } from "./linkConfig.js";
import { hasAvailableConnection } from "./pathfinder.js";

const MAX_SHUFFLE_ATTEMPTS = 100;

export function createLinkBoard({
  layout,
  themeId = "default",
  mode = "easy",
  cardProvider = getThemeCards,
  random = Math.random,
}) {
  const pairCount = layout.tileCount / 2;
  const cards = cardProvider(themeId, pairCount);
  if (cards.length !== pairCount) {
    throw new Error("Chủ đề không có đủ ảnh cho bàn Link Connect.");
  }
  const playableCards = assignSpecialPairs(assignLuckyPairs(cards, mode), random);
  const tiles = playableCards.flatMap((card) => [
    createTile(card),
    createTile(card),
  ]);
  const board = {
    columns: layout.columns,
    rows: layout.tileCount / layout.columns,
    baseColumns: layout.baseColumns ?? layout.columns,
    capacity: layout.tileCount,
    grid: null,
  };
  board.grid = createPaddedGrid(board.rows, board.columns, tiles);
  shuffleIntoPlayableBoard(board);
  freezeRandomPairs(board);
  ensurePlayableBoard(board);
  return board;
}

/** Repack only when the new topology preserves an available move. */
export function reflowLinkBoard(board, columns) {
  if (!board || !Number.isInteger(columns) || columns < 1) return false;
  const capacity = Number.isInteger(board.capacity) ? board.capacity : board.rows * board.columns;
  if (capacity < 1 || capacity % columns !== 0 || board.columns === columns) return false;
  const tiles = getInteriorTiles(board);
  const rows = capacity / columns;
  const grid = createPaddedGrid(rows, columns, tiles);
  if (!hasAvailableConnection(grid)) return false;
  board.columns = columns;
  board.rows = rows;
  board.grid = grid;
  return true;
}

export function findLinkBoardTilePosition(board, instanceId) {
  if (!board || !instanceId) return null;
  return getInteriorPositions(board).find(position => (
    getLinkBoardTile(board, position)?.instanceId === instanceId
  )) || null;
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

export function applyLinkGravityShift(board, direction = "static") {
  if (!board || direction === "static") return false;
  const before = board.grid.map((row) => [...row]);
  if (direction === "down" || direction === "up") {
    for (let column = 1; column <= board.columns; column += 1) {
      const tiles = Array.from({ length: board.rows }, (_, index) => board.grid[index + 1][column]).filter(Boolean);
      for (let row = 1; row <= board.rows; row += 1) board.grid[row][column] = null;
      tiles.forEach((tile, index) => {
        const row = direction === "down" ? board.rows - (tiles.length - 1 - index) : index + 1;
        board.grid[row][column] = tile;
      });
    }
  } else if (direction === "left" || direction === "right") {
    for (let row = 1; row <= board.rows; row += 1) {
      const tiles = Array.from({ length: board.columns }, (_, index) => board.grid[row][index + 1]).filter(Boolean);
      for (let column = 1; column <= board.columns; column += 1) board.grid[row][column] = null;
      tiles.forEach((tile, index) => {
        const column = direction === "right" ? board.columns - (tiles.length - 1 - index) : index + 1;
        board.grid[row][column] = tile;
      });
    }
  } else if (direction === "center") {
    pullLinkTilesToCenter(board);
  } else if (direction === "split-vertical") {
    splitLinkTilesVertically(board);
  } else if (direction === "split-horizontal") {
    splitLinkTilesHorizontally(board);
  } else if (direction === "swap") {
    swapNearbyLinkTiles(board);
  } else if (direction === "rotate-clockwise" || direction === "rotate-counterclockwise") {
    rotateLinkBoardRings(board, direction === "rotate-clockwise");
  }
  return board.grid.some((row, rowIndex) => row.some((tile, columnIndex) => tile !== before[rowIndex][columnIndex]));
}

function pullLinkTilesToCenter(board) {
  const topEnd = Math.floor(board.rows / 2);
  for (let column = 1; column <= board.columns; column += 1) {
    compactLine(board, positionsInColumn(column, 1, topEnd), "end");
    compactLine(board, positionsInColumn(column, topEnd + 1, board.rows), "start");
  }
  const leftEnd = Math.floor(board.columns / 2);
  for (let row = 1; row <= board.rows; row += 1) {
    compactLine(board, positionsInRow(row, 1, leftEnd), "end");
    compactLine(board, positionsInRow(row, leftEnd + 1, board.columns), "start");
  }
}

function splitLinkTilesVertically(board) {
  const topEnd = Math.floor(board.rows / 2);
  for (let column = 1; column <= board.columns; column += 1) {
    compactLine(board, positionsInColumn(column, 1, topEnd), "start");
    compactLine(board, positionsInColumn(column, topEnd + 1, board.rows), "end");
  }
}

function splitLinkTilesHorizontally(board) {
  const leftEnd = Math.floor(board.columns / 2);
  for (let row = 1; row <= board.rows; row += 1) {
    compactLine(board, positionsInRow(row, 1, leftEnd), "start");
    compactLine(board, positionsInRow(row, leftEnd + 1, board.columns), "end");
  }
}

function compactLine(board, positions, edge) {
  if (!positions.length) return;
  const tiles = positions.map((position) => getLinkBoardTile(board, position)).filter(Boolean);
  const emptyCount = positions.length - tiles.length;
  const values = edge === "end"
    ? [...Array(emptyCount).fill(null), ...tiles]
    : [...tiles, ...Array(emptyCount).fill(null)];
  positions.forEach((position, index) => {
    board.grid[position.row][position.column] = values[index];
  });
}

function positionsInColumn(column, startRow, endRow) {
  return Array.from(
    { length: Math.max(0, endRow - startRow + 1) },
    (_, index) => ({ row: startRow + index, column }),
  );
}

function positionsInRow(row, startColumn, endColumn) {
  return Array.from(
    { length: Math.max(0, endColumn - startColumn + 1) },
    (_, index) => ({ row, column: startColumn + index }),
  );
}

function swapNearbyLinkTiles(board) {
  const occupied = getInteriorPositions(board);
  const occupiedKeys = new Set(occupied.map(positionKey));
  const swappedKeys = new Set();
  occupied.forEach((position) => {
    const key = positionKey(position);
    if (swappedKeys.has(key)) return;
    const partner = occupied
      .filter((candidate) => {
        const candidateKey = positionKey(candidate);
        return candidateKey !== key
          && occupiedKeys.has(candidateKey)
          && !swappedKeys.has(candidateKey);
      })
      .sort((first, second) => (
        manhattanDistance(position, first) - manhattanDistance(position, second)
      ))[0];
    if (!partner) return;
    const partnerKey = positionKey(partner);
    const tile = board.grid[position.row][position.column];
    board.grid[position.row][position.column] = board.grid[partner.row][partner.column];
    board.grid[partner.row][partner.column] = tile;
    swappedKeys.add(key);
    swappedKeys.add(partnerKey);
  });
}

function manhattanDistance(first, second) {
  return Math.abs(first.row - second.row) + Math.abs(first.column - second.column);
}

function rotateLinkBoardRings(board, clockwise) {
  const ringCount = Math.ceil(Math.min(board.rows, board.columns) / 2);
  for (let layer = 0; layer < ringCount; layer += 1) {
    const positions = getRingPositions(board, layer);
    if (positions.length < 2) continue;
    const values = positions.map((position) => getLinkBoardTile(board, position));
    const rotated = clockwise
      ? [values.at(-1), ...values.slice(0, -1)]
      : [...values.slice(1), values[0]];
    positions.forEach((position, index) => {
      board.grid[position.row][position.column] = rotated[index];
    });
  }
}

function getRingPositions(board, layer) {
  const top = layer + 1;
  const bottom = board.rows - layer;
  const left = layer + 1;
  const right = board.columns - layer;
  if (top > bottom || left > right) return [];
  if (top === bottom) return positionsInRow(top, left, right);
  if (left === right) return positionsInColumn(left, top, bottom);
  const positions = [];
  for (let column = left; column <= right; column += 1) positions.push({ row: top, column });
  for (let row = top + 1; row <= bottom; row += 1) positions.push({ row, column: right });
  for (let column = right - 1; column >= left; column -= 1) positions.push({ row: bottom, column });
  for (let row = bottom - 1; row > top; row -= 1) positions.push({ row, column: left });
  return positions;
}

function positionKey(position) {
  return `${position.row}:${position.column}`;
}

export function ensurePlayableBoard(board) {
  if (hasAvailableConnection(board.grid)) return false;
  // Không thể xáo để tạo nước đi nếu toàn bộ thẻ còn lại đều đang bị băng khóa.
  // Controller sẽ mở tất cả cặp băng cùng lúc trong trường hợp này.
  if (!getRemainingLinkTiles(board).some((tile) => !tile.frozen)) return false;
  shuffleIntoPlayableBoard(board);
  return true;
}

export function shuffleLinkBoard(board) {
  shuffleIntoPlayableBoard(board);
}

export function unlockFrozenLinkPairs(board, count = 1, { onUnlock } = {}) {
  const frozenPairs = getLinkPairs(board).filter((pair) => (
    pair.positions.length === 2
      && pair.positions.every((position) => getLinkBoardTile(board, position)?.frozen)
  ));
  shuffleArray(frozenPairs);
  const pairsToUnlock = frozenPairs.slice(0, Math.max(0, count));
  pairsToUnlock.forEach((pair) => {
    const tileKeys = pair.positions
      .map((position) => getLinkBoardTile(board, position)?.instanceId)
      .filter(Boolean);
    pair.positions.forEach((position) => replaceTile(board, position, { frozen: false }));
    onUnlock?.({ positions: pair.positions, tileKeys });
  });
  return pairsToUnlock.length;
}

export function unlockAllFrozenLinkPairs(board, options) {
  return unlockFrozenLinkPairs(board, Number.POSITIVE_INFINITY, options);
}

export function unlockAllFrozenLinkPairsAndEnsurePlayable(board, options) {
  const unlockedPairs = unlockAllFrozenLinkPairs(board, options);
  const shuffled = unlockedPairs > 0 ? ensurePlayableBoard(board) : false;
  return { unlockedPairs, shuffled };
}

export function makeRandomLinkPairSpecial(board, random = Math.random) {
  const pairs = getLinkPairs(board).filter((pair) => !pair.positions.every((position) => (
    getLinkBoardTile(board, position)?.special
  )));
  const pair = pairs[Math.floor(random() * pairs.length)];
  if (!pair) return null;
  const premiumType = getLinkPremiumType(random);
  pair.positions.forEach((position) => replaceTile(board, position, { special: true, premiumType }));
  return pair;
}

export function removeRandomLinkPair(board, { excludeTileKeys = [], eligiblePair, remove = true } = {}) {
  const excludedKeys = new Set(excludeTileKeys);
  const pairs = getLinkPairs(board).filter((pair) => (
    pair.positions.length === 2
      && !pair.positions.some((position) => excludedKeys.has(getLinkBoardTile(board, position)?.instanceId))
      && (!eligiblePair || eligiblePair(pair, board))
  ));
  const pair = pairs[Math.floor(Math.random() * pairs.length)];
  if (!pair) return null;
  const [start, end] = pair.positions;
  if (remove) removeLinkBoardPair(board, start, end);
  return pair;
}

function shuffleIntoPlayableBoard(board) {
  const positions = getOccupiedInteriorPositions(board);
  const tiles = positions.map((position) => board.grid[position.row][position.column]);
  if (tiles.length < 2) return;
  for (let attempt = 0; attempt < MAX_SHUFFLE_ATTEMPTS; attempt += 1) {
    shuffleArray(tiles);
    placeTilesAtPositions(board, tiles, positions);
    if (hasAvailableConnection(board.grid)) return;
  }
  throw new Error("Không thể tạo bàn Link Connect có nước đi hợp lệ.");
}

export function getRemainingLinkTiles(board) {
  return getInteriorTiles(board);
}

export function hasOnlyFrozenLinkTiles(board) {
  const tiles = getRemainingLinkTiles(board);
  return tiles.length > 0 && tiles.every((tile) => tile.frozen);
}

let nextTileInstanceId = 1;

function createTile(card) {
  return Object.freeze({
    instanceId: `link-tile-${nextTileInstanceId++}`,
    id: card.id,
    src: card.src,
    alt: card.alt,
    special: card.special === true,
    premiumType: card.special ? card.premiumType || "cyan" : null,
    frozen: false,
    luckyReward: card.luckyReward || null,
  });
}

function assignLuckyPairs(cards, mode) {
  if (!isLinkChallengeMode(mode)) return cards;
  const { min, max } = LINK_CONNECT_CONFIG.challenge.luckyPairCount;
  const count = Math.min(cards.length, randomInteger(min, max));
  const indices = shuffleArray(Array.from({ length: cards.length }, (_, index) => index)).slice(0, count);
  return cards.map((card, index) => indices.includes(index)
    ? { ...card, luckyReward: getLinkLuckyReward(mode) }
    : card);
}

function randomInteger(minimum, maximum) {
  return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
}

function assignSpecialPairs(cards, random) {
  const eligibleIndices = cards.flatMap((card, index) => card.luckyReward ? [] : [index]);
  const count = Math.min(eligibleIndices.length, getLinkSpecialPairCount(cards.length, random));
  if (!count) return cards.map((card) => ({ ...card, special: false, premiumType: null }));
  const indices = shuffleArray(eligibleIndices).slice(0, count);
  return cards.map((card, index) => {
    const special = indices.includes(index);
    return {
      ...card,
      special,
      premiumType: special ? getLinkPremiumType(random) : null,
    };
  });
}

function freezeRandomPairs(board) {
  const count = getLinkFrozenPairCount(getLinkPairs(board).length);
  const pairs = getLinkPairs(board).filter((pair) => (
    pair.positions.length === 2
      && pair.positions.every((position) => {
        const tile = getLinkBoardTile(board, position);
        return !tile?.special && !tile?.luckyReward;
      })
  ));
  shuffleArray(pairs);
  pairs.slice(0, count).forEach((pair) => {
    pair.positions.forEach((position) => replaceTile(board, position, { frozen: true }));
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

function getInteriorPositions(board) {
  const positions = [];
  board.grid.slice(1, -1).forEach((row, rowIndex) => {
    row.slice(1, -1).forEach((tile, columnIndex) => {
      if (tile) positions.push({ row: rowIndex + 1, column: columnIndex + 1 });
    });
  });
  return positions;
}

function getLinkPairs(board) {
  const byId = new Map();
  getInteriorPositions(board).forEach((position) => {
    const tile = getLinkBoardTile(board, position);
    const pair = byId.get(tile.id) || { id: tile.id, positions: [] };
    pair.positions.push(position);
    byId.set(tile.id, pair);
  });
  return [...byId.values()];
}

function replaceTile(board, position, changes) {
  const tile = getLinkBoardTile(board, position);
  if (!tile) return;
  board.grid[position.row][position.column] = Object.freeze({ ...tile, ...changes });
}

function getOccupiedInteriorPositions(board) {
  const positions = [];
  board.grid.slice(1, -1).forEach((row, rowIndex) => {
    row.slice(1, -1).forEach((tile, columnIndex) => {
      if (tile) positions.push({ row: rowIndex + 1, column: columnIndex + 1 });
    });
  });
  return positions;
}

function placeTilesAtPositions(board, tiles, positions) {
  positions.forEach((position, index) => {
    board.grid[position.row][position.column] = tiles[index];
  });
}
