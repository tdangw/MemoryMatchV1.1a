import { connectDialogPlacement } from './dialogPlacement.js';
import { formatWaveLevel } from './progression/waveHud.js';
import { gameRecordLabel } from './gameRecord.js';
import { presentEffect, flyToTarget, pulseTarget } from "./gameShell/gameShellEffects.js";
import { getMemoryHud } from "./memoryMatch/memoryShell.js";
import { setHudText, renderHudTimer } from "./gameShell/gameShellHud.js";
import { shellTimeout as setTimeout, clearShellTimeout as clearTimeout, shellInterval as setInterval, clearShellInterval as clearInterval, shellFrame as requestAnimationFrame, cancelShellFrame as cancelAnimationFrame } from "./gameShell/gameShellLifecycle.js";
// ui.js
import { gameState } from "./gameState.js";
import { GAMEPLAY_TIMING, getComboPresentation } from "./gameplayTuning.js";
import { sounds } from "./sound.js"; // ✅ Đã tách âm thanh
import { SUMMARY_REWARD_TIMING, summaryStarDelay, scheduleSummaryRewardAudio } from './progression/summaryRewardAudio.js';
import { openAppModal, showAppToast } from "./modal.js";
import { suspendAmbientBackground } from './backgroundEffects.js';
import { presentAchievementAnnouncements } from './progression/achievementAnnouncements.js';
import { createIcon } from "./icons.js";
import { launchSummaryConfetti, showSummaryFireworks } from "victory-presentation";
import { clearPersistentGameData } from "./persistence.js";
import { getTheme } from "./themeCatalog.js";
import { getEquippedThemeId } from "./appearance.js";
import { GAME_CONFIG, getStarScoreTargets, getTimerDirection, isEndlessMode, getMemoryMilestoneRewards } from "./config.js";
import { getGameModeLabel } from "./gameCatalog.js";
import { formatClockTime, UI_COPY } from "./uiCatalog.js";
import { prefersReducedMotion } from "./motion.js";
import {
  animateCoinCounter,
  clearCoinRewardEffects,
  isCoinCounterAnimating,
  playCoinRewardFlight,
} from "./coinRewards.js";
import { getMemoryItemTotal } from "./memoryItems.js";
import { createGameShellLifecycle, getActiveGameScope } from "./gameShell/gameShellLifecycle.js";
import { createHudTimerScheduler } from "./gameShell/gameTimerProgress.js";

import { getAppPageScope } from './appPageLifecycle.js';
import { getProgressionStarTargets } from './progression/gameplayRules.js';
import { waveTotalGroups } from './progression/waveProgress.js';
import { scheduleSummaryCoins } from './progression/summaryCoins.js';
let activeIntro = null;
let activeSummary = null;
let summaryGeneration = 0;
let pendingSummaryAction = null;

const scoreElement = document.getElementById("score");
const timerElement = document.getElementById("timer-value");
const timerContainer = document.getElementById("timer");
const gameHudElement = document.getElementById("game-title");
const memoryCoinHudElement = document.getElementById("memory-game-coins");
const memoryCoinElement = document.getElementById("memory-coin-balance");
const memoryTimeScheduler = createHudTimerScheduler();
let memoryTimeProgressState = null;
const rewardPopupQueue = [];
let rewardPopupActive = false;
let rewardPopupOverlay = null;
let rewardPopupDismissTimer;
let rewardPopupRemoveTimer;
let revealTimerInterval = null;
let revealTimerRoundId = null;

export function updateCoinDisplay(coins) {
  document
    .querySelectorAll("#coin-balance, [data-shop-coin-balance]")
    .forEach((element) => setHudText(element, coins));
  getMemoryHud().coins(coins, { animating: isCoinCounterAnimating(memoryCoinElement) });
}

export function showMemoryCoinReward(tileElement, previousCoins, nextCoins, amount) {
  if (!tileElement || !memoryCoinHudElement || !memoryCoinElement) return;
  playCoinRewardFlight(tileElement, memoryCoinHudElement, amount);
  animateCoinCounter(memoryCoinHudElement, memoryCoinElement, previousCoins, nextCoins);
}

