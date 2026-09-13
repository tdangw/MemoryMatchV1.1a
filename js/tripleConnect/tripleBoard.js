import {
  TRIPLE_EASY_CONFIG,
  TRIPLE_EASY_FALLBACK_SEED,
  TRIPLE_EASY_GENERATOR_BUDGET,
  TRIPLE_EASY_LAYOUT,
  TRIPLE_NORMAL_CONFIG,
  TRIPLE_NORMAL_LAYOUT,
} from "./tripleConfig.js";
import { reduceTripleCommand } from "./tripleRules.js";
import { createTripleRoundState } from "./tripleState.js";
import { solveTripleBoard } from "./tripleSolver.js";

export function getEasyTripleLayout() {
  return TRIPLE_EASY_LAYOUT;
}
export function getNormalTripleLayout() { return TRIPLE_NORMAL_LAYOUT; }
export function generateNormalTripleBoard({ seed, solverOptions } = {}) {
  return generateBoard({ seed, layout: TRIPLE_NORMAL_LAYOUT, config: TRIPLE_NORMAL_CONFIG, solverOptions });
}

export function createTripleCoverGraph(layout = TRIPLE_EASY_LAYOUT) {
  validateLayout(layout);
  const graph = Object.fromEntries(layout.slots.map(slot => [slot.id, []]));
  for (const lower of layout.slots) {
    for (const higher of layout.slots) {
      if (higher.layer > lower.layer && rectanglesOverlap(lower, higher, layout)) graph[lower.id].push(higher.id);
    }
  }
  return Object.freeze(Object.fromEntries(Object.entries(graph).map(([slotId, blockers]) => [slotId, Object.freeze(blockers)])));
}

export function generateEasyTripleBoard({
  seed,
  maxAttempts = TRIPLE_EASY_GENERATOR_BUDGET.maxAttempts,
  solverOptions,
} = {}) {
  return generateBoard({ seed, maxAttempts, solverOptions, layout: TRIPLE_EASY_LAYOUT, config: TRIPLE_EASY_CONFIG });
}
function generateBoard({ seed, maxAttempts = TRIPLE_EASY_GENERATOR_BUDGET.maxAttempts, solverOptions, layout, config }) {
  const normalizedSeed = normalizeSeed(seed);
  const attempts = normalizeAttemptCount(maxAttempts);
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = buildSolutionFirstBoard({
      seed: `${normalizedSeed}:${attempt}`,
      layout, config,
    });
    const solved = solveTripleBoard({ board: candidate.board, ...solverOptions });
    if (solved.status === "solved") return freezeGeneratedBoard({ ...candidate, witness: solved.witness, source: "generated" });
  }
  const fallback = buildSolutionFirstBoard({ seed: TRIPLE_EASY_FALLBACK_SEED, layout, config });
  const solvedFallback = solveTripleBoard({ board: fallback.board, ...solverOptions });
  if (solvedFallback.status !== "solved") {
    throw new Error(`Triple fallback corpus failed solver validation: ${solvedFallback.status}`);
  }
  return freezeGeneratedBoard({ ...fallback, witness: solvedFallback.witness, source: "fallback" });
}

export function replayTripleWitness(board, witness) {
  let state;
  try {
    state = createTripleRoundState(board);
  } catch (error) {
    return { ok: false, reason: "invalid", error };
  }
  for (const command of witness || []) {
    const transition = reduceTripleCommand(state, command);
    if (!transition.result.ok) return { ok: false, reason: transition.result.reason, state };
    state = transition.nextState;
  }
  return { ok: state.status === "won", reason: state.status, state };
}

function buildSolutionFirstBoard({ seed, layout, config }) {
  const random = createSeededRng(seed);
  const coverGraphBySlot = createTripleCoverGraph(layout);
  const witnessSlots = createWitnessSlots(layout, random);
  const typeOrder = shuffle(Array.from({ length: config.tileCount / 3 }, (_, index) => `triple-${index + 1}`), random);
  const tilesBySlot = new Map();
  witnessSlots.forEach((slot, index) => {
    const type = typeOrder[Math.floor(index / 3)];
    tilesBySlot.set(slot.id, {
      id: `tile-${slot.id}`,
      type,
      slotId: slot.id,
      layer: slot.layer,
    });
  });
  const tiles = layout.slots.map(slot => tilesBySlot.get(slot.id));
  const tileIdBySlot = Object.fromEntries(tiles.map(tile => [tile.slotId, tile.id]));
  const coverGraph = Object.fromEntries(Object.entries(coverGraphBySlot).map(([slotId, blockers]) => [
    tileIdBySlot[slotId],
    blockers.map(blockerId => tileIdBySlot[blockerId]),
  ]));
  const witness = witnessSlots.map(slot => Object.freeze({ type: "select-tile", tileId: tileIdBySlot[slot.id] }));
  const board = Object.freeze({ roundId: 1, tiles: Object.freeze(tiles), coverGraph: Object.freeze(coverGraph) });
  const replay = replayTripleWitness(board, witness);
  if (!replay.ok) throw new Error(`Solution-first witness is invalid: ${replay.reason}`);
  return Object.freeze({ seed, layoutId: layout.id, board, witness });
}

function createWitnessSlots(layout, random) {
  const layers = new Map();
  for (const slot of layout.slots) {
    const layerSlots = layers.get(slot.layer) || [];
    layerSlots.push(slot);
    layers.set(slot.layer, layerSlots);
  }
  return [...layers.keys()]
    .sort((left, right) => right - left)
    .flatMap(layer => shuffle(layers.get(layer), random));
}

function rectanglesOverlap(first, second, layout) {
  const epsilon = layout.overlapEpsilon;
  return Math.min(first.x + layout.tileWidth, second.x + layout.tileWidth) - Math.max(first.x, second.x) > epsilon
    && Math.min(first.y + layout.tileHeight, second.y + layout.tileHeight) - Math.max(first.y, second.y) > epsilon;
}

function validateLayout(layout) {
  if (!layout || !Array.isArray(layout.slots) || !layout.slots.length || layout.tileWidth <= 0 || layout.tileHeight <= 0) {
    throw new TypeError("Triple layout is invalid.");
  }
  const slotIds = new Set();
  for (const slot of layout.slots) {
    if (!slot?.id || slotIds.has(slot.id) || !Number.isInteger(slot.layer) || slot.layer < 0
      || !Number.isFinite(slot.x) || !Number.isFinite(slot.y)) throw new TypeError("Triple layout slot is invalid.");
    slotIds.add(slot.id);
  }
}

function normalizeSeed(seed) {
  if (typeof seed === "string" && seed) return seed;
  if (Number.isFinite(seed)) return String(seed);
  return "triple-easy-default";
}

function normalizeAttemptCount(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) throw new TypeError("maxAttempts must be a non-negative integer.");
  return number;
}

function createSeededRng(seed) {
  let value = hashSeed(seed) || 1;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 4294967296;
  };
}

function hashSeed(seed) {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shuffle(values, random) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function freezeGeneratedBoard(result) {
  return Object.freeze({
    ...result,
    witness: Object.freeze([...result.witness]),
  });
}
