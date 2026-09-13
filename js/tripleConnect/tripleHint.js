import { getExposedTileIds } from "./tripleState.js";

export function getTripleHintTileIds(state) {
  const exposed = getExposedTileIds(state);
  const trayTypes = new Map();
  state.tray.forEach(id => trayTypes.set(state.tiles[id].type, (trayTypes.get(state.tiles[id].type) || 0) + 1));
  const preferred = exposed.filter(id => trayTypes.has(state.tiles[id].type));
  return (preferred.length ? preferred : exposed).slice(0, 2);
}
