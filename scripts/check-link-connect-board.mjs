import assert from "node:assert/strict";
import {
  createLinkBoard,
  ensurePlayableBoard,
  getRemainingLinkTiles,
  removeLinkBoardPair,
} from "../js/linkConnect/linkBoard.js";
import { hasAvailableConnection } from "../js/linkConnect/pathfinder.js";

const cards = Array.from({ length: 6 }, (_, index) => ({
  id: `card-${index}`,
  src: `card-${index}.webp`,
  alt: `Card ${index}`,
}));
const board = createLinkBoard({
  layout: { tileCount: 12, columns: 4 },
  cardProvider: () => cards,
});

assert.equal(getRemainingLinkTiles(board).length, 12);
assert.equal(hasAvailableConnection(board.grid), true);

const positions = [];
board.grid.forEach((row, rowIndex) => row.forEach((tile, columnIndex) => {
  if (tile?.id === cards[0].id) positions.push({ row: rowIndex, column: columnIndex });
}));
assert.equal(positions.length, 2);
assert.equal(removeLinkBoardPair(board, positions[0], positions[1]), true);
ensurePlayableBoard(board);
assert.equal(getRemainingLinkTiles(board).length, 10);
assert.equal(hasAvailableConnection(board.grid), true);

console.log("Link Connect board checks passed.");
