import { rememberRecentGame } from '../recentGame.js';
import { canLaunchGame } from "../profileOperations.js";
import { getLinkShell, getLinkHud, getLinkHudElements, bindLinkControls, closeLinkMenus, applyLinkTimingStyles } from "./linkShell.js";
import { setHudText, renderHudTimer } from "../gameShell/gameShellHud.js";
import { shellTimeout as setTimeout, clearShellTimeout as clearTimeout, shellInterval as setInterval, clearShellInterval as clearInterval } from "../gameShell/gameShellLifecycle.js";
import { createIcon } from "../icons.js";
import { unmountActiveGameShell } from "../gameShell/gameShell.js";
import { GAME_SHELL_DEFAULTS } from "../gameShell/gameShellConfig.js";
import { createHudTimerScheduler } from "../gameShell/gameTimerProgress.js";
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
  calculateMatchCoinReward,
  isCoinCounterAnimating,
  playCoinRewardFlight,
} from "../coinRewards.js";
import { gameState, increaseCoins, recordLinkConnectResult, spendCoins } from "../gameState.js";
import { saveCoins, savePersistentGameData, isPersistenceBlocked } from "../persistence.js";
import { beginPlayMetrics, resumePlayMetrics, snapshotPlayMetrics, finishPlayMetrics } from "../playMetrics.js";
import { prepareAdventureChapter, stageAdventureLevelStart, canAdvanceAdventure } from "../adventureLaunch.js";
import { getChapterNumber } from "../adventureProgress.js";
import { beginRankedAttempt, finalizeRankedRun, getRankedRun, stageRankedAttempt } from "../rankingRules.js";
import { getTheme, getThemeSelectionEligibility } from "../themeCatalog.js";
import { GAME_MODES } from "../gameCatalog.js";
import { TIME_UP_PURCHASES } from "../shopCatalog.js";
import {
  createThemeSummary,
  UI_TIMING,
} from "../uiCatalog.js";
import {
  calculateLinkMatchPoints,
  calculateLinkCoinReward,
  calculateLinkCompletionTimeBonus,
  calculateLinkThunderPairPoints,
  calculateLinkStarRating,
  getLinkChallengeTime,
  getLinkComboWindowMs,
  getLinkChallengeLayout,
  LINK_CONNECT_CONFIG,
  LINK_CONNECT_HELP_CONTENT,
  getLinkLevelHintBonus,
  getLinkLevelTimeBonus,
  getLinkGravityShift,
  getLinkSpecialMilestoneTooltip,
  getLinkStarScoreTargets,
  getLinkThunderResolveDelay,
  getLinkModeLayout,
  getLinkPremiumSupplyItem,
  getLinkPremiumTypeDefinition,
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
  removeLinkBoardPair,
  removeRandomLinkPair,
  reflowLinkBoard,
  shuffleLinkBoard,
  unlockFrozenLinkPairs,
  unlockAllFrozenLinkPairsAndEnsurePlayable,
} from "./linkBoard.js";
import { findAvailableConnections, findConnectionPath } from "./pathfinder.js";
import { consumeLinkItem, getLinkItemCount, grantLinkItem } from "./linkItems.js";
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
  playLinkSpecialPairTransform,
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
import { resolveSessionTiming } from "../sessionTiming.js";
import {
  canShowFullVictoryCelebration,
  showFullVictoryCelebration,
} from "victory-presentation";

