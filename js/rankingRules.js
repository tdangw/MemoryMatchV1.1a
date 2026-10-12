import { getGameProgressKey } from "./gameCatalog.js";
import { gameState } from "./gameState.js";

export const RANKING_RULES_VERSION = 1;
export function supportsRunRanking(gameId, mode) {
  return Boolean(getGameProgressKey(gameId)) && (mode === "challenge" || (gameId === "triple-connect" && mode === "endless"));
}
export function compareRankingResults(a, b, kind = "time") {
  if (kind === "time") return a.durationMs - b.durationMs;
  return b.levelReached - a.levelReached || b.totalScore - a.totalScore;
}
export function createRankedRun(gameId, mode, level = 1, { rankable = level === 1, id = crypto.randomUUID() } = {}) {
  if (!supportsRunRanking(gameId, mode)) return null;
  if (!Number.isSafeInteger(level) || level < 1) throw new RangeError("Invalid ranked run level.");
  return { version: 1, id, gameId, mode, level, previousScore: 0, attemptScore: 0, attemptCleared: false, finalized: false, rankable };
}
export function normalizeRankedRun(value, { gameId, mode, level }) {
  if (!value || value.version !== 1 || value.gameId !== gameId || value.mode !== mode || value.level !== level
    || typeof value.id !== "string" || !value.id || value.id.length > 100
    || !Number.isSafeInteger(value.previousScore) || value.previousScore < 0
    || !Number.isSafeInteger(value.attemptScore) || value.attemptScore < 0) return null;
  return {
    version: 1, id: value.id, gameId, mode, level,
    previousScore: value.previousScore, attemptScore: value.attemptScore,
    finalized: value.finalized === true, rankable: value.rankable === true, attemptCleared: value.attemptCleared === true,
  };
}
export function reduceRankedRun(run, event) {
  if (!run || run.finalized) return run;
  const next = { ...run };
  if (event.type === "restart") {
    next.attemptScore = 0;
    next.attemptCleared = false;
  } else if (event.type === "advance") {
    if (!run.attemptCleared || event.level !== run.level + 1) throw new Error("A ranked run advances exactly once after a cleared board.");
    next.previousScore += run.attemptScore;
    next.level = event.level;
    next.attemptScore = 0;
    next.attemptCleared = false;
  } else if (event.type === "score" || event.type === "win") {
    if (!Number.isSafeInteger(event.score) || event.score < 0) throw new RangeError("Invalid run score.");
    next.attemptScore = event.score;
    next.attemptCleared = event.type === "win";
  } else if (event.type === "finalize") next.finalized = true;
  else throw new RangeError("Unknown ranked run transition.");
  return next;
}

export function beginRankedAttempt(gameId, mode, level, { reason = "new", savedRun = null } = {}) {
  if (!supportsRunRanking(gameId, mode)) return;
  const profile = gameState.progress[getGameProgressKey(gameId)];
  profile.activeRankedRuns ||= {};
  let run = profile.activeRankedRuns[mode];
  if (reason === "resume") run = normalizeRankedRun(savedRun, { gameId, mode, level }) || createRankedRun(gameId, mode, level, { rankable: false });
  else if (reason === "advance" && run && !run.finalized) run = reduceRankedRun(run, { type: "advance", level });
  else if (reason === "restart" && run && !run.finalized && run.level === level) run = reduceRankedRun(run, { type: "restart" });
  else run = createRankedRun(gameId, mode, level);
  profile.activeRankedRuns[mode] = run;
}
export function stageRankedAttempt(gameId, mode, score, won = false) {
  const profile = gameState.progress[getGameProgressKey(gameId)];
  const run = profile.activeRankedRuns?.[mode];
  if (!run || run.finalized) return;
  profile.activeRankedRuns[mode] = reduceRankedRun(run, { type: won ? "win" : "score", score });
}
export function getRankedRun(gameId, mode) {
  return gameState.progress[getGameProgressKey(gameId)].activeRankedRuns?.[mode] || null;
}
export function finalizeRankedRun(gameId, mode, score, outcome = "lost") {
  const profile = gameState.progress[getGameProgressKey(gameId)];
  let run = profile.activeRankedRuns?.[mode];
  if (!run || run.finalized) return null;
  run = reduceRankedRun(run, { type: outcome === "won" ? "win" : "score", score });
  run = reduceRankedRun(run, { type: "finalize" });
  profile.activeRankedRuns[mode] = run;
  if (!run.rankable) return null;
  const result = { rulesVersion: RANKING_RULES_VERSION, runId: run.id, levelReached: run.level, totalScore: run.previousScore + run.attemptScore, outcome, recordedAt: Date.now() };
  profile.runBests ||= {};
  if (!profile.runBests[mode] || compareRankingResults(result, profile.runBests[mode], "run") < 0) profile.runBests[mode] = result;
  return result;
}
