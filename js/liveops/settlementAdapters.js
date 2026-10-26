import { normalizeWaveProgress, waveTotalGroups } from '../progression/waveProgress.js';
import { trustedRewardPeriod } from './service.js';

function settledFact(gameId, wave) {
  const period = trustedRewardPeriod(), normalized = normalizeWaveProgress(wave, { gameId });
  if (!period || !normalized || normalized.phase !== 'won') return undefined;
  return { uid: period.uid, fact: { roundId: normalized.attemptId, gameId, mode: normalized.mode,
    day: period.day, matches: waveTotalGroups(normalized), noHint: normalized.hintUsed === false } };
}
// One match means a pair for Memory/Link and one triad for Triple, not tiles.
export const memorySettlementFact = wave => settledFact('memory-match', wave);
export const linkSettlementFact = wave => settledFact('link-connect', wave);
export const tripleSettlementFact = wave => settledFact('triple-connect', wave);
