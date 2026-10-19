import test from 'node:test';
import assert from 'node:assert/strict';
import { createLinkBoard, applyLinkGravityShift, getRemainingLinkTiles, removeLinkBoardPair, ensurePlayableBoard } from '../../js/linkConnect/linkBoard.js';
import { hasAvailableConnection } from '../../js/linkConnect/pathfinder.js';

for (const direction of ['diagonal-down-right', 'quadrant-centers'])
  test(`${direction} preserves tile identity and state on odd/even boards and supports deadlock recovery`, () => {
    for (const [count, columns] of [[12,4],[16,4],[24,6],[30,6],[60,6]]) {
      const cards = Array.from({ length: count / 2 }, (_, id) => ({ id: `fixture-${id}`, src: 'fixture.webp', alt: 'Card' }));
      const board = createLinkBoard({ layout: { tileCount: count, columns }, cardProvider: () => cards, random: () => .99 });
      const group = board.grid.flatMap((row, r) => row.flatMap((tile, c) => tile?.id === cards[0].id ? [{ row: r, column: c }] : []));
      removeLinkBoardPair(board, ...group);
      const original = getRemainingLinkTiles(board).map(tile => ({ ...tile })).sort((a,b) => a.instanceId.localeCompare(b.instanceId));
      applyLinkGravityShift(board, direction);
      const transformed = getRemainingLinkTiles(board).map(tile => ({ ...tile })).sort((a,b) => a.instanceId.localeCompare(b.instanceId));
      assert.deepEqual(transformed, original);
      assert(board.grid[0].every(tile => !tile));
      assert(board.grid[board.rows + 1].every(tile => !tile));
      assert(board.grid.every(row => !row[0] && !row[board.columns + 1]));
      assert.equal(applyLinkGravityShift(board, direction), false, 'Compaction has a stable fixed point.');
      ensurePlayableBoard(board);
      assert(hasAvailableConnection(board.grid));
    }
  });
