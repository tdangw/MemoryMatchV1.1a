import { calculateTripleMatchScore, TRIPLE_RULES } from "./tripleConfig.js";
import {
  assertTripleStateInvariant,
  createTripleStateSnapshot,
  isTripleTileExposed,
  restoreTripleStateSnapshot,
} from "./tripleState.js";

export function reduceTripleCommand(state, command) {
  assertTripleStateInvariant(state);
  if (!command || typeof command.type !== "string") return reject(state, "invalid-command");
  if (command.type === "select-tile") return selectTile(state, command.tileId);
  if (command.type === "undo") return undoSelection(state);
  return reject(state, "unknown-command");
}

function selectTile(state, tileId) {
  if (state.status !== "playing") return reject(state, "round-not-playing");
  const tile = state.tiles[tileId];
  if (!tile) return reject(state, "unknown-tile");
  if (tile.location !== "board") return reject(state, "tile-not-on-board");
  if (!isTripleTileExposed(state, tileId)) return reject(state, "tile-covered");

  const snapshot = createTripleStateSnapshot(state);
  const tiles = cloneTiles(state.tiles);
  tiles[tileId] = { ...tile, location: "tray" };
  let tray = insertCanonical(state.tray, tileId, tiles);
  let streakType = state.streakType;
  let streakCount = state.streakCount;
  let misses = state.misses;
  let combo = state.combo;
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
    const points = calculateTripleMatchScore(combo);
    score += points;
    matchedTriples += 1;
    streakType = null;
    streakCount = 0;
    events.push({ type: "triple-resolved", tileIds: matchingIds, points, combo });
  }

  let status = "playing";
  if (countTilesAt(tiles, "board") === 0 && tray.length === 0) {
    status = "won";
    events.push({ type: "round-won" });
  } else if (tray.length === TRIPLE_RULES.trayCapacity || countTilesAt(tiles, "board") === 0) {
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
  const nextState = restoreTripleStateSnapshot(state.undoHistory.at(-1), history);
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
    tray: changes.tray,
    streakType: changes.streakType,
    streakCount: changes.streakCount,
    combo: changes.combo,
    misses: changes.misses,
    moves: changes.moves,
    score: changes.score,
    matchedTriples: changes.matchedTriples,
    initialTileCount: previous.initialTileCount,
  }, changes.undoHistory);
}
