// ui.js
import { gameState } from "./gameState.js";
import { GAMEPLAY_TIMING, getComboPresentation } from "./gameplayTuning.js";
import { sounds } from "./sound.js"; // ✅ Đã tách âm thanh
import { openAppModal, showAppToast } from "./modal.js";
import { createIcon } from "./icons.js";
import { launchSummaryConfetti, showSummaryFireworks } from "victory-presentation";
import { clearPersistentGameData } from "./persistence.js";
import { getTheme } from "./themeCatalog.js";
import { getEquippedThemeId } from "./appearance.js";
import { getStarScoreTargets, getTimerDirection, isEndlessMode } from "./config.js";
import { getGameModeLabel } from "./gameCatalog.js";
import { formatClockTime, UI_COPY } from "./uiCatalog.js";

const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const hintElement = document.getElementById("hint");
const timerElement = document.getElementById("timer-value");
const timerContainer = document.getElementById("timer");
const memoryTimeHudElement = document.getElementById("memory-time-hud");
const memoryTimeProgressElement = document.getElementById("memory-time-progress");
let memoryTimeAnimationFrame = null;
let memoryTimeProgressState = null;
const rewardPopupQueue = [];
let rewardPopupActive = false;
let rewardPopupOverlay = null;
let rewardPopupDismissTimer;
let rewardPopupRemoveTimer;
const movesElement = document.getElementById("moves");
const missesElement = document.getElementById("misses");
const comboElement = document.getElementById("combo");
const matchedPairsElement = document.getElementById("matched-pairs");
const totalPairsElement = document.getElementById("total-pairs");
const totalStarsElement = document.getElementById("total-stars");
const levelStarsElement = document.getElementById("level-stars");
const levelStarsFillElement = document.getElementById("level-stars-fill");
let revealTimerInterval = null;
let revealTimerRoundId = null;

export function updateCoinDisplay(coins) {
  const coinElement = document.getElementById("coin-balance");
  if (coinElement) coinElement.textContent = String(coins);
}

export function updateScoreDisplay(score) {
  if (scoreElement) scoreElement.textContent = score;
  const target = getStarScoreTargets(gameState.totalPairs, gameState.settings.mode).three;
  if (levelStarsFillElement) levelStarsFillElement.style.width = `${Math.min(100, Math.round(score / target * 100))}%`;
}

export function updateLevelStarsDisplay(stars) {
  if (!levelStarsElement) return;
  const earnedStars = Math.max(0, Math.min(3, Number(stars) || 0));
  levelStarsElement.setAttribute("aria-label", `${earnedStars} trên 3 sao`);
  levelStarsElement.querySelectorAll(".star-progress__milestone").forEach((star, index) => {
    star.classList.toggle("is-earned", index < earnedStars);
  });
}

export function updateTotalStarsDisplay(stars) {
  if (totalStarsElement) totalStarsElement.textContent = String(stars);
}

export function updateLevelDisplay(level) {
  if (levelElement) levelElement.textContent = level;
}

export function updateHintDisplay(hints) {
  if (hintElement) hintElement.textContent = `${hints}`;
}

export function updateMovesDisplay(moves) {
  if (movesElement) movesElement.textContent = moves;
}

export function updateMissesDisplay(misses) {
  if (missesElement) missesElement.textContent = misses;
}

export function updateComboDisplay(combo) {
  if (comboElement) comboElement.textContent = combo > 1 ? `x${combo}` : "0";
}

export function updatePairProgressDisplay(
  matchedPairs,
  totalPairs = gameState.totalPairs,
) {
  if (matchedPairsElement) matchedPairsElement.textContent = matchedPairs;
  if (totalPairsElement) totalPairsElement.textContent = totalPairs;
}

export function updateTimerDisplay(seconds) {
  if (!timerElement) return;

  if (revealTimerInterval !== null) return;

  timerElement.textContent = formatClockTime(seconds);

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
  memoryTimeProgressState.deadline = performance.now() + memoryTimeProgressState.remainingMs;
  updateMemoryTimeProgressFrame();
}

