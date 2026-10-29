import { TRIPLE_RULES } from "./tripleConfig.js";

const STATUSES = new Set(["playing", "won", "lost", "disposed"]);
const LOCATIONS = new Set(["board", "tray", "removed"]);
// A round state is immutable. Cache its derived board view by identity so the
// reducer, renderer and HUD share one validated visibility calculation.
const boardViewCache = new WeakMap();

export function createTripleRoundState({ roundId = 1, tiles, coverGraph = {}, cornerStacks = {}, assetPathsByType = {}, trayCapacity = TRIPLE_RULES.trayCapacity } = {}) {
  const normalizedTiles = normalizeTiles(tiles);
  const normalizedCoverGraph = normalizeCoverGraph(coverGraph, normalizedTiles);
  const normalizedPiles = normalizePiles(cornerStacks, normalizedTiles);
  const state = {
    roundId: normalizeRoundId(roundId),
    status: "playing",
    tiles: normalizedTiles,
    layers: collectLayers(normalizedTiles),
    coverGraph: normalizedCoverGraph,
    cornerStacks: normalizedPiles,
    assetPathsByType: normalizeAssetPathsByType(assetPathsByType, normalizedTiles),
    trayCapacity: normalizeTrayCapacity(trayCapacity),
    tray: [],
    streakType: null,
    streakCount: 0,
    combo: 0,
    maxCombo: 0,
    misses: 0,
    moves: 0,
    score: 0,
    matchedTriples: 0,
    claimedLuckyIds: [],
    milestoneTileIds: [],
    undoHistory: [],
    initialTileCount: Object.keys(normalizedTiles).length,
  };
  assertTripleStateInvariant(state);
  return freezeState(state);
}

export function endTripleRound(state) {
  assertTripleStateInvariant(state);
  if (state.status !== "playing") return state;
  return freezeState({ ...state, status: "lost", undoHistory: [] });
}

export function getExposedTileIds(state) {
  return [...createTripleBoardView(state).exposedTileIds];
}

/** Internal solver path: reducer-created states have already crossed validation. */
export function getExposedTileIdsFromTrustedState(state) {
  return [...createTripleBoardViewFromTrustedState(state).exposedTileIds];
}

/** Same tray-first, stable board order for the reducer and hint. State is validated by their boundary. */
export function getTripleMagnetTargetIdsFromTrustedState(state, tileId) {
  const type = state.tiles[tileId].type;
  const targets = [];
  for (const id of state.tray) {
    if (id !== tileId && state.tiles[id].type === type) targets.push(id);
    if (targets.length === 2) return targets;
  }
  const boardTargets = Object.keys(state.tiles).filter(id =>
    id !== tileId && state.tiles[id].location === 'board' && state.tiles[id].type === type).sort();
  for (const id of boardTargets) {
    targets.push(id);
    if (targets.length === 2) break;
  }
  return targets;
}

export function isTripleTileExposed(state, tileId) {
  return createTripleBoardView(state).exposedTileIds.has(tileId);
}

export function isTripleTileVisible(state, tileId) {
  return createTripleBoardView(state).visibleTileIds.has(tileId);
}

export function getTripleVisibleTileIds(state) {
  return [...createTripleBoardView(state).visibleTileIds];
}

export function getTriplePileDepth(state, tileId) {
  const view = createTripleBoardView(state);
  const pileId = view.pileByTileId.get(tileId);
  return pileId ? view.remainingDepthByPileId.get(pileId) : 1;
}

/** Derives pile visibility once per state boundary for render and UI consumers. */
export function createTripleBoardView(state) {
  assertTripleStateInvariant(state);
  return createTripleBoardViewFromTrustedState(state);
}

/** Internal runtime path for immutable state produced by validated boundaries. */
export function createTripleBoardViewFromTrustedState(state) {
  const cached = boardViewCache.get(state);
  if (cached) return cached;
  const pileByTileId = new Map();
  const topByPileId = new Map();
  const remainingDepthByPileId = new Map();
  for (const [pileId, pile] of Object.entries(state.cornerStacks)) {
    let topTileId = null;
    let remainingDepth = 0;
    for (let index = pile.tileIds.length - 1; index >= 0; index -= 1) {
      const tileId = pile.tileIds[index];
      pileByTileId.set(tileId, pileId);
      if (state.tiles[tileId].location === "board") {
        remainingDepth += 1;
        if (!topTileId) topTileId = tileId;
      }
    }
    topByPileId.set(pileId, topTileId);
    remainingDepthByPileId.set(pileId, remainingDepth);
  }
  const visibleTileIds = new Set();
  const exposedTileIds = new Set();
  for (const tile of Object.values(state.tiles)) {
    const pileId = pileByTileId.get(tile.id);
    const visible = tile.location === "tray"
      || (tile.location === "board" && (!pileId || topByPileId.get(pileId) === tile.id));
    if (!visible) continue;
    visibleTileIds.add(tile.id);
    if (tile.location === "board"
      && state.coverGraph[tile.id].every((blockerId) => state.tiles[blockerId].location !== "board")) {
      exposedTileIds.add(tile.id);
    }
  }
  const view = Object.freeze({
    pileByTileId,
    topByPileId,
    remainingDepthByPileId,
    visibleTileIds,
    exposedTileIds,
  });
  boardViewCache.set(state, view);
  return view;
}