export function updateScoreDisplay(score) {
  getMemoryHud().stats({ score });
  const target = gameState.wave ? getProgressionStarTargets({ totalGroups: waveTotalGroups(gameState.wave), mode: gameState.settings.mode }).three
    : getStarScoreTargets(gameState.totalPairs, gameState.settings.mode).three;
  getMemoryHud().stars({ score, target, record: gameRecordLabel(gameState.progress.memoryMatch, gameState.settings.mode, gameState.currentLevel) });
}

export function updateMemorySpecialProgress(progress = gameState.specialProgress) {
  const target = GAME_CONFIG.special.progressTarget;
  getMemoryHud().milestones({ progress: Math.max(0, Math.min(target, Math.floor(Number(progress) || 0))), target,
    descriptions: GAME_CONFIG.special.milestones.map((_, index) => describeMemoryMilestoneRewards(getMemoryMilestoneRewards(index + 1, gameState.settings.mode))) });
}

function describeMemoryMilestoneRewards(rewards = []) {
  return rewards.map((reward) => {
    const values = reward.values || [reward.value];
    const valueText = values.join(" hoặc ");
    if (reward.type === "preview-item") return reward.value === "all" ? "Xem trước tất cả vào kho" : `Xem trước ${valueText} thẻ vào kho`;
    if (reward.type === "time-item") return `+${valueText} giây vào kho`;
    if (reward.type === "hint") return `+${valueText} Gợi ý`;
    if (reward.type === "coins") return `+${valueText} Xu`;
    return "Phần thưởng đặc biệt";
  }).join(" + ");
}

export function updateMemoryAssistInventoryDisplay() {
  getMemoryHud().tool("time", { count: getMemoryItemTotal("time") });
  getMemoryHud().tool("preview", { count: getMemoryItemTotal("preview") });
}



export function updateLevelStarsDisplay(stars) { getMemoryHud().stars({ earned: stars }); }

export function updateTotalStarsDisplay(stars) { getMemoryHud().stats({ totalStars: stars }); }

export function updateLevelDisplay(level) { getMemoryHud().stats({ level: formatWaveLevel(level,gameState.wave) }); }

export function updateHintDisplay(hints) { getMemoryHud().tool("hint", { count: hints }); }

export function updateMovesDisplay(moves) { getMemoryHud().stats({ moves: moves }); }

export function updateMissesDisplay(misses) { getMemoryHud().stats({ misses: misses }); }

export function updateComboDisplay(combo) { getMemoryHud().stats({ combo: combo }); }

export function updateTimerDisplay(seconds) {
  if (!timerElement) return;

  if (revealTimerInterval !== null) return;

  getMemoryHud().stats({ timer: seconds });

  // 🔴 Cảnh báo khi còn <= 10s
  if (getTimerDirection(gameState.settings.mode) === "down" && seconds <= 10) {
    timerContainer?.classList.add("timer-warning");

    if (gameState.settings?.sound && !gameState._timeRunningOutPlayed) {
      sounds.timerunningout.currentTime = 0;
      sounds.timerunningout.play().catch(() => {});
      gameState._timeRunningOutPlayed = true;
    }
  } else {
    timerContainer?.classList.remove("timer-warning");
    gameState._timeRunningOutPlayed = false;
  }
}

export function setMemoryTimeProgress({ remainingSeconds, timeLimit }) {
  stopMemoryTimeProgress();
  memoryTimeProgressState = createMemoryTimeProgressState({ remainingSeconds, timeLimit, running: false });
  renderMemoryTimeProgress(memoryTimeProgressState.remainingMs, memoryTimeProgressState);
}

export function startMemoryTimeProgress({ remainingSeconds, timeLimit }) {
  stopMemoryTimeProgress();
  memoryTimeProgressState = createMemoryTimeProgressState({ remainingSeconds, timeLimit, running: true });
  if (memoryTimeProgressState.endless) {
    renderMemoryTimeProgress(memoryTimeProgressState.remainingMs, memoryTimeProgressState);
    return;
  }
  memoryTimeScheduler.start(updateMemoryTimeProgressFrame);
}

