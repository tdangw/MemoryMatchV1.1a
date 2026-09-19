import { createTripleCoverGraph } from "./tripleBoard.js";
import { restoreTripleStateSnapshot } from "./tripleState.js";
import { solveTripleState } from "./tripleSolver.js";

export function shuffleTripleBoardState(state, layout, seed, solverOptions = {}) {
  const boardTiles = Object.values(state.tiles).filter((tile) => tile.location === "board");
  if (boardTiles.length < 2) return null;
  const slots = shuffle(boardTiles.map((tile) => tile.slotId), random(seed));
  const tiles = Object.fromEntries(Object.entries(state.tiles).map(([id, tile]) => [id, { ...tile }]));
  boardTiles.forEach((tile, index) => {
    const slot = layout.slots.find((candidate) => candidate.id === slots[index]);
    tiles[tile.id] = { ...tiles[tile.id], slotId: slot.id, layer: slot.layer };
  });
  const bySlot = Object.fromEntries(Object.values(tiles).map((tile) => [tile.slotId, tile.id]));
  const slotGraph = createTripleCoverGraph(layout);
  const coverGraph = Object.fromEntries(Object.values(tiles).map((tile) => [tile.id, slotGraph[tile.slotId].map((slotId) => bySlot[slotId])]));
  const layers = Object.values(tiles).reduce((result, tile) => { (result[tile.layer] ||= []).push(tile.id); return result; }, {});
  const next = restoreTripleStateSnapshot({ ...state, tiles, layers, coverGraph }, []);
  const solved = solveTripleState({ initialState: next, ...solverOptions });
  if (solved.status !== "solved") return null;
  return Object.freeze({ state: next, witness: solved.witness, nodes: solved.nodes });
}

function random(seed) { let value = [...String(seed)].reduce((hash, char) => Math.imul(hash ^ char.codePointAt(0), 16777619), 2166136261) >>> 0; return () => ((value ^= value << 13, value ^= value >>> 17, value ^= value << 5, value >>> 0) / 4294967296); }
function shuffle(values, rng) { const result = [...values]; for (let index = result.length - 1; index > 0; index -= 1) { const other = Math.floor(rng() * (index + 1)); [result[index], result[other]] = [result[other], result[index]]; } return result; }
