import {
  TRIPLE_EASY_CONFIG,
  TRIPLE_EASY_FALLBACK_SEED,
  TRIPLE_EASY_GENERATOR_BUDGET,
  TRIPLE_EASY_SOLVER_BUDGET,
  TRIPLE_EASY_LAYOUT,
  TRIPLE_NORMAL_CONFIG,
  TRIPLE_NORMAL_LAYOUT,
  TRIPLE_HARD_CONFIG,
  TRIPLE_HARD_LAYOUT,
  TRIPLE_HARD_SOLVER_BUDGET,
  TRIPLE_SUPER_HARD_CONFIG,
  TRIPLE_SUPER_HARD_LAYOUT,
  TRIPLE_SUPER_HARD_SOLVER_BUDGET,
  TRIPLE_ENDLESS_CONFIG,
  TRIPLE_ENDLESS_LAYOUT,
  TRIPLE_CHALLENGE_LAYOUTS,
  getTripleChallengeStage,
  getTripleModeConfig,
  TRIPLE_LUCKY_REWARDS,
  TRIPLE_CORNER_STACK_CORNERS,
} from "./tripleConfig.js";
import { reduceTripleCommand } from "./tripleRules.js";
import { createTripleRoundState } from "./tripleState.js";
import { solveTripleBoard } from "./tripleSolver.js";
import { compileTriplePattern } from './triplePatterns.js';

export function getEasyTripleLayout() {
  return TRIPLE_EASY_LAYOUT;
}
export function getNormalTripleLayout() {
  return TRIPLE_NORMAL_LAYOUT;
}
export function getTripleLayout(layoutId) {
  const pattern = /^matrix-(?:(v2)-)?([0-9]{2})-(easy|normal|hard|super-hard|endless|challenge-[1-7])$/.exec(layoutId);
  if (pattern) {
    const [, revision, index, baseId] = pattern;
    const config = baseId.startsWith('challenge-') ? getTripleChallengeStage(Number(baseId.slice(10))) : getTripleModeConfig(baseId === 'super-hard' ? 'superHard' : baseId);
    return compileTriplePattern({ index: Number(index), config, baseLayout: getTripleLayout(baseId), version:revision?2:1 });
  }
  const layouts = [
    TRIPLE_EASY_LAYOUT,
    TRIPLE_NORMAL_LAYOUT,
    TRIPLE_HARD_LAYOUT,
    TRIPLE_SUPER_HARD_LAYOUT,
    TRIPLE_ENDLESS_LAYOUT,
    ...TRIPLE_CHALLENGE_LAYOUTS,
  ];
  const layout = layouts.find((candidate) => candidate.id === layoutId);
  if (!layout) throw new TypeError(`Unsupported Triple layout: ${layoutId}`);
  return layout;
}
export function generateNormalTripleBoard({ seed, solverOptions } = {}) {
  return generateBoard({
    seed,
    layout: TRIPLE_NORMAL_LAYOUT,
    config: TRIPLE_NORMAL_CONFIG,
    solverOptions,
  });
}
export function generateHardTripleBoard({ seed, solverOptions } = {}) {
  return generateBoard({
    seed,
    maxAttempts: 1,
    layout: TRIPLE_HARD_LAYOUT,
    config: TRIPLE_HARD_CONFIG,
    solverOptions: { ...TRIPLE_HARD_SOLVER_BUDGET, ...solverOptions },
  });
}
export function generateSuperHardTripleBoard({ seed, solverOptions } = {}) {
  return generateBoard({
    seed,
    maxAttempts: 1,
    layout: TRIPLE_SUPER_HARD_LAYOUT,
    config: TRIPLE_SUPER_HARD_CONFIG,
    solverOptions: { ...TRIPLE_SUPER_HARD_SOLVER_BUDGET, ...solverOptions },
  });
}
export function generateEndlessTripleBoard({ seed, solverOptions } = {}) {
  return generateBoard({
    seed,
    maxAttempts: 1,
    layout: TRIPLE_ENDLESS_LAYOUT,
    config: TRIPLE_ENDLESS_CONFIG,
    solverOptions: { ...TRIPLE_SUPER_HARD_SOLVER_BUDGET, ...solverOptions },
  });
}

