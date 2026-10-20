// Round-local card identity. Presentation owns nodes; snapshots keep their
// existing { id, special, matched } wire format and original board order.
export const memoryBoard = { roundId: null, tiles: new Map(), selectedIds: [] };

export function mountMemoryBoard(cards, roundId) {
  memoryBoard.roundId = roundId;
  memoryBoard.tiles = new Map(cards.map((card, index) => [`tile-${index}`, {
    imageId: card.id, special: card.special === true, matched: card.matched === true,
  }]));
  memoryBoard.selectedIds = [];
}

export function clearMemoryBoard() {
  memoryBoard.roundId = null;
  memoryBoard.tiles.clear();
  memoryBoard.selectedIds = [];
}

export function decideMemorySelection(board, tileId, { roundId, locked, hasImage = true }) {
  if (board.roundId !== roundId || locked || board.selectedIds.length >= 2) return 'reject';
  const tile = board.tiles.get(tileId);
  if (!tile || !hasImage) return 'reject';
  if (board.selectedIds.includes(tileId)) return 'deselect';
  if (tile.matched) return 'reject';
  return 'select';
}

export function decideMemoryPair(first, second, { combo, lastMatchAt, matchedAt, comboWindowMs }) {
  if (first.imageId !== second.imageId) return { matched: false, combo: 0 };
  return { matched: true, combo: lastMatchAt && matchedAt - lastMatchAt <= comboWindowMs ? combo + 1 : 1 };
}

export function snapshotMemoryTiles() {
  return [...memoryBoard.tiles.values()].map(tile => ({ id: tile.imageId, special: tile.special, matched: tile.matched }));
}