export function syncMemoryTimeProgress({ remainingSeconds, timeLimit }) {
  const wasRunning = Boolean(memoryTimeProgressState?.running);
  if (wasRunning) startMemoryTimeProgress({ remainingSeconds, timeLimit });
  else setMemoryTimeProgress({ remainingSeconds, timeLimit });
}

export function stopMemoryTimeProgress() {
  memoryTimeScheduler.stop();
  if (!memoryTimeProgressState) return;
  memoryTimeProgressState.running = false;
  renderMemoryTimeProgress(memoryTimeProgressState.remainingMs, memoryTimeProgressState);
}

function createMemoryTimeProgressState({ remainingSeconds, timeLimit, running }) {
  const endless = isEndlessMode(gameState.settings.mode);
  return {
    endless,
    running,
    timeLimitMs: Math.max(1, Number(timeLimit || remainingSeconds || 1)) * GAMEPLAY_TIMING.secondMs,
    remainingMs: Math.max(0, Number(remainingSeconds || 0)) * GAMEPLAY_TIMING.secondMs,
    lastFrameAt: null,
  };
}

function updateMemoryTimeProgressFrame(elapsed = 0) {
  if (!memoryTimeProgressState?.running || memoryTimeProgressState.endless) return;
  // Giữ timer bar đồng bộ với đồng hồ: animation xử lý thẻ không phải trạng thái pause.
  if (!gameState.isPaused) {
    memoryTimeProgressState.remainingMs = Math.max(0, memoryTimeProgressState.remainingMs - elapsed);
  } else {
    return false;
  }
  renderMemoryTimeProgress(memoryTimeProgressState.remainingMs, memoryTimeProgressState);
  if (memoryTimeProgressState.remainingMs > 0) {
    return true;
  } else {
    memoryTimeProgressState.running = false;
    return false;
  }
}

function renderMemoryTimeProgress(remainingMs, state) {
  renderHudTimer(gameHudElement, { progress: state.endless ? 1 : Number(Math.max(0, Math.min(1, remainingMs / state.timeLimitMs)).toFixed(4)), endless: state.endless });
}

export function showBonusOverlay(message) {
  showAppToast(message, { tone: "info", duration: 1600 });

  if (gameState.settings?.sound) {
    sounds.overlay.currentTime = 0;
    sounds.overlay.play().catch(() => {});
  }
}

// Popup hết giờ dùng chung để hai trò luôn có cùng cấu trúc và hiệu ứng.
export function openTimeUpModal({
  title = "Hết giờ",
  icon = "timer",
  content = UI_COPY.timeUpPrompt,
  actions = [],
  onClose,
} = {}) {
  const modal = openAppModal({
    id: "time-up-modal",
    icon,
    title,
    content,
    closeOnBackdrop: false,
    closeOnEscape: false,
    actions,
    onClose,
  });
  setTimeout(() => modal.panel.classList.add("is-defeat-shaking"), 520);
  return modal;
}

export function showLuckyRewardPopup(reward) {
  showGameplayRewardPopup({
    title: "Ô may mắn!",
    type: reward.type,
    value: reward.value,
  });
}

export function showGameplayRewardPopup({
  title = "Phần thưởng!",
  type,
  value,
  label,
  sound = true,
} = {}) {
  const presentations = {
    time: `+${value} giây`,
    hints: `+${value} gợi ý`,
    coins: `+${value} Xu`,
    reshuffle: `+${value} lượt xáo trộn`,
  };
  const presentation = presentations[type] || label;
  if (!presentation) return;

  rewardPopupQueue.push({ title, presentation, sound });
  if (!rewardPopupActive) showNextGameplayRewardPopup();
}

export function clearGameplayRewardPopups() {
  clearRevealTimer(false);
  document.querySelectorAll(".level-reward-overlay, .fly-icon").forEach(element => element.remove());
  rewardPopupQueue.length = 0;
  rewardPopupActive = false;
  clearTimeout(rewardPopupDismissTimer);
  clearTimeout(rewardPopupRemoveTimer);
  rewardPopupDismissTimer = undefined;
  rewardPopupRemoveTimer = undefined;
  rewardPopupOverlay?.remove();
  rewardPopupOverlay = null;
  clearCoinRewardEffects();
  document.querySelectorAll(".tile-score-effect, .tile-combo-effect").forEach((effect) => effect.remove());
}