export function generateChallengeTripleBoard({ seed, level = 1, solverOptions, luckyCount } = {}) {
  const stage = getTripleChallengeStage(level);
  const generated = generateBoard({
    seed,
    maxAttempts: 1,
    fallbackSeed: `triple-challenge-${stage.tileCount}-fallback`,
    layout: getTripleLayout(stage.layoutId),
    config: stage,
    solverOptions: { ...stage.solverBudget, ...solverOptions },
  });
  return decorateChallengeLuckies(generated, `${seed || stage.layoutId}:lucky`, luckyCount);
}

export function createTripleCoverGraph(layout = TRIPLE_EASY_LAYOUT) {
  validateTripleLayout(layout);
  const graph = Object.fromEntries(layout.slots.map((slot) => [slot.id, []]));
  for (const lower of layout.slots) {
    for (const higher of layout.slots) {
      if (
        higher.layer > lower.layer &&
        rectanglesOverlap(lower, higher, layout)
      )
        graph[lower.id].push(higher.id);
    }
  }
  return Object.freeze(
    Object.fromEntries(
      Object.entries(graph).map(([slotId, blockers]) => [
        slotId,
        Object.freeze(blockers),
      ]),
    ),
  );
}

export function generateEasyTripleBoard({
  seed,
  maxAttempts = TRIPLE_EASY_GENERATOR_BUDGET.maxAttempts,
  solverOptions,
} = {}) {
  return generateBoard({
    seed,
    maxAttempts,
    solverOptions,
    layout: TRIPLE_EASY_LAYOUT,
    config: TRIPLE_EASY_CONFIG,
  });
}
export function generatePatternTripleBoard({ mode = 'easy', level = 1, patternIndex = 0, seed, solverOptions } = {}) {
  const config = mode === 'challenge' ? getTripleChallengeStage(level) : getTripleModeConfig(mode);
  const baseId = mode === 'challenge' ? config.layoutId : mode === 'superHard' ? 'super-hard' : mode;
  const layout = compileTriplePattern({ index: patternIndex, config, baseLayout: getTripleLayout(baseId) });
  const budget = mode === 'challenge' ? config.solverBudget : mode === 'hard' ? TRIPLE_HARD_SOLVER_BUDGET
    : ['superHard', 'endless'].includes(mode) ? TRIPLE_SUPER_HARD_SOLVER_BUDGET : TRIPLE_EASY_SOLVER_BUDGET;
  const generated = generateBoard({ seed, layout, config, solverOptions: { ...budget, ...solverOptions },
    maxAttempts: ['easy', 'normal'].includes(mode) ? TRIPLE_EASY_GENERATOR_BUDGET.maxAttempts : 1,
    fallbackSeed: `${layout.id}:certified-fallback` });
  return mode === 'challenge' ? decorateChallengeLuckies(generated, `${seed}:lucky`) : generated;
}

function generateBoard({
  seed,
  maxAttempts = TRIPLE_EASY_GENERATOR_BUDGET.maxAttempts,
  fallbackSeed = TRIPLE_EASY_FALLBACK_SEED,
  solverOptions,
  layout,
  config,
}) {
  const normalizedSeed = normalizeSeed(seed);
  const attempts = normalizeAttemptCount(maxAttempts);
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const candidate = buildSolutionFirstBoard({
      seed: `${normalizedSeed}:${attempt}`,
      layout,
      config,
    });
    const solved = solveTripleBoard({
      board: candidate.board,
      preferredWitness: candidate.witness,
      now: createDeterministicSolverClock(),
      ...solverOptions,
    });
    if (solved.status === "solved")
      return freezeGeneratedBoard({
        ...candidate,
        witness: solved.witness,
        source: "generated",
      });
  }
  const fallback = buildSolutionFirstBoard({
    seed: fallbackSeed,
    layout,
    config,
  });
  const solvedFallback = solveTripleBoard({
    board: fallback.board,
    preferredWitness: fallback.witness,
    now: createDeterministicSolverClock(),
    ...solverOptions,
  });
  if (solvedFallback.status !== "solved") {
    throw new Error(
      `Triple fallback corpus failed solver validation: ${solvedFallback.status}`,
    );
  }
  return freezeGeneratedBoard({
    ...fallback,
    witness: solvedFallback.witness,
    source: "fallback",
  });
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
    if (!transition.result.ok)
      return { ok: false, reason: transition.result.reason, state };
    state = transition.nextState;
  }
  return { ok: state.status === "won", reason: state.status, state };
}

