import { shellTimeout as setTimeout, clearShellTimeout as clearTimeout } from "./gameShell/gameShellLifecycle.js";
// logic.js - Xử lý logic của trò chơi
// chức năng của logic.js là xử lý logic của trò chơi, bao gồm việc xử lý sự kiện khi người chơi nhấp vào ô, kiểm tra xem hai ô có khớp nhau hay không, và kiểm tra xem người chơi đã hoàn thành cấp độ hay chưa. Nó cũng bao gồm các chức năng để khởi tạo logic và xử lý âm thanh khi người chơi tương tác với trò chơi.

import {
  increaseCoins,
  increaseScore,
  gameState,
  recordMemoryMatchResult,
} from "./gameState.js";
import { calculateCoinReward, calculateCompletionTimeBonus, calculateMatchPoints, calculateStarProgress, calculateStarRating, isEndlessMode } from "./config.js";
import {
  updateScoreDisplay,
  updateTimerDisplay,
  syncMemoryTimeProgress,
  updateMovesDisplay,
  updateMissesDisplay,
  updateComboDisplay,
  updateLevelStarsDisplay,
  updateTotalStarsDisplay,
  updateCoinDisplay,
  showComboEffect,
  showBonusOverlay,
  highlightTarget,
  showScoreEffect,
  showMemoryCoinReward,
  showLevelSummaryOverlay,
} from "./ui.js";
import { duckBackgroundMusicForVictory, pauseBackgroundMusic, sounds } from "./sound.js"; // 📦 Tách âm thanh
import { savePersistentGameData } from "./persistence.js";
import { stageMemorySession, saveMemorySession } from './memorySession.js';
import { getActiveSession } from './sessionProgress.js';
import { finishPlayMetrics } from "./playMetrics.js";
import { checkpointRankedRun, stageRankedAttempt } from "./rankingRules.js";
import { getFlipAnimationClass } from "./appearance.js";
import { clearMemoryTileAnimations, restartMemoryTileAnimation } from "./memoryMatch/tileAnimation.js";
import {
  GAMEPLAY_TIMING,
  getComboTimeBonus,
  getComboWindowMs,
} from "./gameplayTuning.js";
import { calculateMatchCoinReward } from "./coinRewards.js";
import {
  canShowFullVictoryCelebration,
  showFullVictoryCelebration,
} from "victory-presentation";
import { presentMemoryPairRewards } from './memorySpecial.js';
import { resolveMemoryPairRewards } from './memoryMatch/pairRewards.js';
import { clearComboWindow, playComboWindow } from "./gameShell/comboWindowPresentation.js";

let selectedTiles = [];
let levelCompleteActions = { onNext: () => {}, onMenu: () => {} };
let pendingMismatch = null;
let comboExpiryTimer;
let lastMatchAt = 0;
const REVEAL_ANIMATION_CLASSES = [
  "appear-bounce",
  "appear-fade-scale",
  "appear-pop",
  "appear-slide-up",
  "appear-flip-y",
  "appear-zoom-rotate",
  "appear-blur-in",
];

export function configureLogic(actions) {
  levelCompleteActions = { ...levelCompleteActions, ...actions };
}

export function resetLogicRuntime() {
  if (pendingMismatch) clearTimeout(pendingMismatch.timeoutId);
  pendingMismatch = null;
  selectedTiles = [];
  lastMatchAt = 0;
  stopComboWindow();
  clearMemoryTileAnimations();
}

function setInteractionLocked(locked, roundId = gameState.roundId) {
  if (gameState.roundId !== roundId) return;
  gameState.isLocked = locked;
  document
    .getElementById("grid-container")
    ?.classList.toggle("is-locked", locked);
}

function revealTile(img) {
  const animationClass = getFlipAnimationClass(gameState.appearance.flipEffect);
  img.classList.remove("hidden");
  restartMemoryTileAnimation(img, {
    remove: REVEAL_ANIMATION_CLASSES,
    animationClass,
    durationMs: GAMEPLAY_TIMING.tileRevealAnimationMs,
  });
}

function hideTile(img, roundId, onHidden) {
  if (!img) return onHidden?.();

  restartMemoryTileAnimation(img, {
    remove: [...REVEAL_ANIMATION_CLASSES, "hide-fade-scale"],
    animationClass: "hide-fade-scale",
    durationMs: GAMEPLAY_TIMING.tileHideAnimationMs,
    onFinish: () => {
      if (gameState.roundId === roundId) img.classList.add("hidden");
      onHidden?.();
    },
  });
}

