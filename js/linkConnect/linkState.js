import { getLinkModeLayout } from "./linkConfig.js";

export function createLinkGameState() {
  return {
    mode: "easy",
    level: 1,
    gravityShift: "static",
    score: 0,
    moves: 0,
    misses: 0,
    combo: 0,
    lastMatchAt: 0,
    specialProgress: 0,
    specialNoEnergyDropStreak: 0,
    specialMilestoneRewards: {},
    pendingSpecialMilestones: [],
    isResolvingSpecialMilestone: false,
    pendingSpecialPairKeys: [],
    pendingFrozenTileKeys: [],
    freezeSeconds: 0,
    luckyAwards: [],
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
  gravityShift = "static",
  layout = getLinkModeLayout(mode),
  board,
} = {}) {
  linkGameState.roundId += 1;
  linkGameState.mode = mode;
  linkGameState.level = level;
  linkGameState.gravityShift = gravityShift;
  linkGameState.score = 0;
  linkGameState.moves = 0;
  linkGameState.misses = 0;
  linkGameState.combo = 0;
  linkGameState.lastMatchAt = 0;
  linkGameState.specialMilestoneRewards = {};
  linkGameState.pendingSpecialMilestones = [];
  linkGameState.isResolvingSpecialMilestone = false;
  linkGameState.pendingSpecialPairKeys = [];
  linkGameState.pendingFrozenTileKeys = [];
  linkGameState.matchedPairs = 0;
  linkGameState.totalPairs = layout.tileCount / 2;
  linkGameState.remainingTime = layout.timeSeconds;
  // Đóng băng thời gian chỉ có hiệu lực trong màn đang chơi, không mang sang màn kế tiếp.
  linkGameState.freezeSeconds = 0;
  linkGameState.isLocked = true;
  linkGameState.isPaused = false;
  linkGameState.luckyAwards = [];
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
