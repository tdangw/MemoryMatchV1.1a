import { shellTimeout as setTimeout, shellInterval as setInterval, clearShellInterval as clearInterval } from "./gameShell/gameShellLifecycle.js";
import {
  isBackgroundMusicPlaying,
  pauseBackgroundMusic,
  pauseGameAudio,
  sounds,
  syncDefaultMusic,
} from "./sound.js";
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
import { createGrid, stopGridLayout } from "./grid.js";
import {
  updateLevelDisplay,
  updateScoreDisplay,
  updateHintDisplay,
  updateTimerDisplay,
  setMemoryTimeProgress,
  startMemoryTimeProgress,
  stopMemoryTimeProgress,
  syncMemoryTimeProgress,
  updateMovesDisplay,
  updateMissesDisplay,
  updateComboDisplay,
  updatePairProgressDisplay,
  updateLevelStarsDisplay,
  updateTotalStarsDisplay,
  updateCoinDisplay,
  updateMemorySpecialProgress,
  showBonusOverlay,
  openTimeUpModal,
  showRevealTimerInHud,
  showLevelRewardOverlay,
  clearGameplayRewardPopups,
} from "./ui.js";
import {
  beginRound,
  gameState,
  invalidateRound,
  resetGame,
  spendCoins,
} from "./gameState.js";
import { savePersistentGameData } from "./persistence.js";
import { getActiveSession } from "./sessionProgress.js";
import { configureLogic, resetLogicRuntime } from "./logic.js";
import { GAMEPLAY_TIMING } from "./gameplayTuning.js";
import { TIME_UP_PURCHASES } from "./shopCatalog.js";
import { resolveSessionTiming } from "./sessionTiming.js";
import { clearLootEffects } from "./lootEffects.js";
import { saveMemorySession, stageMemorySession } from "./memorySession.js";
import { getMemoryShell } from "./gameShell/legacyShellAdapters.js";
import { clearTooltip } from "./tooltips.js";

let countdownInterval;
let isAutoPaused = false;
let shouldResumeMusic = false;
let sessionCheckpointTicks = 0;
let navigation = { showDifficulty: () => {}, createMenu: () => {} };

export function configureGameController(actions) {
  navigation = { ...navigation, ...actions };
}

export function startNewMemoryRun(level = 1) {
  return initializeLevel(level, { reason: "new" });
}

export function continueMemorySession(session) {
  if (!session) return;
  gameState.settings.mode = session.mode;
  return initializeLevel(session.level, { reason: "resume", session });
}

export function restartMemoryLevel() {
  const session = getActiveSession("memory-match", gameState.settings.mode);
  return initializeLevel(gameState.currentLevel, { reason: "restart", session });
}

export function initializeLevel(level, { reason = "new", session = null } = {}) {
  getMemoryShell().mount({ cleanup: () => {
    stopCountdown();
    stopGridLayout();
    if (isGameVisible()) persistMemorySession();
    invalidateRound();
    resetLogicRuntime();
    clearLootEffects();
    clearGameplayRewardPopups();
    clearTooltip();
  } });
  stopCountdown();
  resetLogicRuntime();
  clearLootEffects();
  clearGameplayRewardPopups();
  pauseBackgroundMusic();
  isAutoPaused = false;
  document.getElementById("menu-container")?.remove();
  document.body.classList.remove("game-is-paused");
  const gameContainer = getMemoryShell().refs.root;
  if (gameContainer) gameContainer.style.display = "flex";

  const mode = gameState.settings.mode || "easy";
  gameState.currentLevel = level;
  const modeLayout = getModeLayout(mode);
  const layout = isChallengeMode(mode) ? getChallengeLayout(level) : modeLayout;
  const timing = resolveMemoryLevelTiming({ mode, level, modeLayout, reason, session });
  const roundId = beginRound();
  const hintBonus = reason === "new" || reason === "advance"
    ? getLevelHintBonus(level, gameState.hints)
    : 0;
  gameState.remainingTime = timing.remainingTime;
  gameState.timeLimit = timing.timeLimit;
  gameState.levelStartTime = timing.levelStartTime;
  sessionCheckpointTicks = 0;
  gameState.hints += hintBonus;
  if (reason === "resume") {
    gameState.specialProgress = Math.max(0, Math.floor(session?.specialProgress || 0))
      % GAME_CONFIG.special.progressTarget;
    gameState.specialNoEnergyDropStreak = Math.min(
      GAME_CONFIG.special.energyDrop.guaranteeAfterMisses,
      Math.max(0, Math.floor(session?.specialNoEnergyDropStreak || 0)),
    );
  }
  persistMemorySession();
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
  updateCoinDisplay(gameState.coins);
  updateMemorySpecialProgress(gameState.specialProgress);
  updateHintDisplay(gameState.hints);
  updateMovesDisplay(gameState.moves);
  updateMissesDisplay(gameState.misses);
  updateComboDisplay(gameState.combo);
  updatePairProgressDisplay(gameState.matchedPairs, gameState.totalPairs);
  updateTimerDisplay(gameState.remainingTime);
  setMemoryTimeProgress({ remainingSeconds: gameState.remainingTime, timeLimit: gameState.timeLimit });
  showLevelRewardOverlay();
  showRevealTimerInHud(previewDurationMs / 1000, roundId);
  document.getElementById("btn-buy-time")?.toggleAttribute("hidden", isEndlessMode(mode));
}