export function assertTripleStateInvariant(state) {
  if (!state || !STATUSES.has(state.status)) throw new TypeError("Triple state has an invalid status.");
  const tiles = state.tiles || {};
  const tileIds = Object.keys(tiles);
  if (!tileIds.length || tileIds.length % TRIPLE_RULES.matchSize !== 0) {
    throw new TypeError("Triple state tile count must be a positive multiple of three.");
  }
  if (state.initialTileCount !== tileIds.length) throw new TypeError("Triple state initial tile count changed.");
  if (!Array.isArray(state.tray) || state.tray.length > normalizeTrayCapacity(state.trayCapacity)) {
    throw new TypeError("Triple state tray is invalid.");
  }
  const trayIds = new Set(state.tray);
  if (trayIds.size !== state.tray.length) throw new TypeError("Triple state tray contains duplicate tile IDs.");
  if (state.tray.some((tileId) => !tiles[tileId])) {
    throw new TypeError("Triple state tray contains an unknown tile ID.");
  }

  let magnetCount = 0;
  const locations = { board: 0, tray: 0, removed: 0 };
  const types = new Map();
  const hasPiles = Object.keys(state.cornerStacks || {}).length > 0;
  const slotIds = hasPiles ? new Map() : new Set();
  for (const [tileId, tile] of Object.entries(tiles)) {
    if (!tile || tile.id !== tileId || !tile.type || !tile.slotId || !LOCATIONS.has(tile.location)
      || (!hasPiles && slotIds.has(tile.slotId))) {
      throw new TypeError("Triple state contains an invalid tile.");
    }
    if (hasPiles) {
      const tilesAtSlot = slotIds.get(tile.slotId) || [];
      tilesAtSlot.push(tileId);
      slotIds.set(tile.slotId, tilesAtSlot);
    } else slotIds.add(tile.slotId);
    if (tile.magnet !== undefined && typeof tile.magnet !== 'boolean' || tile.magnet && (tile.lucky || ++magnetCount > 1)) throw new TypeError('Invalid Triple Magnet metadata.');
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
  if (!state.presentationPreview && Object.values(tiles).some(tile => tile.location === "tray" && countTrayType(state.tray, tiles, tile.type) >= TRIPLE_RULES.matchSize)) {
    throw new TypeError("Stable triple tray cannot retain a completed triple.");
  }
  if (!isCanonicalTray(state.tray, tiles)) throw new TypeError("Triple tray order is not canonical.");
  if (!Number.isInteger(state.streakCount) || state.streakCount < 0
    || (state.streakCount === 0) !== (state.streakType === null)
    || (state.streakType !== null && typeof state.streakType !== "string")) {
    throw new TypeError("Triple streak is invalid.");
  }
  if ([state.combo, state.maxCombo, state.misses, state.moves, state.score, state.matchedTriples].some(value => !Number.isInteger(value) || value < 0)
    || state.maxCombo < state.combo) {
    throw new TypeError("Triple counters are invalid.");
  }
  if (!Array.isArray(state.undoHistory) || state.undoHistory.length > state.initialTileCount) {
    throw new TypeError("Triple undo history is invalid.");
  }
  if (!Array.isArray(state.claimedLuckyIds) || new Set(state.claimedLuckyIds).size !== state.claimedLuckyIds.length
    || state.claimedLuckyIds.some((id) => typeof id !== "string" || !id)) {
    throw new TypeError("Triple Lucky claim ledger is invalid.");
  }
  if (!Array.isArray(state.milestoneTileIds) || new Set(state.milestoneTileIds).size !== state.milestoneTileIds.length
    || state.milestoneTileIds.some((id) => !tiles[id])) {
    throw new TypeError("Triple milestone tile ledger is invalid.");
  }
  if (!state.coverGraph || !state.layers) throw new TypeError("Triple board state is incomplete.");
  if (hasPiles) assertPilesInvariant(state.cornerStacks, tiles, slotIds);
  if (!state.assetPathsByType || typeof state.assetPathsByType !== "object"
    || Object.entries(state.assetPathsByType).some(([type, path]) => !types.has(type) || typeof path !== "string" || !path)) {
    throw new TypeError("Triple asset mapping is invalid.");
  }
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
  return createTripleStateSnapshotFromTrustedState(state);
}

/** Reducer-only snapshot: the caller has already validated this immutable state. */
export function createTripleStateSnapshotFromTrustedState(state) {
  return freezeSnapshot({
    roundId: state.roundId,
    status: state.status,
    tiles: state.tiles,
    layers: state.layers,
    coverGraph: state.coverGraph,
    cornerStacks: state.cornerStacks,
    assetPathsByType: state.assetPathsByType,
    trayCapacity: state.trayCapacity,
    tray: state.tray,
    streakType: state.streakType,
    streakCount: state.streakCount,
    combo: state.combo,
    maxCombo: state.maxCombo,
    misses: state.misses,
    moves: state.moves,
    score: state.score,
    matchedTriples: state.matchedTriples,
    claimedLuckyIds: state.claimedLuckyIds,
    milestoneTileIds: state.milestoneTileIds,
    initialTileCount: state.initialTileCount,
  });
}

export function restoreTripleStateSnapshot(snapshot, undoHistory) {
  const state = {
    ...snapshot,
    trayCapacity: normalizeTrayCapacity(snapshot.trayCapacity),
    undoHistory,
  };
  assertTripleStateInvariant(state);
  return freezeState(state);
}

export function serializeTripleRoundState(state) {
  const snapshot = createTripleStateSnapshot(state);
  return {
    roundId: snapshot.roundId,
    status: snapshot.status,
    tiles: Object.values(snapshot.tiles),
    layers: snapshot.layers,
    coverGraph: snapshot.coverGraph,
    cornerStacks: snapshot.cornerStacks,
    assetPathsByType: snapshot.assetPathsByType,
    tray: snapshot.tray,
    streakType: snapshot.streakType,
    streakCount: snapshot.streakCount,
    combo: snapshot.combo,
    maxCombo: snapshot.maxCombo,
    misses: snapshot.misses,
    moves: snapshot.moves,
    score: snapshot.score,
    matchedTriples: snapshot.matchedTriples,
    initialTileCount: snapshot.initialTileCount,
    claimedLuckyIds: snapshot.claimedLuckyIds,
    milestoneTileIds: snapshot.milestoneTileIds,
  };
}

export function restoreSerializedTripleRoundState(snapshot, { trayCapacity = TRIPLE_RULES.trayCapacity } = {}) {
  if (!snapshot || !Array.isArray(snapshot.tiles) || !snapshot.cornerStacks || typeof snapshot.cornerStacks !== "object") throw new TypeError("Triple snapshot is invalid.");
  const tiles = Object.fromEntries(snapshot.tiles.map(tile => [tile?.id, tile]));
  if (Object.keys(tiles).length !== snapshot.tiles.length) throw new TypeError("Triple snapshot has duplicate tiles.");
  // Capacity is derived from the profile entitlement when a session is restored,
  // rather than stored in a round snapshot that can become stale after purchase.
  return restoreTripleStateSnapshot({ ...snapshot, trayCapacity, tiles }, []);
}

function normalizeTiles(tiles) {
  if (!Array.isArray(tiles)) throw new TypeError("Triple round requires a tile array.");
  const result = {};
  for (const source of tiles) {
    const id = String(source?.id || "");
    const type = String(source?.type || "");
    if (!id || !type || result[id]) throw new TypeError("Triple tile IDs and types must be unique and non-empty.");
    if (source.magnet !== undefined && typeof source.magnet !== 'boolean') throw new TypeError('Invalid Triple Magnet metadata.');
    result[id] = Object.freeze({
      id,
      type,
      slotId: String(source.slotId || id),
      layer: normalizeLayer(source.layer),
      location: "board",
      lucky: normalizeLucky(source.lucky),
      ...(source.magnet === true ? { magnet: true } : {}),
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

function normalizePiles(piles, tiles) {
  const source = piles && typeof piles === "object" && !Array.isArray(piles) ? piles : {};
  const normalized = {};
  for (const [pileId, value] of Object.entries(source)) {
    const anchorSlotId = String(value?.anchorSlotId || "");
    const tileIds = Array.isArray(value?.tileIds) ? value.tileIds.map(String) : [];
    if (!pileId || !anchorSlotId || tileIds.length < 2 || new Set(tileIds).size !== tileIds.length
      || tileIds.some((tileId) => !tiles[tileId] || tiles[tileId].slotId !== anchorSlotId)) {
      throw new TypeError("Triple pile metadata is invalid.");
    }
    normalized[pileId] = Object.freeze({ anchorSlotId, tileIds: Object.freeze(tileIds) });
  }
  return Object.freeze(normalized);
}

function assertPilesInvariant(piles, tiles, slotIds) {
  if (!piles || typeof piles !== "object") throw new TypeError("Triple piles are invalid.");
  const pileByTileId = new Map();
  for (const [pileId, pile] of Object.entries(piles)) {
    if (!pile || pile.anchorSlotId === "" || !Array.isArray(pile.tileIds) || pile.tileIds.length < 2
      || new Set(pile.tileIds).size !== pile.tileIds.length) throw new TypeError("Triple pile is invalid.");
    for (const tileId of pile.tileIds) {
      if (!tiles[tileId] || tiles[tileId].slotId !== pile.anchorSlotId || pileByTileId.has(tileId))
        throw new TypeError("Triple pile membership is invalid.");
      pileByTileId.set(tileId, pileId);
    }
  }
  for (const [slotId, tileIds] of slotIds) {
    if (tileIds.length === 1) {
      if (pileByTileId.has(tileIds[0])) throw new TypeError("Triple pile cannot contain a single tile.");
      continue;
    }
    const pileId = pileByTileId.get(tileIds[0]);
    const pile = pileId ? piles[pileId] : null;
    if (!pile || pile.anchorSlotId !== slotId || pile.tileIds.length !== tileIds.length
      || tileIds.some((tileId) => pileByTileId.get(tileId) !== pileId)) {
      throw new TypeError("Triple tiles sharing an anchor require one pile.");
    }
  }
}

function normalizeAssetPathsByType(value, tiles) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const types = new Set(Object.values(tiles).map((tile) => tile.type));
  return Object.freeze(Object.fromEntries(Object.entries(source).flatMap(([type, path]) => (
    types.has(type) && typeof path === "string" && path ? [[type, path]] : []
  ))));
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

function normalizeTrayCapacity(value) {
  const capacity = Number(value ?? TRIPLE_RULES.trayCapacity);
  if (!Number.isInteger(capacity)
    || capacity < TRIPLE_RULES.trayCapacity
    || capacity > TRIPLE_RULES.trayCapacity + 3)
    throw new TypeError("Triple tray capacity is invalid.");
  return capacity;
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
    cornerStacks: clonePiles(snapshot.cornerStacks),
    assetPathsByType: { ...(snapshot.assetPathsByType || {}) },
    tray: [...snapshot.tray],
    milestoneTileIds: [...(snapshot.milestoneTileIds || [])],
  });
}

function freezeState(state) {
  return deepFreeze({
    ...state,
    tiles: cloneTiles(state.tiles),
    layers: cloneRecordOfArrays(state.layers),
    coverGraph: cloneRecordOfArrays(state.coverGraph),
    cornerStacks: clonePiles(state.cornerStacks),
    assetPathsByType: { ...(state.assetPathsByType || {}) },
    tray: [...state.tray],
    undoHistory: [...state.undoHistory],
    claimedLuckyIds: [...state.claimedLuckyIds],
    milestoneTileIds: [...state.milestoneTileIds],
  });
}

export function claimTripleLuckyRewards(state, luckyIds) {
  assertTripleStateInvariant(state);
  const additions = [...new Set(luckyIds || [])].filter((id) =>
    typeof id === "string" && !state.claimedLuckyIds.includes(id),
  );
  if (!additions.length) return state;
  return restoreTripleStateSnapshot({
    ...createTripleStateSnapshot(state),
    claimedLuckyIds: [...state.claimedLuckyIds, ...additions],
  }, state.undoHistory);
}

export function claimTripleMilestoneTiles(state, tileIds) {
  assertTripleStateInvariant(state);
  const additions = [...new Set(tileIds || [])].filter((id) =>
    typeof id === "string" && state.tiles[id] && !state.milestoneTileIds.includes(id),
  );
  if (!additions.length) return state;
  return restoreTripleStateSnapshot({
    ...createTripleStateSnapshot(state),
    milestoneTileIds: [...state.milestoneTileIds, ...additions],
  }, state.undoHistory);
}

function normalizeLucky(value) {
  if (!value) return null;
  const id = String(value.id || "");
  const type = value.reward?.type;
  const amount = value.reward?.amount;
  if (!id || !["coins", "time", "hint"].includes(type) || !Number.isInteger(amount) || amount < 1)
    throw new TypeError("Triple Lucky metadata is invalid.");
  return Object.freeze({ id, reward: Object.freeze({ type, amount }) });
}

function cloneTiles(tiles) {
  return Object.fromEntries(Object.entries(tiles).map(([id, tile]) => [id, { ...tile }]));
}

function cloneRecordOfArrays(record) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, [...value]]));
}

function clonePiles(piles) {
  return Object.fromEntries(Object.entries(piles || {}).map(([id, pile]) => [id, {
    anchorSlotId: pile.anchorSlotId,
    tileIds: [...pile.tileIds],
  }]));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}
