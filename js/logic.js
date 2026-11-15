import { memoryTicketDrop } from './liveops/dropAdapters.js';
import { prepareLetterDropFeedback } from './liveops/letterDropFeedback.js';
import { shellTimeout as setTimeout, clearShellTimeout as clearTimeout } from "./gameShell/gameShellLifecycle.js";
// logic.js - Xử lý logic của trò chơi
// chức năng của logic.js là xử lý logic của trò chơi, bao gồm việc xử lý sự kiện khi người chơi nhấp vào ô, kiểm tra xem hai ô có khớp nhau hay không, và kiểm tra xem người chơi đã hoàn thành cấp độ hay chưa. Nó cũng bao gồm các chức năng để khởi tạo logic và xử lý âm thanh khi người chơi tương tác với trò chơi.

import {
  increaseCoins,
  increaseScore,
  gameState,
  recordMemoryMatchResult,
} from "./gameState.js";
import { isEndlessMode } from "./config.js";
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
import { duckBackgroundMusicForVictory, pauseBackgroundMusic, sounds, playOwnedRewardCue } from "./sound.js"; // 📦 Tách âm thanh
import { savePersistentGameData } from "./persistence.js";
import { memorySettlementFact } from './liveops/settlementAdapters.js';
import { stageMemorySession } from './memorySession.js';
import { getActiveSession } from './sessionProgress.js';
import { finishPlayMetrics, snapshotPlayMetrics } from "./playMetrics.js";
import { checkpointRankedRun, stageRankedAttempt } from "./rankingRules.js";
import { getFlipAnimationClass } from "./appearance.js";
import { clearMemoryTileAnimations, restartMemoryTileAnimation } from "./memoryMatch/tileAnimation.js";
import {
  GAMEPLAY_TIMING,
  getComboWindowMs,
} from "./gameplayTuning.js";
import {
  canShowFullVictoryCelebration,
  showFullVictoryCelebration,
} from "victory-presentation";
import { presentMemoryPairRewards } from './memorySpecial.js';
import { resolveMemoryPairRewards } from './memoryMatch/pairRewards.js';
import { clearComboWindow, playComboWindow } from "./gameShell/comboWindowPresentation.js";
import { memoryBoard, clearMemoryBoard, decideMemorySelection, decideMemoryPair } from './memoryMatch/memoryBoard.js';
import { MATCH_COINS_PER_GROUP, calculateGroupScore, calculateVictoryCoins, calculateFastFinishBonus, calculateProgressionStars } from './progression/gameplayRules.js';
import { completeWave, waveTotalGroups } from './progression/waveProgress.js';
import { getMemoryHud, getMemoryShell } from './memoryMatch/memoryShell.js';
import { prepareSummaryCoins } from './progression/summaryCoins.js';