export function syncMemoryTimeProgress({ remainingSeconds, timeLimit }) {
  const wasRunning = Boolean(memoryTimeProgressState?.running);
  if (wasRunning) startMemoryTimeProgress({ remainingSeconds, timeLimit });
  else setMemoryTimeProgress({ remainingSeconds, timeLimit });
}

export function stopMemoryTimeProgress() {
  if (memoryTimeAnimationFrame !== null) cancelAnimationFrame(memoryTimeAnimationFrame);
  memoryTimeAnimationFrame = null;
  if (!memoryTimeProgressState) return;
  if (memoryTimeProgressState.running && !memoryTimeProgressState.endless) {
    memoryTimeProgressState.remainingMs = Math.max(0, memoryTimeProgressState.deadline - performance.now());
  }
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
    deadline: null,
  };
}

function updateMemoryTimeProgressFrame() {
  if (!memoryTimeProgressState?.running || memoryTimeProgressState.endless) return;
  memoryTimeProgressState.remainingMs = Math.max(0, memoryTimeProgressState.deadline - performance.now());
  renderMemoryTimeProgress(memoryTimeProgressState.remainingMs, memoryTimeProgressState);
  if (memoryTimeProgressState.remainingMs > 0) {
    memoryTimeAnimationFrame = requestAnimationFrame(updateMemoryTimeProgressFrame);
  } else {
    memoryTimeAnimationFrame = null;
    memoryTimeProgressState.running = false;
  }
}

function renderMemoryTimeProgress(remainingMs, state) {
  if (!memoryTimeHudElement || !memoryTimeProgressElement) return;
  const ratio = state.endless ? 1 : Math.max(0, Math.min(1, remainingMs / state.timeLimitMs));
  memoryTimeProgressElement.style.width = `${(ratio * 100).toFixed(4)}%`;
  memoryTimeHudElement.classList.toggle("is-warning", !state.endless && ratio < 0.7 && ratio >= 0.3);
  memoryTimeHudElement.classList.toggle("is-critical", !state.endless && ratio < 0.3);
  memoryTimeHudElement.classList.toggle("is-endless", state.endless);
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
  content = UI_COPY.timeUpPrompt,
  actions = [],
  onClose,
} = {}) {
  const modal = openAppModal({
    id: "time-up-modal",
    icon: "timer",
    title: "Hết giờ",
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
  rewardPopupQueue.length = 0;
  rewardPopupActive = false;
  clearTimeout(rewardPopupDismissTimer);
  clearTimeout(rewardPopupRemoveTimer);
  rewardPopupDismissTimer = undefined;
  rewardPopupRemoveTimer = undefined;
  rewardPopupOverlay?.remove();
  rewardPopupOverlay = null;
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
  assistText = `Gợi ý: ${gameState.hints}`,
  onComplete = () => {},
} = {}) {
  // 🔄 Xoá overlay cũ nếu còn
  const existing = document.querySelector(".level-reward-overlay");
  if (existing) existing.remove();

  // Nền overlay mờ
  const overlay = document.createElement("div");
  overlay.className = "level-reward-overlay app-modal-overlay fade-in";

  // Layout trực tiếp, không bọc trong .modal
  const container = document.createElement("div");
  container.className =
    "reward-container direct-layout app-modal";
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
    createRewardLine("reward-points", "trophy", `Mục tiêu: ${totalPairs} cặp`),
    createRewardLine("reward-time", "timer", formatClockTime(remainingTime)),
    createRewardLine("reward-hints", "search", assistText),
  ];
  container.append(...lines);

  overlay.appendChild(container);
  document.body.appendChild(overlay);

  // Phát âm thanh
  if (gameState.settings?.sound) {
    sounds.bonus.currentTime = 0;
    sounds.bonus.play().catch(() => {});
  }

  // Tự động ẩn overlay
  setTimeout(() => {
    overlay.classList.replace("fade-in", "fade-out");
    setTimeout(() => {
      overlay.remove();
      onComplete();
    }, 400);
  }, GAMEPLAY_TIMING.levelIntroDurationMs);
}