function resolvePendingMismatch({ immediately = false } = {}) {
  const mismatch = pendingMismatch;
  if (!mismatch) return;

  pendingMismatch = null;
  clearTimeout(mismatch.timeoutId);
  if (gameState.roundId !== mismatch.roundId) return;

  mismatch.tiles.forEach((tile) => tile.classList.remove("selected", "wrong"));
  if (immediately) {
    mismatch.tiles.forEach((tile) =>
      tile.querySelector("img")?.classList.add("hidden"),
    );
    setInteractionLocked(false, mismatch.roundId);
    return;
  }

  setInteractionLocked(true, mismatch.roundId);
  let remainingHides = mismatch.tiles.length;
  const unlockWhenHidden = () => {
    remainingHides -= 1;
    if (remainingHides === 0) setInteractionLocked(false, mismatch.roundId);
  };
  mismatch.tiles.forEach((tile) =>
    hideTile(tile.querySelector("img"), mismatch.roundId, unlockWhenHidden),
  );
}

/**
 * Khởi tạo logic và gán sự kiện click cho tất cả tile
 */
export function initLogic() {
  resetLogicRuntime();
  const tiles = document.querySelectorAll(".tile");
  tiles.forEach((tile) => {
    tile.onclick = async () => (await handleTileClick(tile));
  });
}

/**
 * Xử lý khi người chơi click vào tile
 */
export async function handleTileClick(tileElement) {
  // Chạm một thẻ mới trong lúc cặp sai đang hiện sẽ đóng cặp đó ngay.
  resolvePendingMismatch({ immediately: true });
  if (gameState.isLocked || selectedTiles.length >= 2) return;

  const imageId = tileElement.dataset.imageId;
  const img = tileElement.querySelector("img");

  if (tileElement.classList.contains("selected") && img) {
    tileElement.classList.remove("selected");
    selectedTiles = selectedTiles.filter(({ element }) => element !== tileElement);
    hideTile(img, gameState.roundId);
    return;
  }

  // Không cho tương tác lại với thẻ đã ghép hoặc phần tử ảnh không hợp lệ.
  if (
    tileElement.classList.contains("matched") ||
    !img
  )
    return;

  // 🎵 Phát âm click nếu bật sound
  if (gameState.settings?.sound) {
    sounds.click.currentTime = 0;
    sounds.click.play().catch(() => {});
  }

  revealTile(img);
  tileElement.classList.add("selected");

  selectedTiles.push({
    element: tileElement,
    imageId,
    special: tileElement.dataset.special === "true",
  });
  if (selectedTiles.length === 2) {
    gameState.moves++;
    updateMovesDisplay(gameState.moves);
    setInteractionLocked(true);
    (await checkMatch(gameState.roundId));
  }
}

