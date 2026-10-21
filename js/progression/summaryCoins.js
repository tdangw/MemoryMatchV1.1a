import { playCoinRewardFlight, stopCoinCounterAnimation } from '../coinRewards.js';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { playOwnedRewardCue } from '../sound.js';
import { getRankingOwner } from '../rankingOwner.js';
import { prefersReducedMotion } from '../motion.js';
import { SUMMARY_REWARD_TIMING } from './summaryRewardAudio.js';

// Persistence owns the award. This handle only withholds its HUD presentation.
export function prepareSummaryCoins(hud, amount, total, owner) {
  const reward = hud.deferCoins({ amount, total, owner });
  if (reward) stopCoinCounterAnimation(reward.counter);
  return reward;
}

export function scheduleSummaryCoins({ owner, source, amount, reward, getSettings }) {
  const scope = createGameShellLifecycle();
  const identity = JSON.stringify(getRankingOwner());
  const release = owner.own(() => scope.dispose(), 'cleanup');
  scope.own(() => { release.forget(); reward?.finish(); });
  const finish = () => scope.dispose();
  scope.listen(document, 'visibilitychange', () => { if (document.hidden) finish(); });
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  scope.listen(motion, 'change', () => { if (motion.matches) finish(); });
  scope.timeout(() => {
    if (identity !== JSON.stringify(getRankingOwner()) || document.hidden || !source.isConnected) { finish(); return; }
    if (amount < 1) { finish(); return; }
    if (reward?.finished) { finish(); return; }
    playOwnedRewardCue('summary', scope, getSettings());
    if (!reward || prefersReducedMotion() || !reward.target.isConnected) { reward?.finish(); return; }
    playCoinRewardFlight(source, reward.target, amount, {
      owner: scope, showLabel: false,
      flightDurationMs: SUMMARY_REWARD_TIMING.coinFlight,
      staggerMs: SUMMARY_REWARD_TIMING.coinStagger,
      durationVarianceMs: SUMMARY_REWARD_TIMING.coinVariance,
      onArrival: reward.arrive,
      onComplete: reward.finish,
    });
  }, SUMMARY_REWARD_TIMING.coinStart);
}
