import { resolveLinkPairRewards } from './pairRewards.js';
import { gameRecordLabel } from '../gameRecord.js';
import { rememberRecentGame } from '../recentGame.js';
import { remainingComboWindow } from '../pairSessionSnapshot.js';
import { openGameExitDialog } from '../gameExitDialog.js';
import { canLaunchGame } from "../profileOperations.js";
import { getLinkShell, getLinkHud, getLinkHudElements, bindLinkControls, closeLinkMenus, applyLinkTimingStyles } from "./linkShell.js";
import { setHudText, renderHudTimer } from "../gameShell/gameShellHud.js";
import { shellTimeout as setTimeout, clearShellTimeout as clearTimeout, shellInterval as setInterval, clearShellInterval as clearInterval } from "../gameShell/gameShellLifecycle.js";
import { createIcon } from "../icons.js";
import { unmountActiveGameShell } from "../gameShell/gameShell.js";
import { GAME_SHELL_DEFAULTS } from "../gameShell/gameShellConfig.js";
import { createHudTimerScheduler, HUD_PROGRESS_TICK_MS } from "../gameShell/gameTimerProgress.js";
import { createGameShellStartup } from "../gameShell/gameShellStartup.js";
import { getCompactLandscapeColumns } from "../gameShell/gameShellLayout.js";
import { clearTooltip } from "../tooltips.js";
import { clearLootEffects } from "../lootEffects.js";
import { openAppModal, showAppToast } from "../modal.js";
import { duckBackgroundMusicForVictory, pauseBackgroundMusic, restoreBackgroundMusic, sounds, syncDefaultMusic } from "../sound.js";
import { getEquippedThemeId } from "../appearance.js";
import { GAMEPLAY_TIMING } from "../gameplayTuning.js";
import {
  animateCoinCounter,
  isCoinCounterAnimating,
  playCoinRewardFlight,
} from "../coinRewards.js";
import { gameState, increaseCoins, recordLinkConnectResult, spendCoins } from "../gameState.js";
import { savePersistentGameData, isPersistenceBlocked } from "../persistence.js";
import { beginPlayMetrics, resumePlayMetrics, snapshotPlayMetrics, finishPlayMetrics } from "../playMetrics.js";
import { prepareAdventureChapter, stageAdventureLevelStart, canAdvanceAdventure } from "../adventureLaunch.js";
import { getChapterNumber } from "../adventureProgress.js";
import { beginRankedAttempt, checkpointRankedRun, finalizeRankedRun, getRankedRun, stageRankedAttempt } from "../rankingRules.js";
import { createWaveProgress, completeWave, activateNextWave, normalizeWaveProgress, waveTotalGroups } from '../progression/waveProgress.js';
import { MATCH_COINS_PER_GROUP, calculateGroupScore, calculateVictoryCoins, calculateFastFinishBonus, calculateProgressionStars, getProgressionStarTargets } from '../progression/gameplayRules.js';
import { getDifficultyAccess } from '../progression/difficultyProgress.js';
import { playOwnedRewardCue } from '../sound.js';
import { renderWaveStatus, announceWave, presentWaveExit, prepareWaveArrival } from '../progression/waveHud.js';
import { PROGRESSION_HELP_CONTENT } from '../progression/progressionCopy.js';
import { pausePlayMetrics } from '../playMetrics.js';
import { getTheme, getThemeSelectionEligibility } from "../themeCatalog.js";
import { GAME_MODES } from "../gameCatalog.js";
import { TIME_UP_PURCHASES } from "../shopCatalog.js";
import {
  createThemeSummary,
  UI_TIMING,
} from "../uiCatalog.js";
import {
  getLinkComboWindowMs,
  getLinkChallengeLayout,
  LINK_CONNECT_CONFIG,
  LINK_CONNECT_HELP_CONTENT,
  getLinkLevelHintBonus,
  getLinkGravityShift,
  getLinkSpecialMilestoneTooltip,
  getLinkThunderResolveDelay,
  getLinkModeLayout,
  getLinkTimerDirection,
  getLinkMatchResolveDelay,
  isLinkChallengeMode,
  isLinkEndlessMode,
  LINK_CONNECT_TIMING,
} from "./linkConfig.js";
import {
  createLinkBoard,
  applyLinkGravityShift,
  ensurePlayableBoard,
  findLinkBoardTilePosition,
  getLinkBoardTile,
  hasOnlyFrozenLinkTiles,
  hasLinkThunderPair,
  isLinkThunderPairEligible,
  removeLinkBoardPair,
  removeRandomLinkPair,
  reflowLinkBoard,
  shuffleLinkBoard,
  unlockAllFrozenLinkPairsAndEnsurePlayable,
} from "./linkBoard.js";
import { findFirstAvailableConnection, hasAvailableConnection } from "./pathfinder.js";
import { decideLinkSelection } from './linkTurn.js';
import { consumeLinkItem, getLinkItemCount } from "./linkItems.js";
import {
  commitThemeSession,
  clearActiveSession,
  getActiveSession,
  saveActiveSession,
  stageActiveSession,
} from "../sessionProgress.js";
import {
  clearGameplayRewardPopups,
  openTimeUpModal,
  updateCoinDisplay,
  showComboEffect,
  showLevelRewardOverlay,
  showLevelSummaryOverlay,
  showGameplayRewardEffect,
  showScoreEffect,
} from "../ui.js";
import {
  clearLinkPath,
  clearLinkTransientEffects,
  stopLinkBoardLayout,
  clearLinkMatchedPair,
  clearLinkTileSelection,
  clearLinkTileHints,
  drawLinkPath,
  playLinkMatchExit,
  playLinkMismatch,
  playLinkFrozenPairUnlock,
  playLinkEnergyFlight,
  playLinkItemRewardFlight,
  playLinkThunderStrike,
  renderLinkBoard,
  renderLinkBoardStartup,
  renderLinkBoardShift,
  renderLinkBoardShuffle,
  setLinkTileSelected,
  setLinkTileHinted,
} from "./linkRenderer.js";
import { beginLinkRound, linkGameState, resetLinkGame } from "./linkState.js";
import { clearComboWindow, playComboWindow } from "../gameShell/comboWindowPresentation.js";
import {
  canShowFullVictoryCelebration,
  showFullVictoryCelebration,
} from "victory-presentation";

let countdownInterval;
const linkTimeScheduler = createHudTimerScheduler({
  schedule: (callback) => setTimeout(callback, HUD_PROGRESS_TICK_MS),
  cancel: clearTimeout,
});
let linkTimeProgressState = null;
let comboExpiryTimer;
let selectedPosition = null;
let pendingCompactLayout = null;
let linkTimeWarningPlayed = false;
let linkSessionCheckpointTicks = 0;
let activeAssetPaths = [];
let isLinkAutoPaused = false;
let navigation = {
  showMenu: () => {},
  showCollection: () => {},
  showShop: () => {},
  showSettings: () => {},
  showReset: () => {},
};

export function configureLinkController(options = {}) {
  navigation = { ...navigation, ...options };
}

export function showLinkDifficultyOverlay() {
  const content = document.createElement("div");
  content.className = "difficulty-content";
  const activeTheme = getTheme(getEquippedThemeId(gameState.appearance, "link-connect"));
  const themeRow = document.createElement("div");
  themeRow.className = "difficulty-theme";
  themeRow.append(createIcon(activeTheme.icon));
  const themeText = createThemeSummary(activeTheme.title);
  const changeTheme = document.createElement("button");
  changeTheme.type = "button";
  changeTheme.className = "difficulty-theme__change";
  changeTheme.textContent = "Đổi";
  themeRow.append(themeText, changeTheme);
  const options = document.createElement("div");
  options.className = "difficulty-options";
  const modal = openAppModal({
    id: "difficulty-modal",
    icon: "play",
    title: "Chọn chế độ Link Connect",
    content,
  });
  changeTheme.addEventListener("click", () => {
    modal.close();
    setTimeout(() => navigation.showCollection(), UI_TIMING.modalCloseMs);
  });
  GAME_MODES.forEach(({ id: mode, label, icon }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "difficulty-option";
    button.append(createIcon(icon), document.createTextNode(label));
    button.addEventListener("click", () => chooseLinkMode(mode, label, modal));
    options.append(button);
  });
  content.append(themeRow, options);
}

