import { rememberRecentGame } from './recentGame.js';
import { canLaunchGame } from "./profileOperations.js";
import { shellTimeout as setTimeout, shellInterval as setInterval, clearShellInterval as clearInterval } from "./gameShell/gameShellLifecycle.js";
import {
  isBackgroundMusicPlaying,
  pauseBackgroundMusic,
  pauseGameAudio,
  restoreBackgroundMusic,
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
import { createGrid, stopGridLayout, revealAndHideTiles } from "./grid.js";
import { createGameShellStartup } from "./gameShell/gameShellStartup.js";
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
import { savePersistentGameData, isPersistenceBlocked } from "./persistence.js";
import { getActiveSession } from "./sessionProgress.js";
import { getTheme, getThemeSelectionEligibility } from "./themeCatalog.js";
import { showAppToast } from "./modal.js";
import { configureLogic, resetLogicRuntime } from "./logic.js";
import { restartMemoryTileAnimation } from "./memoryMatch/tileAnimation.js";
import { GAMEPLAY_TIMING } from "./gameplayTuning.js";
import { TIME_UP_PURCHASES } from "./shopCatalog.js";
import { resolveSessionTiming } from "./sessionTiming.js";
import { clearLootEffects } from "./lootEffects.js";
import { commitMemoryThemeSession, getMemorySessionSnapshot, saveMemorySession, stageMemorySession } from "./memorySession.js";
import { getMemoryShell } from "./memoryMatch/memoryShell.js";
import { bindMemoryMenus } from "./gameMenu.js";
import { clearTooltip } from "./tooltips.js";
import { beginPlayMetrics, resumePlayMetrics } from "./playMetrics.js";
import { prepareAdventureChapter, stageAdventureLevelStart, canAdvanceAdventure } from "./adventureLaunch.js";
import { getChapterNumber } from "./adventureProgress.js";
import { beginRankedAttempt, finalizeRankedRun } from "./rankingRules.js";

let countdownInterval;
let isAutoPaused = false;
let shouldResumeMusic = false;
let sessionCheckpointTicks = 0;
let activeAssetPaths = [];
let navigation = { showDifficulty: () => {}, createMenu: () => {} };

export function configureGameController(actions) {
  navigation = { ...navigation, ...actions };
}

export function startNewMemoryRun(level = 1, { skipIntro = false } = {}) {
  return initializeLevel(level, { reason: "new", skipIntro });
}

export function continueMemorySession(session) {
  if (!session || !canLaunchGame()) return;
  gameState.settings.mode = session.mode;
  return initializeLevel(session.level, { reason: "resume", session });
}

export function restartMemoryLevel() {
  const session = getActiveSession("memory-match", gameState.settings.mode)
    || getMemorySessionSnapshot(activeAssetPaths.length ? { assetPaths: activeAssetPaths } : {});
  return initializeLevel(gameState.currentLevel, { reason: "restart", session });
}

export function initializeLevel(level, { reason = "new", session = null, skipIntro = false } = {}) {
  if (!canLaunchGame()) return null;
  const requestedMode = gameState.settings.mode || "easy";
  const requestedModeLayout = getModeLayout(requestedMode);
  const requestedLayout = isChallengeMode(requestedMode)
    ? getChallengeLayout(level)
    : requestedModeLayout;
  const eligibility = getThemeSelectionEligibility(
    getTheme(gameState.appearance.themes.memoryMatch).id,
    requestedLayout.tileCount / 2,
  );
  if (!eligibility.ok) {
    showAppToast(`Chủ đề ${eligibility.theme.title} cần ${eligibility.required} ảnh khác nhau; hiện có ${eligibility.available}. Hãy chọn chủ đề khác.`);
    return null;
  }
  const scope = getMemoryShell().mount({ cleanup: () => {
    stopCountdown();
    stopGridLayout();
    if (isGameVisible() && gameState.remainingTime > 0 && gameState.matchedPairs < gameState.totalPairs && scope.startup?.status === 'ready') void persistMemorySession();
    invalidateRound();
    resetLogicRuntime();
    clearLootEffects();
    clearGameplayRewardPopups();
    clearTooltip();
  } });
  beginPlayMetrics(scope, { gameId: "memory-match", mode: requestedMode, level }, reason === "resume" ? session?.metrics || {} : null);
  bindMemoryMenus(scope, getMemoryShell().refs.root, { onExit: returnToMainMenu, onRestart: restartMemoryLevel });
  const startup = createGameShellStartup(scope, getMemoryShell().refs, error => {
    console.error('Memory startup failed', error);
    showAppToast('Không thể chuẩn bị bàn chơi. Hãy chơi lại.');
  });
  return startup.run(async () => {
  if (!await prepareAdventureChapter("memory-match", getChapterNumber(level), () => scope.active)) return null;
  startup.check();
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

  const mode = requestedMode;
  gameState.currentLevel = level;
  const modeLayout = getModeLayout(mode);
  const layout = isChallengeMode(mode) ? getChallengeLayout(level) : modeLayout;
  const timing = resolveMemoryLevelTiming({ mode, level, modeLayout, reason, session });
  const roundId = beginRound();
  const firstStart = !gameState.progress.memoryMatch.startedLevels?.[`${mode}:${level}`];
  const hintBonus = (reason === "new" || reason === "advance") && firstStart
    ? getLevelHintBonus(level, gameState.progress.memoryMatch.items.hint)
    : 0;
  gameState.remainingTime = timing.remainingTime;
  gameState.timeLimit = timing.timeLimit;
  gameState.levelStartTime = timing.levelStartTime;
  sessionCheckpointTicks = 0;
  if (reason === "resume") {
    gameState.specialProgress = Math.max(0, Math.floor(session?.specialProgress || 0))
      % GAME_CONFIG.special.progressTarget;
    gameState.specialNoEnergyDropStreak = Math.min(
      GAME_CONFIG.special.energyDrop.guaranteeAfterMisses,
      Math.max(0, Math.floor(session?.specialNoEnergyDropStreak || 0)),
    );
  }
  const previewDurationMs = getPreviewDurationMs(mode);
  const themeId = getTheme(gameState.appearance.themes.memoryMatch).id;
  const selectedCards = await startup.phase('render', () => createGrid(layout, {
    startup,
    deferPreview: true,
    roundId,
    onPreviewComplete: startCountdown,
    previewDurationMs,
    assetPaths: reason === "resume" ? session?.assetPaths : undefined,
    history: reason === "resume" ? undefined : gameState.progress.themeSelectionHistory[themeId],
  }));
  await startup.yield();
  activeAssetPaths = selectedCards?.map((card) => card.assetPath).filter(Boolean) || [];

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
  updateHintDisplay(gameState.progress.memoryMatch.items.hint);
  updateMovesDisplay(gameState.moves);
  updateMissesDisplay(gameState.misses);
  updateComboDisplay(gameState.combo);
  updateTimerDisplay(gameState.remainingTime);
  setMemoryTimeProgress({ remainingSeconds: gameState.remainingTime, timeLimit: gameState.timeLimit });
  if (!skipIntro) showLevelRewardOverlay();
  await startup.phase('images', () => startup.decodeBoard());
  startup.check();
  beginRankedAttempt("memory-match", mode, level, { reason, savedRun: session?.run });
  stageAdventureLevelStart("memory-match", mode, level);
  gameState.progress.memoryMatch.items.hint += hintBonus;
  const committed = reason !== "resume" && activeAssetPaths.length
    ? await commitMemoryThemeSession(themeId, activeAssetPaths) : await persistMemorySession(true);
  if (!committed) return null;
  updateHintDisplay(gameState.progress.memoryMatch.items.hint);
  startup.check();
  showRevealTimerInHud(previewDurationMs / 1000, roundId);
  document.getElementById("btn-buy-time")?.toggleAttribute("hidden", isEndlessMode(mode));
  revealAndHideTiles(roundId, startCountdown, previewDurationMs);
  });
}

function startCountdown(roundId = gameState.roundId) {
  if (gameState.roundId !== roundId) return;
  stopCountdown();
  resumePlayMetrics("startup");
  void rememberRecentGame("memory-match");
  restoreBackgroundMusic(gameState.settings);
  startMemoryTimeProgress({ remainingSeconds: gameState.remainingTime, timeLimit: gameState.timeLimit });
  syncDefaultMusic(gameState.settings);
  countdownInterval = setInterval(async () => {
    if (gameState.roundId !== roundId) return stopCountdown();
    if (isPersistenceBlocked()) return stopCountdown();
    // Khóa thao tác chỉ bảo vệ lượt chọn/hiệu ứng; đồng hồ chỉ dừng khi game thật sự pause.
    if (gameState.isPaused) return;

    const direction = getTimerDirection(gameState.settings.mode);
    gameState.remainingTime += direction === "up" ? 1 : -1;
    sessionCheckpointTicks += 1;
    if (sessionCheckpointTicks >= GAMEPLAY_TIMING.sessionCheckpointSeconds) {
      sessionCheckpointTicks = 0;
      void persistMemorySession();
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

async function pauseForBackground() {
  // Âm thanh phải dừng ở mọi màn hình, kể cả menu và popup.
  if (isAutoPaused) return;
  shouldResumeMusic = isBackgroundMusicPlaying();
  pauseGameAudio();

  if (!isGameVisible() || gameState.isPaused) return;
  isAutoPaused = true;
  gameState.isPaused = true;
  getMemoryShell().update({ paused: true });
  document.body.classList.add("game-is-paused");
  await persistMemorySession();
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
  void persistMemorySession();
  let actionSelected = false;

  const returnToMenu = async () => {
    const scope = getMemoryShell().scope;
    if (gameState.settings.mode === "challenge") {
      finalizeRankedRun("memory-match", "challenge", gameState.score);
      delete gameState.progress.memoryMatch.sessionsByMode.challenge;
      if (!await savePersistentGameData({ progress: gameState.progress })) return;
    }
    if (!scope.active) return;
    getMemoryShell().unmount();
    resetGame();
    document
      .getElementById("game-container")
      ?.style.setProperty("display", "none");
    navigation.createMenu();
    syncDefaultMusic(gameState.settings);
  };

  const buyMoreTime = async (seconds, price, close) => {
    const scope = getMemoryShell().scope;
    const expiredRoundId = gameState.roundId;
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
    stageMemorySession({
      remainingTime: seconds,
      timeLimit: seconds,
      levelStartTime: gameState.levelStartTime,
    });
    if (!(await savePersistentGameData({ coins: gameState.coins, progress: gameState.progress }))) {
      gameState.coins = previousCoins;
      Object.assign(gameState, previousTiming);
      if (previousSession) sessions[mode] = previousSession;
      else delete sessions[mode];
      showBonusOverlay("Không thể lưu giao dịch. Xu và thời gian chưa thay đổi.");
      return true;
    }
    if (!scope.active || gameState.roundId !== expiredRoundId) return true;
    // Đồng bộ HUD trước khi đóng modal: nếu không, số Xu cũ có thể lưu lại
    // đến tận lần nhận thưởng tiếp theo dù giao dịch đã được lưu thành công.
    updateCoinDisplay(gameState.coins);
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
        onClick: async (close) => (await buyMoreTime(seconds, price, close)),
      })),
    ],
    onClose: () => {
      if (!actionSelected) returnToMenu();
    },
  });

}