function showNextGameplayRewardPopup() {
  const next = rewardPopupQueue.shift();
  if (!next) {
    rewardPopupActive = false;
    return;
  }
  rewardPopupActive = true;

  const popup = document.createElement("div");
  popup.className = "gameplay-reward-toast";
  popup.setAttribute("role", "status");
  popup.setAttribute("aria-live", "polite");
  const title = document.createElement("span");
  title.className = "gameplay-reward-toast__title";
  title.textContent = next.title;
  const value = document.createElement("strong");
  value.className = "gameplay-reward-toast__value";
  value.textContent = next.presentation;
  popup.append(title, value);
  document.body.append(popup);
  rewardPopupOverlay = popup;

  if (next.sound && gameState.settings?.sound) {
    sounds.overlay.currentTime = 0;
    sounds.overlay.play().catch(() => {});
  }

  rewardPopupDismissTimer = setTimeout(() => {
    popup.classList.add("is-leaving");
    rewardPopupRemoveTimer = setTimeout(() => {
      popup.remove();
      if (rewardPopupOverlay === popup) rewardPopupOverlay = null;
      showNextGameplayRewardPopup();
    }, GAMEPLAY_TIMING.rewardPopupExitMs);
  }, GAMEPLAY_TIMING.rewardPopupVisibleMs);
}
// Thưởng qua màn
export function showLevelRewardOverlay({
  level = gameState.currentLevel,
  mode = gameState.settings.mode || "easy",
  themeId = getEquippedThemeId(gameState.appearance),
  totalPairs = gameState.totalPairs,
  remainingTime = gameState.remainingTime,
  assistText = `Gợi ý: ${gameState.progress.memoryMatch.items.hint}`,
  targetText = `Mục tiêu: ${totalPairs} cặp`,
  overlayId,
  scope,
  onComplete = () => {},
} = {}) {
  // 🔄 Xoá overlay cũ nếu còn
  activeIntro?.destroy();

  // Nền overlay mờ
  const overlay = document.createElement("div");
  overlay.className = "level-reward-overlay app-modal-overlay fade-in";
  overlay.dataset.keepBanner = 'true';
  if (overlayId) overlay.id = overlayId;

  // Layout trực tiếp, không bọc trong .modal
  const container = document.createElement("div");
  container.className =
    "reward-container direct-layout app-modal";
  container.dataset.uiSurface = 'garden';
  const rewardTitle = document.createElement("h2");
  rewardTitle.className = "reward-title glow";
  rewardTitle.textContent = `Màn ${level}`;

  const subtitle = document.createElement("p");
  subtitle.className = "reward-subtitle";
  subtitle.textContent = `${getGameModeLabel(mode)} · Chủ đề ${getTheme(themeId).title}`;

  const createRewardLine = (className, icon, value) => {
    const line = document.createElement("div");
    line.className = className;
    line.append(createIcon(icon), document.createTextNode(value));
    return line;
  };

  container.append(rewardTitle, subtitle);
  const lines = [
    createRewardLine("reward-points", "trophy", targetText),
    createRewardLine("reward-time", "timer", formatClockTime(remainingTime)),
    createRewardLine("reward-hints", "search", assistText),
  ];
  container.append(...lines);

  overlay.appendChild(container);
  document.body.appendChild(overlay);

  const introScope = createGameShellLifecycle();
  introScope.own(suspendAmbientBackground());
  let release;
  const removeOverlay = () => {
    introScope.dispose(); overlay.remove(); release?.forget();
    if (activeIntro?.overlay === overlay) activeIntro = null;
  };
  activeIntro = { overlay, destroy: removeOverlay };
  release = (scope || getActiveGameScope() || getAppPageScope())?.own(removeOverlay, 'node');
  connectDialogPlacement(overlay, container, introScope);

  // Phát âm thanh
  if (gameState.settings?.sound) {
    sounds.bonus.currentTime = 0;
    sounds.bonus.play().catch(() => {});
  }

  // Tự động ẩn overlay
  const schedule = introScope.timeout;
  schedule(() => {
    overlay.classList.replace("fade-in", "fade-out");
    schedule(() => {
      removeOverlay();
      onComplete();
    }, 400);
  }, GAMEPLAY_TIMING.levelIntroDurationMs);

  return { overlay, destroy: removeOverlay };
}

