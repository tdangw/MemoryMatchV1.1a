import { createTripleCoverGraph } from "./tripleBoard.js";
import { restoreTripleStateSnapshot } from "./tripleState.js";
import { solveTripleState } from "./tripleSolver.js";

export function shuffleTripleBoardState(state, layout, seed, solverOptions = {}) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = shuffleTripleBoardStateOnce(state, layout, `${seed}:${attempt}`, solverOptions);
    if (result) return result;
  }
  return null;
}

function shuffleTripleBoardStateOnce(state, layout, seed, solverOptions) {
  const groups = getShuffleGroups(state);
  if (groups.length < 2) return null;
  const slots = shuffle(groups.map((group) => group.slotId), random(seed));
  const tiles = Object.fromEntries(Object.entries(state.tiles).map(([id, tile]) => [id, { ...tile }]));
  const cornerStacks = clonePiles(state.cornerStacks);
  groups.forEach((group, index) => {
    const slot = layout.slots.find((candidate) => candidate.id === slots[index]);
    group.tileIds.forEach((tileId) => {
      tiles[tileId] = { ...tiles[tileId], slotId: slot.id, layer: slot.layer };
    });
    if (group.pileId) cornerStacks[group.pileId] = { ...cornerStacks[group.pileId], anchorSlotId: slot.id };
  });
  const tileIdsBySlot = new Map();
  Object.values(tiles).forEach((tile) => {
    const ids = tileIdsBySlot.get(tile.slotId) || [];
    ids.push(tile.id);
    tileIdsBySlot.set(tile.slotId, ids);
  });
  const slotGraph = createTripleCoverGraph(layout);
  const coverGraph = Object.fromEntries(Object.values(tiles).map((tile) => [
    tile.id,
    slotGraph[tile.slotId].flatMap((slotId) => tileIdsBySlot.get(slotId) || []),
  ]));
  const layers = Object.values(tiles).reduce((result, tile) => { (result[tile.layer] ||= []).push(tile.id); return result; }, {});
  const next = restoreTripleStateSnapshot({ ...state, tiles, cornerStacks, layers, coverGraph }, []);
  const solved = solveTripleState({ initialState: next, ...solverOptions });
  if (solved.status !== "solved") return null;
  return Object.freeze({ state: next, witness: solved.witness, nodes: solved.nodes });
}

function getShuffleGroups(state) {
  const pileByTileId = new Map();
  Object.entries(state.cornerStacks).forEach(([pileId, pile]) => pile.tileIds.forEach((tileId) => pileByTileId.set(tileId, pileId)));
  const groups = [];
  const seen = new Set();
  for (const tile of Object.values(state.tiles)) {
    if (seen.has(tile.id)) continue;
    const pileId = pileByTileId.get(tile.id);
    const pile = pileId ? state.cornerStacks[pileId] : null;
    const tileIds = pile ? pile.tileIds : [tile.id];
    tileIds.forEach((tileId) => seen.add(tileId));
    if (tileIds.some((tileId) => state.tiles[tileId].location === "board"))
      groups.push({ pileId, tileIds, slotId: tile.slotId });
  }
  return groups;
}

function clonePiles(piles) {
  return Object.fromEntries(Object.entries(piles).map(([id, pile]) => [id, {
    anchorSlotId: pile.anchorSlotId,
    tileIds: [...pile.tileIds],
  }]));
}

function random(seed) { let value = [...String(seed)].reduce((hash, char) => Math.imul(hash ^ char.codePointAt(0), 16777619), 2166136261) >>> 0; return () => ((value ^= value << 13, value ^= value >>> 17, value ^= value << 5, value >>> 0) / 4294967296); }
function shuffle(values, rng) { const result = [...values]; for (let index = result.length - 1; index > 0; index -= 1) { const other = Math.floor(rng() * (index + 1)); [result[index], result[other]] = [result[other], result[index]]; } return result; }