function chooseLinkMode(mode, label, difficultyModal) {
  const session = getActiveSession("link-connect", mode);
  if (!session) {
    difficultyModal.close();
    startLinkLevel({ mode, level: 1 });
    return;
  }
  const modal = openAppModal({
    id: "link-session-choice-modal",
    icon: "play",
    title: `${label} - Level ${session.level}`,
    content: "<p>Bạn muốn tiếp tục hành trình đã lưu hay bắt đầu lại từ cấp 1?</p>",
    actions: [
      {
        label: "Chơi mới",
        icon: "restart",
        onClick: () => {
          difficultyModal.close();
          startLinkLevel({ mode, level: 1 });
        },
      },
      {
        label: "Tiếp tục",
        icon: "play",
        variant: "primary",
        onClick: () => {
          difficultyModal.close();
          continueLinkSession(session);
        },
      },
    ],
  });
  modal.panel.classList.add("session-choice-modal");
}

export function startLinkLevel({
  mode = linkGameState.mode,
  level = 1,
  resume = false,
  restart = false,
  advance = false,
  skipIntro = false,
  gravityShift,
  specialProgress,
  specialNoEnergyDropStreak,
  remainingTime,
  timeLimit,
  levelStartTime,
  assetPaths,
  metrics,
  run,
  pairSnapshot,
  pairSnapshotInvalid,
  wave,
  waveInvalid,
  waveTransition = false,
} = {}) {
  if (!canLaunchGame()) return null;
  if (waveInvalid) { showAppToast('Lượt chơi này không thể tiếp tục.'); return null; }
  if (resume && wave?.phase === 'advance') { resume = false; waveTransition = true; skipIntro = true; }
  if (restart && (mode === 'challenge' || mode === 'endless')) { level = 1; restart = false; advance = false; }
  const modeLayout = getLinkModeLayout(mode);
  const layout = getLinkBoardLayoutForViewport(isLinkChallengeMode(mode) ? getLinkChallengeLayout(level) : modeLayout);
  if (wave && !normalizeWaveProgress(wave, { gameId: 'link-connect', mode, level, groupsPerWave: layout.tileCount / 2 })) {
    showAppToast('Không thể tiếp tục lượt này. Hãy bắt đầu lượt mới.'); return null;
  }
  if (resume && (pairSnapshotInvalid || run?.version === 3 && !pairSnapshot || pairSnapshot && (pairSnapshot.totalPairs * 2 !== layout.tileCount || getTheme(pairSnapshot.themeId).id !== pairSnapshot.themeId))) {
    showAppToast('Không thể tiếp tục lượt này. Hãy bắt đầu lượt mới.');
    return null;
  }
  const themeId = getTheme(resume && pairSnapshot ? pairSnapshot.themeId || getEquippedThemeId(gameState.appearance, 'link-connect') : getEquippedThemeId(gameState.appearance, 'link-connect')).id;
  const eligibility = getThemeSelectionEligibility(themeId, layout.tileCount / 2);
  if (!eligibility.ok) {
    showAppToast(`Chủ đề ${eligibility.theme.title} cần ${eligibility.required} ảnh khác nhau; hiện có ${eligibility.available}. Hãy chọn chủ đề khác.`);
    return null;
  }
  unmountActiveGameShell();
  stopCountdown();
  clearGameplayRewardPopups();
  clearLinkTransientEffects();
  clearLinkPath();
  clearLinkTileHints();
  selectedPosition = null;
  pendingCompactLayout = null;
  linkTimeWarningPlayed = false;
  const scope = showLinkGame();
  if (waveTransition) prepareWaveArrival(getLinkShell().refs, scope);
  beginPlayMetrics(scope, { gameId: "link-connect", mode, level }, resume || waveTransition ? metrics || {} : null);
  const startup = createGameShellStartup(scope, getLinkShell().refs, error => {
    console.error('Link startup failed', error);
    showAppToast('Không thể chuẩn bị bàn chơi. Hãy chơi lại.');
  });
  linkGameState.isLocked = true;
  return startup.run(async () => {
  if (!await prepareAdventureChapter("link-connect", getChapterNumber(level), () => scope.active)) return null;
  startup.check();
  if (!['challenge', 'endless'].includes(mode)
    && !getDifficultyAccess({ completed: gameState.progress.linkConnect.bestByLevel, level, mode }).unlocked) {
    showAppToast('Hãy hoàn thành độ khó trước để mở khóa.'); await returnToLinkMenu(); return null;
  }
  const board = await startup.phase('prepare', () => resume && pairSnapshot ? structuredClone(pairSnapshot.board) : createLinkBoard({
    layout,
    themeId,
    level,
    mode,
    assetPaths: resume ? assetPaths : undefined,
    history: resume ? undefined : gameState.progress.themeSelectionHistory[themeId],
  }));
  activeAssetPaths = board.selectedAssetPaths;
  board.seed = resume && pairSnapshot ? pairSnapshot.seed : crypto.randomUUID();
  board.themeId = themeId;
  if (level === 1 && !resume && !restart && !waveTransition) {
    linkGameState.specialProgress = 0;
    linkGameState.specialNoEnergyDropStreak = 0;
  } else if (resume) {
    const progressTarget = LINK_CONNECT_CONFIG.special.progressTarget;
    if (Number.isFinite(specialProgress)) {
      linkGameState.specialProgress = Math.max(0, Math.floor(specialProgress)) % progressTarget;
    }
    if (Number.isFinite(specialNoEnergyDropStreak)) {
      linkGameState.specialNoEnergyDropStreak = Math.min(
        LINK_CONNECT_CONFIG.special.energyDrop.guaranteeAfterMisses,
        Math.max(0, Math.floor(specialNoEnergyDropStreak)),
      );
    }
  }
  const resolvedGravityShift = gravityShift
    || (restart ? linkGameState.gravityShift : getLinkGravityShift(level));
  const restoredWave = wave && normalizeWaveProgress(wave, { gameId: 'link-connect', mode, level, groupsPerWave: layout.tileCount / 2 });
  if (wave && !restoredWave) throw new Error('Invalid Link wave checkpoint.');
  const activeWave = waveTransition ? activateNextWave(restoredWave)
    : resume && restoredWave ? restoredWave
      : createWaveProgress({ attemptId: crypto.randomUUID(), gameId: 'link-connect', mode, level, groupsPerWave: layout.tileCount / 2 });
  const timing = resume || waveTransition ? { remainingTime, timeLimit, levelStartTime }
    : { remainingTime: activeWave.allocatedSeconds, timeLimit: activeWave.allocatedSeconds, levelStartTime: activeWave.allocatedSeconds };
  const roundId = beginLinkRound({ mode, level, layout, board, gravityShift: resolvedGravityShift });
  linkGameState.wave = activeWave;
  linkGameState.score = activeWave.completedScore;
  linkGameState.moves = activeWave.completedMoves;
  linkGameState.misses = activeWave.completedMisses;
  if (waveTransition) linkGameState.freezeSeconds = pairSnapshot?.freezeSeconds || 0;
  if (resume && pairSnapshot) for (const key of ['score', 'moves', 'misses', 'matchedPairs', 'totalPairs']) linkGameState[key] = pairSnapshot[key];
  if (resume && pairSnapshot) {
    linkGameState.luckyAwards = structuredClone(pairSnapshot.luckyAwards || []);
    linkGameState.freezeSeconds = pairSnapshot.freezeSeconds || 0;
    const windowMs = getLinkComboWindowMs(linkGameState.totalPairs);
    const remaining = remainingComboWindow(pairSnapshot, windowMs);
    linkGameState.combo = remaining > 0 ? pairSnapshot.combo : 0;
    linkGameState.lastMatchAt = linkGameState.combo ? performance.now() - windowMs + remaining : 0;
  }
  linkGameState.remainingTime = timing.remainingTime;
  linkGameState.timeLimit = timing.timeLimit;
  linkGameState.levelStartTime = timing.levelStartTime;
  linkSessionCheckpointTicks = 0;
  await startup.yield();
  await startup.phase('render', () => renderLinkBoardStartup(board, { onTileClick: handleLinkTileClick, onCompactLandscapeChange: handleLinkCompactLandscapeChange }, startup));
  await startup.yield();
  updateLinkHud();
  linkGameState.isLocked = true;
  let introComplete = skipIntro;
  let imagesReady = false;
  let activation;
  const activateWhenReady = () => {
    if (!introComplete || !imagesReady || linkGameState.roundId !== roundId) return Promise.resolve();
    if (activation) return activation;
    activation = (async () => {
    await announceWave(getLinkShell().refs, scope, linkGameState.wave);
    if (!scope.active || linkGameState.roundId !== roundId) return;
    unlockLinkBoard();
    if (resume && pairSnapshot) {
      const windowMs = getLinkComboWindowMs(linkGameState.totalPairs);
      const remaining = remainingComboWindow(pairSnapshot, windowMs);
      linkGameState.combo = remaining > 0 ? pairSnapshot.combo : 0;
      if (linkGameState.combo) {
        linkGameState.lastMatchAt = performance.now() - windowMs + remaining;
        startLinkComboWindow(remaining, linkGameState.lastMatchAt, roundId, board);
      }
      updateLinkHud();
    }
    startCountdown(roundId);
    if (resume && pairSnapshot?.matchedPairs === pairSnapshot?.totalPairs && pairSnapshot) void completeLinkLevel();
    })();
    return activation;
  };
  if (!skipIntro) showLevelRewardOverlay({
    level,
    mode,
    themeId: getEquippedThemeId(gameState.appearance, "link-connect"),
    totalPairs: linkGameState.totalPairs,
    remainingTime: linkGameState.remainingTime,
    assistText: `Gợi ý: ${getLinkItemCount("hint")}`,
    onComplete: () => {
      introComplete = true;
      void activateWhenReady().catch(error => {
        if (!scope.active) return;
        console.error('Link activation failed', error);
        showAppToast('Không thể chuẩn bị bàn chơi. Hãy chơi lại.');
      });
    },
  });
  await startup.phase('images', () => startup.decodeBoard());
  startup.check();
  beginRankedAttempt("link-connect", mode, level, { reason: resume || waveTransition ? "resume" : restart ? "restart" : advance ? "advance" : "new", savedRun: run });
  if (stageAdventureLevelStart("link-connect", mode, level) && !resume && !restart) {
    gameState.progress.linkConnect.items.hint += getLinkLevelHintBonus(level, getLinkItemCount("hint"));
  }
  const committed = !resume && activeAssetPaths.length
    ? await commitThemeSession("link-connect", createLinkSession(), themeId, activeAssetPaths) : await persistLinkRunProgress(true);
  if (!committed) return null;
  startup.check();
  imagesReady = true;
  await activateWhenReady();
  });
}

