import {
  isBackgroundMusicPlaying,
  pauseBackgroundMusic,
  pauseGameAudio,
  sounds,
  syncDefaultMusic,
} from "./sound.js";
import { openAppModal } from "./modal.js";
import {
  GAME_CONFIG,
  getChallengeLayout,
  getLevelHintBonus,
  getLevelTimeBonus,
  getModeLayout,
  getPreviewDurationMs,
  getTimerDirection,
  isChallengeMode,
  isEndlessMode,
} from "./config.js";
import { createGrid } from "./grid.js";
import {
  updateLevelDisplay,
  updateScoreDisplay,
  updateHintDisplay,
  updateTimerDisplay,
  updateMovesDisplay,
  updateMissesDisplay,
  updateComboDisplay,
  updatePairProgressDisplay,
  updateLevelStarsDisplay,
  updateTotalStarsDisplay,
  showBonusOverlay,
  showRevealTimerInHud,
  showLevelRewardOverlay,
} from "./ui.js";
import {
  beginRound,
  gameState,
  invalidateRound,
  resetGame,
  spendCoins,
} from "./gameState.js";
import { saveCoins } from "./persistence.js";
import { saveActiveSession } from "./sessionProgress.js";
import { configureLogic } from "./logic.js";
import { GAMEPLAY_TIMING } from "./gameplayTuning.js";

let countdownInterval;
let isAutoPaused = false;
let shouldResumeMusic = false;
let navigation = { showDifficulty: () => {}, createMenu: () => {} };

export function configureGameController(actions) {
  navigation = { ...navigation, ...actions };
}

export function initializeLevel(level) {
  stopCountdown();
  pauseBackgroundMusic();
  isAutoPaused = false;
  document.getElementById("menu-container")?.remove();
  document.body.classList.remove("game-is-paused");
  const gameContainer = document.getElementById("game-container");
  if (gameContainer) gameContainer.style.display = "flex";

  const mode = gameState.settings.mode || "easy";
  gameState.currentLevel = level;
  saveActiveSession("memory-match", { mode, level });
  const modeLayout = getModeLayout(mode);
  const layout = isChallengeMode(mode) ? getChallengeLayout(level) : modeLayout;
  const roundId = beginRound();
  const timeBonus = getLevelTimeBonus(level);
  const hintBonus = getLevelHintBonus(level, gameState.hints);
  if (isEndlessMode(mode)) gameState.remainingTime = 0;
  else if (isChallengeMode(mode)) {
    gameState.remainingTime = level === 1
      ? modeLayout.timeSeconds
      : gameState.remainingTime + GAME_CONFIG.specialModes.challengeTimeBonusSeconds;
  } else gameState.remainingTime = layout.timeSeconds + timeBonus;
  gameState.hints += hintBonus;
  const previewDurationMs = getPreviewDurationMs(mode);
  createGrid(layout, { roundId, onPreviewComplete: startCountdown, previewDurationMs });

  gameState.moves = 0;
  gameState.misses = 0;
  gameState.combo = 0;
  gameState.score = 0;
  gameState.matchedPairs = 0;
  gameState.totalPairs = layout.tileCount / 2;

  updateLevelDisplay(level);
  updateScoreDisplay(gameState.score);
  updateLevelStarsDisplay(0);
  updateTotalStarsDisplay(gameState.progress.memoryMatch.totalStars);
  updateHintDisplay(gameState.hints);
  updateMovesDisplay(gameState.moves);
  updateMissesDisplay(gameState.misses);
  updateComboDisplay(gameState.combo);
  updatePairProgressDisplay(gameState.matchedPairs, gameState.totalPairs);
  updateTimerDisplay(gameState.remainingTime);
  showLevelRewardOverlay();
  showRevealTimerInHud(previewDurationMs / 1000, roundId);
  document.getElementById("btn-buy-time")?.toggleAttribute("hidden", isEndlessMode(mode));
}

function startCountdown(roundId = gameState.roundId) {
  if (gameState.roundId !== roundId) return;
  stopCountdown();
  syncDefaultMusic(gameState.settings);
  countdownInterval = setInterval(() => {
    if (gameState.roundId !== roundId) return stopCountdown();
    if (gameState.isPaused || gameState.isLocked) return;

    const direction = getTimerDirection(gameState.settings.mode);
    gameState.remainingTime += direction === "up" ? 1 : -1;
    updateTimerDisplay(gameState.remainingTime);
    if (direction === "down" && gameState.remainingTime <= 0) handleTimeUp();
  }, 1000);
}

function stopCountdown() {
  clearInterval(countdownInterval);
  countdownInterval = undefined;
}

function isGameVisible() {
  const gameContainer = document.getElementById("game-container");
  return gameContainer?.style.display === "flex";
}

function pauseForBackground() {
  // Âm thanh phải dừng ở mọi màn hình, kể cả menu và popup.
  if (isAutoPaused) return;
  shouldResumeMusic = isBackgroundMusicPlaying();
  pauseGameAudio();

  if (!isGameVisible() || gameState.isPaused) return;
  isAutoPaused = true;
  gameState.isPaused = true;
  document.body.classList.add("game-is-paused");
}

function resumeFromBackground() {
  if (isAutoPaused) {
    isAutoPaused = false;
    gameState.isPaused = false;
    document.body.classList.remove("game-is-paused");
  }
  if (shouldResumeMusic) syncDefaultMusic(gameState.settings);
  shouldResumeMusic = false;
}