let levelCompleteActions = { onNext: () => {}, onMenu: () => {} };
let pendingMismatch = null;
let comboExpiryTimer;
let lastMatchAt = 0;
let pausedComboRemainingMs = null;
const REVEAL_ANIMATION_CLASSES = [
  'appear-storybook-moon', 'appear-storybook-petals',
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

export function resetLogicRuntime({ preserveBoard = false } = {}) {
  if (pendingMismatch) clearTimeout(pendingMismatch.timeoutId);
  pendingMismatch = null;
  memoryBoard.selectedIds = [];
  if (!preserveBoard) clearMemoryBoard();
  lastMatchAt = 0;
  pausedComboRemainingMs = null;
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

  memoryBoard.selectedIds = [];
  mismatch.tiles.forEach((tile) => tile.classList.remove("selected", "wrong"));
  if (immediately) {
    mismatch.tiles.forEach((tile) =>
      tile.querySelector("img")?.classList.add("hidden"),
    );
    setInteractionLocked(false, mismatch.roundId);
    return;
  }

  // Closing cards own their animations. Reselecting one cancels its old hide;
  // a hide completion must never unlock a later pair's durable transaction.
  setInteractionLocked(false, mismatch.roundId);
  mismatch.tiles.forEach((tile) =>
    hideTile(tile.querySelector("img"), mismatch.roundId),
  );
}

/**
 * Khởi tạo logic và gán sự kiện click cho tất cả tile
 */
export function initLogic() {
  resetLogicRuntime({ preserveBoard: true });
  const tiles = document.querySelectorAll(".tile");
  tiles.forEach((tile) => {
    tile.onclick = async () => (await handleTileClick(tile));
  });
}

/**
 * Xử lý khi người chơi click vào tile
 */
export async function handleTileClick(tileElement) {
  if (document.getElementById(tileElement.id) !== tileElement) return;
  if (gameState.isPaused) return;
  // Chạm một thẻ mới trong lúc cặp sai đang hiện sẽ đóng cặp đó ngay.
  resolvePendingMismatch({ immediately: true });
  const img = tileElement.querySelector("img");
  // The DOM adapter resolves a live node to its stable model ID only.
  const decision = decideMemorySelection(memoryBoard, tileElement.id, {
    roundId: gameState.roundId, locked: gameState.isLocked, hasImage: Boolean(img),
  });
  if (decision === 'reject') return;
  if (decision === 'deselect') {
    tileElement.classList.remove("selected");
    memoryBoard.selectedIds = memoryBoard.selectedIds.filter(id => id !== tileElement.id);
    hideTile(img, gameState.roundId);
    return;
  }

  // 🎵 Phát âm click nếu bật sound
  if (gameState.settings?.sound) {
    sounds.click.currentTime = 0;
    sounds.click.play().catch(() => {});
  }

  revealTile(img);
  tileElement.classList.add("selected");

  memoryBoard.selectedIds.push(tileElement.id);
  if (memoryBoard.selectedIds.length === 2) {
    gameState.moves++;
    updateMovesDisplay(gameState.moves);
    setInteractionLocked(true);
    (await checkMatch(gameState.roundId));
  }
}

// So khớp 2 tile được chọn
async function checkMatch(roundId) {
  const [first, second] = memoryBoard.selectedIds.map(id => ({
    ...memoryBoard.tiles.get(id), id, element: document.getElementById(id),
  }));
  if (first.imageId === second.imageId) {
    const rollback = structuredClone({ coins: gameState.coins, progress: gameState.progress.memoryMatch,
      score: gameState.score, combo: gameState.combo, matchedPairs: gameState.matchedPairs, remainingTime: gameState.remainingTime,
      luckyRewards: gameState.luckyRewards, luckyAwards: gameState.luckyAwards, specialProgress: gameState.specialProgress,
      specialNoEnergyDropStreak: gameState.specialNoEnergyDropStreak });
    first.element.classList.remove("selected");
    second.element.classList.remove("selected");
    first.element.classList.add("matched");
    second.element.classList.add("matched");
    memoryBoard.tiles.get(first.id).matched = true;
    memoryBoard.tiles.get(second.id).matched = true;

    // Keep the original logical clock boundary after snapshot/staging work.
    const matchedAt = performance.now();
    const comboWindowMs = getComboWindowMs(gameState.totalPairs);
    const decision = decideMemoryPair(first, second, {
      combo: gameState.combo, lastMatchAt, matchedAt, comboWindowMs,
    });
    gameState.combo = decision.combo;
    const resolvedCombo = gameState.combo;
    lastMatchAt = matchedAt;
    startComboWindow(comboWindowMs, matchedAt, roundId);
    const matchPoints = calculateGroupScore({ combo: gameState.combo });
    const score = increaseScore(matchPoints);
    const matchCoins = MATCH_COINS_PER_GROUP;
    const previousCoins = gameState.coins;
    increaseCoins(matchCoins);
    const rewards = resolveMemoryPairRewards(gameState, { imageId: first.imageId, special: first.special });
    const totalCoins = gameState.coins;
    gameState.matchedPairs++;
    const ticketDrop=memoryTicketDrop(gameState.wave,first,second,rewards);
    const staged = stageMemorySession({ assetPaths: getActiveSession('memory-match', gameState.settings.mode)?.assetPaths || [] });
    if (!staged || !(await savePersistentGameData({ coins: totalCoins, progress: gameState.progress,
      ticketDrop,
      onSpecialDrop: ticketDrop ? prepareLetterDropFeedback(second.element,getMemoryShell().scope) : undefined }))) {
      if (gameState.roundId !== roundId) return;
      gameState.progress.memoryMatch = rollback.progress;
      for (const key of Object.keys(rollback)) if (key !== 'progress') gameState[key] = rollback[key];
      first.element.classList.remove('matched'); second.element.classList.remove('matched');
      memoryBoard.tiles.get(first.id).matched = false;
      memoryBoard.tiles.get(second.id).matched = false;
      stopComboWindow(); lastMatchAt = 0;
      updateScoreDisplay(gameState.score);
      updateComboDisplay(gameState.combo);
      updateTimerDisplay(gameState.remainingTime);
      syncMemoryTimeProgress({ remainingSeconds: gameState.remainingTime, timeLimit: gameState.timeLimit });
      showBonusOverlay("Không thể lưu phần thưởng Xu lúc này.");
      return;
    }
    else {
      if (gameState.roundId !== roundId) return;
      if (gameState.matchedPairs >= gameState.totalPairs && gameState.wave.index < gameState.wave.count) {
        playOwnedRewardCue('wave', getMemoryShell().scope, gameState.settings);
      }
      updateScoreDisplay(score);
      showScoreEffect(second.element, matchPoints);
      showMemoryCoinReward(second.element, previousCoins, totalCoins, matchCoins);
    }
    highlightTarget("#score");
    updateLevelStarsDisplay(calculateProgressionStars({ gameId: 'memory-match', score, totalGroups: waveTotalGroups(gameState.wave), mode: gameState.settings.mode, won: false }));
    updateComboDisplay(gameState.combo);
    if (resolvedCombo >= 2) {
      setTimeout(() => {
        if (gameState.roundId === roundId) showComboEffect(second.element, resolvedCombo);
      }, 650);
    }
    highlightTarget("#pair-progress");

    if (gameState.settings?.sound) {
      sounds.match.currentTime = 0;
      sounds.match.play().catch(() => {});
    }

    presentMemoryPairRewards(rewards, second.element, roundId);
    updateTimerDisplay(gameState.remainingTime);
    syncMemoryTimeProgress({ remainingSeconds: gameState.remainingTime, timeLimit: gameState.timeLimit });

    // Board, wallet and rewards were staged and committed together above.
    // Release this pair before accepting another selection, with no later
    // continuation capable of clearing the next pair's selected IDs.
    memoryBoard.selectedIds = [];
    if (gameState.matchedPairs >= gameState.totalPairs) await checkLevelComplete();
    else setInteractionLocked(false, roundId);
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

  // Wrong tiles remain selected until the mismatch owner closes them, just as
  // the original DOM contract required for Hint and the item picker.
  // Successful pairs release their selection at the commit boundary above.
}

export function memoryComboRemainingMs() {
  return pausedComboRemainingMs ?? (lastMatchAt ? Math.max(0, getComboWindowMs(gameState.totalPairs) - (performance.now() - lastMatchAt)) : 0);
}
export function pauseMemoryCombo() {
  pausedComboRemainingMs = memoryComboRemainingMs();
  stopComboWindow();
}
export function restoreMemoryCombo(combo, remainingMs, { paused = false } = {}) {
  stopComboWindow();
  pausedComboRemainingMs = paused ? remainingMs : null;
  gameState.combo = remainingMs > 0 ? combo : 0;
  if (gameState.combo) {
    lastMatchAt = performance.now() - getComboWindowMs(gameState.totalPairs) + remainingMs;
    if (!paused) startComboWindow(remainingMs, lastMatchAt, gameState.roundId);
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
    if (gameState.wave.index < gameState.wave.count) {
      await levelCompleteActions.onWave();
      return;
    }
    const roundId = gameState.roundId;
    const activeMs = snapshotPlayMetrics({ gameId: 'memory-match', mode: gameState.settings.mode, level: gameState.currentLevel })?.elapsedMs || 0;
    const durationMs = finishPlayMetrics();
    const rollback = { coins: gameState.coins, score: gameState.score, wave: gameState.wave, progress: structuredClone(gameState.progress.memoryMatch) };
    const previousChapter = gameState.progress.memoryMatch.adventure?.currentChapter || 1;
    setInteractionLocked(true);
    gameState.isPaused = true;
    gameState.wave = completeWave(gameState.wave, { score: gameState.score, moves: gameState.moves,
      misses: gameState.misses, matchedGroups: gameState.matchedPairs }).progress;
    const totalGroups = waveTotalGroups(gameState.wave);
    const timeBonus = calculateFastFinishBonus({ mode: gameState.settings.mode, totalGroups,
      activeMs, allocatedSeconds: gameState.wave.allocatedSeconds });
    const finalScore = increaseScore(timeBonus);
    const stars = calculateProgressionStars({ gameId: 'memory-match', score: finalScore, totalGroups, mode: gameState.settings.mode, won: true });
    const coinsEarned = calculateVictoryCoins({ gameId: 'memory-match', mode: gameState.settings.mode, totalGroups, stars });
    const progressResult = recordMemoryMatchResult({
      mode: gameState.settings.mode,
      level: gameState.currentLevel,
      score: finalScore,
      stars,
      durationMs,
      wave: gameState.wave,
    });
    const totalCoins = increaseCoins(coinsEarned);
    stageRankedAttempt("memory-match", gameState.settings.mode, finalScore, true);
    checkpointRankedRun("memory-match", gameState.settings.mode);
    delete gameState.progress.memoryMatch.sessionsByMode?.[gameState.settings.mode];
    if (!(await savePersistentGameData({ coins: totalCoins, progress: gameState.progress, rewardFact: memorySettlementFact(gameState.wave), cloudEvent: true }))) {
      if (gameState.roundId === roundId) {
        gameState.coins = rollback.coins;
        gameState.score = rollback.score;
        gameState.wave = rollback.wave;
        gameState.progress.memoryMatch = rollback.progress;
      }
      return;
    }
    if (gameState.roundId !== roundId) return;
    const coinPresentation = prepareSummaryCoins(getMemoryHud(), coinsEarned, totalCoins, getMemoryShell().scope);
    updateScoreDisplay(finalScore);
    updateLevelStarsDisplay(stars);
    updateTotalStarsDisplay(progressResult.totalStars);
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
      gameId: 'memory-match',
      level: gameState.currentLevel,
      remainingTime: gameState.remainingTime,
      moves: gameState.moves,
      misses: gameState.misses,
      coinsEarned,
      coinPresentation,
      mastery: progressResult.mastery,
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