export function showLevelSummaryOverlay(completion) {
  gameState.isPaused = true;
  const generation = ++summaryGeneration;
  pendingSummaryAction?.dispose();
  activeSummary?.dispose();
  const scope = createGameShellLifecycle(); activeSummary = scope;
  scope.own(() => completion.coinPresentation?.finish());
  const owner = getActiveGameScope() || getAppPageScope();
  const release = owner?.own(() => scope.dispose(), 'cleanup');
  scope.own(() => { release?.forget(); if (activeSummary === scope) activeSummary = null; });
  showSummaryFireworks({
    durationMs: GAMEPLAY_TIMING.victoryFireworksDurationMs,
    containerId: completion.fireworksContainerId, owner: scope,
  }).then(result => {
    if (result === false || !scope.active) return;
    const open = () => { if (scope.active) openLevelSummaryOverlay(completion, scope, owner, generation); };
    if (!document.hidden) open();
    else {
      const releaseVisibility = scope.listen(document, 'visibilitychange', () => { if (!document.hidden) { releaseVisibility(); open(); } });
    }
  }, error => { scope.dispose(); console.error('Victory fireworks failed', error); });
}

function openLevelSummaryOverlay({
  gameId,
  level,
  remainingTime,
  moves,
  misses,
  coinsEarned,
  coinPresentation,
  score,
  stars,
  timeBonus,
  luckyAwards = [],
  settings = {},
  onNext,
  onMenu,
  isVictoryCelebration = false,
}, scope, continuationOwner, generation) {
  function afterClose(callback) {
    pendingSummaryAction?.dispose();
    const actionScope = createGameShellLifecycle(); pendingSummaryAction = actionScope;
    const release = continuationOwner?.own(() => actionScope.dispose(), 'cleanup');
    actionScope.own(() => { release?.forget(); if (pendingSummaryAction === actionScope) pendingSummaryAction = null; });
    const current = () => actionScope.active && generation === summaryGeneration && (!continuationOwner || continuationOwner.active);
    void modal.whenClosed.then(async result => {
      if (result.reason !== 'closed' || !current()) { actionScope.dispose(); return; }
      let navigationPage = getAppPageScope();
      const failed = error => {
        if (generation === summaryGeneration && getAppPageScope() === navigationPage && (!navigationPage || navigationPage.active)) showAppToast('Chưa mở được màn chơi. Hãy thử lại.');
        console.error('Summary navigation failed', error.name);
      };
      try {
        if (!await presentAchievementAnnouncements({ owner: actionScope, gameId, level }) || !current()) return;
        const work = callback();
        navigationPage = getAppPageScope();
        await Promise.resolve(work).catch(failed);
      } catch (error) { failed(error); }
      finally { actionScope.dispose(); }
    });
  }
  let actionSelected = false;

  const content = document.createElement("div");
  content.className = "level-summary";

  const heading = document.createElement("h3");
  heading.className = "level-summary__heading";
  heading.textContent = `Hoàn thành Màn ${level}!`;

  const result = document.createElement("div");
  result.className = "level-summary__result";
  const resultStars = document.createElement("div");
  resultStars.className = "level-summary__stars";
  resultStars.setAttribute("aria-label", `${stars} trên 3 sao`);
  for (let index = 0; index < 3; index += 1) {
    const star = document.createElement("span");
    const isEarned = index < stars;
    star.className = [
      "level-summary__star",
      index === 1 && "level-summary__star--middle",
      isEarned ? "level-summary__star--earned" : "level-summary__star--unearned",
    ].filter(Boolean).join(" ");
    // Chừa một nhịp để popup ổn định trước, rồi mới hé từng sao.
    if (isEarned) star.style.setProperty("--star-delay", `${summaryStarDelay(index)}ms`);
    star.append(createIcon("star"));
    star.setAttribute("aria-hidden", "true");
    resultStars.appendChild(star);
  }
  const resultScore = document.createElement("strong");
  resultScore.className = "level-summary__score";
  resultScore.textContent = "0";
  result.append(resultStars);

  const stats = document.createElement("div");
  stats.className = "level-summary__stats";
  let coinsValueElement;
  const summaryStats = [
    ["Xu nhận", `+${coinsEarned}`, "summary-coins"],
    [getTimerDirection(settings.mode) === "up" ? "Thời gian đã chơi" : "Thời gian còn lại", formatClockTime(remainingTime), "summary-time"],
    ["Điểm", score, "summary-points"],
  ];

  summaryStats.forEach(([label, value, className]) => {
    const item = document.createElement("div");
    item.className = `level-summary__stat ${className}`;
    const statLabel = document.createElement("span");
    statLabel.textContent = label;
    const statValue = className === "summary-points" ? resultScore : document.createElement("strong");
    statValue.textContent = className === "summary-coins" ? "+0" : value;
    if (className === "summary-coins") coinsValueElement = statValue;
    const statIcon = createIcon(className === "summary-coins" ? "coin" : className === "summary-time" ? "timer" : "star");
    item.append(statIcon, statLabel, statValue);
    stats.appendChild(item);
  });

  content.append(result, heading, stats);

  const modal = openAppModal({
    id: "level-summary-modal",
    artwork: 'reward',
    owner: scope,
    onDestroy: () => scope.dispose(),
    showHeader: false,
    dismissible: false,
    content,
    size: "medium",
    closeOnBackdrop: false,
    actions: [
      {
        label: "Bản đồ",
        icon: "victory-home",
        variant: "secondary",
        onClick: (close) => {
          actionSelected = true;
          close();
          afterClose(() => onMenu?.());
        },
      },
      {
        label: "Chơi tiếp",
        sound: 'gameStart',
        icon: "victory-next",
        variant: "primary",
        onClick: (close) => {
          actionSelected = true;
          close();
          afterClose(() => {
            gameState.isPaused = false;
            return onNext?.();
          });
        },
      },
    ],
    onClose: () => {
      if (!actionSelected) onMenu?.();
    },
  });

  modal.panel.classList.add("level-summary-modal");
  scheduleSummaryRewardAudio({ owner: scope, stars, getSettings: () => gameState.settings });
  if (isVictoryCelebration) {
    modal.panel.classList.add("level-summary-modal--victory");
  }
  launchSummaryConfetti(scope);
  animateSummaryNumber(resultScore, score, { scope, delayMs: 360, durationMs: 1250 });
  if (coinsValueElement) {
    animateSummaryNumber(coinsValueElement, coinsEarned, { scope, prefix: "+", delayMs: SUMMARY_REWARD_TIMING.coinStart, durationMs: SUMMARY_REWARD_TIMING.coinDuration });
    scheduleSummaryCoins({ owner: scope, source: coinsValueElement.parentElement, amount: coinsEarned,
      reward: coinPresentation, getSettings: () => gameState.settings });
  }
}