// So khớp 2 tile được chọn
async function checkMatch(roundId) {
  const [first, second] = selectedTiles;

  if (first.imageId === second.imageId) {
    const rollback = structuredClone({ coins: gameState.coins, progress: gameState.progress.memoryMatch,
      score: gameState.score, combo: gameState.combo, matchedPairs: gameState.matchedPairs, remainingTime: gameState.remainingTime,
      luckyRewards: gameState.luckyRewards, luckyAwards: gameState.luckyAwards, specialProgress: gameState.specialProgress,
      specialNoEnergyDropStreak: gameState.specialNoEnergyDropStreak });
    first.element.classList.remove("selected");
    second.element.classList.remove("selected");
    first.element.classList.add("matched");
    second.element.classList.add("matched");

    const matchedAt = performance.now();
    const comboWindowMs = getComboWindowMs(gameState.totalPairs);
    gameState.combo = lastMatchAt && matchedAt - lastMatchAt <= comboWindowMs
      ? gameState.combo + 1
      : 1;
    const resolvedCombo = gameState.combo;
    lastMatchAt = matchedAt;
    startComboWindow(comboWindowMs, matchedAt, roundId);
    const comboAdjustedPoints = calculateMatchPoints(gameState.combo);
    const specialBonus = first.special ? Math.round(comboAdjustedPoints * 0.5) : 0;
    const matchPoints = comboAdjustedPoints + specialBonus;
    const score = increaseScore(matchPoints);
    updateScoreDisplay(score);
    showScoreEffect(second.element, matchPoints);
    const matchCoins = calculateMatchCoinReward(gameState.combo);
    const previousCoins = gameState.coins;
    increaseCoins(matchCoins);
    const comboTimeBonus = getComboTimeBonus(gameState.combo);
    if (!isEndlessMode(gameState.settings.mode)) gameState.remainingTime += comboTimeBonus;
    const rewards = resolveMemoryPairRewards(gameState, { imageId: first.imageId, special: first.special });
    const totalCoins = gameState.coins;
    gameState.matchedPairs++;
    const staged = stageMemorySession({ assetPaths: getActiveSession('memory-match', gameState.settings.mode)?.assetPaths || [] });
    if (!staged || !(await savePersistentGameData({ coins: totalCoins, progress: gameState.progress }))) {
      if (gameState.roundId !== roundId) return;
      gameState.progress.memoryMatch = rollback.progress;
      for (const key of Object.keys(rollback)) if (key !== 'progress') gameState[key] = rollback[key];
      first.element.classList.remove('matched'); second.element.classList.remove('matched');
      stopComboWindow(); lastMatchAt = 0;
      showBonusOverlay("Không thể lưu phần thưởng Xu lúc này.");
      return;
    }
    else {
      if (gameState.roundId !== roundId) return;
      showMemoryCoinReward(second.element, previousCoins, totalCoins, matchCoins);
    }
    highlightTarget("#score");
    updateLevelStarsDisplay(calculateStarProgress(score, gameState.totalPairs, gameState.settings.mode));
    updateComboDisplay(gameState.combo);
    if (comboTimeBonus > 0 && !isEndlessMode(gameState.settings.mode)) {
      updateTimerDisplay(gameState.remainingTime);
      syncMemoryTimeProgress({ remainingSeconds: gameState.remainingTime, timeLimit: gameState.timeLimit });
      highlightTarget("#timer");
    }
    if (comboTimeBonus > 0) {
      setTimeout(() => showComboEffect(second.element, resolvedCombo), 650);
    }
    highlightTarget("#pair-progress");

    if (gameState.settings?.sound) {
      sounds.match.currentTime = 0;
      sounds.match.play().catch(() => {});
    }

    presentMemoryPairRewards(rewards, second.element, roundId);
    updateTimerDisplay(gameState.remainingTime);
    syncMemoryTimeProgress({ remainingSeconds: gameState.remainingTime, timeLimit: gameState.timeLimit });

    setInteractionLocked(false, roundId);
    if (gameState.matchedPairs < gameState.totalPairs) await saveMemorySession({ assetPaths: getActiveSession('memory-match', gameState.settings.mode)?.assetPaths || [] });
    (await checkLevelComplete());
  } else {
    gameState.misses++;
    gameState.combo = 0;
    lastMatchAt = 0;
    stopComboWindow();
    updateMissesDisplay(gameState.misses);
    updateComboDisplay(gameState.combo);
    first.element.classList.add("wrong");
    second.element.classList.add("wrong");

    if (gameState.settings?.sound) {
      sounds.wrong.currentTime = 0;
      sounds.wrong.play().catch(() => {});
    }

    // Trong thời gian viền đỏ hiển thị, người chơi có thể chạm thẻ khác để ẩn ngay.
    setInteractionLocked(false, roundId);
    pendingMismatch = {
      roundId,
      tiles: [first.element, second.element],
      timeoutId: setTimeout(
        () => resolvePendingMismatch(),
        GAMEPLAY_TIMING.mismatchRevealMs,
      ),
    };
  }

  selectedTiles = [];
}

export function memoryComboRemainingMs() {
  return lastMatchAt ? Math.max(0, getComboWindowMs(gameState.totalPairs) - (performance.now() - lastMatchAt)) : 0;
}
export function restoreMemoryCombo(combo, remainingMs) {
  gameState.combo = remainingMs > 0 ? combo : 0;
  if (gameState.combo) {
    lastMatchAt = performance.now() - getComboWindowMs(gameState.totalPairs) + remainingMs;
    startComboWindow(remainingMs, lastMatchAt, gameState.roundId);
  }
  updateComboDisplay(gameState.combo);
}
function startComboWindow(durationMs, matchedAt, roundId) {
  clearTimeout(comboExpiryTimer);
  const card = document.getElementById("combo")?.closest(".stat-combo");
  if (card) {
    playComboWindow(card, durationMs);
  }
  comboExpiryTimer = setTimeout(() => {
    if (gameState.roundId !== roundId || lastMatchAt !== matchedAt) return;
    gameState.combo = 0;
    lastMatchAt = 0;
    updateComboDisplay(0);
    stopComboWindow();
  }, durationMs);
}