export function showLevelSummaryOverlay(completion) {
  gameState.isPaused = true;
  showSummaryFireworks({
    durationMs: GAMEPLAY_TIMING.victoryFireworksDurationMs,
    containerId: completion.fireworksContainerId,
  }).finally(() => openLevelSummaryOverlay(completion));
}

function openLevelSummaryOverlay({
  level,
  remainingTime,
  moves,
  misses,
  coinsEarned,
  score,
  stars,
  timeBonus,
  luckyAwards = [],
  settings = {},
  onNext,
  onMenu,
  isVictoryCelebration = false,
  onCelebrate,
}) {
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
    if (isEarned) star.style.setProperty("--star-delay", `${420 + index * 380}ms`);
    star.textContent = isEarned ? "★" : "☆";
    star.setAttribute("aria-hidden", "true");
    resultStars.appendChild(star);
  }
  const resultScore = document.createElement("strong");
  resultScore.className = "level-summary__score";
  resultScore.textContent = "0 ĐIỂM";
  result.append(resultStars, resultScore);

  const stats = document.createElement("div");
  stats.className = "level-summary__stats";
  let coinsValueElement;
  const summaryStats = [
    ["XU NHẬN", `+${coinsEarned}`, "summary-coins"],
    [
      isEndlessMode(settings.mode) ? "THỜI GIAN ĐÃ CHƠI" : "THỜI GIAN CÒN LẠI",
      formatClockTime(remainingTime),
      "summary-time",
    ],
    ["SỐ NƯỚC ĐI", moves, "summary-moves"],
    ["LƯỢT SAI", misses, "summary-misses"],
  ];
  if (timeBonus > 0) summaryStats.push(["THƯỞNG THỜI GIAN", `+${timeBonus}`, "summary-time-bonus"]);
  if (luckyAwards.length > 0) {
    summaryStats.push(["Ô MAY MẮN", `${luckyAwards.length} phần thưởng`, "summary-lucky"]);
    summaryStats.push([
      "PHẦN THƯỞNG",
      formatLuckyAwardSummary(luckyAwards),
      "summary-lucky-details",
    ]);
  }

  summaryStats.forEach(([label, value, className]) => {
    const item = document.createElement("div");
    item.className = `level-summary__stat ${className}`;
    const statLabel = document.createElement("span");
    statLabel.textContent = label;
    const statValue = document.createElement("strong");
    statValue.textContent = className === "summary-coins" ? "+0" : value;
    if (className === "summary-coins") coinsValueElement = statValue;
    item.append(statLabel, statValue);
    stats.appendChild(item);
  });

  content.append(heading, result, stats);

  const modal = openAppModal({
    id: "level-summary-modal",
    showHeader: false,
    dismissible: false,
    content,
    size: "medium",
    closeOnBackdrop: false,
    actions: isVictoryCelebration ? [
      {
        label: "Congratulations!",
        variant: "primary",
        onClick: (close) => {
          actionSelected = true;
          close();
          setTimeout(() => onCelebrate?.(), 200);
        },
      },
    ] : [
      {
        label: "Menu",
        icon: "home",
        variant: "secondary",
        onClick: (close) => {
          actionSelected = true;
          close();
          setTimeout(() => onMenu?.(), 200);
        },
      },
      {
        label: "Next Level",
        icon: "arrow-right",
        variant: "primary",
        onClick: (close) => {
          actionSelected = true;
          close();
          setTimeout(() => {
            gameState.isPaused = false;
            onNext?.();
          }, 200);
        },
      },
    ],
    onClose: () => {
      if (!actionSelected) onMenu?.();
    },
  });

  modal.panel.classList.add("level-summary-modal");
  if (isVictoryCelebration) {
    modal.panel.classList.add("level-summary-modal--victory");
  }
  launchSummaryConfetti();
  animateSummaryNumber(resultScore, score, { suffix: " ĐIỂM", delayMs: 360, durationMs: 1250 });
  if (coinsValueElement) {
    animateSummaryNumber(coinsValueElement, coinsEarned, { prefix: "+", delayMs: 760, durationMs: 1000 });
  }
}