function buildSolutionFirstBoard({ seed, layout, config }) {
  const random = createSeededRng(seed);
  const coverGraphBySlot = createTripleCoverGraph(layout);
  const stackPlan = createCornerStackPlan(layout, config);
  const witnessSlots = createWitnessSlots(layout, random, stackPlan.stackSlots);
  if (witnessSlots.length !== config.tileCount || config.tileCount % 3 !== 0)
    throw new TypeError("Triple pile configuration does not match its tile count.");
  const typeOrder = shuffle(
    Array.from(
      { length: config.tileCount / 3 },
      (_, index) => `triple-${index + 1}`,
    ),
    random,
  );
  const tiles = [];
  const tileIdsBySlot = new Map();
  witnessSlots.forEach((slot, index) => {
    const type = typeOrder[Math.floor(index / 3)];
    const tile = {
      id: (stackPlan.depthBySlot.get(slot.id) || 1) > 1
        ? `tile-${slot.id}-${index + 1}`
        : `tile-${slot.id}`,
      type,
      slotId: slot.id,
      layer: slot.layer,
    };
    tiles.push(tile);
    const tileIdsAtSlot = tileIdsBySlot.get(slot.id) || [];
    tileIdsAtSlot.push(tile.id);
    tileIdsBySlot.set(slot.id, tileIdsAtSlot);
  });
  const cornerStacks = Object.fromEntries(
    [...stackPlan.depthBySlot.entries()]
      .filter(([, depth]) => depth > 1)
      .map(([slotId]) => [`stack-${slotId}`, Object.freeze({
        anchorSlotId: slotId,
        // Witness visits a pile from top to bottom; stored state is bottom to top.
        tileIds: Object.freeze([...tileIdsBySlot.get(slotId)].reverse()),
      })]),
  );
  const coverGraph = Object.fromEntries(
    tiles.map((tile) => [
      tile.id,
      (coverGraphBySlot[tile.slotId] || []).flatMap((blockerSlotId) => tileIdsBySlot.get(blockerSlotId)),
    ]),
  );
  tiles.at(-1).magnet = true;
  const witness = tiles.map((tile) =>
    Object.freeze({ type: "select-tile", tileId: tile.id }),
  );
  const board = Object.freeze({
    roundId: 1,
    tiles: Object.freeze(tiles),
    coverGraph: Object.freeze(coverGraph),
    cornerStacks: Object.freeze(cornerStacks),
  });
  const replay = replayTripleWitness(board, witness);
  if (!replay.ok)
    throw new Error(`Solution-first witness is invalid: ${replay.reason}`);
  return Object.freeze({ seed, layoutId: layout.id, board, witness });
}

function createCornerStackPlan(layout, config) {
  if (!Array.isArray(config.cornerStackSizes)) {
    if (config.tileCount === layout.slots.length)
      return { depthBySlot: new Map(), stackSlots: [] };
    throw new TypeError("Triple pile configuration must use corner stacks.");
  }
  const stackSlots = config.cornerStackSizes.map((depth, index) => ({
    id: `corner-stack-${TRIPLE_CORNER_STACK_CORNERS[index]}`,
    layer: 0,
    corner: TRIPLE_CORNER_STACK_CORNERS[index],
    depth,
  }));
  if (!stackSlots.every(({ depth, corner }) => Number.isInteger(depth) && depth > 0 && layout.cornerStackAnchors?.[corner]))
    throw new TypeError("Triple corner stack configuration is invalid.");
  return { depthBySlot: new Map(stackSlots.map((slot) => [slot.id, slot.depth])), stackSlots };
}

function createWitnessSlots(layout, random, stackSlots = []) {
  const layers = new Map();
  for (const slot of layout.slots) {
    const layerSlots = layers.get(slot.layer) || [];
    layerSlots.push(slot);
    layers.set(slot.layer, layerSlots);
  }
  const boardSlots = [...layers.keys()]
    .sort((left, right) => right - left)
    .flatMap((layer) => shuffle(layers.get(layer), random));
  const stackCards = stackSlots.flatMap((slot) => Array.from({ length: slot.depth }, () => slot));
  if (!stackCards.length) return boardSlots;
  const groupCount = (boardSlots.length + stackCards.length) / 3;
  if (!Number.isInteger(groupCount) || stackCards.length > groupCount)
    throw new TypeError("Triple corner stacks cannot be distributed across witness groups.");
  const groupsWithStack = new Set(shuffle(Array.from({ length: groupCount }, (_, index) => index), random).slice(0, stackCards.length));
  const result = [];
  let boardIndex = 0;
  let stackIndex = 0;
  for (let group = 0; group < groupCount; group += 1) {
    const stackCard = groupsWithStack.has(group) ? stackCards[stackIndex++] : null;
    if (stackCard) result.push(stackCard);
    const boardCount = 3 - Number(Boolean(stackCard));
    result.push(...boardSlots.slice(boardIndex, boardIndex + boardCount));
    boardIndex += boardCount;
  }
  if (boardIndex !== boardSlots.length || stackIndex !== stackCards.length)
    throw new TypeError("Triple corner stack witness distribution is incomplete.");
  return result;
}