function stopComboWindow() {
  clearTimeout(comboExpiryTimer);
  comboExpiryTimer = undefined;
  clearComboWindow(document.getElementById("combo")?.closest(".stat-combo"));
}

/**
 * Kiểm tra nếu đã matched hết → qua màn
 */
export async function checkLevelComplete() {
  if (!gameState.isPaused && gameState.totalPairs > 0 && gameState.matchedPairs >= gameState.totalPairs) {
    const roundId = gameState.roundId;
    const durationMs = finishPlayMetrics();
    const rollback = { coins: gameState.coins, score: gameState.score, progress: structuredClone(gameState.progress.memoryMatch) };
    const previousChapter = gameState.progress.memoryMatch.adventure?.currentChapter || 1;
    setInteractionLocked(true);
    gameState.isPaused = true;
    const grossCoins = calculateCoinReward(
      gameState.settings.mode,
      gameState.remainingTime,
    );
    const coinPenalty = isEndlessMode(gameState.settings.mode)
      ? 0
      : Math.min(grossCoins, gameState.misses);
    const coinsEarned = grossCoins - coinPenalty;
    const timeBonus = calculateCompletionTimeBonus(
      gameState.settings.mode,
      gameState.remainingTime,
    );
    const finalScore = increaseScore(timeBonus);
    const stars = calculateStarRating(finalScore, gameState.totalPairs, gameState.settings.mode);
    const progressResult = recordMemoryMatchResult({
      mode: gameState.settings.mode,
      level: gameState.currentLevel,
      score: finalScore,
      stars,
      durationMs,
    });
    updateScoreDisplay(finalScore);
    updateLevelStarsDisplay(stars);
    updateTotalStarsDisplay(progressResult.totalStars);
    const totalCoins = increaseCoins(coinsEarned);
    stageRankedAttempt("memory-match", gameState.settings.mode, finalScore, true);
    checkpointRankedRun("memory-match", gameState.settings.mode);
    delete gameState.progress.memoryMatch.sessionsByMode?.[gameState.settings.mode];
    if (!(await savePersistentGameData({ coins: totalCoins, progress: gameState.progress, cloudEvent: true }))) {
      if (gameState.roundId === roundId) {
        gameState.coins = rollback.coins;
        gameState.score = rollback.score;
        gameState.progress.memoryMatch = rollback.progress;
      }
      return;
    }
    if (gameState.roundId !== roundId) return;
    updateCoinDisplay(totalCoins);
    duckBackgroundMusicForVictory(gameState.settings);
    if (gameState.settings?.sound) {
      sounds.victory.currentTime = 0;
      sounds.victory.play().catch(() => {});
    }
    const completedChapter = gameState.progress.memoryMatch.adventure?.currentChapter > previousChapter ? previousChapter : null;
    const nextLevel = completedChapter ? gameState.progress.memoryMatch.adventure.firstLevel : gameState.currentLevel + 1;
    const continueToNextLevel = () => levelCompleteActions.onNext(nextLevel);
    const completion = {
      level: gameState.currentLevel,
      remainingTime: gameState.remainingTime,
      moves: gameState.moves,
      misses: gameState.misses,
      coinsEarned,
      score: finalScore,
      stars,
      timeBonus,
      luckyAwards: gameState.luckyAwards,
      settings: gameState.settings,
      onNext: continueToNextLevel,
      onMenu: levelCompleteActions.onMenu,
      completedChapter,
    };
    if (
      canShowFullVictoryCelebration
      && completion.completedChapter
    ) {
      showLevelSummaryOverlay({
        ...completion,
        isVictoryCelebration: true,
        onCelebrate: () => showFullVictoryCelebration(completion),
      });
    } else {
      showLevelSummaryOverlay(completion);
    }
  }
}
