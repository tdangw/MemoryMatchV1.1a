import { playRewardPhase } from './rewardAudio.js';
import { shellTimeout as setTimeout, getActiveGameScope } from './gameShell/gameShellLifecycle.js';
import { gameState } from './gameState.js';
import { playLootDrop } from './lootEffects.js';
import { getMemoryItem, getMemoryItemId } from './memoryItems.js';
import { savePersistentGameData } from './persistence.js';
import { stageMemorySession } from './memorySession.js';
import { getActiveSession } from './sessionProgress.js';
import { resolveMemoryPairRewards } from './memoryMatch/pairRewards.js';
import { updateCoinDisplay, updateHintDisplay, updateMemoryAssistInventoryDisplay, updateMemorySpecialProgress } from './ui.js';

export async function handleMemorySpecialMatch(source, roundId = gameState.roundId) {
  if (!source || gameState.roundId !== roundId) return;
  const rollback = structuredClone({ coins: gameState.coins, progress: gameState.progress.memoryMatch, energy: gameState.specialProgress, streak: gameState.specialNoEnergyDropStreak });
  const presentation = resolveMemoryPairRewards(gameState, { special: true });
  stageMemorySession({ assetPaths: getActiveSession('memory-match', gameState.settings.mode)?.assetPaths || [] });
  if (!await savePersistentGameData({ coins: gameState.coins, progress: gameState.progress })) {
    if (gameState.roundId === roundId) { gameState.coins = rollback.coins; gameState.progress.memoryMatch = rollback.progress; gameState.specialProgress = rollback.energy; gameState.specialNoEnergyDropStreak = rollback.streak; }
    return;
  }
  presentMemoryPairRewards(presentation, source, roundId);
}

export function presentMemoryPairRewards(presentation, source, roundId) {
  if (gameState.roundId !== roundId) return;
  updateCoinDisplay(gameState.coins); updateHintDisplay(gameState.progress.memoryMatch.items.hint);
  updateMemoryAssistInventoryDisplay(); updateMemorySpecialProgress(gameState.specialProgress);
  const owner = getActiveGameScope();
  if (owner && (presentation.lucky || presentation.rewards.length)) playRewardPhase('receive', owner);
  if (presentation.lucky) dropLuckyReward(presentation.lucky, source);
  if (presentation.energyProgress !== null) playLootDrop(source, { icon: 'energy', tier: 'energy', target: document.getElementById('memory-special-milestones'), receiveCue:false });
  presentation.rewards.forEach((reward, index) => setTimeout(() => {
    if (gameState.roundId !== roundId) return;
    if (reward.type === 'coins') { dropLuckyReward(reward, source); return; }
    const item = getMemoryItem(reward.type === 'hint' ? 'hint' : getMemoryItemId(reward.type === 'time-item' ? 'time' : 'preview', reward.value));
    playLootDrop(source, { icon: item.icon, tier: item.tier, target: document.getElementById(item.type === 'time' ? 'btn-buy-time' : item.type === 'hint' ? 'btn-hint' : 'btn-preview-cards'), receiveCue:false });
  }, index * 130));
}

function dropLuckyReward(reward, source) {
  const coins = reward.type === 'coins', time = reward.type === 'time';
  playLootDrop(source, {
    icon: coins ? 'coin' : time ? 'timer' : 'search',
    tier: coins ? 'gold' : time ? 'blue' : getMemoryItem('hint').tier,
    target: document.getElementById(coins ? 'memory-game-coins' : time ? 'timer' : 'btn-hint'), receiveCue:false,
  });
}
