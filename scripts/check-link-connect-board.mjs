import assert from "node:assert/strict";
import {
  createLinkBoard,
  applyLinkGravityShift,
  ensurePlayableBoard,
  getRemainingLinkTiles,
  makeRandomLinkPairSpecial,
  removeLinkBoardPair,
  removeRandomLinkPair,
  unlockAllFrozenLinkPairs,
  unlockFrozenLinkPairs,
} from "../js/linkConnect/linkBoard.js";
import { hasAvailableConnection } from "../js/linkConnect/pathfinder.js";

const cards = Array.from({ length: 6 }, (_, index) => ({
  id: `card-${index}`,
  src: `card-${index}.webp`,
  alt: `Card ${index}`,
}));
const originalRandom = Math.random;
let board;
try {
  Math.random = () => 0;
  board = createLinkBoard({
    layout: { tileCount: 12, columns: 4 },
    cardProvider: () => cards,
  });
} finally {
  Math.random = originalRandom;
}

assert.equal(getRemainingLinkTiles(board).length, 12);
assert.equal(hasAvailableConnection(board.grid), true);
assert.notDeepEqual(
  getRemainingLinkTiles(board).map((tile) => tile.id),
  cards.flatMap((card) => [card.id, card.id]),
);

const positions = [];
board.grid.forEach((row, rowIndex) => row.forEach((tile, columnIndex) => {
  if (tile?.id === cards[0].id) positions.push({ row: rowIndex, column: columnIndex });
}));
assert.equal(positions.length, 2);
assert.equal(removeLinkBoardPair(board, positions[0], positions[1]), true);
const emptyPositionsBeforeShuffle = positions.map(({ row, column }) => `${row}:${column}`).sort();
ensurePlayableBoard(board);
assert.equal(getRemainingLinkTiles(board).length, 10);
assert.equal(hasAvailableConnection(board.grid), true);
const emptyPositionsAfterShuffle = board.grid.flatMap((row, rowIndex) => row.flatMap((tile, columnIndex) => (
  rowIndex > 0 && rowIndex < board.rows + 1 && columnIndex > 0 && columnIndex < board.columns + 1 && !tile
    ? [`${rowIndex}:${columnIndex}`]
    : []
))).sort();
assert.deepEqual(emptyPositionsAfterShuffle, emptyPositionsBeforeShuffle);

const specialBoard = createLinkBoard({
  layout: { tileCount: 12, columns: 4 },
  level: 3,
  cardProvider: () => cards,
});
assert.equal(getRemainingLinkTiles(specialBoard).filter((tile) => tile.special).length, 2);
const frozenTiles = getRemainingLinkTiles(specialBoard).filter((tile) => tile.frozen);
assert.equal(frozenTiles.length, 2);
assert.equal(new Set(frozenTiles.map((tile) => tile.id)).size, 1);
assert.equal(frozenTiles.some((tile) => tile.special), false);
assert.equal(unlockFrozenLinkPairs(specialBoard), 1);
assert.equal(getRemainingLinkTiles(specialBoard).filter((tile) => tile.frozen).length, 0);
assert.ok(makeRandomLinkPairSpecial(specialBoard));
assert.ok(removeRandomLinkPair(specialBoard));
assert.equal(unlockAllFrozenLinkPairs(specialBoard), 0);

const gravityBoard = {
  rows: 3,
  columns: 3,
  grid: [
    [null, null, null, null, null],
    [null, { id: "a" }, null, { id: "b" }, null],
    [null, null, { id: "c" }, null, null],
    [null, { id: "d" }, null, null, null],
    [null, null, null, null, null],
  ],
};
assert.equal(applyLinkGravityShift(gravityBoard, "down"), true);
assert.equal(gravityBoard.grid[3][1].id, "d");
assert.equal(gravityBoard.grid[3][2].id, "c");
assert.equal(gravityBoard.grid[3][3].id, "b");
assert.equal(gravityBoard.grid[2][1].id, "a");
assert.equal(applyLinkGravityShift(gravityBoard, "right"), true);
assert.equal(gravityBoard.grid[2][3].id, "a");
assert.equal(applyLinkGravityShift(gravityBoard, "left"), true);
assert.equal(gravityBoard.grid[2][1].id, "a");

console.log("Link Connect board checks passed.");