let countdownInterval;
const linkTimeScheduler = createHudTimerScheduler({
  schedule: (callback) => setTimeout(callback, 250),
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
  gravityShift,
  specialProgress,
  specialNoEnergyDropStreak,
  remainingTime,
  timeLimit,
  levelStartTime,
  assetPaths,
  metrics,
  run,
} = {}) {
  if (!canLaunchGame()) return null;
  const modeLayout = getLinkModeLayout(mode);
  const layout = getLinkBoardLayoutForViewport(isLinkChallengeMode(mode) ? getLinkChallengeLayout(level) : modeLayout);
  const themeId = getTheme(getEquippedThemeId(gameState.appearance, "link-connect")).id;
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
  beginPlayMetrics(scope, { gameId: "link-connect", mode, level }, resume ? metrics || {} : null);
  const startup = createGameShellStartup(scope, getLinkShell().refs, error => {
    console.error('Link startup failed', error);
    showAppToast('Không thể chuẩn bị bàn chơi. Hãy chơi lại.');
  });
  linkGameState.isLocked = true;
  return startup.run(async () => {
  if (!await prepareAdventureChapter("link-connect", getChapterNumber(level), () => scope.active)) return null;
  startup.check();
  const board = await startup.phase('prepare', () => createLinkBoard({
    layout,
    themeId,
    level,
    mode,
    assetPaths: resume ? assetPaths : undefined,
    history: resume ? undefined : gameState.progress.themeSelectionHistory[themeId],
  }));
  activeAssetPaths = board.selectedAssetPaths;
  if (level === 1 && !resume && !restart) {
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
  const timing = resolveLinkLevelTiming({
    mode,
    level,
    modeLayout,
    resume,
    restart,
    remainingTime,
    timeLimit,
    levelStartTime,
  });
  const roundId = beginLinkRound({ mode, level, layout, board, gravityShift: resolvedGravityShift });
  linkGameState.remainingTime = timing.remainingTime;
  linkGameState.timeLimit = timing.timeLimit;
  linkGameState.levelStartTime = timing.levelStartTime;
  linkSessionCheckpointTicks = 0;
  await startup.yield();
  await startup.phase('render', () => renderLinkBoardStartup(board, { onTileClick: handleLinkTileClick, onCompactLandscapeChange: handleLinkCompactLandscapeChange }, startup));
  await startup.yield();
  updateLinkHud();
  linkGameState.isLocked = true;
  let introComplete = false;
  let imagesReady = false;
  const activateWhenReady = () => {
    if (!introComplete || !imagesReady || linkGameState.roundId !== roundId) return;
    unlockLinkBoard();
    startCountdown(roundId);
  };
  showLevelRewardOverlay({
    level,
    mode,
    themeId: getEquippedThemeId(gameState.appearance, "link-connect"),
    totalPairs: linkGameState.totalPairs,
    remainingTime: linkGameState.remainingTime,
    assistText: `Gợi ý: ${getLinkItemCount("hint")}`,
    onComplete: () => {
      introComplete = true;
      activateWhenReady();
    },
  });
  await startup.phase('images', () => startup.decodeBoard());
  startup.check();
  beginRankedAttempt("link-connect", mode, level, { reason: resume ? "resume" : restart ? "restart" : advance ? "advance" : "new", savedRun: run });
  if (stageAdventureLevelStart("link-connect", mode, level) && !resume && !restart) {
    gameState.progress.linkConnect.items.hint += getLinkLevelHintBonus(level, getLinkItemCount("hint"));
  }
  const committed = !resume && activeAssetPaths.length
    ? await commitThemeSession("link-connect", createLinkSession(), themeId, activeAssetPaths) : await persistLinkRunProgress(true);
  if (!committed) return null;
  startup.check();
  imagesReady = true;
  activateWhenReady();
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

async function runLinkGameAction(action) {
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
    return showLinkGameModal("Cách chơi Link Connect", LINK_CONNECT_HELP_CONTENT, "book");
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
  openAppModal({ id: "link-game-info-modal", title, content, icon, onClose: resumeLinkAfterModal });
}

export function openLinkPanel(open) {
  const scope = getLinkShell().scope;
  pauseLinkForModal();
  return open(() => { if (scope?.active) resumeLinkAfterModal(); });
}

function pauseLinkForModal() {
  linkGameState.isPaused = true;
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
  if (linkGameState.isLocked || linkGameState.isPaused) return;
  const tile = getLinkBoardTile(linkGameState.board, position);
  if (!tile || tile.frozen) return;
  clearLinkTileHints();
  if (!selectedPosition) {
    selectedPosition = position;
    setLinkTileSelected(position, true);
    return;
  }
  if (samePosition(selectedPosition, position)) {
    setLinkTileSelected(position, false);
    selectedPosition = null;
    return;
  }
  linkGameState.moves += 1;
  const firstTile = getLinkBoardTile(linkGameState.board, selectedPosition);
  const path = firstTile?.id === tile.id
    ? findConnectionPath(linkGameState.board.grid, selectedPosition, position)
    : null;
  if (!path) {
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
  const matchPoints = calculateLinkMatchPoints(linkGameState.combo, {
    special: isSpecialMatch,
  });
  linkGameState.score += matchPoints;
  drawLinkPath(path, linkGameState.board);
  const dropsEnergy = isSpecialMatch && (await shouldDropLinkEnergy());
  if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
  if (dropsEnergy) {
    const energyProgress = (await reserveLinkEnergy(roundId, board));
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    playLinkEnergyFlight(selectedPosition, position, {
      targetProgress: energyProgress,
      progressTarget: LINK_CONNECT_CONFIG.special.progressTarget,
      onArrive: async () => (await collectLinkEnergy(roundId, board)),
    });
  }
  const matchedTiles = playLinkMatchExit(selectedPosition, position);
  const matchRewardCoins = calculateMatchCoinReward(linkGameState.combo);
  const matchRewardAnchor = matchedTiles[1] || matchedTiles[0];
  (await awardLinkCoins(matchRewardCoins, matchRewardAnchor));
  if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
  showScoreEffect(matchedTiles[0], matchPoints);
  showComboEffect(matchedTiles[1] || matchedTiles[0], linkGameState.combo);
  setTimeout(async () => {
    // Người chơi có thể khởi động màn khác trước khi hiệu ứng kết thúc.
    // Khi đó callback cũ không được phép thay đổi trạng thái của bàn mới.
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    removeLinkBoardPair(board, matchedStart, position);
    linkGameState.matchedPairs += 1;
    const premiumReward = isSpecialMatch
      ? (await applyPremiumMatchReward(premiumType, matchedTiles[0]))
      : { triggerPairBreak: false };
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    if (firstTile.luckyReward) (await applyLinkLuckyReward(firstTile.luckyReward, matchedTiles[1] || matchedTiles[0]));
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    const boardShifted = applyLinkGravityShift(board, linkGameState.gravityShift);
    selectedPosition = null;
    clearLinkPath();
    if (boardShifted) renderLinkBoardShift(linkGameState.board, { onTileClick: handleLinkTileClick });
    else clearLinkMatchedPair(matchedStart, position);
    const finishResolution = async () => {
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
      updateLinkHud();
      if (linkGameState.matchedPairs >= linkGameState.totalPairs) {
        (await completeLinkLevel());
        return;
      }
      recoverBlockedLinkBoard(linkGameState.board);
      playPendingBoardTransforms();
      if (linkGameState.pendingSpecialMilestones.length) {
        (await processPendingSpecialMilestones(roundId, board));
        return;
      }
      unlockLinkBoard();
    };
    if (premiumReward.triggerPairBreak && linkGameState.matchedPairs < linkGameState.totalPairs) {
      (await playAutomaticPairBreak(roundId, board, finishResolution, { scoreMode: "combo" }));
      return;
    }
    (await finishResolution());
  }, getLinkMatchResolveDelay());
}

async function useLinkItem(id) {
  if (linkGameState.isLocked || linkGameState.isPaused || isLinkBoardMoving()) return;
  if (id === "freeze" && isLinkEndlessMode(linkGameState.mode)) {
    showAppToast("Chế độ Vô tận không dùng đóng băng thời gian.");
    return;
  }
  const hintConnection = id === "hint" ? findAvailableConnections(linkGameState.board.grid)[0] : null;
  if (id === "hint" && !hintConnection) {
    showAppToast("Không có đường nối khả dụng để gợi ý.");
    return;
  }
  const roundId = linkGameState.roundId;
  const board = linkGameState.board;
  linkGameState.isLocked = true;
  const consumed = await consumeLinkItem(id);
  if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
  linkGameState.isLocked = false;
  if (!consumed) {
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
      eligiblePair: (candidate, board) => candidate.positions.every((position) => {
        const tile = getLinkBoardTile(board, position);
        return tile && !tile.frozen && !tile.special && !tile.luckyReward;
      }),
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
  pauseLinkTimeProgressForFreeze();
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
  const roundId = linkGameState.roundId;
  const durationMs = finishPlayMetrics();
  const rollback = { coins: gameState.coins, score: linkGameState.score, progress: structuredClone(gameState.progress.linkConnect) };
  const previousChapter = gameState.progress.linkConnect.adventure?.currentChapter || 1;
  linkGameState.isCompleted = true;
  stopCountdown();
  linkGameState.isLocked = true;
  duckBackgroundMusicForVictory(gameState.settings);
  playLinkSound("victory");
  const coinsEarned = calculateLinkCoinReward(linkGameState.mode, linkGameState.remainingTime);
  const timeBonus = calculateLinkCompletionTimeBonus(linkGameState.mode, linkGameState.remainingTime);
  linkGameState.score += timeBonus;
  const stars = calculateLinkStarRating(
    linkGameState.score,
    linkGameState.totalPairs,
    linkGameState.mode,
  );
  recordLinkConnectResult({
    mode: linkGameState.mode,
    level: linkGameState.level,
    score: linkGameState.score,
    stars,
    durationMs,
  });
  (await awardLinkCoins(coinsEarned, null, { animate: false, persist: false }));
  if (linkGameState.roundId !== roundId) return;
  stageRankedAttempt("link-connect", linkGameState.mode, linkGameState.score, true);
  delete gameState.progress.linkConnect.sessionsByMode?.[linkGameState.mode];
  if (!(await savePersistentGameData({ coins: gameState.coins, progress: gameState.progress, cloudEvent: true }))) {
    if (linkGameState.roundId === roundId) {
      gameState.coins = rollback.coins;
      linkGameState.score = rollback.score;
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
    score: linkGameState.score,
    stars,
    timeBonus,
    luckyAwards: linkGameState.luckyAwards,
    settings: { ...gameState.settings, mode: linkGameState.mode },
    onMenu: returnToLinkMenu,
    completedChapter,
    onNext: () => canAdvanceAdventure("link-connect", linkGameState.mode, nextLevel)
      ? startLinkLevel({ mode: linkGameState.mode, level: nextLevel, advance: true }) : returnToLinkMenu(),
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

async function applyLinkLuckyReward(reward, anchor) {
  playLinkSound("bonus");
  linkGameState.luckyAwards.push(reward);
  if (reward.type === "coins") {
    (await awardLinkCoins(reward.value, anchor));
    showGameplayRewardEffect(anchor, { type: "coins", value: reward.value });
    return;
  }
  linkGameState.remainingTime += reward.value;
  syncLinkTimeProgress();
  showGameplayRewardEffect(anchor, { type: "time", value: reward.value });
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
  restoreBackgroundMusic(gameState.settings);
  startLinkTimeProgress(roundId);
  syncDefaultMusic(gameState.settings);
  countdownInterval = setInterval(async () => {
    if (isPersistenceBlocked()) return stopCountdown();
    // isLocked chỉ khóa input trong lúc board đổi trạng thái; không được làm dừng đồng hồ.
    if (linkGameState.roundId !== roundId || linkGameState.isPaused) return;
    if (linkGameState.freezeSeconds > 0) {
      linkGameState.freezeSeconds -= 1;
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
    stageActiveSession("link-connect", {
      mode: linkGameState.mode,
      level: linkGameState.level,
      gravityShift: linkGameState.gravityShift,
      specialProgress: linkGameState.specialProgress,
      specialNoEnergyDropStreak: linkGameState.specialNoEnergyDropStreak,
      remainingTime: seconds,
      timeLimit: seconds,
      levelStartTime: linkGameState.levelStartTime,
    });
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
  hud.timerCard?.classList.toggle("is-time-frozen", linkGameState.freezeSeconds > 0);
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
  if (persist && !(await saveCoins(gameState.coins))) {
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
    lastFrameAt: null,
  };
  renderLinkTimeProgress(linkTimeProgressState.remainingMs, linkTimeProgressState, hud);
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
    && linkGameState.freezeSeconds <= 0 && !linkTimeScheduler.active) {
    linkTimeScheduler.start(updateLinkTimeProgressFrame);
  }
}

function updateLinkTimeProgressFrame(elapsed = 0) {
  const state = linkTimeProgressState;
  if (!state?.running || state.roundId !== linkGameState.roundId) return;
  // Freeze giữ nguyên thanh thời gian và không để requestAnimationFrame chạy nền.
  if (linkGameState.freezeSeconds > 0) {
    return false;
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

function pauseLinkTimeProgressForFreeze() {
  linkTimeScheduler.pause();
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
  component.stars({ earned: calculateLinkStarRating(linkGameState.score, linkGameState.totalPairs, linkGameState.mode), score: linkGameState.score,
    target: getLinkStarScoreTargets(linkGameState.totalPairs, linkGameState.mode).three, totalScore: gameState.progress.linkConnect.totalScore });
  component.stats({ totalStars: gameState.progress.linkConnect.totalStars });
}

function updateLinkSpecialMilestones(hud = getLinkHudElements()) {
  getLinkHud(hud).milestones({ progress: linkGameState.specialProgress, target: LINK_CONNECT_CONFIG.special.progressTarget,
    descriptions: hud.milestones.map((_, index) => linkGameState.specialMilestoneRewards[index + 1] || getLinkSpecialMilestoneTooltip(index + 1)) });
}

async function shouldDropLinkEnergy() {
  const energy = LINK_CONNECT_CONFIG.special.energyDrop;
  if (
    linkGameState.specialProgress + linkGameState.pendingEnergyCollections
      >= LINK_CONNECT_CONFIG.special.progressTarget
  ) return false;
  if (linkGameState.specialNoEnergyDropStreak >= energy.guaranteeAfterMisses) {
    linkGameState.specialNoEnergyDropStreak = 0;
    return true;
  }
  if (Math.random() < energy.chance) {
    linkGameState.specialNoEnergyDropStreak = 0;
    return true;
  }
  linkGameState.specialNoEnergyDropStreak += 1;
  (await persistLinkRunProgress());
  return false;
}

async function reserveLinkEnergy(roundId, board) {
  if (linkGameState.roundId !== roundId || linkGameState.board !== board) return 0;
  linkGameState.pendingEnergyCollections += 1;
  (await persistLinkRunProgress());
  if (linkGameState.roundId !== roundId || linkGameState.board !== board) return 0;
  return linkGameState.specialProgress + linkGameState.pendingEnergyCollections;
}

async function collectLinkEnergy(roundId, board) {
  if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
  linkGameState.pendingEnergyCollections = Math.max(0, linkGameState.pendingEnergyCollections - 1);
  linkGameState.specialProgress = Math.min(
    LINK_CONNECT_CONFIG.special.progressTarget,
    linkGameState.specialProgress + 1,
  );
  const reachedProgress = linkGameState.specialProgress;
  (await persistLinkRunProgress());
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
  updateLinkHud();
  (await queueLinkEnergyMilestone(reachedProgress, roundId, board));
}

async function queueLinkEnergyMilestone(progress, roundId, board) {
  if (!progress || linkGameState.roundId !== roundId || linkGameState.board !== board) return;
  linkGameState.pendingSpecialMilestones.push(progress);
  if (!linkGameState.isLocked) (await processPendingSpecialMilestones(roundId, board));
}

async function applyPremiumMatchReward(premiumType, anchor) {
  const roundId = linkGameState.roundId;
  const board = linkGameState.board;
  const definition = getLinkPremiumTypeDefinition(premiumType);
  if (definition.id === "blue") {
    if (Math.random() >= definition.effectChance) return { triggerPairBreak: false };
    const itemId = getLinkPremiumSupplyItem(linkGameState.mode);
    (await grantAndAnimateLinkItem(itemId, anchor));
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    return { triggerPairBreak: false };
  }
  if (definition.id === "red") {
    return { triggerPairBreak: Math.random() < definition.effectChance };
  }

  const special = LINK_CONNECT_CONFIG.special;
  const thawedPairs = unlockFrozenLinkPairs(linkGameState.board, 1, { onUnlock: rememberFrozenPairForTransform });
  if (thawedPairs) return { triggerPairBreak: false };
  const rewardType = isLinkEndlessMode(linkGameState.mode) || Math.random() < 0.5 ? "coins" : "time";
  const range = special.frozenFallbackReward[rewardType === "coins" ? "coin" : "time"];
  const value = randomInteger(range.min, range.max);
  if (rewardType === "coins") {
    (await awardLinkCoins(value, anchor));
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
  } else {
    linkGameState.remainingTime += value;
    syncLinkTimeProgress();
  }
  showGameplayRewardEffect(anchor, { type: rewardType, value });
  return { triggerPairBreak: false };
}

async function processPendingSpecialMilestones(roundId, board) {
  if (linkGameState.isResolvingSpecialMilestone || linkGameState.roundId !== roundId || linkGameState.board !== board) return;
  const progress = linkGameState.pendingSpecialMilestones.shift();
  if (!progress) {
    unlockLinkBoard();
    return;
  }
  linkGameState.isResolvingSpecialMilestone = true;
  const anchor = getLinkHudElements().specialTrack;
  const finish = async () => {
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    linkGameState.isResolvingSpecialMilestone = false;
    if (progress >= LINK_CONNECT_CONFIG.special.progressTarget) linkGameState.specialProgress = 0;
    (await persistLinkRunProgress());
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    updateLinkHud();
    if (linkGameState.matchedPairs >= linkGameState.totalPairs) return (await completeLinkLevel());
    recoverBlockedLinkBoard(board);
    (await processPendingSpecialMilestones(roundId, board));
  };
  const rewardPairBreak = async () => (await playAutomaticPairBreak(roundId, board, finish));
  if (progress === 1 || progress === 3) {
    linkGameState.specialMilestoneRewards[progress] = "Phá 1 cặp thường ngẫu nhiên.";
    (await rewardPairBreak());
  } else if (progress === 2) {
    const coins = LINK_CONNECT_CONFIG.special.milestones.two.coins;
    (await awardLinkCoins(coins, anchor));
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    showGameplayRewardEffect(anchor, { type: "coins", value: coins });
    linkGameState.specialMilestoneRewards[progress] = `+${coins} Xu.`;
    (await finish());
  } else if (progress === 4) {
    const rules = LINK_CONNECT_CONFIG.special.milestones.four;
    if (isLinkEndlessMode(linkGameState.mode)) {
      (await awardLinkCoins(rules.fallbackCoins, anchor));
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
      showGameplayRewardEffect(anchor, { type: "coins", value: rules.fallbackCoins });
      linkGameState.specialMilestoneRewards[progress] = `+${rules.fallbackCoins} Xu.`;
    } else {
      const seconds = randomInteger(rules.time.min, rules.time.max);
      linkGameState.remainingTime += seconds;
      syncLinkTimeProgress();
      showGameplayRewardEffect(anchor, { type: "time", value: seconds });
      linkGameState.specialMilestoneRewards[progress] = `+${seconds}s.`;
    }
    (await finish());
  } else if (progress === 5) {
    const item = Math.random() < 0.5 ? "hint" : "reshuffle";
    const granted = (await grantAndAnimateLinkItem(item, anchor));
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    linkGameState.specialMilestoneRewards[progress] = granted
      ? `+1 ${item === "hint" ? "Gợi ý" : "Xáo trộn"}.`
      : "Không thể lưu vật phẩm thưởng.";
    (await finish());
  } else if (progress === 6) {
    const rules = LINK_CONNECT_CONFIG.special.milestones.six;
    const thawedPairs = unlockFrozenLinkPairs(board, rules.frozenPairs, { onUnlock: rememberFrozenPairForTransform });
    if (thawedPairs) {
      linkGameState.specialMilestoneRewards[progress] = "Mở 1 cặp băng.";
      playPendingBoardTransforms();
    } else {
      (await awardLinkCoins(rules.fallbackCoins, anchor));
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
      showGameplayRewardEffect(anchor, { type: "coins", value: rules.fallbackCoins });
      linkGameState.specialMilestoneRewards[progress] = `Hết băng: +${rules.fallbackCoins} Xu.`;
    }
    (await finish());
  } else if (progress === 7) {
    const rules = LINK_CONNECT_CONFIG.special.milestones.seven;
    const seconds = randomInteger(rules.time.min, rules.time.max);
    if (!isLinkEndlessMode(linkGameState.mode)) {
      linkGameState.remainingTime += seconds;
      syncLinkTimeProgress();
      showGameplayRewardEffect(anchor, { type: "time", value: seconds });
    }
    (await awardLinkCoins(rules.coins, anchor));
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    showGameplayRewardEffect(anchor, { type: "coins", value: rules.coins });
    linkGameState.specialMilestoneRewards[progress] = isLinkEndlessMode(linkGameState.mode)
      ? `+${rules.coins} Xu.`
      : `+${seconds}s và +${rules.coins} Xu.`;
    (await finish());
  } else if (progress === 8) {
    const rules = LINK_CONNECT_CONFIG.special.milestones.eight;
    const itemId = isLinkEndlessMode(linkGameState.mode) ? rules.endlessItem : rules.standardItem;
    const granted = (await grantAndAnimateLinkItem(itemId, anchor));
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    linkGameState.specialMilestoneRewards[progress] = granted
      ? `+1 ${itemId === "freeze" ? "Đóng băng thời gian" : "Xáo trộn"}.`
      : "Không thể lưu vật phẩm thưởng.";
    (await finish());
  } else if (progress === 9 || progress === 10) {
    const hintGranted = (await grantAndAnimateLinkItem("hint", anchor));
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    if (progress === 10) {
      const coins = LINK_CONNECT_CONFIG.special.milestones.ten.coins;
      (await awardLinkCoins(coins, anchor));
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
      const reshuffleGranted = (await grantAndAnimateLinkItem("reshuffle", anchor, { delayMs: 180 }));
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
      showGameplayRewardEffect(anchor, { type: "coins", value: coins });
      linkGameState.specialMilestoneRewards[progress] = `+${coins} Xu${reshuffleGranted ? ", +1 Xáo trộn" : ""}${hintGranted ? ", +1 Gợi ý" : ""} và phá cặp.`;
    } else linkGameState.specialMilestoneRewards[progress] = hintGranted
      ? "+1 Gợi ý và phá 1 cặp thường."
      : "Phá 1 cặp thường; không thể lưu Gợi ý thưởng.";
    (await rewardPairBreak());
  } else (await finish());
}

async function grantAndAnimateLinkItem(itemId, anchor, { delayMs = 0 } = {}) {
  const roundId = linkGameState.roundId;
  const board = linkGameState.board;
  if (!(await grantLinkItem(itemId))) {
    showAppToast("Không thể lưu vật phẩm thưởng lúc này.");
    return false;
  }
  if (linkGameState.roundId !== roundId || linkGameState.board !== board) return false;
  showGameplayRewardEffect(anchor, { type: itemId, value: 1 });
  playLinkItemRewardFlight(anchor, itemId, { delayMs });
  return true;
}

function recoverBlockedLinkBoard(board) {
  if (findAvailableConnections(board.grid).length) return false;
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

async function playAutomaticPairBreak(roundId, board, onComplete, { scoreMode = "none" } = {}) {
  const milestone = LINK_CONNECT_CONFIG.special.milestones;
  const pair = removeRandomLinkPair(board, {
    remove: false,
    eligiblePair: (candidate, currentBoard) => candidate.positions.every((position) => {
      const tile = getLinkBoardTile(currentBoard, position);
      return tile && !tile.frozen && !tile.special && !tile.luckyReward;
    }),
  });
  if (!pair) {
    const anchor = getLinkHudElements().specialTrack;
    (await awardLinkCoins(milestone.breakCoins, anchor));
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    showGameplayRewardEffect(anchor, { type: "coins", value: milestone.breakCoins });
    onComplete();
    return;
  }
  const [start, end] = pair.positions;
  setLinkTileSelected(start, true);
  setLinkTileSelected(end, true);
  setTimeout(() => {
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    const strike = playLinkThunderStrike([start, end], "yellow");
    let affectedTiles = [];
    setTimeout(() => {
      if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
      affectedTiles = playLinkMatchExit(start, end);
    }, LINK_CONNECT_TIMING.thunderCardExitDelayMs);
    setTimeout(() => {
      if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
      strike?.remove();
      applyThunderPairScore(scoreMode, affectedTiles[0]);
      removeLinkBoardPair(board, start, end);
      clearLinkMatchedPair(start, end);
      linkGameState.matchedPairs += 1;
      const shifted = applyLinkGravityShift(board, linkGameState.gravityShift);
      if (shifted) renderLinkBoardShift(board, { onTileClick: handleLinkTileClick });
      onComplete();
    }, getLinkThunderResolveDelay());
  }, LINK_CONNECT_TIMING.automaticPairMarkMs);
}

function applyThunderPairScore(mode, anchor) {
  if (mode === "none") return 0;
  if (mode === "combo") {
    linkGameState.combo += 1;
    const matchedAt = performance.now();
    linkGameState.lastMatchAt = matchedAt;
    const comboWindowMs = getLinkComboWindowMs(linkGameState.totalPairs);
    startLinkComboWindow(
      comboWindowMs,
      matchedAt,
      linkGameState.roundId,
      linkGameState.board,
    );
    setHudText(getLinkHudElements().combo, linkGameState.combo);
    showComboEffect(anchor, linkGameState.combo);
  }
  const points = calculateLinkThunderPairPoints(linkGameState.combo, {
    countsCombo: mode === "combo",
  });
  linkGameState.score += points;
  setHudText(getLinkHudElements().score, linkGameState.score);
  showScoreEffect(anchor, points);
  return points;
}

function rememberSpecialPairForTransform(pair) {
  const tileKeys = pair?.positions
    .map((position) => getLinkBoardTile(linkGameState.board, position)?.instanceId)
    .filter(Boolean) || [];
  linkGameState.pendingSpecialPairKeys = tileKeys;
  return tileKeys;
}

function rememberFrozenPairForTransform({ tileKeys }) {
  linkGameState.pendingFrozenTileKeys = [
    ...new Set([...linkGameState.pendingFrozenTileKeys, ...tileKeys]),
  ];
}

function playPendingBoardTransforms() {
  const tileKeys = linkGameState.pendingSpecialPairKeys;
  linkGameState.pendingSpecialPairKeys = [];
  if (tileKeys.length) playLinkSpecialPairTransform(tileKeys);
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
  stageRankedAttempt("link-connect", linkGameState.mode, linkGameState.score, linkGameState.isCompleted);
  return {
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

function resolveLinkLevelTiming({
  mode,
  level,
  modeLayout,
  resume,
  restart,
  remainingTime,
  timeLimit,
  levelStartTime,
}) {
  const fallback = isLinkChallengeMode(mode)
    ? getLinkChallengeTime(level)
    : modeLayout.timeSeconds + getLinkLevelTimeBonus(level);
  return resolveSessionTiming({
    endless: isLinkEndlessMode(mode),
    reason: resume ? "resume" : restart ? "restart" : "new",
    newTime: fallback,
    restartTime: restart ? linkGameState.levelStartTime : undefined,
    session: { remainingTime, timeLimit, levelStartTime },
  });
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

function samePosition(left, right) {
  return left.row === right.row && left.column === right.column;
}
