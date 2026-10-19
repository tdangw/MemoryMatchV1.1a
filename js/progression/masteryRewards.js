import { getMasteryBlock } from './difficultyProgress.js';

export const MASTERY_CHEST_REWARDS = Object.freeze([
  Object.freeze({ tier: 'C', mode: 'easy', coins: 30, hints: 1 }),
  Object.freeze({ tier: 'B', mode: 'normal', coins: 60, hints: 2 }),
  Object.freeze({ tier: 'A', mode: 'hard', coins: 100, hints: 3 }),
  Object.freeze({ tier: 'S', mode: 'superHard', coins: 160, hints: 4 }),
]);
export const COLLECTION_REWARD_COINS = 300;

export function getMasteryRewards({ completed, level, claim = {} }) {
  const mastery = getMasteryBlock({ completed, level });
  const claimed = claim?.rulesVersion === 1 && claim.tiers && typeof claim.tiers === 'object' ? claim.tiers : {};
  const index = MASTERY_CHEST_REWARDS.findIndex(reward => !claimed[reward.tier]);
  const active = index < 0 ? null : mastery.tiers[index];
  return Object.freeze({ ...mastery,
    activeTier: active?.tier || null, exp: active?.exp || 0,
    chestEligible: Boolean(active?.complete),
    reward: index < 0 ? null : MASTERY_CHEST_REWARDS[index],
    collectionClaimed: claim?.rulesVersion === 1 && Boolean(claim.collection),
    collectionEligible: mastery.collectionComplete && !(claim?.rulesVersion === 1 && claim.collection),
  });
}
