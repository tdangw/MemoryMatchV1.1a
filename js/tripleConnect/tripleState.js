import { TRIPLE_RULES } from "./tripleConfig.js";

const STATUSES = new Set(["playing", "won", "lost", "disposed"]);
const LOCATIONS = new Set(["board", "tray", "removed"]);

export function createTripleRoundState({ roundId = 1, tiles, coverGraph = {} } = {}) {
  const normalizedTiles = normalizeTiles(tiles);
  const normalizedCoverGraph = normalizeCoverGraph(coverGraph, normalizedTiles);
  const state = {
    roundId: normalizeRoundId(roundId),
    status: "playing",
    tiles: normalizedTiles,
    layers: collectLayers(normalizedTiles),
    coverGraph: normalizedCoverGraph,
    tray: [],
    streakType: null,
    streakCount: 0,
    combo: 0,
    misses: 0,
    moves: 0,
    score: 0,
    matchedTriples: 0,
    undoHistory: [],
    initialTileCount: Object.keys(normalizedTiles).length,
  };
  assertTripleStateInvariant(state);
  return freezeState(state);
}

export function getExposedTileIds(state) {
  assertTripleStateInvariant(state);
  return Object.values(state.tiles)
    .filter(tile => tile.location === "board" && state.coverGraph[tile.id].every(blockerId => state.tiles[blockerId].location !== "board"))
    .map(tile => tile.id);
}

export function isTripleTileExposed(state, tileId) {
  return getExposedTileIds(state).includes(tileId);
}

export function assertTripleStateInvariant(state) {
  if (!state || !STATUSES.has(state.status)) throw new TypeError("Triple state has an invalid status.");
  const tiles = state.tiles || {};
  const tileIds = Object.keys(tiles);
  if (!tileIds.length || tileIds.length % TRIPLE_RULES.matchSize !== 0) {
    throw new TypeError("Triple state tile count must be a positive multiple of three.");
  }
  if (state.initialTileCount !== tileIds.length) throw new TypeError("Triple state initial tile count changed.");
  if (!Array.isArray(state.tray) || state.tray.length > TRIPLE_RULES.trayCapacity) {
    throw new TypeError("Triple state tray is invalid.");
  }
  const trayIds = new Set(state.tray);
  if (trayIds.size !== state.tray.length) throw new TypeError("Triple state tray contains duplicate tile IDs.");

  const locations = { board: 0, tray: 0, removed: 0 };
  const types = new Map();
  const slotIds = new Set();
  for (const [tileId, tile] of Object.entries(tiles)) {
    if (!tile || tile.id !== tileId || !tile.type || !tile.slotId || slotIds.has(tile.slotId) || !LOCATIONS.has(tile.location)) {
      throw new TypeError("Triple state contains an invalid tile.");
    }
    slotIds.add(tile.slotId);
    locations[tile.location] += 1;
    types.set(tile.type, (types.get(tile.type) || 0) + 1);
    if ((tile.location === "tray") !== trayIds.has(tile.id)) {
      throw new TypeError("Triple tile location and tray disagree.");
    }
  }
  if (locations.board + locations.tray + locations.removed !== tileIds.length) {
    throw new TypeError("Triple state lost a tile.");
  }
  if ([...types.values()].some(count => count % TRIPLE_RULES.matchSize !== 0)) {
    throw new TypeError("Triple tile types must occur in complete triples.");
  }
  if (Object.values(tiles).some(tile => tile.location === "tray" && countTrayType(state.tray, tiles, tile.type) >= TRIPLE_RULES.matchSize)) {
    throw new TypeError("Stable triple tray cannot retain a completed triple.");
  }
  if (!isCanonicalTray(state.tray, tiles)) throw new TypeError("Triple tray order is not canonical.");
  if (!Number.isInteger(state.streakCount) || state.streakCount < 0
    || (state.streakCount === 0) !== (state.streakType === null)
    || (state.streakType !== null && typeof state.streakType !== "string")) {
    throw new TypeError("Triple streak is invalid.");
  }
  if ([state.combo, state.misses, state.moves, state.score, state.matchedTriples].some(value => !Number.isInteger(value) || value < 0)) {
    throw new TypeError("Triple counters are invalid.");
  }
  if (!Array.isArray(state.undoHistory) || state.undoHistory.length > state.initialTileCount) {
    throw new TypeError("Triple undo history is invalid.");
  }
  if (!state.coverGraph || !state.layers) throw new TypeError("Triple board state is incomplete.");
  for (const tileId of tileIds) {
    const blockers = state.coverGraph[tileId];
    if (!Array.isArray(blockers) || blockers.some(blockerId => !tiles[blockerId] || blockerId === tileId)) {
      throw new TypeError("Triple cover graph is invalid.");
    }
  }
  const layerTileIds = Object.values(state.layers).flat();
  if (layerTileIds.length !== tileIds.length || new Set(layerTileIds).size !== tileIds.length
    || layerTileIds.some(tileId => !tiles[tileId] || !state.layers[tiles[tileId].layer]?.includes(tileId))) {
    throw new TypeError("Triple layers are invalid.");
  }
  return true;
}