export function continueLinkSession(session) {
  if (!session) return;
  return startLinkLevel({ ...session, resume: true });
}

export function returnToLinkMenu() {
  if (!linkGameState.isCompleted && linkGameState.remainingTime <= 0 && linkGameState.mode === "challenge") {
    finalizeRankedRun("link-connect", linkGameState.mode, linkGameState.score);
    delete gameState.progress.linkConnect.sessionsByMode.challenge;
    void savePersistentGameData({ progress: gameState.progress });
  }
  getLinkShell().unmount();
  stopCountdown();
  stopLinkBoardLayout();
  clearGameplayRewardPopups();
  resetLinkGame();
  selectedPosition = null;
  pendingCompactLayout = null;
  clearLinkPath();
  clearLinkTileHints();
  clearLinkTransientEffects();
  document.getElementById("link-connect-container")?.setAttribute("hidden", "");
  navigation.showMenu();
  restoreBackgroundMusic(gameState.settings);
  syncDefaultMusic(gameState.settings);
}

function showLinkGame() {
  const container = getLinkShell().refs.root;
  applyLinkTimingStyles(container, LINK_CONNECT_TIMING);
  document.getElementById("menu-container")?.remove();
  document.getElementById("game-container")?.style.setProperty("display", "none");
  container.removeAttribute("hidden");
  const scope = getLinkShell().mount({ cleanup: () => {
    stopCountdown();
    stopLinkBoardLayout();
    const endedChallenge = linkGameState.mode === "challenge" && linkGameState.remainingTime <= 0;
    if (scope.startup?.status === 'ready' && !linkGameState.isCompleted && !endedChallenge) void persistLinkRunProgress();
    clearGameplayRewardPopups();
    clearLinkPath();
    clearLinkTileHints();
    clearLinkTransientEffects();
    clearLootEffects();
    clearTooltip();
  } });
  bindLinkControls(scope, { onAction: runLinkGameAction, onItem: useLinkItem });
  return scope;
}

export async function runLinkGameAction(action) {
  if (action === 'exit-dialog') return openLinkPanel(onClose => openGameExitDialog({ mode: linkGameState.mode, owner: getLinkShell().scope, trigger: getLinkShell().refs.root.querySelector('#link-actions-menu-toggle'), onClose, onExit: () => runLinkGameAction('menu'), onRestart: () => runLinkGameAction('restart'), onSettings: () => runLinkGameAction('settings') }));
  if (action === "menu") return (await returnToLinkMenu());
  if (action === "restart") {
    return startLinkLevel({ mode: linkGameState.mode, level: linkGameState.level, restart: true });
  }
  if (action === "settings") {
    pauseLinkForModal();
    return navigation.showSettings(resumeLinkAfterModal);
  }
  if (action === "collection") {
    pauseLinkForModal();
    return navigation.showCollection(resumeLinkAfterModal);
  }
  if (action === "shop") {
    pauseLinkForModal();
    return navigation.showShop(resumeLinkAfterShop);
  }
  if (action === "help") {
    return showLinkGameModal("Cách chơi Link Connect", LINK_CONNECT_HELP_CONTENT + PROGRESSION_HELP_CONTENT, "book");
  }
  if (action === "info") {
    return showLinkGameModal("Giới thiệu", "<p><strong>Link Connect</strong> là trò chơi nối cặp hình giúp rèn luyện khả năng quan sát.</p>", "info");
  }
  if (action === "reset") {
    pauseLinkForModal();
    return navigation.showReset(resumeLinkAfterModal);
  }
}

function showLinkGameModal(title, content, icon) {
  pauseLinkForModal();
  openAppModal({ id: "link-game-info-modal", alignment: "center", title, content, icon, onClose: resumeLinkAfterModal });
}

export function openLinkPanel(open) {
  const scope = getLinkShell().scope;
  pauseLinkForModal();
  return open(() => { if (scope?.active) resumeLinkAfterModal(); });
}

function pauseLinkForModal() {
  linkGameState.isPaused = true;
  linkTimeScheduler.pause();
}

function resumeLinkAfterModal() {
  linkGameState.isPaused = false;
  syncLinkTimeProgress();
}

function resumeLinkAfterShop() {
  resumeLinkAfterModal();
  updateLinkHud();
}

