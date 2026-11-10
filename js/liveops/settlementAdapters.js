import { normalizeWaveProgress, waveTotalGroups } from '../progression/waveProgress.js';
import { trustedRewardPeriod } from './service.js';
import { getAccountService } from '../accountService.js';

function settledFact(gameId, wave) {
  const period = trustedRewardPeriod(), normalized = normalizeWaveProgress(wave, { gameId });
  const identity = getAccountService()?.getLocalIdentity();
  if (!identity || !normalized || normalized.phase !== 'won') return undefined;
  return { uid: identity.uid, profileId:identity.profileId, fact: { version:2, roundId: normalized.attemptId, gameId, mode: normalized.mode,
    day: period?.uid === identity.uid ? period.day : null, matches: waveTotalGroups(normalized), noHint: normalized.hintUsed === false } };
}
// One match means a pair for Memory/Link and one triad for Triple, not tiles.
export const memorySettlementFact = wave => settledFact('memory-match', wave);
export const linkSettlementFact = wave => settledFact('link-connect', wave);
export const tripleSettlementFact = wave => settledFact('triple-connect', wave);