export function createTripleStateSnapshot(state) {
  assertTripleStateInvariant(state);
  return freezeSnapshot({
    roundId: state.roundId,
    status: state.status,
    tiles: state.tiles,
    layers: state.layers,
    coverGraph: state.coverGraph,
    tray: state.tray,
    streakType: state.streakType,
    streakCount: state.streakCount,
    combo: state.combo,
    misses: state.misses,
    moves: state.moves,
    score: state.score,
    matchedTriples: state.matchedTriples,
    initialTileCount: state.initialTileCount,
  });
}

export function restoreTripleStateSnapshot(snapshot, undoHistory) {
  const state = { ...snapshot, undoHistory };
  assertTripleStateInvariant(state);
  return freezeState(state);
}

function normalizeTiles(tiles) {
  if (!Array.isArray(tiles)) throw new TypeError("Triple round requires a tile array.");
  const result = {};
  for (const source of tiles) {
    const id = String(source?.id || "");
    const type = String(source?.type || "");
    if (!id || !type || result[id]) throw new TypeError("Triple tile IDs and types must be unique and non-empty.");
    result[id] = Object.freeze({
      id,
      type,
      slotId: String(source.slotId || id),
      layer: normalizeLayer(source.layer),
      location: "board",
    });
  }
  return Object.freeze(result);
}

function normalizeCoverGraph(coverGraph, tiles) {
  const result = {};
  for (const tileId of Object.keys(tiles)) {
    const blockers = coverGraph[tileId] || [];
    if (!Array.isArray(blockers) || new Set(blockers).size !== blockers.length || blockers.some(id => !tiles[id] || id === tileId)) {
      throw new TypeError("Triple cover graph contains an invalid blocker.");
    }
    result[tileId] = Object.freeze([...blockers]);
  }
  return Object.freeze(result);
}

function collectLayers(tiles) {
  const layers = {};
  for (const tile of Object.values(tiles)) (layers[tile.layer] ||= []).push(tile.id);
  return Object.freeze(Object.fromEntries(Object.entries(layers).map(([layer, ids]) => [layer, Object.freeze(ids)])));
}

function normalizeRoundId(roundId) {
  const value = Number(roundId);
  if (!Number.isInteger(value) || value < 1) throw new TypeError("Triple round ID must be a positive integer.");
  return value;
}

function normalizeLayer(layer) {
  const value = Number(layer ?? 0);
  if (!Number.isInteger(value) || value < 0) throw new TypeError("Triple tile layer must be a non-negative integer.");
  return value;
}

function countTrayType(tray, tiles, type) {
  return tray.reduce((count, id) => count + Number(tiles[id].type === type), 0);
}

function isCanonicalTray(tray, tiles) {
  const seenTypes = new Set();
  let previousType = null;
  for (const tileId of tray) {
    const type = tiles[tileId].type;
    if (type !== previousType && seenTypes.has(type)) return false;
    seenTypes.add(type);
    previousType = type;
  }
  return true;
}

function freezeSnapshot(snapshot) {
  return deepFreeze({
    ...snapshot,
    tiles: cloneTiles(snapshot.tiles),
    layers: cloneRecordOfArrays(snapshot.layers),
    coverGraph: cloneRecordOfArrays(snapshot.coverGraph),
    tray: [...snapshot.tray],
  });
}

function freezeState(state) {
  return deepFreeze({
    ...state,
    tiles: cloneTiles(state.tiles),
    layers: cloneRecordOfArrays(state.layers),
    coverGraph: cloneRecordOfArrays(state.coverGraph),
    tray: [...state.tray],
    undoHistory: [...state.undoHistory],
  });
}

function cloneTiles(tiles) {
  return Object.fromEntries(Object.entries(tiles).map(([id, tile]) => [id, { ...tile }]));
}

function cloneRecordOfArrays(record) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, [...value]]));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}
