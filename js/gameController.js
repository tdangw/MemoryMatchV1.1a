import { rememberRecentGame } from './recentGame.js';
import { memoryBoard } from './memoryMatch/memoryBoard.js';
import { canLaunchGame } from "./profileOperations.js";
import { shellTimeout as setTimeout, shellInterval as setInterval, clearShellInterval as clearInterval } from "./gameShell/gameShellLifecycle.js";
import {
  isBackgroundMusicPlaying,
  pauseBackgroundMusic,
  pauseGameAudio,
  restoreBackgroundMusic,
  sounds,
  syncDefaultMusic,
  playOwnedRewardCue,
} from "./sound.js";
import {
  GAME_CONFIG,
  getChallengeLayout,
  getLevelHintBonus,
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
import { configureLogic, resetLogicRuntime, restoreMemoryCombo, pauseMemoryCombo, checkLevelComplete } from "./logic.js";
import { remainingComboWindow } from './pairSessionSnapshot.js';
import { getComboWindowMs } from './gameplayTuning.js';
import { restartMemoryTileAnimation } from "./memoryMatch/tileAnimation.js";
import { GAMEPLAY_TIMING } from "./gameplayTuning.js";
import { TIME_UP_PURCHASES } from "./shopCatalog.js";
import { clearLootEffects } from "./lootEffects.js";
import { commitMemoryThemeSession, getMemorySessionSnapshot, saveMemorySession, stageMemorySession, beginMemoryBoardIdentity } from "./memorySession.js";
import { getMemoryShell } from "./memoryMatch/memoryShell.js";
import { bindMemoryMenus } from "./gameMenu.js";
import { clearTooltip } from "./tooltips.js";
import { beginPlayMetrics, resumePlayMetrics } from "./playMetrics.js";
import { prepareAdventureChapter, stageAdventureLevelStart, canAdvanceAdventure } from "./adventureLaunch.js";
import { getChapterNumber } from "./adventureProgress.js";
import { beginRankedAttempt, finalizeRankedRun } from "./rankingRules.js";
import { createWaveProgress, completeWave, activateNextWave, normalizeWaveProgress } from './progression/waveProgress.js';
import { getDifficultyAccess } from './progression/difficultyProgress.js';
import { renderWaveStatus, announceWave, presentWaveExit, prepareWaveArrival } from './progression/waveHud.js';
import { pausePlayMetrics, snapshotPlayMetrics } from './playMetrics.js';

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
  if (isChallengeMode(gameState.settings.mode) || isEndlessMode(gameState.settings.mode)) return initializeLevel(1, { reason: 'new' });
  const session = getActiveSession("memory-match", gameState.settings.mode)
    || getMemorySessionSnapshot(activeAssetPaths.length ? { assetPaths: activeAssetPaths } : {});
  return initializeLevel(gameState.currentLevel, { reason: "restart", session });
}