export function nextLevel(targetLevel = gameState.currentLevel + 1) {
  const next = targetLevel;
  if (!canAdvanceAdventure("memory-match", gameState.settings.mode, next)) return returnToMainMenu();
  initializeLevel(next, { reason: "advance" });
}

export function returnToMainMenu() {
  getMemoryShell().unmount();
  stopCountdown();
  stopGridLayout();
  isAutoPaused = false;
  document.body.classList.remove("game-is-paused");
  resetGame();
  document
    .getElementById("game-container")
    ?.style.setProperty("display", "none");
  navigation.createMenu();
  restoreBackgroundMusic(gameState.settings);
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

async function persistMemorySession(allowStartup = false) {
  const startup = getMemoryShell().scope?.startup;
  if (startup && startup.status !== 'ready' && !allowStartup) return false;
  if (!gameState.settings.mode || gameState.currentLevel < 1) return false;
  return (await saveMemorySession(activeAssetPaths.length ? { assetPaths: activeAssetPaths } : {}));
}

export async function handleHintClick() {
  if (gameState.isLocked || gameState.isPaused) return;
  if (gameState.progress.memoryMatch.items.hint <= 0) return showBonusOverlay("Bạn đã hết lượt gợi ý.");
  const roundId = gameState.roundId;
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

  gameState.progress.memoryMatch.items.hint -= 1;
  if (!(await persistMemorySession())) {
    gameState.progress.memoryMatch.items.hint += 1;
    return showBonusOverlay("Không thể lưu lượt gợi ý. Hãy thử lại.");
  }
  if (gameState.roundId !== roundId) return;
  updateHintDisplay(gameState.progress.memoryMatch.items.hint);
  revealHintPair(pair.slice(0, 2), roundId);
  showBonusOverlay("Đã lật 2 thẻ trong vài giây.");
}

function revealHintPair(tiles, roundId) {
  const grid = document.getElementById("grid-container");
  gameState.isLocked = true;
  grid?.classList.add("is-locked");

  tiles.forEach((tile) => {
    const image = tile.querySelector("img");
    if (image) {
      image.classList.remove("hidden");
      restartMemoryTileAnimation(image, {
        remove: ["appear-bounce"],
        animationClass: "appear-bounce",
        durationMs: GAMEPLAY_TIMING.tileRevealAnimationMs,
      });
    }
    tile.classList.add("hint-reveal");
  });

  setTimeout(() => {
    if (gameState.roundId !== roundId) return;

    tiles.forEach((tile) => {
      const image = tile.querySelector("img");
      if (!tile.classList.contains("matched") && image) {
        restartMemoryTileAnimation(image, {
          remove: ["appear-bounce", "hide-fade-scale"],
          animationClass: "hide-fade-scale",
          durationMs: GAMEPLAY_TIMING.tileHideAnimationMs,
          onFinish: () => {
            if (gameState.roundId === roundId) image.classList.add("hidden");
          },
        });
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

document.addEventListener("visibilitychange", async () => {
  if (document.hidden) (await pauseForBackground());
  else resumeFromBackground();
});

window.addEventListener("pagehide", async () => {
  if (isGameVisible()) (await persistMemorySession());
});