function animateSummaryNumber(element, target, {
  scope,
  prefix = "",
  suffix = "",
  delayMs = 0,
  durationMs = 700,
} = {}) {
  const total = Math.max(0, Math.round(Number(target) || 0));
  const render = (value) => {
    element.textContent = `${prefix}${Number(value).toLocaleString("en-US")}${suffix}`;
  };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!total || reduced.matches || document.hidden) { render(total); return; }
  const animationScope = createGameShellLifecycle();
  const releaseOwner = scope.own(() => animationScope.dispose(), 'cleanup');
  let frame;
  animationScope.own(() => { globalThis.cancelAnimationFrame(frame); releaseOwner.forget(); }, 'frame');
  function finish() { if (scope.active && element.isConnected) render(total); animationScope.dispose(); }
  animationScope.listen(reduced, 'change', () => { if (reduced.matches) finish(); });
  animationScope.listen(document, 'visibilitychange', () => { if (document.hidden) finish(); });
  animationScope.timeout(() => {
    if (!element.isConnected) { animationScope.dispose(); return; }
    const startedAt = performance.now();
    const tick = now => {
      if (!scope.active || !animationScope.active || !element.isConnected) { animationScope.dispose(); return; }
      const progress = Math.min(1, (now - startedAt) / durationMs);
      render(Math.round(total * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = globalThis.requestAnimationFrame(tick);
      else animationScope.dispose();
    };
    frame = globalThis.requestAnimationFrame(tick);
  }, delayMs);
}

export function showResetConfirmationOverlay({ onClose = () => {} } = {}) {
  gameState.isPaused = true;

  if (gameState.settings?.sound) {
    sounds.overlay.currentTime = 0;
    sounds.overlay.play().catch(() => {});
  }

  openAppModal({
    id: "reset-modal",
    icon: "wand",
    title: "Xóa dữ liệu đã lưu",
    content:
      "<p>Điểm cao nhất và các cài đặt đã lưu trên thiết bị sẽ bị xóa. Bạn có muốn tiếp tục?</p>",
    actions: [
      {
        label: "Xóa dữ liệu",
        variant: "danger",
        onClick: async () => {
          sounds.confirm?.play().catch(() => {});
          if (await clearPersistentGameData()) location.reload();
        },
      },
    ],
    onClose: () => {
      gameState.isPaused = false;
      onClose();
    },
  });
}

export function showReturnToMenuOverlay({ onConfirm } = {}) {
  gameState.isPaused = true;

  if (gameState.settings?.sound) {
    sounds.overlay.currentTime = 0;
    sounds.overlay.play().catch(() => {});
  }

  openAppModal({
    id: "return-modal",
    icon: "home",
    title: "Về Menu",
    content:
      "<p>Bạn sẽ rời màn hiện tại. Kết quả của màn này sẽ không được lưu.</p>",
    actions: [
      {
        label: "Về Menu",
        variant: "primary",
        onClick: () => {
          if (gameState.settings?.sound) {
            sounds.confirm.currentTime = 0;
            sounds.confirm.play().catch(() => {});
          }
          setTimeout(() => {
            if (onConfirm) onConfirm();
            else location.reload();
          }, 220);
        },
      },
    ],
    onClose: () => {
      gameState.isPaused = false;
    },
  });
}
export function showScoreEffect(tileElement, points) {
  if (!tileElement || points <= 0) return;
  showGameplayFloatEffect(tileElement, `+${points} điểm`, "tile-score-effect");
}

export function showScoreEffectAt({ x, y } = {}, points) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || points <= 0 || prefersReducedMotion()) return;
  const effect = document.createElement("div");
  effect.className = "tile-score-effect";
  effect.textContent = `+${points} điểm`;
  effect.setAttribute("aria-hidden", "true");
  effect.style.left = `${x}px`;
  effect.style.top = `${y}px`;
  effect.style.setProperty("--gameplay-feedback-duration", `${GAMEPLAY_TIMING.scoreEffectDurationMs}ms`);
  presentEffect(effect, { type: "score", duration: GAMEPLAY_TIMING.scoreEffectDurationMs });
}

