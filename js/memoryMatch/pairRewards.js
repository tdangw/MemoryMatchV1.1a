import { GAME_CONFIG, getMemorySupportDrop, resolveMemoryMilestoneRewards, shouldDropMemoryEnergy } from '../config.js';
import { GAMEPLAY_LIMITS } from '../gameplayTuning.js';

// Resolve all durable mutations before the caller writes the pair snapshot.
export function resolveMemoryPairRewards(state, { imageId, special = false }, random = Math.random) {
  const items = state.progress.memoryMatch.items;
  const presentation = { lucky: null, energyProgress: null, rewards: [] };
  let lucky = state.luckyRewards.get(imageId);
  state.luckyRewards.delete(imageId);
  if (lucky?.type === 'hints' && items.hint >= GAMEPLAY_LIMITS.itemCount) {
    const type = random() < .5 ? 'time' : 'coins';
    const range = GAME_CONFIG.specialModes.luckyRewards[type];
    lucky = { type, value: range.minimum + Math.floor(random() * (range.maximum - range.minimum + 1)) };
  }
  if (lucky) {
    state.luckyAwards.push(lucky);
    presentation.lucky = lucky;
    if (lucky.type === 'coins') state.coins += lucky.value;
    else if (lucky.type === 'time') state.remainingTime += lucky.value;
    else items.hint = Math.min(GAMEPLAY_LIMITS.itemCount, items.hint + lucky.value);
  }
  if (!special) return presentation;
  const target = GAME_CONFIG.special.progressTarget;
  if (state.specialProgress < target) {
    if (shouldDropMemoryEnergy(state.specialNoEnergyDropStreak, random)) {
      state.specialNoEnergyDropStreak = 0;
      const reached = state.specialProgress + 1;
      state.specialProgress = reached % target;
      presentation.energyProgress = reached;
      presentation.rewards.push(...resolveMemoryMilestoneRewards(reached, random));
    } else state.specialNoEnergyDropStreak++;
  }
  const support = getMemorySupportDrop(random);
  if (support) presentation.rewards.push(support);
  for (const reward of presentation.rewards) {
    if (reward.type === 'coins') state.coins += reward.value;
    else {
      const id = reward.type === 'hint' ? 'hint' : `${reward.type === 'time-item' ? 'time' : 'preview'}${reward.value === 'all' ? 'All' : reward.value}`;
      items[id] = Math.min(GAMEPLAY_LIMITS.itemCount, (items[id] || 0) + (id === 'hint' ? reward.value : 1));
    }
  }
  state.pendingEnergyCollections = 0;
  return presentation;
}