export function initializeLevel(level, { reason = "new", session = null, skipIntro = false } = {}) {
  if (!canLaunchGame()) return null;
  if (session?.waveInvalid) { showAppToast('Lượt chơi này không thể tiếp tục.'); return null; }
  if (reason === 'resume' && session?.wave?.phase === 'advance') reason = 'wave';
  const requestedMode = gameState.settings.mode || "easy";
  const requestedModeLayout = getModeLayout(requestedMode);
  const requestedLayout = isChallengeMode(requestedMode)
    ? getChallengeLayout(level)
    : requestedModeLayout;
  if (session?.wave && !normalizeWaveProgress(session.wave, { gameId: 'memory-match', mode: requestedMode, level, groupsPerWave: requestedLayout.tileCount / 2 })) {
    showAppToast('Không thể tiếp tục lượt này. Hãy bắt đầu lượt mới.'); return null;
  }
  if (reason === 'resume' && (session?.pairSnapshotInvalid || session?.run?.version === 3 && !session.pairSnapshot
    || session?.pairSnapshot && (session.pairSnapshot.totalPairs * 2 !== requestedLayout.tileCount || getTheme(session.pairSnapshot.themeId).id !== session.pairSnapshot.themeId))) {
    showAppToast('Không thể tiếp tục lượt này. Hãy bắt đầu lượt mới.');
    return null;
  }
  const eligibility = getThemeSelectionEligibility(
    getTheme(reason === 'resume' ? session?.pairSnapshot?.themeId || gameState.appearance.themes.memoryMatch : gameState.appearance.themes.memoryMatch).id,
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
  if (reason === 'wave') prepareWaveArrival(getMemoryShell().refs, scope);
  beginPlayMetrics(scope, { gameId: "memory-match", mode: requestedMode, level }, reason === "resume" || reason === 'wave' ? session?.metrics || {} : null);
  bindMemoryMenus(scope, getMemoryShell().refs.root, { onExit: returnToMainMenu, onRestart: restartMemoryLevel, onSettings: navigation.showSettings });
  const startup = createGameShellStartup(scope, getMemoryShell().refs, error => {
    console.error('Memory startup failed', error);
    showAppToast('Không thể chuẩn bị bàn chơi. Hãy chơi lại.');
  });
  return startup.run(async () => {
  if (!await prepareAdventureChapter("memory-match", getChapterNumber(level), () => scope.active)) return null;
  startup.check();
  if (!['challenge', 'endless'].includes(requestedMode)
    && !getDifficultyAccess({ completed: gameState.progress.memoryMatch.bestByLevel, level, mode: requestedMode }).unlocked) {
    showAppToast('Hãy hoàn thành độ khó trước để mở khóa.');
    returnToMainMenu();
    return null;
  }
  stopCountdown();
  resetLogicRuntime();
  clearLootEffects();
  clearGameplayRewardPopups();
  if (reason !== 'wave') pauseBackgroundMusic();
  isAutoPaused = false;
  document.getElementById("menu-container")?.remove();
  document.body.classList.remove("game-is-paused");
  const gameContainer = getMemoryShell().refs.root;
  if (gameContainer) gameContainer.style.display = "flex";

  const mode = requestedMode;
  gameState.currentLevel = level;
  const modeLayout = getModeLayout(mode);
  const layout = isChallengeMode(mode) ? getChallengeLayout(level) : modeLayout;
  const restoredWave = session?.wave && normalizeWaveProgress(session.wave, { gameId: 'memory-match', mode, level, groupsPerWave: layout.tileCount / 2 });
  if ((reason === 'resume' || reason === 'wave') && session?.wave && !restoredWave) throw new Error('Invalid wave checkpoint.');
  gameState.wave = reason === 'wave' ? activateNextWave(restoredWave)
    : reason === 'resume' && restoredWave ? restoredWave
      : createWaveProgress({ attemptId: crypto.randomUUID(), gameId: 'memory-match', mode, level, groupsPerWave: layout.tileCount / 2 });
  const timing = reason === 'resume' || reason === 'wave'
    ? { remainingTime: session.remainingTime, timeLimit: session.timeLimit, levelStartTime: session.levelStartTime }
    : { remainingTime: gameState.wave.allocatedSeconds, timeLimit: gameState.wave.allocatedSeconds, levelStartTime: gameState.wave.allocatedSeconds };
  const roundId = beginRound();
  const pairSnapshot = reason === 'resume' ? session?.pairSnapshot : null;
  const waveCombo = reason === 'wave' ? session?.pairSnapshot : null;
  beginMemoryBoardIdentity(pairSnapshot?.seed, pairSnapshot?.themeId || gameState.appearance.themes.memoryMatch);
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
  const themeId = getTheme(pairSnapshot?.themeId || gameState.appearance.themes.memoryMatch).id;
  const selectedCards = await startup.phase('render', () => createGrid(layout, {
    startup,
    deferPreview: true,
    roundId,
    onPreviewComplete: startCountdown,
    previewDurationMs,
    assetPaths: reason === "resume" ? session?.assetPaths : undefined,
    history: reason === "resume" ? undefined : gameState.progress.themeSelectionHistory[themeId],
    snapshot: pairSnapshot,
  }));
  await startup.yield();
  activeAssetPaths = selectedCards?.map((card) => card.assetPath).filter(Boolean) || [];

  gameState.moves = gameState.wave.completedMoves;
  gameState.misses = gameState.wave.completedMisses;
  gameState.combo = 0;
  gameState.score = gameState.wave.completedScore;
  gameState.matchedPairs = 0;
  gameState.totalPairs = layout.tileCount / 2;
  if (pairSnapshot) {
    for (const key of ['score', 'moves', 'misses', 'matchedPairs', 'totalPairs']) gameState[key] = pairSnapshot[key];
    gameState.luckyAwards = structuredClone(pairSnapshot.luckyAwards);
    restoreMemoryCombo(pairSnapshot.combo, remainingComboWindow(pairSnapshot, getComboWindowMs(gameState.totalPairs)));
  }

  if (waveCombo) restoreMemoryCombo(waveCombo.combo, waveCombo.comboRemainingMs, { paused: true });
  updateLevelDisplay(level);
  renderWaveStatus(getMemoryShell().refs, gameState.wave);
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
  if (!skipIntro && reason !== 'wave') showLevelRewardOverlay();
  await startup.phase('images', () => startup.decodeBoard());
  startup.check();
  beginRankedAttempt("memory-match", mode, level, { reason: reason === 'wave' ? 'resume' : reason, savedRun: session?.run });
  stageAdventureLevelStart("memory-match", mode, level);
  gameState.progress.memoryMatch.items.hint += hintBonus;
  const committed = reason !== "resume" && activeAssetPaths.length
    ? await commitMemoryThemeSession(themeId, activeAssetPaths) : await persistMemorySession(true);
  if (!committed) return null;
  updateHintDisplay(gameState.progress.memoryMatch.items.hint);
  startup.check();
  await announceWave(getMemoryShell().refs, scope, gameState.wave);
  startup.check();
  showRevealTimerInHud(previewDurationMs / 1000, roundId);
  document.getElementById("btn-buy-time")?.toggleAttribute("hidden", isEndlessMode(mode));
  revealAndHideTiles(roundId, () => {
    if (pairSnapshot) restoreMemoryCombo(pairSnapshot.combo, remainingComboWindow(pairSnapshot, getComboWindowMs(gameState.totalPairs)));
    if (waveCombo) restoreMemoryCombo(waveCombo.combo, waveCombo.comboRemainingMs);
    startCountdown(roundId);
    if (pairSnapshot?.matchedPairs === pairSnapshot?.totalPairs && pairSnapshot) void checkLevelComplete();
  }, previewDurationMs);
  });
}

async function advanceMemoryWave() {
  const roundId = gameState.roundId;
  const rollback = { wave: gameState.wave, remainingTime: gameState.remainingTime,
    progress: structuredClone(gameState.progress.memoryMatch) };
  gameState.isPaused = true;
  pausePlayMetrics('wave-transition');
  pauseMemoryCombo();
  const result = completeWave(gameState.wave, { score: gameState.score, moves: gameState.moves,
    misses: gameState.misses, matchedGroups: gameState.matchedPairs });
  gameState.wave = result.progress;
  gameState.remainingTime += result.bonusSeconds;
  gameState.timeLimit = Math.max(gameState.timeLimit, gameState.remainingTime);
  if (!await persistMemorySession()) {
    if (gameState.roundId === roundId) {
      gameState.wave = rollback.wave; gameState.remainingTime = rollback.remainingTime;
      gameState.progress.memoryMatch = rollback.progress;
    }
    return;
  }
  if (gameState.roundId !== roundId) return;
  const checkpoint = getMemorySessionSnapshot();
  checkpoint.metrics = snapshotPlayMetrics({ gameId: 'memory-match', mode: gameState.settings.mode, level: gameState.currentLevel });
  if (!await presentWaveExit(getMemoryShell().refs, getMemoryShell().scope) || gameState.roundId !== roundId) return;
  return initializeLevel(gameState.currentLevel, { reason: 'wave', session: checkpoint, skipIntro: true });
}

function startCountdown(roundId = gameState.roundId) {
  if (gameState.roundId !== roundId) return;
  stopCountdown();
  if (!isEndlessMode(gameState.settings.mode) && gameState.remainingTime <= 0) { handleTimeUp(); return; }
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
  if (!['challenge', 'endless'].includes(gameState.settings.mode)) gameState.settings.mode = 'easy';
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

async function persistMemorySession(allowStartup = false) {
  if (gameState.wave?.phase === 'won') return true;
  const startup = getMemoryShell().scope?.startup;
  if (startup && startup.status !== 'ready' && !allowStartup) return false;
  if (!gameState.settings.mode || gameState.currentLevel < 1) return false;
  return (await saveMemorySession(activeAssetPaths.length ? { assetPaths: activeAssetPaths } : {}));
}

export async function handleHintClick() {
  if (gameState.isLocked || gameState.isPaused) return;
  if (gameState.progress.memoryMatch.items.hint <= 0) return showBonusOverlay("Bạn đã hết lượt gợi ý.");
  const roundId = gameState.roundId;
  if (memoryBoard.selectedIds.length) {
    showBonusOverlay("Hãy hoàn thành lượt chọn hiện tại trước khi dùng gợi ý.");
    return;
  }

  const tilePairs = {};
  for (const [id, tile] of memoryBoard.tiles) {
    if (tile.matched || memoryBoard.selectedIds.includes(id)) continue;
    (tilePairs[tile.imageId] ||= []).push(document.getElementById(id));
  }

  const availablePairs = Object.values(tilePairs).filter(
    (tiles) => tiles.length >= 2,
  );
  const pair =
    availablePairs[Math.floor(Math.random() * availablePairs.length)];
  if (!pair) return showBonusOverlay("Hiện không có cặp thẻ phù hợp để gợi ý.");

  gameState.isLocked = true;
  gameState.progress.memoryMatch.items.hint -= 1;
  if (!(await persistMemorySession())) {
    if (gameState.roundId !== roundId) return;
    gameState.progress.memoryMatch.items.hint += 1;
    gameState.isLocked = false;
    return showBonusOverlay("Không thể lưu lượt gợi ý. Hãy thử lại.");
  }
  if (gameState.roundId !== roundId) return;
  updateHintDisplay(gameState.progress.memoryMatch.items.hint);
  playOwnedRewardCue('hint', getMemoryShell().scope, gameState.settings);
  revealHintPair(pair.slice(0, 2), roundId);
  showAppToast("Đã lật 2 thẻ trong vài giây.", { tone: 'info', duration: 1600 });
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

configureLogic({ onNext: nextLevel, onMenu: returnToMainMenu, onWave: advanceMemoryWave });

document.addEventListener("visibilitychange", async () => {
  if (document.hidden) (await pauseForBackground());
  else resumeFromBackground();
});

window.addEventListener("pagehide", async () => {
  if (isGameVisible()) (await persistMemorySession());
});