export function showGameplayRewardEffect(tileElement, { type, value } = {}) {
  if (!tileElement || !Number.isFinite(value) || value <= 0) return;
  const presentations = {
    coins: { text: `+${value} Xu`, icon: "coin" },
    time: { text: `+${value}s`, icon: "timer" },
    hint: { text: `+${value}`, icon: "search" },
    reshuffle: { text: `+${value}`, icon: "restart" },
    freeze: { text: `+${value}`, icon: "timer" },
    thunder: { text: `+${value}`, icon: "wand" },
  };
  const presentation = presentations[type];
  if (!presentation) return;
  showGameplayFloatEffect(
    tileElement,
    presentation.text,
    `tile-score-effect tile-score-effect--${type}`,
    presentation.icon,
  );
}

function showGameplayFloatEffect(tileElement, text, className, iconName) {
  if (prefersReducedMotion()) return;
  const rect = tileElement.getBoundingClientRect();
  const effect = document.createElement("div");
  effect.className = className;
  if (iconName) {
    effect.classList.add("tile-score-effect--reward");
    const icon = createIcon(iconName);
    icon.classList.add("tile-score-effect__icon");
    const label = document.createElement("span");
    label.textContent = text;
    effect.append(icon, label);
  } else {
    effect.textContent = text;
  }
  effect.setAttribute("aria-hidden", "true");
  effect.style.left = `${rect.left + rect.width / 2}px`;
  effect.style.top = `${rect.top + rect.height / 2}px`;
  effect.style.setProperty("--gameplay-feedback-duration", `${GAMEPLAY_TIMING.scoreEffectDurationMs}ms`);
  presentEffect(effect, { type: "score", duration: GAMEPLAY_TIMING.scoreEffectDurationMs });
}