function handleTimeUp() {
  stopCountdown();
  invalidateRound();
  let actionSelected = false;

  const returnToMenu = () => {
    resetGame();
    document
      .getElementById("game-container")
      ?.style.setProperty("display", "none");
    navigation.createMenu();
    syncDefaultMusic(gameState.settings);
  };

  const buyMoreTime = (seconds, price, close) => {
    if (!spendCoins(price)) {
      showBonusOverlay("Bạn không đủ Xu để mua thêm thời gian.");
      return true;
    }

    saveCoins(gameState.coins);
    actionSelected = true;
    gameState.remainingTime = seconds;
    const roundId = beginRound();
    gameState.isLocked = false;
    gameState.isPaused = false;
    document.getElementById("grid-container")?.classList.remove("is-locked");
    updateTimerDisplay(gameState.remainingTime);
    close();
    showBonusOverlay(`Đã mua +${seconds}s với ${price} Xu.`);
    syncDefaultMusic(gameState.settings);
    setTimeout(
      () => startCountdown(roundId),
      GAMEPLAY_TIMING.timePurchaseGraceMs,
    );
    return true;
  };

  pauseBackgroundMusic();
  if (gameState.settings.sound) {
    sounds.defeat.currentTime = 0;
    sounds.defeat.play().catch(() => {});
  }

  const timeUpModal = openAppModal({
    id: "time-up-modal",
    icon: "timer",
    title: "Hết giờ",
    content: "<p>Chọn một cách để tiếp tục hành trình của bạn.</p>",
    closeOnBackdrop: false,
    closeOnEscape: false,
    actions: [
      {
        label: "Về Menu",
        icon: "home",
        variant: "secondary",
        onClick: (close) => {
          actionSelected = true;
          close();
          returnToMenu();
        },
      },
      {
        label: "Chơi lại",
        icon: "restart",
        variant: "primary",
        onClick: (close) => {
          actionSelected = true;
          close();
          gameState.fromDefeat = true;
          initializeLevel(gameState.currentLevel);
        },
      },
      {
        label: "+1 giây · 2 Xu",
        icon: "coin",
        variant: "time-purchase",
        onClick: (close) => buyMoreTime(1, 2, close),
      },
      {
        label: "+5 giây · 10 Xu",
        icon: "coin",
        variant: "time-purchase",
        onClick: (close) => buyMoreTime(5, 10, close),
      },
    ],
    onClose: () => {
      if (!actionSelected) returnToMenu();
    },
  });

  setTimeout(() => {
    timeUpModal.panel.classList.add("is-defeat-shaking");
  }, 520);
}

export function nextLevel() {
  gameState.currentLevel += 1;
  initializeLevel(gameState.currentLevel);
}

export function returnToMainMenu() {
  stopCountdown();
  isAutoPaused = false;
  document.body.classList.remove("game-is-paused");
  resetGame();
  document
    .getElementById("game-container")
    ?.style.setProperty("display", "none");
  navigation.createMenu();
  syncDefaultMusic(gameState.settings);
}

export function handleHintClick() {
  if (gameState.isLocked || gameState.isPaused) return;
  if (gameState.hints <= 0) return showBonusOverlay("Bạn đã hết lượt gợi ý.");
  if (document.querySelector(".tile.selected")) {
    showBonusOverlay("Hãy hoàn thành lượt chọn hiện tại trước khi dùng gợi ý.");
    return;
  }

  const tilePairs = {};
  document
    .querySelectorAll(".tile:not(.matched):not(.selected)")
    .forEach((tile) => {
      const imageId = tile.dataset.imageId;
      (tilePairs[imageId] ||= []).push(tile);
    });

  const availablePairs = Object.values(tilePairs).filter(
    (tiles) => tiles.length >= 2,
  );
  const pair =
    availablePairs[Math.floor(Math.random() * availablePairs.length)];
  if (!pair) return showBonusOverlay("Hiện không có cặp thẻ phù hợp để gợi ý.");

  gameState.hints -= 1;
  updateHintDisplay(gameState.hints);
  revealHintPair(pair.slice(0, 2), gameState.roundId);
  showBonusOverlay("Đã lật 2 thẻ trong vài giây.");
}

function revealHintPair(tiles, roundId) {
  const grid = document.getElementById("grid-container");
  gameState.isLocked = true;
  grid?.classList.add("is-locked");

  tiles.forEach((tile) => {
    const image = tile.querySelector("img");
    if (image) {
      image.classList.remove("hidden", "appear-bounce");
      void image.offsetWidth;
      image.classList.add("appear-bounce");
      setTimeout(
        () => image.classList.remove("appear-bounce"),
        GAMEPLAY_TIMING.tileRevealAnimationMs,
      );
    }
    tile.classList.add("hint-reveal");
  });

  setTimeout(() => {
    if (gameState.roundId !== roundId) return;

    tiles.forEach((tile) => {
      const image = tile.querySelector("img");
      if (!tile.classList.contains("matched") && image) {
        image.classList.remove("appear-bounce", "hide-fade-scale");
        void image.offsetWidth;
        image.classList.add("hide-fade-scale");
        setTimeout(() => {
          if (gameState.roundId === roundId) image.classList.add("hidden");
          image.classList.remove("hide-fade-scale");
        }, GAMEPLAY_TIMING.tileHideAnimationMs);
      }
      tile.classList.remove("hint-reveal");
    });

    setTimeout(() => {
      if (gameState.roundId !== roundId) return;
      gameState.isLocked = false;
      grid?.classList.remove("is-locked");
    }, GAMEPLAY_TIMING.tileHideAnimationMs);
  }, GAME_CONFIG.hintRevealDurationMs);
}

configureLogic({ onNext: nextLevel, onMenu: returnToMainMenu });

document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseForBackground();
  else resumeFromBackground();
});
