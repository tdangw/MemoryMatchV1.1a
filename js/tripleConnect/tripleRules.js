import { calculateTripleMatchScore, TRIPLE_RULES } from "./tripleConfig.js";
import {
  assertTripleStateInvariant,
  claimTripleMilestoneTiles,
  createTripleStateSnapshotFromTrustedState,
  createTripleBoardViewFromTrustedState,
  restoreTripleStateSnapshot,
} from "./tripleState.js";

export function reduceTripleCommand(state, command) {
  assertTripleStateInvariant(state);
  return reduceTrustedTripleCommand(state, command);
}

/** Controller path for immutable states already validated at creation/restore boundaries. */
export function reduceTrustedTripleCommand(state, command) {
  if (!command || typeof command.type !== "string") return reject(state, "invalid-command");
  if (command.type === "select-tile") return selectTile(state, command.tileId);
  if (command.type === "undo") return undoSelection(state);
  if (command.type === "expire-combo") return expireCombo(state);
  return reject(state, "unknown-command");
}

function expireCombo(state) {
  if (state.status !== "playing") return reject(state, "round-not-playing");
  if (state.combo === 0) return reject(state, "combo-inactive");
  const nextState = restoreTripleStateSnapshot({
    ...createTripleStateSnapshotFromTrustedState(state),
    combo: 0,
  }, state.undoHistory);
  return {
    nextState,
    events: Object.freeze([{ type: "combo-expired" }]),
    result: Object.freeze({ ok: true, reason: null }),
  };
}

function selectTile(state, tileId) {
  if (state.status !== "playing") return reject(state, "round-not-playing");
  const tile = state.tiles[tileId];
  if (!tile) return reject(state, "unknown-tile");
  if (tile.location !== "board") return reject(state, "tile-not-on-board");
  if (!createTripleBoardViewFromTrustedState(state).exposedTileIds.has(tileId))
    return reject(state, "tile-covered");

  const snapshot = createTripleStateSnapshotFromTrustedState(state);
  const tiles = cloneTiles(state.tiles);
  tiles[tileId] = { ...tile, location: "tray" };
  let tray = insertCanonical(state.tray, tileId, tiles);
  let streakType = state.streakType;
  let streakCount = state.streakCount;
  let misses = state.misses;
  let combo = state.combo;
  let maxCombo = state.maxCombo;
  let score = state.score;
  let matchedTriples = state.matchedTriples;
  const events = [{ type: "tile-selected", tileId }];

  if (streakType && streakType !== tile.type) {
    misses += 1;
    combo = 0;
    streakType = tile.type;
    streakCount = 1;
    events.push({ type: "miss", tileId });
  } else {
    streakType = tile.type;
    streakCount += 1;
  }

  const matchingIds = tray.filter(id => tiles[id].type === tile.type);
  if (matchingIds.length === TRIPLE_RULES.matchSize) {
    matchingIds.forEach(id => { tiles[id] = { ...tiles[id], location: "removed" }; });
    tray = tray.filter(id => !matchingIds.includes(id));
    combo += 1;
    maxCombo = Math.max(maxCombo, combo);
    const points = calculateTripleMatchScore(combo);
    score += points;
    matchedTriples += 1;
    streakType = null;
    streakCount = 0;
    events.push({ type: "triple-resolved", tileIds: matchingIds, points, combo });
    const luckyRewards = matchingIds
      .map((id) => tiles[id].lucky)
      .filter((lucky) => lucky && !state.claimedLuckyIds.includes(lucky.id));
    if (luckyRewards.length) events.push({ type: "lucky-resolved", rewards: luckyRewards });
  }

  let status = "playing";
  if (countTilesAt(tiles, "board") === 0 && tray.length === 0) {
    status = "won";
    events.push({ type: "round-won" });
  } else if (tray.length === state.trayCapacity || countTilesAt(tiles, "board") === 0) {
    status = "lost";
    events.push({ type: "round-lost" });
  }
  const nextState = freezeNextState(state, {
    status,
    tiles,
    tray,
    streakType,
    streakCount,
    combo,
    maxCombo,
    misses,
    moves: state.moves + 1,
    score,
    matchedTriples,
    undoHistory: appendHistory(state.undoHistory, snapshot, state.initialTileCount),
  });
  return { nextState, events: Object.freeze(events), result: Object.freeze({ ok: true, reason: null }) };
}

function undoSelection(state) {
  if (state.status !== "playing") return reject(state, "round-not-playing");
  if (!state.undoHistory.length) return reject(state, "undo-empty");
  const history = state.undoHistory.slice(0, -1);
  // Milestone attribution is a durable round ledger, not a reversible board move.
  // Restoring an older board snapshot must not make the same tiles earn progress twice.
  const restored = restoreTripleStateSnapshot(state.undoHistory.at(-1), history);
  const nextState = claimTripleMilestoneTiles(restored, state.milestoneTileIds);
  return {
    nextState,
    events: Object.freeze([{ type: "undo-restored" }]),
    result: Object.freeze({ ok: true, reason: null }),
  };
}

function reject(state, reason) {
  return { nextState: state, events: Object.freeze([]), result: Object.freeze({ ok: false, reason }) };
}

function insertCanonical(tray, tileId, tiles) {
  const type = tiles[tileId].type;
  const lastSameType = tray.map(id => tiles[id].type).lastIndexOf(type);
  if (lastSameType === -1) return [...tray, tileId];
  return [...tray.slice(0, lastSameType + 1), tileId, ...tray.slice(lastSameType + 1)];
}

function appendHistory(history, snapshot, limit) {
  return [...history, snapshot].slice(-limit);
}

function countTilesAt(tiles, location) {
  return Object.values(tiles).filter(tile => tile.location === location).length;
}

function cloneTiles(tiles) {
  return Object.fromEntries(Object.entries(tiles).map(([id, tile]) => [id, { ...tile }]));
}

function freezeNextState(previous, changes) {
  return restoreTripleStateSnapshot({
    roundId: previous.roundId,
    status: changes.status,
    tiles: changes.tiles,
    layers: previous.layers,
    coverGraph: previous.coverGraph,
    cornerStacks: previous.cornerStacks,
    assetPathsByType: previous.assetPathsByType,
    trayCapacity: previous.trayCapacity,
    tray: changes.tray,
    streakType: changes.streakType,
    streakCount: changes.streakCount,
    combo: changes.combo,
    maxCombo: changes.maxCombo,
    misses: changes.misses,
    moves: changes.moves,
    score: changes.score,
    matchedTriples: changes.matchedTriples,
    claimedLuckyIds: changes.claimedLuckyIds ?? previous.claimedLuckyIds,
    milestoneTileIds: changes.milestoneTileIds ?? previous.milestoneTileIds,
    initialTileCount: previous.initialTileCount,
  }, changes.undoHistory);
}
