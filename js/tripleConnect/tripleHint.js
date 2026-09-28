import { getExposedTileIds } from "./tripleState.js";

export function getTripleHintTileIds(state) {
  const exposed = getExposedTileIds(state);
  const candidatesByType = new Map();
  // A hint identifies a complete playable triple. Tiles already in the tray
  // are part of that triple, so keep them before exposed board tiles.
  for (const tileId of [...state.tray, ...exposed]) {
    const tile = state.tiles[tileId];
    if (!tile) continue;
    const candidates = candidatesByType.get(tile.type) || [];
    candidates.push(tileId);
    candidatesByType.set(tile.type, candidates);
  }
  const choices = [...candidatesByType.entries()]
    .filter(([, tileIds]) => tileIds.length >= 3 && tileIds.some((tileId) => exposed.includes(tileId)))
    .sort(([, left], [, right]) => right.filter((tileId) => state.tray.includes(tileId)).length
      - left.filter((tileId) => state.tray.includes(tileId)).length);
  return choices[0]?.[1].slice(0, 3) || [];
}