async function handleLinkTileClick(position) {
  const decision = decideLinkSelection({ board: linkGameState.board, selected: selectedPosition,
    position, locked: linkGameState.isLocked, paused: linkGameState.isPaused });
  if (decision.type === 'reject') return;
  clearLinkTileHints();
  if (decision.type === 'select') {
    selectedPosition = position;
    setLinkTileSelected(position, true);
    return;
  }
  if (decision.type === 'deselect') {
    setLinkTileSelected(position, false);
    selectedPosition = null;
    return;
  }
  linkGameState.moves += 1;
  const { firstTile, tile, path } = decision;
  if (decision.type === 'mismatch') {
    const roundId = linkGameState.roundId;
    const board = linkGameState.board;
    playLinkSound("wrong");
    linkGameState.misses += 1;
    linkGameState.combo = 0;
    linkGameState.lastMatchAt = 0;
    stopLinkComboWindow();
    linkGameState.isLocked = true;
    const wrongTiles = playLinkMismatch(selectedPosition, position);
    updateLinkHud();
    setTimeout(() => {
      if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
      wrongTiles.forEach((tileElement) => tileElement.classList.remove("is-wrong"));
      clearLinkTileSelection();
      selectedPosition = null;
      unlockLinkBoard();
    }, LINK_CONNECT_TIMING.mismatchFeedbackMs);
    return;
  }

  const rollback = { coins: gameState.coins, progress: structuredClone(gameState.progress.linkConnect), state: structuredClone(linkGameState) };
  linkGameState.isLocked = true;
  playLinkSound("match");
  const matchedAt = performance.now();
  const comboWindowMs = getLinkComboWindowMs(linkGameState.totalPairs);
  linkGameState.combo = linkGameState.lastMatchAt
    && matchedAt - linkGameState.lastMatchAt <= comboWindowMs
    ? linkGameState.combo + 1
    : 1;
  linkGameState.lastMatchAt = matchedAt;
  const isSpecialMatch = firstTile.special && tile.special;
  const premiumType = isSpecialMatch ? firstTile.premiumType || "cyan" : null;
  const roundId = linkGameState.roundId;
  const board = linkGameState.board;
  startLinkComboWindow(comboWindowMs, matchedAt, roundId, board);
  const matchedStart = selectedPosition;
  const matchPoints = calculateGroupScore({ combo: linkGameState.combo });
  linkGameState.score += matchPoints;
  drawLinkPath(path, linkGameState.board);
  removeLinkBoardPair(board, matchedStart, position);
  linkGameState.matchedPairs += 1;
  const baseCoins = MATCH_COINS_PER_GROUP;
  const rewards = resolveLinkPairRewards(linkGameState, gameState.progress.linkConnect.items, { special: isSpecialMatch, premiumType, luckyReward: firstTile.luckyReward });
  const previousCoins = gameState.coins;
  increaseCoins(baseCoins + rewards.coins);
  const staged = stageActiveSession('link-connect', createLinkSession());
  if (!staged || !await savePersistentGameData({ coins: gameState.coins, progress: gameState.progress })) {
    if (linkGameState.roundId === roundId) {
      gameState.coins = rollback.coins; gameState.progress.linkConnect = rollback.progress;
      Object.assign(linkGameState, rollback.state); linkGameState.isLocked = true; stopLinkComboWindow();
      renderLinkBoard(linkGameState.board, { onTileClick: handleLinkTileClick });
      showAppToast('Chưa thể lưu lượt chơi.');
    }
    return;
  }
  if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
  const matchedTiles = playLinkMatchExit(matchedStart, position);
  showScoreEffect(matchedTiles[0], matchPoints);
  showComboEffect(matchedTiles[1] || matchedTiles[0], linkGameState.combo);
  animateCoinCounter(getLinkHudElements().coins, getLinkHudElements().coinBalance, previousCoins, gameState.coins);
  playCoinRewardFlight(matchedTiles[1] || matchedTiles[0], getLinkHudElements().coins, baseCoins + rewards.coins);
  if (rewards.rewards.length) playOwnedRewardCue('reward', getLinkShell().scope, gameState.settings);
  for (const reward of rewards.rewards) {
    const anchor = matchedTiles[1] || matchedTiles[0];
    showGameplayRewardEffect(anchor, reward);
    if (['hint', 'reshuffle', 'freeze'].includes(reward.type)) playLinkItemRewardFlight(anchor, reward.type);
  }
  const bonusPositions = rewards.breakTileKeys.map(keys => keys.map(key => findLinkBoardTilePosition(rollback.state.board, key)));
  if (bonusPositions.length) {
    playLinkThunderStrike(bonusPositions.flat(), 'yellow');
    setTimeout(() => {
      if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
      for (const positions of bonusPositions) playLinkMatchExit(...positions);
    }, LINK_CONNECT_TIMING.thunderCardExitDelayMs);
  }
  if (rewards.energyProgress !== null) playLinkEnergyFlight(matchedStart, position, { targetProgress: rewards.energyProgress, progressTarget: LINK_CONNECT_CONFIG.special.progressTarget });
  if (rewards.unlocked.length) linkGameState.pendingFrozenTileKeys.push(...rewards.unlocked);
  const comboRemaining = Math.max(0, comboWindowMs - (performance.now() - matchedAt));
  if (comboRemaining > 0) startLinkComboWindow(comboRemaining, matchedAt, roundId, board);
  setTimeout(async () => {
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    selectedPosition = null; clearLinkPath();
    renderLinkBoardShift(board, { onTileClick: handleLinkTileClick });
    playPendingBoardTransforms(); updateLinkHud();
    if (linkGameState.matchedPairs >= linkGameState.totalPairs) { await completeLinkLevel(); return; }
    recoverBlockedLinkBoard(board);
    await persistLinkRunProgress();
    if (linkGameState.roundId === roundId && linkGameState.board === board) unlockLinkBoard();
  }, bonusPositions.length
    ? Math.max(getLinkMatchResolveDelay(), getLinkThunderResolveDelay())
    : getLinkMatchResolveDelay());

}

async function useLinkItem(id) {
  if (linkGameState.isLocked || linkGameState.isPaused || isLinkBoardMoving()) return;
  if (id === "freeze" && isLinkEndlessMode(linkGameState.mode)) {
    showAppToast("Chế độ Vô tận không dùng đóng băng thời gian.");
    return;
  }
  const hintConnection = id === "hint" ? findFirstAvailableConnection(linkGameState.board.grid) : null;
  if (id === "hint" && !hintConnection) {
    showAppToast("Không có đường nối khả dụng để gợi ý.");
    return;
  }
  if (id === 'thunder' && !hasLinkThunderPair(linkGameState.board)) {
    showAppToast('Không còn cặp thẻ để Sấm sét phá hủy.');
    return;
  }
  const roundId = linkGameState.roundId;
  const board = linkGameState.board;
  linkGameState.isLocked = true;
  const mode = linkGameState.mode;
  const sessions = gameState.progress.linkConnect.sessionsByMode;
  const previousSession = sessions?.[mode];
  let stagedFreeze = false;
  if (id === 'freeze' && getLinkItemCount(id) > 0) {
    const session = createLinkSession();
    session.pairSnapshot.freezeSeconds += 10;
    stagedFreeze = stageActiveSession('link-connect', session);
    if (!stagedFreeze) { linkGameState.isLocked = false; return; }
  }
  const consumed = await consumeLinkItem(id);
  if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
  linkGameState.isLocked = false;
  if (!consumed) {
    if (stagedFreeze) {
      if (previousSession) gameState.progress.linkConnect.sessionsByMode[mode] = previousSession;
      else delete gameState.progress.linkConnect.sessionsByMode[mode];
    }
    showAppToast("Bạn chưa có vật phẩm này.");
    return;
  }
  closeLinkMenus();
  playLinkSound("overlay");
  if (id === "hint") useLinkHint(hintConnection);
  else if (id === "reshuffle") useLinkReshuffle();
  else if (id === "thunder") useLinkThunder();
  else if (id === "freeze") useLinkFreeze();
  updateLinkHud();
}

