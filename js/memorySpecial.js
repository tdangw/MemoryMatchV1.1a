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

export function handleMemorySpecialMatch(source, roundId = gameState.roundId) {
  if (!source || gameState.roundId !== roundId) return;
  const dropsEnergy = shouldDropMemoryEnergy(gameState.specialNoEnergyDropStreak);
  if (!dropsEnergy) {
    gameState.specialNoEnergyDropStreak += 1;
    persistMemoryRewards();
  } else {
    gameState.specialNoEnergyDropStreak = 0;
    const target = GAME_CONFIG.special.progressTarget;
    gameState.specialProgress = Math.min(target, gameState.specialProgress + 1);
    const reachedProgress = gameState.specialProgress;
    updateMemorySpecialProgress(reachedProgress);
    persistMemoryRewards();
    playLootDrop(source, {
      icon: "energy",
      tier: "energy",
      target: document.getElementById("memory-special-milestones"),
    });
    resolveMemoryMilestoneRewards(reachedProgress).forEach((reward, index) => {
      setTimeout(() => grantMemoryReward(reward, source, roundId), index * 130);
    });
    if (reachedProgress >= target) {
      gameState.specialProgress = 0;
      persistMemoryRewards();
      setTimeout(() => {
        if (gameState.roundId === roundId) updateMemorySpecialProgress(0);
      }, 1200);
    }
  }

  const supportReward = getMemorySupportDrop();
  if (supportReward) setTimeout(() => grantMemoryReward(supportReward, source, roundId), 180);
}

function grantMemoryReward(reward, source, roundId) {
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
    persistMemoryRewards({ coins: after });
    updateCoinDisplay(after);
    showMemoryCoinReward(source, before, after, reward.value);
    return;
  }

  if (reward.type === "hint") {
    gameState.hints = Math.min(GAMEPLAY_LIMITS.itemCount, gameState.hints + reward.value);
    persistMemoryRewards();
    updateHintDisplay(gameState.hints);
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
  persistMemoryRewards();
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

function persistMemoryRewards({ coins } = {}) {
  stageMemorySession();
  return savePersistentGameData({
    ...(Number.isFinite(coins) ? { coins } : {}),
    progress: gameState.progress,
  });
}
