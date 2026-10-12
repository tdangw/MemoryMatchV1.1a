import { shellTimeout as setTimeout } from "./gameShell/gameShellLifecycle.js";
import {
  GAME_CONFIG,
  getMemorySupportDrop,
  resolveMemoryMilestoneRewards,
  shouldDropMemoryEnergy,
} from "./config.js";
import { gameState, increaseCoins } from "./gameState.js";
import { playLootDrop } from "./lootEffects.js";
import { changeMemoryItemCount, getMemoryItem, getMemoryItemId } from "./memoryItems.js";
import { revealMemoryTiles } from "./memoryPreview.js";
import { savePersistentGameData } from "./persistence.js";
import { stageMemorySession } from "./memorySession.js";
import {
  showMemoryCoinReward,
  updateCoinDisplay,
  updateHintDisplay,
  updateMemoryAssistInventoryDisplay,
  updateMemorySpecialProgress,
} from "./ui.js";
import { GAMEPLAY_LIMITS, GAMEPLAY_TIMING } from "./gameplayTuning.js";

export async function handleMemorySpecialMatch(source, roundId = gameState.roundId) {
  if (!source || gameState.roundId !== roundId) return;
  const target = GAME_CONFIG.special.progressTarget;
  const hasCollectionCapacity = gameState.specialProgress + gameState.pendingEnergyCollections < target;
  const dropsEnergy = hasCollectionCapacity
    && shouldDropMemoryEnergy(gameState.specialNoEnergyDropStreak);
  if (!dropsEnergy) {
    if (hasCollectionCapacity) {
      gameState.specialNoEnergyDropStreak += 1;
      (await persistMemoryRewards());
      if (gameState.roundId !== roundId) return;
    }
  } else {
    gameState.specialNoEnergyDropStreak = 0;
    gameState.pendingEnergyCollections += 1;
    (await persistMemoryRewards());
    if (gameState.roundId !== roundId) return;
    playLootDrop(source, {
      icon: "energy",
      tier: "energy",
      target: document.getElementById("memory-special-milestones"),
      onCollected: async () => (await collectMemoryEnergy(source, roundId)),
    });
  }

  const supportReward = getMemorySupportDrop();
  if (supportReward) setTimeout(async () => (await grantMemoryReward(supportReward, source, roundId)), 180);
}

async function collectMemoryEnergy(source, roundId) {
  if (gameState.roundId !== roundId) return;
  const target = GAME_CONFIG.special.progressTarget;
  gameState.pendingEnergyCollections = Math.max(0, gameState.pendingEnergyCollections - 1);
  gameState.specialProgress = Math.min(target, gameState.specialProgress + 1);
  const reachedProgress = gameState.specialProgress;
  updateMemorySpecialProgress(reachedProgress);
  (await persistMemoryRewards());
  if (gameState.roundId !== roundId) return;
  resolveMemoryMilestoneRewards(reachedProgress).forEach((reward, index) => {
    setTimeout(async () => (await grantMemoryReward(reward, source, roundId)), index * 130);
  });
  if (reachedProgress < target) return;
  gameState.specialProgress = 0;
  (await persistMemoryRewards());
  if (gameState.roundId !== roundId) return;
  setTimeout(() => {
    if (gameState.roundId === roundId) updateMemorySpecialProgress(0);
  }, 1200);
}

async function grantMemoryReward(reward, source, roundId) {
  if (!reward || gameState.roundId !== roundId) return;
  if (reward.type === "preview-auto") {
    const item = getMemoryItem(getMemoryItemId("preview", reward.value));
    playLootDrop(source, {
      icon: "eye",
      tier: item?.tier || GAME_CONFIG.special.previewTierColors[reward.value],
      target: document.getElementById("btn-preview-cards"),
      onCollected: () => useAutomaticPreviewWhenReady(reward.value, roundId),
    });
    return;
  }

  if (reward.type === "coins") {
    const before = gameState.coins;
    const after = increaseCoins(reward.value);
    if (!(await persistMemoryRewards({ coins: after }))) {
      gameState.coins = before;
      return;
    }
    if (gameState.roundId !== roundId) return;
    updateCoinDisplay(after);
    showMemoryCoinReward(source, before, after, reward.value);
    return;
  }

  if (reward.type === "hint") {
    gameState.progress.memoryMatch.items.hint = Math.min(GAMEPLAY_LIMITS.itemCount, gameState.progress.memoryMatch.items.hint + reward.value);
    (await persistMemoryRewards());
    if (gameState.roundId !== roundId) return;
    updateHintDisplay(gameState.progress.memoryMatch.items.hint);
    playLootDrop(source, {
      icon: "search",
      tier: "blue",
      target: document.getElementById("btn-hint"),
    });
    return;
  }

  const itemType = reward.type === "time-item" ? "time" : "preview";
  const item = getMemoryItem(getMemoryItemId(itemType, reward.value));
  if (!item || !changeMemoryItemCount(item.id, 1)) return;
  (await persistMemoryRewards());
  if (gameState.roundId !== roundId) return;
  updateMemoryAssistInventoryDisplay();
  playLootDrop(source, {
    icon: item.icon,
    tier: item.tier,
    target: document.getElementById(item.type === "time" ? "btn-buy-time" : "btn-preview-cards"),
  });
}

function useAutomaticPreviewWhenReady(value, roundId, attempts = 0) {
  if (gameState.roundId !== roundId || gameState.isPaused) return;
  if (gameState.isLocked || document.querySelector(".tile.selected")) {
    if (attempts < 20) {
      setTimeout(() => useAutomaticPreviewWhenReady(value, roundId, attempts + 1), 250);
    }
    return;
  }
  revealMemoryTiles(value, GAMEPLAY_TIMING.shopRevealDurationMs, roundId);
}

async function persistMemoryRewards({ coins } = {}) {
  if (gameState.matchedPairs < gameState.totalPairs) stageMemorySession();
  return (await savePersistentGameData({
    ...(Number.isFinite(coins) ? { coins } : {}),
    progress: gameState.progress,
  }));
}
