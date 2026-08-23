// ui.js
import { gameState } from "./gameState.js";
import { sounds } from "./sound.js"; // ✅ Đã tách âm thanh
import { openAppModal, showAppToast } from "./modal.js";
import { createIcon } from "./icons.js";
import confetti from "canvas-confetti";
import { clearPersistentGameData } from "./persistence.js";

const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const hintElement = document.getElementById("hint");
const timerElement = document.getElementById("timer-value");
const timerContainer = document.getElementById("timer");
const highScoreEl = document.getElementById("high-score-value");
const movesElement = document.getElementById("moves");
const missesElement = document.getElementById("misses");
const matchedPairsElement = document.getElementById("matched-pairs");
const totalPairsElement = document.getElementById("total-pairs");

export function updateCoinDisplay(coins) {
  const coinElement = document.getElementById("coin-balance");
  if (coinElement) coinElement.textContent = `${coins} Xu`;
}

export function updateHighScoreDisplay(score) {
  if (highScoreEl) {
    highScoreEl.textContent = score;
  }
}

export function updateScoreDisplay(score) {
  if (scoreElement) scoreElement.textContent = score;
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

export function updatePairProgressDisplay(
  matchedPairs,
  totalPairs = gameState.totalPairs,
) {
  if (matchedPairsElement) matchedPairsElement.textContent = matchedPairs;
  if (totalPairsElement) totalPairsElement.textContent = totalPairs;
}

export function updateTimerDisplay(seconds) {
  if (!timerElement) return;

  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  timerElement.textContent = `${m}:${s}`;

  // 🔴 Cảnh báo khi còn <= 10s
  if (seconds <= 10) {
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
    "reward-container direct-layout app-modal app-modal--small";
  const mode = gameState.settings.mode || "easy";
  const modeLabels = {
    easy: "Dễ",
    normal: "Trung bình",
    hard: "Khó",
    superHard: "Siêu khó",
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
  subtitle.textContent = modeLabels[mode];

  const createRewardLine = (className, icon, text) => {
    const line = document.createElement("div");
    line.className = className;
    line.append(createIcon(icon), document.createTextNode(text));
    return line;
  };

  container.append(rewardTitle, subtitle);
  container.append(
    createRewardLine("reward-points", "star", `${gameState.score} điểm`),
    createRewardLine("reward-time", "timer", `Thời gian ${minutes}:${seconds}`),
    createRewardLine("reward-hints", "search", `${gameState.hints} lượt gợi ý`),
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
  }, 3000);
}

function launchSummaryConfetti() {
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#6366f1", "#a855f7", "#10b981"],
    disableForReducedMotion: true,
    zIndex: 31000,
  });
}

export function showLevelSummaryOverlay({
  level,
  remainingTime,
  moves,
  misses,
  coinsEarned,
  onNext,
  onMenu,
}) {
  gameState.isPaused = true;
  let actionSelected = false;
  const minutes = String(Math.floor(remainingTime / 60)).padStart(2, "0");
  const seconds = String(remainingTime % 60).padStart(2, "0");

  const content = document.createElement("div");
  content.className = "level-summary";

  const heading = document.createElement("h3");
  heading.className = "level-summary__heading";
  heading.textContent = `Hoàn thành Màn ${level}!`;

  const stats = document.createElement("div");
  stats.className = "level-summary__stats";
  [
    ["THỜI GIAN", `${minutes}:${seconds}`, "summary-time"],
    ["MOVES", moves, "summary-moves"],
    ["MISS", misses, "summary-misses"],
    ["XU NHẬN", `+${coinsEarned}`, "summary-coins"],
  ].forEach(([label, value, className]) => {
    const item = document.createElement("div");
    item.className = `level-summary__stat ${className}`;
    const statLabel = document.createElement("span");
    statLabel.textContent = label;
    const statValue = document.createElement("strong");
    statValue.textContent = value;
    item.append(statLabel, statValue);
    stats.appendChild(item);
  });

  content.append(heading, stats);

  const modal = openAppModal({
    id: "level-summary-modal",
    icon: "trophy",
    title: "Tổng kết",
    content,
    size: "medium",
    closeOnBackdrop: false,
    actions: [
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
  launchSummaryConfetti();
}

export function showResetConfirmationOverlay() {
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
/**
 * 💡 Hiển thị hiệu ứng cộng điểm tại vị trí tile cụ thể (ví dụ ô thứ 2 khi match)
 * @param {HTMLElement} tileElement - Ô tile DOM
 * @param {string|number} text - Nội dung hiển thị (ví dụ: 12 hoặc '+12 points')
 */
export function showTilePointEffect(tileElement, text = "") {
  const effect = document.createElement("div");
  effect.className = "tile-point-effect"; // Giữ base class luôn luôn

  if (typeof text === "number") {
    effect.textContent = `+${text}`;
  } else {
    effect.textContent = text;
  }

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
    }, 500);
  }, 1600);
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

// Hiển thị thời gian đếm ngược khi mua gợi ý
export function showRevealTimerNextToHint(duration = 5) {
  const hintEl = document.getElementById("hint");
  const parentEl = hintEl?.parentElement;
  if (!hintEl || !parentEl) return;

  const old = document.querySelector(".hint-timer-indicator");
  if (old) old.remove();

  const wrapper = document.createElement("span");
  wrapper.className = "hint-timer-indicator";

  // ✅ tách phần icon ⏳ và số giây
  const icon = document.createElement("span");
  icon.className = "hint-timer-icon";
  icon.appendChild(createIcon("hourglass"));

  const text = document.createElement("span");
  text.className = "hint-timer-text";
  const seconds = document.createElement("span");
  seconds.textContent = duration;
  text.append(seconds, document.createTextNode("s"));
  wrapper.append(icon, text);

  parentEl.appendChild(wrapper);

  let remaining = duration;
  const span = seconds;

  const interval = setInterval(() => {
    remaining--;
    span.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(interval);
      wrapper.remove();
    }
  }, 1000);
}
