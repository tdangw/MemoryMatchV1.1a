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

const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const hintElement = document.getElementById("hint");
const timerElement = document.getElementById("timer-value");
const timerContainer = document.getElementById("timer");
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

  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  timerElement.textContent = `${m}:${s}`;

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

export function showBonusOverlay(message) {
  showAppToast(message, { tone: "info", duration: 1600 });

  if (gameState.settings?.sound) {
    sounds.overlay.currentTime = 0;
    sounds.overlay.play().catch(() => {});
  }
}

export function showLuckyRewardPopup(reward) {
  document.querySelector(".lucky-reward-popup-overlay")?.remove();

  const presentations = {
    time: { icon: "timer", label: `+${reward.value} giây` },
    hints: { icon: "search", label: `+${reward.value} gợi ý` },
    coins: { icon: "coin", label: `+${reward.value} Xu` },
  };
  const presentation = presentations[reward.type];
  if (!presentation) return;

  const overlay = document.createElement("div");
  overlay.className = "lucky-reward-popup-overlay";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");
  const popup = document.createElement("div");
  popup.className = "lucky-reward-popup";
  const badge = document.createElement("span");
  badge.className = "lucky-reward-popup__badge";
  badge.append(createIcon("star"));
  const title = document.createElement("strong");
  title.textContent = "Ô may mắn!";
  const value = document.createElement("span");
  value.className = "lucky-reward-popup__value";
  value.append(createIcon(presentation.icon), document.createTextNode(presentation.label));
  popup.append(badge, title, value);
  overlay.append(popup);
  document.body.append(overlay);

  if (gameState.settings?.sound) {
    sounds.overlay.currentTime = 0;
    sounds.overlay.play().catch(() => {});
  }

  setTimeout(() => {
    overlay.classList.add("is-leaving");
    setTimeout(() => overlay.remove(), 240);
  }, 1500);
}
// Thưởng qua màn
export function showLevelRewardOverlay() {
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
  const mode = gameState.settings.mode || "easy";
  const modeLabels = {
    easy: "Dễ",
    normal: "Trung bình",
    hard: "Khó",
    superHard: "Siêu khó",
    endless: "Vô tận",
    challenge: "Thử thách",
  };
  const minutes = String(Math.floor(gameState.remainingTime / 60)).padStart(
    2,
    "0",
  );
  const seconds = String(gameState.remainingTime % 60).padStart(2, "0");
  const rewardTitle = document.createElement("h2");
  rewardTitle.className = "reward-title glow";
  rewardTitle.textContent = `Màn ${gameState.currentLevel}`;

  const subtitle = document.createElement("p");
  subtitle.className = "reward-subtitle";
  subtitle.textContent = `${modeLabels[mode]} · Chủ đề ${getTheme(getEquippedThemeId(gameState.appearance)).title}`;

  const createRewardLine = (className, icon, value) => {
    const line = document.createElement("div");
    line.className = className;
    line.append(createIcon(icon), document.createTextNode(value));
    return line;
  };

  container.append(rewardTitle, subtitle);
  container.append(
    createRewardLine("reward-points", "trophy", `Mục tiêu: ${gameState.totalPairs} cặp`),
    createRewardLine("reward-time", "timer", `${minutes}:${seconds}`),
    createRewardLine("reward-hints", "search", `Gợi ý: ${gameState.hints}`),
  );

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
    setTimeout(() => overlay.remove(), 400);
  }, GAMEPLAY_TIMING.levelIntroDurationMs);
}

export function showLevelSummaryOverlay(completion) {
  gameState.isPaused = true;
  showSummaryFireworks({
    durationMs: GAMEPLAY_TIMING.victoryFireworksDurationMs,
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
  const minutes = String(Math.floor(remainingTime / 60)).padStart(2, "0");
  const seconds = String(remainingTime % 60).padStart(2, "0");

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
    star.className = `level-summary__star${index === 1 ? " level-summary__star--middle" : ""}`;
    star.textContent = index < stars ? "★" : "☆";
    star.setAttribute("aria-hidden", "true");
    resultStars.appendChild(star);
  }
  const resultScore = document.createElement("strong");
  resultScore.className = "level-summary__score";
  resultScore.textContent = `${Number(score).toLocaleString("en-US")} ĐIỂM`;
  result.append(resultStars, resultScore);

  const stats = document.createElement("div");
  stats.className = "level-summary__stats";
  const summaryStats = [
    ["XU NHẬN", `+${coinsEarned}`, "summary-coins"],
    [
      isEndlessMode(settings.mode) ? "THỜI GIAN ĐÃ CHƠI" : "THỜI GIAN CÒN LẠI",
      `${minutes}:${seconds}`,
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
    statValue.textContent = value;
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
  document.body.appendChild(effect);

  setTimeout(() => effect.remove(), 1400);
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

  document.body.appendChild(effect);

  setTimeout(() => {
    effect.classList.add("fade-out");
    setTimeout(() => {
      effect.remove();
    }, GAMEPLAY_TIMING.comboPopupFadeMs);
  }, GAMEPLAY_TIMING.comboPopupVisibleMs);
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
