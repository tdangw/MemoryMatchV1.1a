import { getRankingOwner } from '../rankingOwner.js';
import { playOwnedRewardCue } from '../sound.js';

export const SUMMARY_REWARD_TIMING = Object.freeze({ starStart: 420, starStep: 380, coinStart: 760, coinDuration: 1000,
  coinFlight: 1550, coinStagger: 30, coinVariance: 100 });
export const summaryStarDelay = index => SUMMARY_REWARD_TIMING.starStart + index * SUMMARY_REWARD_TIMING.starStep;

export function scheduleSummaryRewardAudio({ owner, stars, getSettings }) {
  const identity = JSON.stringify(getRankingOwner());
  const playCue = name => {
    if (identity === JSON.stringify(getRankingOwner())) playOwnedRewardCue(name, owner, getSettings());
  };
  // The same timeline drives CSS star entrances and audio. Reduced motion keeps
  // the audible sequence, independently of the visual animation preference.
  for (let index = 0; index < Math.min(3, stars); index++) {
    owner.timeout(() => playCue(`star${index + 1}`), summaryStarDelay(index));
  }
}