function rectanglesOverlap(first, second, layout) {
  const epsilon = layout.overlapEpsilon;
  return (
    Math.min(first.x + layout.tileWidth, second.x + layout.tileWidth) -
      Math.max(first.x, second.x) >
      epsilon &&
    Math.min(first.y + layout.tileHeight, second.y + layout.tileHeight) -
      Math.max(first.y, second.y) >
      epsilon
  );
}

export function validateTripleLayout(layout) {
  if (
    !layout ||
    !Array.isArray(layout.slots) ||
    !layout.slots.length ||
    layout.tileWidth <= 0 ||
    layout.tileHeight <= 0
  ) {
    throw new TypeError("Triple layout is invalid.");
  }
  const slotIds = new Set();
  const slotsByLayer = new Map();
  for (const slot of layout.slots) {
    if (
      !slot?.id ||
      slotIds.has(slot.id) ||
      !Number.isInteger(slot.layer) ||
      slot.layer < 0 ||
      !Number.isFinite(slot.x) ||
      !Number.isFinite(slot.y)
    )
      throw new TypeError("Triple layout slot is invalid.");
    slotIds.add(slot.id);
    const layerSlots = slotsByLayer.get(slot.layer) || [];
    layerSlots.push(slot);
    slotsByLayer.set(slot.layer, layerSlots);
    if (
      layout.coordinateUnit === "half-card" &&
      (slot.x < 0 ||
        slot.y < 0 ||
        slot.x + layout.tileWidth > layout.gridWidth ||
        slot.y + layout.tileHeight > layout.gridHeight)
    ) {
      throw new TypeError("Triple layout slot is outside its template bounds.");
    }
  }
  if (
    !Number.isInteger(layout.gridWidth) ||
    !Number.isInteger(layout.gridHeight) ||
    !Array.isArray(layout.layerCounts)
  ) {
    throw new TypeError("Triple template geometry is invalid.");
  }
  validateCornerStackAnchors(layout);
  const sortedLayers = [...slotsByLayer.keys()].sort(
    (left, right) => left - right,
  );
  if (
    sortedLayers.length !== layout.layerCounts.length ||
    sortedLayers.some((layer, index) => layer !== index)
  ) {
    throw new TypeError("Triple template layers must be contiguous.");
  }
  for (const [layer, slots] of slotsByLayer) {
    if (slots.length !== layout.layerCounts[layer])
      throw new TypeError("Triple template layer count is invalid.");
    for (let index = 0; index < slots.length; index += 1) {
      for (
        let otherIndex = index + 1;
        otherIndex < slots.length;
        otherIndex += 1
      ) {
        if (rectanglesOverlap(slots[index], slots[otherIndex], layout))
          throw new TypeError("Triple template has a same-layer collision.");
      }
    }
  }
  for (const [layer, slots] of slotsByLayer) {
    if (layer === 0) continue;
    const lowerSlots = layout.slots.filter((slot) => slot.layer < layer);
    for (const slot of slots) {
      if (!lowerSlots.some((lower) => rectanglesOverlap(lower, slot, layout)))
        throw new TypeError("Triple template has a non-blocking upper tile.");
    }
  }
  for (const slot of layout.slots) {
    const blockers = layout.slots.filter(
      (other) =>
        other.layer > slot.layer && rectanglesOverlap(slot, other, layout),
    );
    if (!hasVisibleArea(slot, blockers, layout))
      throw new TypeError("Triple template fully covers a lower tile.");
  }
}

