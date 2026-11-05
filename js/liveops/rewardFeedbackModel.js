import { CHEST_TYPES } from './chestConfig.js';

// Presentation facts only: never persisted or used to grant an entitlement.
export const REWARD_FEEDBACK_LIMIT = 12;
/** A wheel grant is separate from mission/rollover grants in the same request. */
export function committedWheelRewardsForTransition(result) {
  if (!result.wheelApplied) return [];
  const reward = result.wheelReward;
  if (!reward) return result.spin?.coins > 0 ? [{kind:'coins',amount:result.spin.coins}] : [];
  if (reward.kind === 'coins') return [{kind:'coins',amount:reward.coins}];
  if (reward.kind === 'item') return [{kind:'item',itemId:reward.itemId,amount:1}];
  if (reward.kind === 'support') return [{kind:'support',gameId:reward.gameId,key:reward.key,amount:1}];
  return [];
}
export function mergeCommittedRewards(previous = [], incoming = []) {
  const merged = new Map();
  for (const reward of [...previous, ...incoming]) {
    const { amount, ...identity } = reward;
    const key = JSON.stringify(identity), existing = merged.get(key);
    if (existing) existing.amount += amount;
    else if (merged.size < REWARD_FEEDBACK_LIMIT) merged.set(key, { ...identity, amount });
  }
  return [...merged.values()];
}

/** Call with the canonical transition, then publish these facts only after commit. */
export function committedRewardsForTransition(previous, result) {
  const rewards = [], state = result.state;
  const coins = result.receipts.reduce((sum, receipt) => sum + receipt.coins, 0);
  if (coins > 0) rewards.push({ kind:'coins', amount:coins });
  for (const receipt of result.receipts) {
    if (receipt.acquisition) for (const itemId of receipt.acquisition.items) rewards.push({ kind:'item', itemId, amount:1 });
    if (receipt.support) rewards.push({ kind:'support', ...receipt.support, amount:1 });
  }
  // Reconciled gameplay drops already had their own feedback. Only net newly
  // granted tickets (mission bonuses / gift), excluding spending and mirroring.
  const tickets = state.tickets - (previous?.tickets || 0)
    + state.ticketSpent - (previous?.ticketSpent || 0)
    - state.ticketEarned + (previous?.ticketEarned || 0);
  if (tickets > 0) rewards.push({ kind:'ticket', amount:tickets });
  for (const chestType of CHEST_TYPES) {
    const amount = (state.chests?.earned[chestType] || 0) - (previous?.chests?.earned[chestType] || 0);
    if (amount > 0) rewards.push({ kind:'chest', chestType, amount });
  }
  const last = state.letters.last;
  if (last?.kind === 'fuse' && last.sequence > (previous?.letters.sequence || 0)) rewards.push({ kind:'letter', letter:last.received, amount:1 });
  return mergeCommittedRewards([], rewards);
}
