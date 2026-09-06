import assert from "node:assert/strict";
import {
  createLinkBoard,
  applyLinkGravityShift,
  ensurePlayableBoard,
  getRemainingLinkTiles,
  hasOnlyFrozenLinkTiles,
  makeRandomLinkPairSpecial,
  removeLinkBoardPair,
  removeRandomLinkPair,
  unlockAllFrozenLinkPairs,
  unlockFrozenLinkPairs,
} from "../js/linkConnect/linkBoard.js";
import { hasAvailableConnection } from "../js/linkConnect/pathfinder.js";
import { getLinkFrozenPairCount, getLinkGravityShift, getLinkSpecialPairCount } from "../js/linkConnect/linkConfig.js";

assert.equal(getLinkSpecialPairCount(8, () => 0), 1);
assert.equal(getLinkSpecialPairCount(8, () => 0.99), 0);
assert.equal(getLinkSpecialPairCount(12, () => 0), 1);
assert.equal(getLinkSpecialPairCount(16, () => 0), 2);
assert.equal(getLinkSpecialPairCount(16, () => 0.99), 0);
assert.deepEqual(
  [8, 9, 16, 25].map((pairCount) => getLinkFrozenPairCount(pairCount)),
  [1, 2, 3, 4],
);

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
  cardProvider: () => cards,
  random: () => 0,
});
assert.equal(getRemainingLinkTiles(specialBoard).filter((tile) => tile.special).length, 2);
assert.deepEqual(
  [...new Set(getRemainingLinkTiles(specialBoard).filter((tile) => tile.special).map((tile) => tile.premiumType))],
  ["cyan"],
);
const frozenTiles = getRemainingLinkTiles(specialBoard).filter((tile) => tile.frozen);
assert.equal(frozenTiles.length, 2);
assert.equal(new Set(frozenTiles.map((tile) => tile.id)).size, 1);
assert.equal(frozenTiles.some((tile) => tile.special), false);
assert.equal(hasOnlyFrozenLinkTiles(specialBoard), false);
assert.equal(unlockFrozenLinkPairs(specialBoard), 1);
assert.equal(getRemainingLinkTiles(specialBoard).filter((tile) => tile.frozen).length, 0);
assert.ok(makeRandomLinkPairSpecial(specialBoard));
assert.ok(removeRandomLinkPair(specialBoard));
assert.equal(unlockAllFrozenLinkPairs(specialBoard), 0);

const frozenOnlyBoard = {
  rows: 2,
  columns: 2,
  grid: [
    [null, null, null, null],
    [null, { id: "ice", frozen: true }, { id: "ice", frozen: true }, null],
    [null, { id: "ice-2", frozen: true }, { id: "ice-2", frozen: true }, null],
    [null, null, null, null],
  ],
};
assert.equal(hasOnlyFrozenLinkTiles(frozenOnlyBoard), true);
assert.equal(unlockAllFrozenLinkPairs(frozenOnlyBoard), 2);
assert.equal(hasOnlyFrozenLinkTiles(frozenOnlyBoard), false);

let challengeBoard;
try {
  Math.random = () => 0;
  challengeBoard = createLinkBoard({
    layout: { tileCount: 12, columns: 4 },
    mode: "challenge",
    cardProvider: () => cards,
    random: () => 0,
  });
} finally {
  Math.random = originalRandom;
}
assert.equal(
  getRemainingLinkTiles(challengeBoard).some((tile) => tile.special && tile.luckyReward),
  false,
);

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

assert.deepEqual(
  [1, 3, 6, 9, 10, 13, 16, 19, 22, 25, 26].map((level) => getLinkGravityShift(level, () => 0)),
  ["static", "down", "up", "left", "right", "center", "split-vertical", "split-horizontal", "swap", "rotate-clockwise", "rotate-counterclockwise"],
);
assert.equal(getLinkGravityShift(28, () => 0), "down");
assert.equal(getLinkGravityShift(28, () => 0.999), "rotate-counterclockwise");

const advancedGravitySource = {
  rows: 4,
  columns: 4,
  grid: [
    [null, null, null, null, null, null],
    [null, { id: "a" }, null, null, { id: "b" }, null],
    [null, null, { id: "c" }, null, null, null],
    [null, null, null, { id: "d" }, null, null],
    [null, { id: "e" }, null, null, { id: "f" }, null],
    [null, null, null, null, null, null],
  ],
};
const advancedDirections = [
  "center", "split-vertical", "split-horizontal", "swap",
  "rotate-clockwise", "rotate-counterclockwise",
];
advancedDirections.forEach((direction) => {
  const testBoard = {
    ...advancedGravitySource,
    grid: advancedGravitySource.grid.map((row) => [...row]),
  };
  const beforeIds = getRemainingLinkTiles(testBoard).map((tile) => tile.id).sort();
  assert.equal(applyLinkGravityShift(testBoard, direction), true, `${direction} should move tiles`);
  assert.deepEqual(
    getRemainingLinkTiles(testBoard).map((tile) => tile.id).sort(),
    beforeIds,
    `${direction} should preserve every tile`,
  );
});

console.log("Link Connect board checks passed.");
