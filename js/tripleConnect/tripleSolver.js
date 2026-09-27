import { TRIPLE_EASY_SOLVER_BUDGET } from "./tripleConfig.js";
import { reduceTripleCommand } from "./tripleRules.js";
import { createTripleRoundState, getExposedTileIds } from "./tripleState.js";

export function solveTripleBoard({
  board,
  maxNodes = TRIPLE_EASY_SOLVER_BUDGET.maxNodes,
  maxMemo = TRIPLE_EASY_SOLVER_BUDGET.maxMemo,
  deadlineMs = TRIPLE_EASY_SOLVER_BUDGET.deadlineMs,
  now = defaultNow,
  preferredWitness = [],
} = {}) {
  let initialState;
  try {
    initialState = createTripleRoundState(board);
  } catch (error) {
    return Object.freeze({ status: "invalid", reason: error.message, witness: Object.freeze([]), nodes: 0 });
  }
  return solveTripleState({ initialState, maxNodes, maxMemo, deadlineMs, now, preferredWitness });
}

export function solveTripleState({ initialState, maxNodes = TRIPLE_EASY_SOLVER_BUDGET.maxNodes, maxMemo = TRIPLE_EASY_SOLVER_BUDGET.maxMemo, deadlineMs = TRIPLE_EASY_SOLVER_BUDGET.deadlineMs, now = defaultNow, preferredWitness = [] } = {}) {
  const limits = validateLimits({ maxNodes, maxMemo, deadlineMs, now });
  if (!initialState) return Object.freeze({ status: "invalid", reason: "missing-state", witness: Object.freeze([]), nodes: 0 });
  const deadline = limits.now() + limits.deadlineMs;
  const memo = new Set();
  let nodes = 0;
  let timedOut = false;

  function search(state, depth = 0) {
    if (limits.now() > deadline || nodes >= limits.maxNodes) {
      timedOut = true;
      return null;
    }
    nodes += 1;
    if (state.status === "won") return [];
    if (state.status !== "playing") return null;
    const key = createTripleSolverKey(state);
    if (memo.has(key)) return null;
    if (memo.size < limits.maxMemo) memo.add(key);
    for (const tileId of orderMoves(state, preferredWitness[depth]?.tileId)) {
      const command = Object.freeze({ type: "select-tile", tileId });
      const transition = reduceTripleCommand(state, command);
      if (!transition.result.ok) continue;
      const suffix = search(transition.nextState, depth + 1);
      if (suffix) return [command, ...suffix];
      if (timedOut) return null;
    }
    return null;
  }

  const witness = search(initialState);
  if (timedOut) return Object.freeze({ status: "timeout", reason: "budget-exhausted", witness: Object.freeze([]), nodes });
  if (witness) return Object.freeze({ status: "solved", reason: null, witness: Object.freeze(witness), nodes });
  return Object.freeze({ status: "unsolved", reason: "no-solution", witness: Object.freeze([]), nodes });
}

export function createTripleSolverKey(state) {
  const stackTops = Object.entries(state.cornerStacks || {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([stackId, stack]) => `${stackId}:${[...stack.tileIds].reverse().find((id) => state.tiles[id].location === "board") || "-"}`)
    .join("|");
  return `${Object.keys(state.tiles).sort().map(id => `${id}:${state.tiles[id].location}`).join("|")};${state.tray.join(",")};${stackTops}`;
}

function orderMoves(state, preferredTileId) {
  const trayTypeCounts = state.tray.reduce((counts, tileId) => {
    const type = state.tiles[tileId].type;
    counts.set(type, (counts.get(type) || 0) + 1);
    return counts;
  }, new Map());
  return getExposedTileIds(state).sort((left, right) => {
    const leftCount = trayTypeCounts.get(state.tiles[left].type) || 0;
    const rightCount = trayTypeCounts.get(state.tiles[right].type) || 0;
    return Number(right === preferredTileId) - Number(left === preferredTileId) || rightCount - leftCount || left.localeCompare(right);
  });
}

function validateLimits({ maxNodes, maxMemo, deadlineMs, now }) {
  for (const [name, value] of Object.entries({ maxNodes, maxMemo, deadlineMs })) {
    if (!Number.isInteger(value) || value < 1) throw new TypeError(`${name} must be a positive integer.`);
  }
  if (typeof now !== "function") throw new TypeError("now must be a function.");
  return { maxNodes, maxMemo, deadlineMs, now };
}

function defaultNow() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