function validateCornerStackAnchors(layout) {
  const anchors = layout.cornerStackAnchors;
  if (!anchors) return;
  const padding = Number(layout.cornerStackExclusionPadding);
  if (!Number.isFinite(padding) || padding < 0)
    throw new TypeError("Triple corner stack exclusion padding is invalid.");
  for (const anchor of Object.values(anchors)) {
    if (!Number.isFinite(anchor?.x) || !Number.isFinite(anchor?.y)
      || anchor.x < 0 || anchor.y < 0
      || anchor.x + layout.tileWidth > layout.gridWidth
      || anchor.y + layout.tileHeight > layout.gridHeight) {
      throw new TypeError("Triple corner stack anchor is outside its template bounds.");
    }
    const zoneLeft = Math.max(0, anchor.x - padding);
    const zoneTop = Math.max(0, anchor.y - padding);
    const zoneRight = Math.min(layout.gridWidth, anchor.x + layout.tileWidth + padding);
    const zoneBottom = Math.min(layout.gridHeight, anchor.y + layout.tileHeight + padding);
    for (const slot of layout.slots) {
      const overlaps = Math.min(slot.x + layout.tileWidth, zoneRight) - Math.max(slot.x, zoneLeft) > layout.overlapEpsilon
        && Math.min(slot.y + layout.tileHeight, zoneBottom) - Math.max(slot.y, zoneTop) > layout.overlapEpsilon;
      if (overlaps)
        throw new TypeError("Triple layout slot collides with a corner stack exclusion zone.");
    }
  }
}

function hasVisibleArea(slot, blockers, layout) {
  if (!blockers.length) return true;
  const xEdges = new Set([slot.x, slot.x + layout.tileWidth]);
  const yEdges = new Set([slot.y, slot.y + layout.tileHeight]);
  for (const blocker of blockers) {
    xEdges.add(Math.max(slot.x, blocker.x));
    xEdges.add(
      Math.min(slot.x + layout.tileWidth, blocker.x + layout.tileWidth),
    );
    yEdges.add(Math.max(slot.y, blocker.y));
    yEdges.add(
      Math.min(slot.y + layout.tileHeight, blocker.y + layout.tileHeight),
    );
  }
  const xs = [...xEdges].sort((left, right) => left - right);
  const ys = [...yEdges].sort((left, right) => left - right);
  for (let xIndex = 0; xIndex < xs.length - 1; xIndex += 1)
    for (let yIndex = 0; yIndex < ys.length - 1; yIndex += 1) {
      const x = (xs[xIndex] + xs[xIndex + 1]) / 2;
      const y = (ys[yIndex] + ys[yIndex + 1]) / 2;
      if (
        !blockers.some(
          (blocker) =>
            x > blocker.x &&
            x < blocker.x + layout.tileWidth &&
            y > blocker.y &&
            y < blocker.y + layout.tileHeight,
        )
      )
        return true;
    }
  return false;
}

function normalizeSeed(seed) {
  if (typeof seed === "string" && seed) return seed;
  if (Number.isFinite(seed)) return String(seed);
  return "triple-easy-default";
}

function createDeterministicSolverClock() {
  let elapsed = 0;
  // Generation validates a seed-bound witness. A monotonic logical clock keeps
  // retries reproducible while preserving the solver's deadline semantics.
  return () => (elapsed += 0.01);
}

function normalizeAttemptCount(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0)
    throw new TypeError("maxAttempts must be a non-negative integer.");
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

function decorateChallengeLuckies(generated, seed, requestedCount) {
  const rng = createSeededRng(seed);
  const groups = new Map();
  for (const tile of generated.board.tiles) (groups.get(tile.type) || groups.set(tile.type, []).get(tile.type)).push(tile);
  const count = Number.isInteger(requestedCount)
    ? Math.max(1, Math.min(3, requestedCount, groups.size))
    : 1 + Math.floor(rng() * Math.min(3, groups.size));
  const selectedGroups = shuffle([...groups.values()], rng).slice(0, count);
  const tiles = generated.board.tiles.map((tile) => tile);
  for (const group of selectedGroups) {
    const eligible = group.filter(tile => !tile.magnet);
    const tile = eligible[Math.floor(rng() * eligible.length)];
    const index = tiles.findIndex((candidate) => candidate.id === tile.id);
    tiles[index] = Object.freeze({
      ...tile,
      lucky: Object.freeze({ id: `lucky-${tile.id}`, reward: TRIPLE_LUCKY_REWARDS[Math.floor(rng() * TRIPLE_LUCKY_REWARDS.length)] }),
    });
  }
  return freezeGeneratedBoard({
    ...generated,
    board: Object.freeze({ ...generated.board, tiles: Object.freeze(tiles) }),
  });
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
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function freezeGeneratedBoard(result) {

  return Object.freeze({
    ...result,
    witness: Object.freeze([...result.witness]),
  });
}