function useLinkHint(connection) {
  linkGameState.isLocked = true;
  const roundId = linkGameState.roundId;
  const board = linkGameState.board;
  clearLinkTileHints();
  setLinkTileHinted(connection.start, true);
  setLinkTileHinted(connection.end, true);
  drawLinkPath(connection.path, linkGameState.board);
  showAppToast("Đây là một đường nối khả dụng.");
  setTimeout(() => {
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    clearLinkPath();
    unlockLinkBoard();
  }, LINK_CONNECT_TIMING.hintPreviewMs);
}

function useLinkReshuffle() {
  const roundId = linkGameState.roundId;
  const board = linkGameState.board;
  linkGameState.isLocked = true;
  selectedPosition = null;
  clearLinkTileSelection();
  clearLinkPath();
  shuffleLinkBoard(linkGameState.board);
  const settleMs = renderLinkBoardShuffle(linkGameState.board, { onTileClick: handleLinkTileClick });
  showAppToast("Đã xáo lại các thẻ còn lại.");
  setTimeout(() => {
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    unlockLinkBoard();
  }, settleMs);
}

function isLinkBoardMoving() {
  return Boolean(document.getElementById("link-board")?.classList.contains("is-moving"));
}

function useLinkThunder() {
  const pairCount = randomInteger(1, 3);
  const removedPairs = [];
  for (let index = 0; index < pairCount; index += 1) {
    const excludedTileKeys = removedPairs.flatMap((pair) => pair.positions
      .map((position) => getLinkBoardTile(linkGameState.board, position)?.instanceId));
    const pair = removeRandomLinkPair(linkGameState.board, {
      remove: false,
      excludeTileKeys: excludedTileKeys,
      eligiblePair: isLinkThunderPairEligible,
    });
    if (!pair) break;
    removedPairs.push(pair);
  }
  if (!removedPairs.length) {
    showAppToast("Không còn cặp thẻ để Sấm sét phá hủy.");
    return;
  }
  linkGameState.isLocked = true;
  const roundId = linkGameState.roundId;
  const board = linkGameState.board;
  showAppToast(`Sấm sét đang phá hủy ${removedPairs.length} cặp thẻ.`);
  playNextThunderStrike(removedPairs, 0, roundId, board, getThunderColor(removedPairs.length));
}

function playNextThunderStrike(pairs, index, roundId, board, colorId) {
  if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
  const pair = pairs[index];
  const strike = playLinkThunderStrike(pair.positions, colorId);
  const [start, end] = pair.positions;
  let affectedTiles = [];
  setTimeout(() => {
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    affectedTiles = playLinkMatchExit(start, end);
  }, LINK_CONNECT_TIMING.thunderCardExitDelayMs);
  setTimeout(async () => {
    strike?.remove();
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    applyThunderPairScore("normal", affectedTiles[0]);
    removeLinkBoardPair(board, start, end);
    clearLinkMatchedPair(start, end);
    linkGameState.matchedPairs += 1;
    updateLinkHud();
    if (index < pairs.length - 1) {
      setTimeout(
        () => playNextThunderStrike(pairs, index + 1, roundId, board, colorId),
        LINK_CONNECT_TIMING.thunderNextPairDelayMs,
      );
      return;
    }
    (await finishLinkThunder(board, roundId));
  }, getLinkThunderResolveDelay());
}

function getThunderColor(pairCount) {
  return pairCount === 1 ? "yellow" : pairCount === 2 ? "blue" : "red";
}

async function finishLinkThunder(board, roundId) {
  if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
  if (linkGameState.matchedPairs >= linkGameState.totalPairs) {
    (await completeLinkLevel());
    return;
  }
  const boardShifted = applyLinkGravityShift(board, linkGameState.gravityShift);
  if (boardShifted) renderLinkBoardShift(board, { onTileClick: handleLinkTileClick });
  recoverBlockedLinkBoard(board);
  unlockLinkBoard();
}

function useLinkFreeze() {
  linkGameState.freezeSeconds += 10;
  startLinkFreezeProgress();
  showAppToast("Đồng hồ đã đóng băng trong 10 giây.");
}

function getLinkBoardLayoutForViewport(layout) {
  const viewport = window.visualViewport;
  const width = viewport?.width ?? window.innerWidth;
  const height = viewport?.height ?? window.innerHeight;
  if (width <= height) return layout;
  return {
    ...layout,
    baseColumns: layout.columns,
    columns: getCompactLandscapeColumns({
      tileCount: layout.tileCount,
      columns: layout.columns,
      maxRows: GAME_SHELL_DEFAULTS.layout.compactLandscapeMaxRows,
    }),
  };
}

function handleLinkCompactLandscapeChange({ landscape, config }) {
  pendingCompactLayout = { landscape, maxRows: config.layout.compactLandscapeMaxRows };
  applyPendingLinkCompactLayout();
}

function applyPendingLinkCompactLayout() {
  if (!pendingCompactLayout || linkGameState.isLocked || !linkGameState.board) return false;
  const board = linkGameState.board;
  const columns = pendingCompactLayout.landscape
    ? getCompactLandscapeColumns({
      tileCount: board.capacity,
      columns: board.baseColumns,
      maxRows: pendingCompactLayout.maxRows,
    })
    : board.baseColumns;
  const selectedTileId = selectedPosition
    ? getLinkBoardTile(board, selectedPosition)?.instanceId
    : null;
  if (!reflowLinkBoard(board, columns)) {
    pendingCompactLayout = null;
    return false;
  }
  clearLinkTileSelection();
  renderLinkBoard(board, { onTileClick: handleLinkTileClick });
  selectedPosition = findLinkBoardTilePosition(board, selectedTileId);
  if (selectedPosition) setLinkTileSelected(selectedPosition, true);
  pendingCompactLayout = null;
  return true;
}

function unlockLinkBoard() {
  linkGameState.isLocked = false;
  applyPendingLinkCompactLayout();
}