export function showComboEffect(tileElement, combo) {
  const presentation = getComboPresentation(combo);
  if (!presentation || !tileElement || prefersReducedMotion()) return;

  document.querySelector(".tile-combo-effect")?.remove();

  const effect = document.createElement("div");
  effect.className = `tile-combo-effect tile-combo-effect--${presentation.id}`;
  effect.textContent = `${presentation.label}  x${combo}`;

  const board = tileElement.closest("#grid-board-frame, #link-board-frame, .triple-connect__surface");
  const rect = (board || tileElement).getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const upperBoardY = board
    ? rect.top + Math.min(42, Math.max(26, rect.height * 0.08))
    : rect.top + rect.height / 2;

  effect.style.left = `${centerX}px`;
  effect.style.top = `${upperBoardY}px`;
  effect.style.setProperty("--gameplay-feedback-duration", `${GAMEPLAY_TIMING.scoreEffectDurationMs}ms`);

  presentEffect(effect, { type: "combo", duration: GAMEPLAY_TIMING.scoreEffectDurationMs });
}

// Shop
export function showShopMessage(message, tone = "success") {
  showAppToast(message, { tone });
}
// Hiệu ứng Shop
export function animateIconToTarget(iconName, targetSelector) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  const icon = document.createElement("div");
  icon.className = "fly-icon strong-effect"; // 👉 thêm class mạnh hơn
  icon.appendChild(createIcon(iconName));
  document.body.appendChild(icon);

  const startX = window.innerWidth / 2;
  const startY = window.innerHeight / 2;
  icon.style.left = `${startX}px`;
  icon.style.top = `${startY}px`;

  icon.style.position = "fixed";
  icon.style.pointerEvents = "none";
  icon.style.zIndex = "10000";
  flyToTarget(icon, target, { onFinish: () => pulseTarget(target) });
}
export function highlightTarget(selector, isNegative = false) {
  const element = document.querySelector(selector);
  if (element) pulseTarget(element, isNegative);
}

// Tạm thay đồng hồ màn chơi bằng đếm ngược hiệu ứng xem trước.
export function showRevealTimerInHud(
  duration = 5,
  roundId = gameState.roundId,
) {
  if (!timerElement || !timerContainer) return;

  clearRevealTimer(false);
  revealTimerRoundId = roundId;
  let remaining = Math.max(1, Math.ceil(duration));

  timerContainer.classList.add("is-previewing");
  replaceTimerIcon("eye");
  timerElement.textContent = `${remaining}s`;

  revealTimerInterval = setInterval(() => {
    if (gameState.roundId !== revealTimerRoundId) {
      clearRevealTimer(true);
      return;
    }

    remaining -= 1;
    if (remaining <= 0) {
      clearRevealTimer(true);
      return;
    }
    timerElement.textContent = `${remaining}s`;
  }, 1000);
}

function clearRevealTimer(restoreTimer) {
  if (revealTimerInterval !== null) clearInterval(revealTimerInterval);
  revealTimerInterval = null;
  revealTimerRoundId = null;
  timerContainer?.classList.remove("is-previewing");
  replaceTimerIcon("timer");
  if (restoreTimer) updateTimerDisplay(gameState.remainingTime);
}

function replaceTimerIcon(iconName) {
  const currentIcon = timerContainer?.querySelector(".ui-icon");
  if (currentIcon) currentIcon.replaceWith(createIcon(iconName));
}
