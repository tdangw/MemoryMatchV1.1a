import { groupEnergyChance, groupSupportChance } from '../progression/groupDropPolicy.js';
import { GAME_CONFIG, getMemorySupportDrop, resolveMemoryMilestoneRewards } from '../config.js';
import { GAMEPLAY_LIMITS } from '../gameplayTuning.js';

// Resolve all durable mutations before the caller writes the pair snapshot.
export function resolveMemoryPairRewards(state, { imageId, special = false }, random = Math.random) {
  const items = state.progress.memoryMatch.items;
  const presentation = { lucky: null, energyProgress: null, rewards: [] };
  let lucky = state.luckyRewards.get(imageId);
  state.luckyRewards.delete(imageId);
  if (lucky?.type === 'hints' && items.hint >= GAMEPLAY_LIMITS.itemCount) lucky = { type: 'coins', value: lucky.value * GAMEPLAY_LIMITS.itemOverflowCoins };
  if (lucky) {
    state.luckyAwards.push(lucky);
    presentation.lucky = lucky;
    if (lucky.type === 'coins') state.coins += lucky.value;
    else if (lucky.type === 'time') state.remainingTime += lucky.value;
    else {
      const accepted = Math.min(lucky.value, GAMEPLAY_LIMITS.itemCount - items.hint);
      items.hint += accepted;
      if (accepted < lucky.value) {
        const coins = { type: 'coins', value: (lucky.value - accepted) * GAMEPLAY_LIMITS.itemOverflowCoins };
        state.luckyAwards[state.luckyAwards.length - 1] = { ...lucky, value: accepted };
        presentation.lucky = { ...lucky, value: accepted };
        state.luckyAwards.push(coins); presentation.rewards.push(coins);
      }
    }
  }
  const legacy = state.rewardPolicyVersion === 1;
  if (legacy && !special) return presentation;
  const isSpecial = special || Boolean(lucky);
  const target = GAME_CONFIG.special.progressTarget;
  if (state.specialProgress < target) {
    if (random() < (legacy ? 1 : groupEnergyChance(isSpecial))) {
      state.specialNoEnergyDropStreak = 0;
      const reached = state.specialProgress + 1;
      state.specialProgress = reached % target;
      presentation.energyProgress = reached;
      presentation.rewards.push(...resolveMemoryMilestoneRewards(reached, random, state.settings?.mode || 'easy', legacy ? 1 : 2));
    } else state.specialNoEnergyDropStreak++;
  }
  const support = getMemorySupportDrop(random, legacy ? .5 : groupSupportChance(isSpecial, special), legacy);
  if (support) presentation.rewards.push(support);
  const requestedRewards = presentation.rewards;
  presentation.rewards = [];
  for (const reward of requestedRewards) {
    if (reward.type === 'coins') { state.coins += reward.value; presentation.rewards.push(reward); }
    else {
      const id = reward.type === 'hint' ? 'hint' : `${reward.type === 'time-item' ? 'time' : 'preview'}${reward.value === 'all' ? 'All' : reward.value}`;
      const amount = id === 'hint' ? reward.value : 1;
      const accepted = Math.min(amount, GAMEPLAY_LIMITS.itemCount - (items[id] || 0));
      items[id] = (items[id] || 0) + accepted;
      const overflowCoins = (amount - accepted) * GAMEPLAY_LIMITS.itemOverflowCoins;
      state.coins += overflowCoins;
      if (accepted) presentation.rewards.push(id === 'hint' ? { ...reward, value: accepted } : reward);
      if (overflowCoins) presentation.rewards.push({ type: 'coins', value: overflowCoins });
    }
  }
  state.pendingEnergyCollections = 0;
  return presentation;
}