function startCountdown(roundId = gameState.roundId) {
  if (gameState.roundId !== roundId) return;
  stopCountdown();
  startMemoryTimeProgress({ remainingSeconds: gameState.remainingTime, timeLimit: gameState.timeLimit });
  syncDefaultMusic(gameState.settings);
  countdownInterval = setInterval(() => {
    if (gameState.roundId !== roundId) return stopCountdown();
    // Khóa thao tác chỉ bảo vệ lượt chọn/hiệu ứng; đồng hồ chỉ dừng khi game thật sự pause.
    if (gameState.isPaused) return;

    const direction = getTimerDirection(gameState.settings.mode);
    gameState.remainingTime += direction === "up" ? 1 : -1;
    sessionCheckpointTicks += 1;
    if (sessionCheckpointTicks >= GAMEPLAY_TIMING.sessionCheckpointSeconds) {
      sessionCheckpointTicks = 0;
      persistMemorySession();
    }
    updateTimerDisplay(gameState.remainingTime);
    if (direction === "down" && gameState.remainingTime <= 0) handleTimeUp();
  }, 1000);
}

function stopCountdown() {
  clearInterval(countdownInterval);
  countdownInterval = undefined;
  stopMemoryTimeProgress();
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
  persistMemorySession();
  isAutoPaused = true;
  gameState.isPaused = true;
  getMemoryShell().update({ paused: true });
  document.body.classList.add("game-is-paused");
}

function resumeFromBackground() {
  if (isAutoPaused) {
    isAutoPaused = false;
    gameState.isPaused = false;
    getMemoryShell().update({ paused: false });
    document.body.classList.remove("game-is-paused");
    syncMemoryTimeProgress({ remainingSeconds: gameState.remainingTime, timeLimit: gameState.timeLimit });
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
    const previousCoins = gameState.coins;
    const previousTiming = {
      remainingTime: gameState.remainingTime,
      timeLimit: gameState.timeLimit,
      levelStartTime: gameState.levelStartTime,
    };
    const mode = gameState.settings.mode;
    const sessions = gameState.progress.memoryMatch.sessionsByMode;
    const previousSession = sessions?.[mode] ? { ...sessions[mode] } : null;
    if (!spendCoins(price)) {
      showBonusOverlay("Bạn không đủ Xu để mua thêm thời gian.");
      return true;
    }

    gameState.remainingTime = seconds;
    gameState.timeLimit = seconds;
    gameState.levelStartTime = seconds;
    stageMemorySession({
      remainingTime: seconds,
      timeLimit: seconds,
      levelStartTime: seconds,
    });
    if (!savePersistentGameData({ coins: gameState.coins, progress: gameState.progress })) {
      gameState.coins = previousCoins;
      Object.assign(gameState, previousTiming);
      if (previousSession) sessions[mode] = previousSession;
      else delete sessions[mode];
      showBonusOverlay("Không thể lưu giao dịch. Xu và thời gian chưa thay đổi.");
      return true;
    }
    actionSelected = true;
    const roundId = beginRound();
    gameState.isLocked = false;
    gameState.isPaused = false;
    document.getElementById("grid-container")?.classList.remove("is-locked");
    updateTimerDisplay(gameState.remainingTime);
    syncMemoryTimeProgress({ remainingSeconds: gameState.remainingTime, timeLimit: gameState.timeLimit });
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

  openTimeUpModal({
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
          restartMemoryLevel();
        },
      },
      ...TIME_UP_PURCHASES.map(({ seconds, price }) => ({
        label: `+${seconds} giây · ${price} Xu`,
        icon: "coin",
        variant: "time-purchase",
        onClick: (close) => buyMoreTime(seconds, price, close),
      })),
    ],
    onClose: () => {
      if (!actionSelected) returnToMenu();
    },
  });

}

export function nextLevel() {
  gameState.currentLevel += 1;
  initializeLevel(gameState.currentLevel, { reason: "advance" });
}

export function returnToMainMenu() {
  getMemoryShell().unmount();
  stopCountdown();
  stopGridLayout();
  persistMemorySession();
  isAutoPaused = false;
  document.body.classList.remove("game-is-paused");
  resetGame();
  document
    .getElementById("game-container")
    ?.style.setProperty("display", "none");
  navigation.createMenu();
  syncDefaultMusic(gameState.settings);
}

function resolveMemoryLevelTiming({ mode, level, modeLayout, reason, session }) {
  const standardTime = modeLayout.timeSeconds + getLevelTimeBonus(level);
  const challenge = isChallengeMode(mode);
  return resolveSessionTiming({
    endless: isEndlessMode(mode),
    reason,
    newTime: challenge ? modeLayout.timeSeconds : standardTime,
    currentRemaining: gameState.remainingTime,
    session,
    carryOnAdvance: challenge,
    advanceBonus: GAME_CONFIG.specialModes.challengeTimeBonusSeconds,
  });
}

function persistMemorySession() {
  if (!gameState.settings.mode || gameState.currentLevel < 1) return false;
  return saveMemorySession();
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
  if (!persistMemorySession()) {
    gameState.hints += 1;
    return showBonusOverlay("Không thể lưu lượt gợi ý. Hãy thử lại.");
  }
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

window.addEventListener("pagehide", () => {
  if (isGameVisible()) persistMemorySession();
});
