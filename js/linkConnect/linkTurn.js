import { getLinkBoardTile } from './linkBoard.js';
import { findConnectionPath } from './pathfinder.js';

// A decision reads model positions, never DOM or presentation state. The
// controller keeps the original commit/recovery/interaction boundaries.
export function decideLinkSelection({ board, selected, position, locked, paused }) {
  if (locked || paused) return { type: 'reject' };
  const tile = getLinkBoardTile(board, position);
  if (!tile || tile.frozen) return { type: 'reject' };
  if (!selected) return { type: 'select' };
  if (selected.row === position.row && selected.column === position.column) return { type: 'deselect' };
  const firstTile = getLinkBoardTile(board, selected);
  const path = firstTile?.id === tile.id ? findConnectionPath(board.grid, selected, position) : null;
  return { type: path ? 'match' : 'mismatch', firstTile, tile, path };
}