async function completeLinkLevel() {
  if (linkGameState.isCompleted) return;
  if (linkGameState.wave.index < linkGameState.wave.count) return advanceLinkWave();
  const roundId = linkGameState.roundId;
  const activeMs = snapshotPlayMetrics({ gameId: 'link-connect', mode: linkGameState.mode, level: linkGameState.level })?.elapsedMs || 0;
  const durationMs = finishPlayMetrics();
  const rollback = { coins: gameState.coins, score: linkGameState.score, wave: linkGameState.wave, progress: structuredClone(gameState.progress.linkConnect) };
  const previousChapter = gameState.progress.linkConnect.adventure?.currentChapter || 1;
  linkGameState.isCompleted = true;
  stopCountdown();
  linkGameState.isLocked = true;
  duckBackgroundMusicForVictory(gameState.settings);
  playLinkSound("victory");
  linkGameState.wave = completeWave(linkGameState.wave, { score: linkGameState.score, moves: linkGameState.moves,
    misses: linkGameState.misses, matchedGroups: linkGameState.matchedPairs }).progress;
  const totalGroups = waveTotalGroups(linkGameState.wave);
  const timeBonus = calculateFastFinishBonus({ totalGroups, mode: linkGameState.mode, activeMs, allocatedSeconds: linkGameState.wave.allocatedSeconds });
  linkGameState.score += timeBonus;
  const stars = calculateProgressionStars({ totalGroups, mode: linkGameState.mode, score: linkGameState.score, won: true });
  const coinsEarned = calculateVictoryCoins({ gameId: 'link-connect', totalGroups, mode: linkGameState.mode, stars });
  const progressResult = recordLinkConnectResult({
    mode: linkGameState.mode,
    level: linkGameState.level,
    score: linkGameState.score,
    stars,
    durationMs,
    wave: linkGameState.wave,
  });
  (await awardLinkCoins(coinsEarned, null, { animate: false, persist: false }));
  if (linkGameState.roundId !== roundId) return;
  stageRankedAttempt("link-connect", linkGameState.mode, linkGameState.score, true);
  checkpointRankedRun("link-connect", linkGameState.mode);
  delete gameState.progress.linkConnect.sessionsByMode?.[linkGameState.mode];
  if (!(await savePersistentGameData({ coins: gameState.coins, progress: gameState.progress, cloudEvent: true }))) {
    if (linkGameState.roundId === roundId) {
      gameState.coins = rollback.coins;
      linkGameState.score = rollback.score;
      linkGameState.wave = rollback.wave;
      gameState.progress.linkConnect = rollback.progress;
    }
    return;
  }
  if (linkGameState.roundId !== roundId) return;
  updateLinkHud();
  const completedChapter = gameState.progress.linkConnect.adventure?.currentChapter > previousChapter ? previousChapter : null;
  const nextLevel = completedChapter ? gameState.progress.linkConnect.adventure.firstLevel : linkGameState.level + 1;
  const completion = {
    fireworksContainerId: "link-connect-container",
    level: linkGameState.level,
    remainingTime: linkGameState.remainingTime,
    moves: linkGameState.moves,
    misses: linkGameState.misses,
    coinsEarned,
    mastery: progressResult.mastery,
    score: linkGameState.score,
    stars,
    timeBonus,
    luckyAwards: linkGameState.luckyAwards,
    settings: { ...gameState.settings, mode: linkGameState.mode },
    onMenu: returnToLinkMenu,
    completedChapter,
    onNext: () => canAdvanceAdventure("link-connect", linkGameState.mode, nextLevel)
      ? startLinkLevel({ mode: ['challenge', 'endless'].includes(linkGameState.mode) ? linkGameState.mode : 'easy', level: nextLevel, advance: true }) : returnToLinkMenu(),
  };
  if (canShowFullVictoryCelebration && completion.completedChapter) {
    showLevelSummaryOverlay({
      ...completion,
      isVictoryCelebration: true,
      onCelebrate: () => showFullVictoryCelebration(completion),
    });
  } else {
    showLevelSummaryOverlay(completion);
  }
}