function animateSummaryNumber(element, target, {
  prefix = "",
  suffix = "",
  delayMs = 0,
  durationMs = 700,
} = {}) {
  const total = Math.max(0, Math.round(Number(target) || 0));
  const render = (value) => {
    element.textContent = `${prefix}${Number(value).toLocaleString("en-US")}${suffix}`;
  };
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (!total || reducedMotion) {
    render(total);
    return;
  }

  window.setTimeout(() => {
    if (!element.isConnected) return;
    const startedAt = performance.now();
    const tick = (now) => {
      if (!element.isConnected) return;
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const easedProgress = 1 - (1 - progress) ** 3;
      render(Math.round(total * easedProgress));
      if (progress < 1) window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  }, delayMs);
}

function formatLuckyAwardSummary(awards) {
  const totals = awards.reduce((result, award) => {
    result[award.type] = (result[award.type] || 0) + award.value;
    return result;
  }, {});
  return [
    totals.time && `+${totals.time}s`,
    totals.hints && `+${totals.hints} gợi ý`,
    totals.coins && `+${totals.coins} Xu`,
  ].filter(Boolean).join(" · ");
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
        onClick: () => {
          sounds.confirm?.play().catch(() => {});
          clearPersistentGameData();
          setTimeout(() => location.reload(), 220);
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

  const rect = tileElement.getBoundingClientRect();
  const effect = document.createElement("div");
  effect.className = "tile-score-effect";
  effect.textContent = `+${points}`;
  effect.setAttribute("aria-hidden", "true");
  effect.style.left = `${rect.left + rect.width / 2}px`;
  effect.style.top = `${rect.top + rect.height / 2}px`;
  effect.style.setProperty("--gameplay-feedback-duration", `${GAMEPLAY_TIMING.scoreEffectDurationMs}ms`);
  document.body.appendChild(effect);

  setTimeout(() => effect.remove(), GAMEPLAY_TIMING.scoreEffectDurationMs);
}

export function showComboEffect(tileElement, combo) {
  const presentation = getComboPresentation(combo);
  if (!presentation) return;

  const effect = document.createElement("div");
  effect.className = `tile-combo-effect tile-combo-effect--${presentation.id}`;
  effect.textContent = `${presentation.label}  x${combo}`;

  const rect = tileElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  effect.style.left = `${centerX}px`;
  effect.style.top = `${centerY}px`;
  effect.style.setProperty("--gameplay-feedback-duration", `${GAMEPLAY_TIMING.scoreEffectDurationMs}ms`);

  document.body.appendChild(effect);
  setTimeout(() => effect.remove(), GAMEPLAY_TIMING.scoreEffectDurationMs);
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
  const targetRect = target.getBoundingClientRect();

  icon.style.left = `${startX}px`;
  icon.style.top = `${startY}px`;

  setTimeout(() => {
    icon.style.left = `${targetRect.left + targetRect.width / 2}px`;
    icon.style.top = `${targetRect.top}px`;
    icon.style.transform = "scale(0.6)";
    icon.style.opacity = "0";
  }, 20);

  setTimeout(() => {
    icon.remove();
    highlightTarget(targetSelector); // ✨ gọi hiệu ứng sáng
  }, 800);
}
export function highlightTarget(selector, isNegative = false) {
  const el = document.querySelector(selector);
  if (!el) return;

  el.classList.add("highlight-effect");
  if (isNegative) el.classList.add("highlight-negative");

  setTimeout(() => {
    el.classList.remove("highlight-effect");
    if (isNegative) el.classList.remove("highlight-negative");
  }, 1000);
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
