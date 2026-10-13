import { getGameProgressKey } from "./gameCatalog.js";
import { gameState } from "./gameState.js";
import { getRankingOwner } from './rankingOwner.js';
import { validateRankingResult } from './rankingResult.js';

export const RANKING_RULES_VERSION = 2;
export function supportsRunRanking(gameId, mode) {
  return Boolean(getGameProgressKey(gameId)) && (mode === "challenge" || mode === "endless");
}
export function compareRankingResults(a, b, kind = "time") {
  if (kind === "time") return a.durationMs - b.durationMs;
  return b.levelReached - a.levelReached || b.totalScore - a.totalScore;
}
export function createRankedRun(gameId, mode, level = 1, { rankable = level === 1, id = crypto.randomUUID() } = {}) {
  if (!supportsRunRanking(gameId, mode)) return null;
  if (!Number.isSafeInteger(level) || level < 1) throw new RangeError("Invalid ranked run level.");
  return { version: 2, id, gameId, mode, level, previousScore: 0, attemptScore: 0, attemptCleared: false, finalized: false, rankable, owner: getRankingOwner() };
}
export function normalizeRankedRun(value, { gameId, mode, level }) {
  if (!supportsRunRanking(gameId, mode) || !value || ![1, 2].includes(value.version) || value.gameId !== gameId || value.mode !== mode || value.level !== level
    || typeof value.id !== "string" || !value.id || value.id.length > 100
    || !Number.isSafeInteger(value.previousScore) || value.previousScore < 0
    || !Number.isSafeInteger(value.attemptScore) || value.attemptScore < 0 || !Number.isSafeInteger(value.previousScore + value.attemptScore)) return null;
  return {
    version: 2, id: value.id, gameId, mode, level,
    previousScore: value.previousScore, attemptScore: value.attemptScore,
    finalized: value.finalized === true, rankable: value.rankable === true, attemptCleared: value.attemptCleared === true,
    owner: typeof value.owner?.profileId === 'string' && (value.owner.uid === null || typeof value.owner.uid === 'string') ? { ...value.owner } : null,
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
    if (!Number.isSafeInteger(event.level) || !Number.isSafeInteger(run.previousScore + run.attemptScore)) throw new RangeError('Ranked run exceeds the supported range.');
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
/** Stage with the winning settlement transaction; subscribers see it only after durability. */
export function checkpointRankedRun(gameId, mode) {
  const profile = gameState.progress[getGameProgressKey(gameId)];
  const run = profile.activeRankedRuns?.[mode];
  if (!run || run.finalized || !run.rankable || !run.attemptCleared || !run.owner) return null;
  const totalScore = run.previousScore + run.attemptScore;
  if (!Number.isSafeInteger(totalScore)) throw new RangeError('Run score exceeds the supported range.');
  const result = Object.freeze({ rulesVersion: RANKING_RULES_VERSION, runId: run.id, levelReached: run.level, totalScore,
    outcome: 'won', recordedAt: Date.now(), id: crypto.randomUUID(), owner: Object.freeze({ ...run.owner }), gameId, mode, kind: 'run' });
  profile.runBestsV2 ||= {};
  const previous = profile.runBestsV2[mode];
  const sameOwner = previous && (run.owner.uid ? run.owner.uid === previous.owner.uid : run.owner.profileId === previous.owner.profileId && previous.owner.uid === null);
  if (!sameOwner || compareRankingResults(result, previous, 'run') < 0) {
    profile.runBestsV2[mode] = result;
    return result;
  }
  return null;
}
export function finalizeRankedRun(gameId, mode, score, outcome = 'lost') {
  const profile = gameState.progress[getGameProgressKey(gameId)];
  const run = profile.activeRankedRuns?.[mode];
  if (!run || run.finalized) return null;
  // Closing a run never publishes the unfinished board or repeats its last checkpoint.
  profile.activeRankedRuns[mode] = reduceRankedRun(run, { type: 'finalize' });
  return null;
}

/** Import only when the matching finalized v1 run proves the cleared-board total. */
export function normalizeRunBestsV2(progress, gameId) {
  const bests = Object.fromEntries(Object.entries(progress.runBestsV2 || {}).filter(([mode, result]) =>
    supportsRunRanking(gameId, mode) && result?.rulesVersion === 2 && result.gameId === gameId && result.mode === mode && validateRankingResult(result)));
  for (const [mode, legacy] of Object.entries(progress.runBests || {})) {
    const source = legacy?.rankingResult || legacy;
    const rawRun = progress.activeRankedRuns?.[mode];
    const run = rawRun?.version === 1 ? normalizeRankedRun(rawRun, { gameId, mode, level: rawRun.level }) : null;
    if (!run || !run.finalized || !run.rankable || !run.owner || !validateRankingResult(source) || source.rulesVersion !== 1 || source.kind !== 'run'
      || source.gameId !== gameId || source.mode !== mode || source.runId !== run.id || source.levelReached !== run.level
      || source.totalScore !== run.previousScore + run.attemptScore || source.owner.profileId !== run.owner.profileId || source.owner.uid !== run.owner.uid
      || (source.outcome === 'won') !== run.attemptCleared) continue;
    const levelReached = run.attemptCleared ? run.level : run.level - 1;
    if (levelReached < 1) continue;
    const candidate = { ...source, rulesVersion: 2, outcome: 'won', levelReached, totalScore: run.previousScore + (run.attemptCleared ? run.attemptScore : 0) };
    const previous = bests[mode];
    if (!previous || previous.owner.uid === candidate.owner.uid && previous.owner.profileId === candidate.owner.profileId && compareRankingResults(candidate, previous, 'run') < 0) bests[mode] = candidate;
  }
  return bests;
}