function playLinkSound(name) {
  const sound = sounds[name];
  if (!gameState.settings?.sound || !sound) return;
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function startCountdown(roundId) {
  resumePlayMetrics("startup");
  void rememberRecentGame("link-connect");
  stopCountdown();
  if (!isLinkEndlessMode(linkGameState.mode) && linkGameState.remainingTime <= 0) { handleLinkTimeUp(); return; }
  restoreBackgroundMusic(gameState.settings);
  startLinkTimeProgress(roundId);
  syncDefaultMusic(gameState.settings);
  countdownInterval = setInterval(async () => {
    if (isPersistenceBlocked()) return stopCountdown();
    // isLocked chỉ khóa input trong lúc board đổi trạng thái; không được làm dừng đồng hồ.
    if (linkGameState.roundId !== roundId || linkGameState.isPaused) return;
    if (linkGameState.freezeSeconds > 0) {
      linkGameState.freezeSeconds -= 1;
      linkTimeProgressState.freezeRemainingMs = Math.min(linkTimeProgressState.freezeRemainingMs, linkGameState.freezeSeconds * GAMEPLAY_TIMING.secondMs);
      if (linkGameState.freezeSeconds === 0) resumeLinkTimeProgressAfterFreeze();
      updateLinkTimerHud();
      return;
    }
    linkGameState.remainingTime += getLinkTimerDirection(linkGameState.mode) === "up" ? 1 : -1;
    linkSessionCheckpointTicks += 1;
    if (linkSessionCheckpointTicks >= GAMEPLAY_TIMING.sessionCheckpointSeconds) {
      linkSessionCheckpointTicks = 0;
      void persistLinkRunProgress();
    }
    syncLinkTimeProgress();
    updateLinkTimerHud();
    if (!isLinkEndlessMode(linkGameState.mode) && linkGameState.remainingTime <= 10 && !linkTimeWarningPlayed) {
      playLinkSound("timerunningout");
      linkTimeWarningPlayed = true;
    }
    if (linkGameState.remainingTime <= 0 && !isLinkEndlessMode(linkGameState.mode)) {
      handleLinkTimeUp();
    }
  }, GAMEPLAY_TIMING.secondMs);
}

function handleLinkTimeUp() {
  stopCountdown();
  linkGameState.isLocked = true;
  pauseBackgroundMusic();
  playLinkSound("defeat");
  let actionSelected = false;
  const returnToMenu = async () => (await returnToLinkMenu());
  const buyMoreTime = async (seconds, price, close) => {
    const scope = getLinkShell().scope;
    const expiredRoundId = linkGameState.roundId;
    const previousCoins = gameState.coins;
    const previousTiming = {
      remainingTime: linkGameState.remainingTime,
      timeLimit: linkGameState.timeLimit,
      levelStartTime: linkGameState.levelStartTime,
    };
    const sessions = gameState.progress.linkConnect.sessionsByMode;
    const previousSession = sessions?.[linkGameState.mode]
      ? { ...sessions[linkGameState.mode] }
      : null;
    if (!spendCoins(price)) {
      showAppToast("Bạn không đủ Xu để mua thêm thời gian.");
      playLinkSound("overlay");
      return true;
    }
    linkGameState.remainingTime = seconds;
    linkGameState.timeLimit = seconds;
    stageActiveSession('link-connect', createLinkSession());
    if (!(await savePersistentGameData({ coins: gameState.coins, progress: gameState.progress }))) {
      gameState.coins = previousCoins;
      Object.assign(linkGameState, previousTiming);
      if (previousSession) sessions[linkGameState.mode] = previousSession;
      else delete sessions[linkGameState.mode];
      showAppToast("Không thể lưu giao dịch. Xu và thời gian chưa thay đổi.");
      return true;
    }
    if (!scope.active || linkGameState.roundId !== expiredRoundId) return true;
    updateCoinDisplay(gameState.coins);
    updateLinkCoinHud();
    actionSelected = true;
    syncLinkTimeProgress();
    linkTimeWarningPlayed = false;
    unlockLinkBoard();
    updateLinkTimerHud();
    close();
    showAppToast(`Đã mua +${seconds}s với ${price} Xu.`);
    playLinkSound("bonus");
    syncDefaultMusic(gameState.settings);
    setTimeout(() => startCountdown(expiredRoundId), LINK_CONNECT_TIMING.countdownResumeDelayMs);
    return true;
  };
  openTimeUpModal({
    actions: [
      {
        label: "Về Menu",
        icon: "home",
        variant: "secondary",
        onClick: async (close) => {
          actionSelected = true;
          close();
          (await returnToMenu());
        },
      },
      {
        label: "Chơi lại",
        icon: "restart",
        variant: "primary",
        onClick: (close) => {
          actionSelected = true;
          close();
          startLinkLevel({ mode: linkGameState.mode, level: linkGameState.level, restart: true });
        },
      },
      ...TIME_UP_PURCHASES.map(({ seconds, price }) => ({
        label: `+${seconds} giây · ${price} Xu`,
        icon: "coin",
        variant: "time-purchase",
        onClick: async (close) => (await buyMoreTime(seconds, price, close)),
      })),
    ],
    onClose: async () => {
      if (!actionSelected) (await returnToMenu());
    },
  });
}

function updateLinkHud() {
  renderWaveStatus(getLinkShell().refs, linkGameState.wave);
  const hud = getLinkHudElements();
  const component = getLinkHud(hud);
  component.stats({ level: linkGameState.level, moves: linkGameState.moves, misses: linkGameState.misses, combo: linkGameState.combo, score: linkGameState.score });
  updateLinkCoinHud(hud);
  updateLinkTimerHud(hud);
  updateLinkStarsHud(hud);
  updateLinkSpecialMilestones(hud);
  hud.itemCounts.forEach(element => component.tool(element.dataset.itemCount, { count: getLinkItemCount(element.dataset.itemCount) }));
  component.tool("freeze", { disabled: isLinkEndlessMode(linkGameState.mode) });
}

function updateLinkTimerHud(hud = getLinkHudElements()) {
  getLinkHud(hud).stats({ timer: linkGameState.remainingTime });
  syncLinkTimerFreezeState(hud);
  if (!linkTimeProgressState || linkTimeProgressState.roundId !== linkGameState.roundId) {
    setLinkTimeProgress(false, linkGameState.roundId, hud);
    return;
  }
  renderLinkTimeProgress(linkTimeProgressState.remainingMs, linkTimeProgressState, hud);
}

function syncLinkTimerFreezeState(hud = getLinkHudElements()) {
  const frozen = linkGameState.freezeSeconds > 0;
  hud.timerCard?.classList.toggle("is-time-frozen", frozen);
  const state = linkTimeProgressState;
  const ratio = frozen && state?.roundId === linkGameState.roundId
    ? Math.min(1, state.freezeRemainingMs / Math.max(1, state.freezeDurationMs)) : 0;
  // A new or stacked item snaps full; only the countdown interpolates downward.
  hud.freezeProgress.style.transitionDuration = ratio === 1 ? '0s' : '';
  hud.freezeProgress.style.transform = `scaleX(${ratio})`;
  hud.freezeProgress.style.opacity = frozen ? "1" : "0";
}

function updateLinkCoinHud(hud = getLinkHudElements()) {
  if (!isCoinCounterAnimating(hud.coinBalance)) getLinkHud(hud).coins(gameState.coins);
}

async function awardLinkCoins(amount, anchor, { animate = true, persist = true } = {}) {
  const roundId = linkGameState.roundId;
  const board = linkGameState.board;
  const value = Math.max(0, Math.floor(Number(amount) || 0));
  if (value < 1) return 0;
  const previousCoins = gameState.coins;
  increaseCoins(value);
  if (persist) stageActiveSession('link-connect', createLinkSession());
  if (persist && !(await savePersistentGameData({ coins: gameState.coins, progress: gameState.progress }))) {
    gameState.coins = previousCoins;
    showAppToast("Không thể lưu phần thưởng Xu lúc này.");
    return 0;
  }
  const hud = getLinkHudElements();
  animateCoinCounter(hud.coins, hud.coinBalance, previousCoins, gameState.coins);
  if (animate && anchor) playCoinRewardFlight(anchor, hud.coins, value);
  return value;
}

function setLinkTimeProgress(running, roundId = linkGameState.roundId, hud = getLinkHudElements()) {
  stopLinkTimeProgress();
  const endless = isLinkEndlessMode(linkGameState.mode);
  linkTimeProgressState = {
    roundId,
    endless,
    running: Boolean(running && !endless),
    timeLimitMs: Math.max(1, Number(linkGameState.timeLimit || linkGameState.remainingTime || 1))
      * GAMEPLAY_TIMING.secondMs,
    remainingMs: Math.max(0, Number(linkGameState.remainingTime || 0)) * GAMEPLAY_TIMING.secondMs,
    freezeRemainingMs: linkGameState.freezeSeconds * GAMEPLAY_TIMING.secondMs,
    freezeDurationMs: linkGameState.freezeSeconds * GAMEPLAY_TIMING.secondMs,
    lastFrameAt: null,
  };
  renderLinkTimeProgress(linkTimeProgressState.remainingMs, linkTimeProgressState, hud);
  syncLinkTimerFreezeState(hud);
  if (!linkTimeProgressState.running) return;
  linkTimeScheduler.start(updateLinkTimeProgressFrame);
}

function startLinkTimeProgress(roundId) {
  setLinkTimeProgress(true, roundId);
}

function syncLinkTimeProgress() {
  if (!linkTimeProgressState || linkTimeProgressState.roundId !== linkGameState.roundId) return;
  linkTimeProgressState.remainingMs = Math.max(0, Number(linkGameState.remainingTime || 0))
    * GAMEPLAY_TIMING.secondMs;
  linkTimeProgressState.timeLimitMs = Math.max(1, Number(linkGameState.timeLimit || 1))
    * GAMEPLAY_TIMING.secondMs;
  linkTimeProgressState.lastFrameAt = performance.now();
  renderLinkTimeProgress(linkTimeProgressState.remainingMs, linkTimeProgressState);
  if (linkTimeProgressState.running && !linkGameState.isPaused
    && !linkTimeScheduler.active) {
    linkTimeScheduler.start(updateLinkTimeProgressFrame);
  }
}

function updateLinkTimeProgressFrame(elapsed = 0) {
  const state = linkTimeProgressState;
  if (!state?.running || state.roundId !== linkGameState.roundId) return;
  if (linkGameState.isPaused) return false;
  if (linkGameState.freezeSeconds > 0) {
    state.freezeRemainingMs = Math.max(0, state.freezeRemainingMs - elapsed);
    syncLinkTimerFreezeState();
    return true;
  }
  if (!linkGameState.isPaused && linkGameState.freezeSeconds <= 0) {
    state.remainingMs = Math.max(0, state.remainingMs - elapsed);
  }
  renderLinkTimeProgress(state.remainingMs, state);
  if (state.remainingMs > 0) {
    return !linkGameState.isPaused;
  } else {
    state.running = false;
    return false;
  }
}

function startLinkFreezeProgress() {
  const state = linkTimeProgressState;
  if (!state || state.roundId !== linkGameState.roundId) return;
  state.freezeRemainingMs = linkGameState.freezeSeconds * GAMEPLAY_TIMING.secondMs;
  state.freezeDurationMs = state.freezeRemainingMs;
  syncLinkTimerFreezeState();
  if (state.running && !linkGameState.isPaused && !linkTimeScheduler.active) {
    linkTimeScheduler.start(updateLinkTimeProgressFrame);
  }
}

function resumeLinkTimeProgressAfterFreeze() {
  const state = linkTimeProgressState;
  if (!state?.running || state.roundId !== linkGameState.roundId || linkGameState.isPaused || linkTimeScheduler.active) return;
  linkTimeScheduler.start(updateLinkTimeProgressFrame);
}

function renderLinkTimeProgress(remainingMs, state, hud = getLinkHudElements()) {
  const countdown = state.timeLimitMs > 0 && !state.endless;
  renderHudTimer(hud.gameHud, { progress: state.endless ? 1 : countdown ? remainingMs / state.timeLimitMs : 0, visible: countdown || state.endless, endless: state.endless });
}

function stopLinkTimeProgress() {
  linkTimeScheduler.stop();
  if (linkTimeProgressState) linkTimeProgressState.running = false;
}

function updateLinkStarsHud(hud = getLinkHudElements()) {
  const component = getLinkHud(hud);
  const totalGroups = linkGameState.wave ? waveTotalGroups(linkGameState.wave) : linkGameState.totalPairs;
  component.stars({ earned: calculateProgressionStars({ score: linkGameState.score, totalGroups, mode: linkGameState.mode, won: linkGameState.wave?.phase === 'won' }), score: linkGameState.score,
    target: getProgressionStarTargets({ totalGroups, mode: linkGameState.mode }).three, record: gameRecordLabel(gameState.progress.linkConnect, linkGameState.mode, linkGameState.level) });
  component.stats({ totalStars: gameState.progress.linkConnect.totalStars });
}

function updateLinkSpecialMilestones(hud = getLinkHudElements()) {
  getLinkHud(hud).milestones({ progress: linkGameState.specialProgress, target: LINK_CONNECT_CONFIG.special.progressTarget,
    descriptions: hud.milestones.map((_, index) => linkGameState.specialMilestoneRewards[index + 1] || getLinkSpecialMilestoneTooltip(index + 1)) });
}

function recoverBlockedLinkBoard(board) {
  if (hasAvailableConnection(board.grid)) return false;
  if (hasOnlyFrozenLinkTiles(board)) {
    const { unlockedPairs, shuffled } = unlockAllFrozenLinkPairsAndEnsurePlayable(board, {
      onUnlock: rememberFrozenPairForTransform,
    });
    if (!unlockedPairs) return false;
    if (shuffled) renderLinkBoardShuffle(board, { onTileClick: handleLinkTileClick });
    else renderLinkBoard(board, { onTileClick: handleLinkTileClick });
    playPendingBoardTransforms();
    showAppToast(
      shuffled
        ? `Đã mở toàn bộ ${unlockedPairs} cặp băng và xáo lại bàn.`
        : `Đã mở toàn bộ ${unlockedPairs} cặp băng còn lại.`,
    );
    return true;
  }
  if (ensurePlayableBoard(board)) {
    renderLinkBoardShuffle(board, { onTileClick: handleLinkTileClick });
    showAppToast("Không còn đường nối. Bàn đã được xáo lại.");
    return true;
  }
  return false;
}

function applyThunderPairScore(mode, anchor) {
  const points = calculateGroupScore({ combo: linkGameState.combo, automatic: true });
  linkGameState.score += points;
  setHudText(getLinkHudElements().score, linkGameState.score);
  showScoreEffect(anchor, points);
  return points;
}

async function advanceLinkWave() {
  const roundId = linkGameState.roundId;
  const rollback = { wave: linkGameState.wave, remainingTime: linkGameState.remainingTime,
    progress: structuredClone(gameState.progress.linkConnect) };
  linkGameState.isCompleted = true;
  linkGameState.isLocked = true;
  stopCountdown();
  pausePlayMetrics('wave-transition');
  const result = completeWave(linkGameState.wave, { score: linkGameState.score, moves: linkGameState.moves,
    misses: linkGameState.misses, matchedGroups: linkGameState.matchedPairs });
  linkGameState.wave = result.progress;
  linkGameState.remainingTime += result.bonusSeconds;
  linkGameState.timeLimit = Math.max(linkGameState.timeLimit, linkGameState.remainingTime);
  const session = createLinkSession();
  if (!await saveActiveSession('link-connect', session)) {
    if (linkGameState.roundId === roundId) {
      linkGameState.wave = rollback.wave; linkGameState.remainingTime = rollback.remainingTime;
      gameState.progress.linkConnect = rollback.progress;
    }
    return;
  }
  if (linkGameState.roundId !== roundId) return;
  if (!await presentWaveExit(getLinkShell().refs, getLinkShell().scope) || linkGameState.roundId !== roundId) return;
  return startLinkLevel({ ...session, waveTransition: true, skipIntro: true });
}

function rememberFrozenPairForTransform({ tileKeys }) {
  linkGameState.pendingFrozenTileKeys = [
    ...new Set([...linkGameState.pendingFrozenTileKeys, ...tileKeys]),
  ];
}

function playPendingBoardTransforms() {
  const frozenTileKeys = linkGameState.pendingFrozenTileKeys;
  linkGameState.pendingFrozenTileKeys = [];
  if (frozenTileKeys.length) playLinkFrozenPairUnlock(frozenTileKeys);
}

function randomInteger(minimum, maximum) {
  return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
}

async function persistLinkRunProgress(allowStartup = false) {
  const startup = getLinkShell().scope?.startup;
  if (startup && startup.status !== 'ready' && !allowStartup) return false;
  if (linkGameState.isCompleted) return await savePersistentGameData({ progress: gameState.progress });
  return await saveActiveSession("link-connect", createLinkSession());
}

function createLinkSession() {
  stageRankedAttempt("link-connect", linkGameState.mode, linkGameState.score, linkGameState.wave?.phase === 'won');
  return {
    ...(linkGameState.wave ? { wave: linkGameState.wave } : {}),
    pairSnapshot: { version: 1, gameId: 'link-connect', seed: linkGameState.board?.seed || 'legacy',
      themeId: linkGameState.board?.themeId,
      capturedAt: Date.now(), comboRemainingMs: linkGameState.lastMatchAt ? Math.max(0, getLinkComboWindowMs(linkGameState.totalPairs) - (performance.now() - linkGameState.lastMatchAt)) : 0,
      luckyAwards: structuredClone(linkGameState.luckyAwards), freezeSeconds: linkGameState.freezeSeconds,
      board: structuredClone(linkGameState.board), score: linkGameState.score, moves: linkGameState.moves,
      misses: linkGameState.misses, combo: linkGameState.combo, matchedPairs: linkGameState.matchedPairs, totalPairs: linkGameState.totalPairs },
    mode: linkGameState.mode,
    level: linkGameState.level,
    gravityShift: linkGameState.gravityShift,
    specialProgress: linkGameState.specialProgress,
    specialNoEnergyDropStreak: linkGameState.specialNoEnergyDropStreak,
    remainingTime: linkGameState.remainingTime,
    timeLimit: linkGameState.timeLimit,
    levelStartTime: linkGameState.levelStartTime,
    metrics: snapshotPlayMetrics({ gameId: "link-connect", mode: linkGameState.mode, level: linkGameState.level }),
    run: getRankedRun("link-connect", linkGameState.mode),
    ...(activeAssetPaths.length ? { assetPaths: activeAssetPaths } : {}),
  };
}

function isLinkGameVisible() {
  const container = document.getElementById("link-connect-container");
  return Boolean(container && !container.hasAttribute("hidden"));
}

async function pauseLinkForBackground() {
  if (!isLinkGameVisible()) return;
  if (linkGameState.isPaused) return;
  isLinkAutoPaused = true;
  linkGameState.isPaused = true;
  linkTimeScheduler.pause();
  getLinkShell().update({ paused: true });
  await persistLinkRunProgress();
}

function resumeLinkFromBackground() {
  if (!isLinkAutoPaused) return;
  isLinkAutoPaused = false;
  linkGameState.isPaused = false;
  getLinkShell().update({ paused: false });
  syncLinkTimeProgress();
}

function stopCountdown() {
  clearInterval(countdownInterval);
  countdownInterval = undefined;
  stopLinkTimeProgress();
  stopLinkComboWindow();
}

document.addEventListener("visibilitychange", async () => {
  if (document.hidden) (await pauseLinkForBackground());
  else resumeLinkFromBackground();
});

window.addEventListener("pagehide", async () => {
  if (isLinkGameVisible()) (await persistLinkRunProgress());
});

function startLinkComboWindow(durationMs, matchedAt, roundId, board) {
  clearTimeout(comboExpiryTimer);
  const card = getLinkHudElements().comboCard;
  if (card) {
    playComboWindow(card, durationMs);
  }
  comboExpiryTimer = setTimeout(() => {
    if (linkGameState.roundId !== roundId
      || linkGameState.board !== board
      || linkGameState.lastMatchAt !== matchedAt) return;
    linkGameState.combo = 0;
    linkGameState.lastMatchAt = 0;
    setHudText(getLinkHudElements().combo, 0);
    stopLinkComboWindow();
  }, durationMs);
}

function stopLinkComboWindow() {
  clearTimeout(comboExpiryTimer);
  comboExpiryTimer = undefined;
  clearComboWindow(getLinkHudElements().comboCard);
}
