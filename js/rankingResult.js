import { NORMAL_MODE_IDS, MAX_ADVENTURE_LEVEL } from './adventureProgress.js';
const games = new Set(['memory-match', 'link-connect', 'triple-connect']);
export function rankingBoardId({ gameId, mode, level, kind }) {
  if (!games.has(gameId)) throw new RangeError('Unknown ranking game.');
  if (kind === 'time' && NORMAL_MODE_IDS.includes(mode) && Number.isSafeInteger(level) && level > 0 && level <= MAX_ADVENTURE_LEVEL) return `v1_${gameId}_${mode}_${level}`;
  if (kind === 'run' && (mode === 'challenge' || gameId === 'triple-connect' && mode === 'endless')) return `v1_${gameId}_${mode}`;
  throw new RangeError('Unsupported ranking board.');
}
export function validateRankingResult(result) {
  try {
    rankingBoardId(result);
    return result.rulesVersion === 1 && typeof result.id === 'string' && /^[a-f0-9-]{36}$/.test(result.id)
      && Number.isSafeInteger(result.recordedAt) && result.recordedAt > 0
      && typeof result.owner?.profileId === 'string' && result.owner.profileId.length > 0
      && (result.owner.uid === null || typeof result.owner.uid === 'string')
      && (result.kind === 'time' ? result.outcome === 'won' && integer(result.durationMs, 1) && integer(result.score) && integer(result.stars) && result.stars <= 3
        : ['won', 'lost'].includes(result.outcome) && integer(result.levelReached, 1) && integer(result.totalScore));
  } catch { return false; }
}
export function comparePublicResults(a, b, kind) {
  return kind === 'time' ? a.durationMs - b.durationMs : b.levelReached - a.levelReached || b.totalScore - a.totalScore;
}
export function collectRankingResults(snapshot) {
  const records = [];
  const collect = progress => {
    for (const game of Object.values(progress || {})) {
      for (const result of Object.values(game?.bestByLevel || {})) if (validateRankingResult(result.rankingResult)) records.push(result.rankingResult);
      for (const best of Object.values(game?.runBests || {})) {
        const result = best.rankingResult || best;
        if (validateRankingResult(result)) records.push(result);
      }
    }
  };
  collect(snapshot.profile.data.progress);
  for (const { value } of snapshot.chapters) for (const result of Object.values(value.bestByLevel || {})) if (validateRankingResult(result.rankingResult)) records.push(result.rankingResult);
  return records;
}
function integer(value, minimum = 0) { return Number.isSafeInteger(value) && value >= minimum && value <= Number.MAX_SAFE_INTEGER; }
