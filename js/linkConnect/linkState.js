import { getLinkModeLayout } from "./linkConfig.js";

export function createLinkGameState() {
  return {
    mode: "easy",
    level: 1,
    score: 0,
    moves: 0,
    misses: 0,
    combo: 0,
    specialProgress: 0,
    hints: 0,
    reshuffles: 0,
    freezeSeconds: 0,
    matchedPairs: 0,
    totalPairs: getLinkModeLayout().tileCount / 2,
    remainingTime: getLinkModeLayout().timeSeconds,
    isLocked: true,
    isPaused: false,
    roundId: 0,
    board: null,
  };
}

export const linkGameState = createLinkGameState();

export function beginLinkRound({
  mode = "easy",
  level = 1,
  layout = getLinkModeLayout(mode),
  board,
} = {}) {
  linkGameState.roundId += 1;
  linkGameState.mode = mode;
  linkGameState.level = level;
  linkGameState.score = 0;
  linkGameState.moves = 0;
  linkGameState.misses = 0;
  linkGameState.combo = 0;
  linkGameState.matchedPairs = 0;
  linkGameState.totalPairs = layout.tileCount / 2;
  linkGameState.remainingTime = layout.timeSeconds;
  linkGameState.isLocked = true;
  linkGameState.isPaused = false;
  linkGameState.board = board || null;
  return linkGameState.roundId;
}

export function invalidateLinkRound() {
  linkGameState.roundId += 1;
  linkGameState.isLocked = true;
  return linkGameState.roundId;
}

export function resetLinkGame() {
  const roundId = invalidateLinkRound();
  Object.assign(linkGameState, createLinkGameState(), { roundId });
}
