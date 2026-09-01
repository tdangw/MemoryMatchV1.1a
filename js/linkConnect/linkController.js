import { openAppModal, showAppToast } from "../modal.js";
import { syncDefaultMusic } from "../sound.js";
import {
  calculateLinkMatchPoints,
  getLinkChallengeLayout,
  getLinkLevelTimeBonus,
  getLinkModeLayout,
  getLinkTimerDirection,
  isLinkChallengeMode,
  isLinkEndlessMode,
} from "./linkConfig.js";
import {
  createLinkBoard,
  ensurePlayableBoard,
  getLinkBoardTile,
  removeLinkBoardPair,
} from "./linkBoard.js";
import { findConnectionPath } from "./pathfinder.js";
import {
  clearLinkPath,
  clearLinkTileSelection,
  drawLinkPath,
  renderLinkBoard,
  setLinkTileSelected,
} from "./linkRenderer.js";
import { beginLinkRound, linkGameState, resetLinkGame } from "./linkState.js";

const LINK_MATCH_DELAY_MS = 420;
let countdownInterval;
let selectedPosition = null;
let navigation = { showMenu: () => {} };

export function configureLinkController({ showMenu } = {}) {
  navigation = { ...navigation, showMenu };
}

export function showLinkDifficultyOverlay() {
  const options = document.createElement("div");
  options.className = "difficulty-options";
  const modal = openAppModal({
    id: "link-difficulty-modal",
    icon: "puzzle",
    title: "Chọn chế độ Link Connect",
    content: options,
  });
  [
    ["easy", "Dễ"],
    ["normal", "Trung bình"],
    ["hard", "Khó"],
    ["superHard", "Siêu khó"],
    ["endless", "Vô tận"],
    ["challenge", "Thử thách"],
  ].forEach(([mode, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "difficulty-option";
    button.textContent = label;
    button.addEventListener("click", () => {
      modal.close();
      startLinkLevel({ mode, level: 1 });
    });
    options.append(button);
  });
}

export function startLinkLevel({ mode = linkGameState.mode, level = 1 } = {}) {
  stopCountdown();
  clearLinkPath();
  selectedPosition = null;
  const modeLayout = getLinkModeLayout(mode);
  const layout = isLinkChallengeMode(mode) ? getLinkChallengeLayout(level) : modeLayout;
  const board = createLinkBoard({ layout });
  const roundId = beginLinkRound({ mode, level, layout, board });
  if (isLinkEndlessMode(mode)) linkGameState.remainingTime = 0;
  else if (isLinkChallengeMode(mode) && level > 1) {
    linkGameState.remainingTime = 60 + (level - 1) * 10;
  } else {
    linkGameState.remainingTime = modeLayout.timeSeconds + getLinkLevelTimeBonus(level);
  }
  showLinkGame();
  renderLinkBoard(board, { onTileClick: handleLinkTileClick });
  updateLinkHud();
  linkGameState.isLocked = false;
  startCountdown(roundId);
}

export function returnToLinkMenu() {
  stopCountdown();
  resetLinkGame();
  selectedPosition = null;
  clearLinkPath();
  document.getElementById("link-connect-container")?.setAttribute("hidden", "");
  navigation.showMenu();
  syncDefaultMusic();
}

function showLinkGame() {
  let container = document.getElementById("link-connect-container");
  if (!container) {
    container = document.createElement("section");
    container.id = "link-connect-container";
    container.className = "link-connect-game";
    container.innerHTML = `
      <header class="link-connect-game__header">
        <button id="link-menu-button" class="link-connect-game__menu" type="button">Menu</button>
        <div><strong>Link Connect</strong><span id="link-level-label">Cấp 1</span></div>
        <button id="link-restart-button" class="link-connect-game__menu" type="button">Chơi lại</button>
      </header>
      <div class="link-connect-game__stats" aria-label="Tiến trình màn chơi">
        <span>Nước <strong id="link-moves">0</strong></span>
        <span>Sai <strong id="link-misses">0</strong></span>
        <span>Combo <strong id="link-combo">0</strong></span>
        <span>Điểm <strong id="link-score">0</strong></span>
      </div>
      <div id="link-board-frame" class="link-board-frame">
        <div id="link-board" class="link-board" aria-label="Bàn Link Connect"></div>
        <svg id="link-path-overlay" class="link-path-overlay" aria-hidden="true"></svg>
      </div>
      <footer class="link-connect-game__footer">
        <span id="link-pair-progress">0/0 cặp</span>
        <strong id="link-timer">00:00</strong>
      </footer>`;
    document.querySelector(".main-wrapper")?.append(container);
    document.getElementById("link-menu-button")?.addEventListener("click", returnToLinkMenu);
    document.getElementById("link-restart-button")?.addEventListener("click", showLinkDifficultyOverlay);
  }
  document.getElementById("menu-container")?.remove();
  document.getElementById("game-container")?.style.setProperty("display", "none");
  container.removeAttribute("hidden");
}

function handleLinkTileClick(position) {
  if (linkGameState.isLocked) return;
  const tile = getLinkBoardTile(linkGameState.board, position);
  if (!tile) return;
  if (!selectedPosition) {
    selectedPosition = position;
    setLinkTileSelected(position, true);
    return;
  }
  if (samePosition(selectedPosition, position)) return;
  linkGameState.moves += 1;
  const firstTile = getLinkBoardTile(linkGameState.board, selectedPosition);
  const path = firstTile?.id === tile.id
    ? findConnectionPath(linkGameState.board.grid, selectedPosition, position)
    : null;
  if (!path) {
    linkGameState.misses += 1;
    linkGameState.combo = 0;
    clearLinkTileSelection();
    selectedPosition = null;
    updateLinkHud();
    return;
  }

  linkGameState.isLocked = true;
  linkGameState.combo += 1;
  linkGameState.score += calculateLinkMatchPoints(linkGameState.combo);
  drawLinkPath(path, linkGameState.board);
  setTimeout(() => {
    removeLinkBoardPair(linkGameState.board, selectedPosition, position);
    linkGameState.matchedPairs += 1;
    selectedPosition = null;
    clearLinkPath();
    renderLinkBoard(linkGameState.board, { onTileClick: handleLinkTileClick });
    updateLinkHud();
    if (linkGameState.matchedPairs >= linkGameState.totalPairs) {
      completeLinkLevel();
      return;
    }
    if (ensurePlayableBoard(linkGameState.board)) {
      renderLinkBoard(linkGameState.board, { onTileClick: handleLinkTileClick });
      showAppToast("Không còn đường nối. Bàn đã được xáo lại.");
    }
    linkGameState.isLocked = false;
  }, LINK_MATCH_DELAY_MS);
}

function completeLinkLevel() {
  stopCountdown();
  linkGameState.isLocked = true;
  openAppModal({
    id: "link-level-summary-modal",
    icon: "trophy",
    title: "Hoàn thành màn",
    content: `<p>Điểm: <strong>${linkGameState.score}</strong></p><p>Số lượt: <strong>${linkGameState.moves}</strong></p>`,
    actions: [
      { label: "Menu", icon: "home", onClick: () => returnToLinkMenu() },
      { label: "Màn tiếp", icon: "arrow-right", variant: "primary", onClick: () => startLinkLevel({ mode: linkGameState.mode, level: linkGameState.level + 1 }) },
    ],
  });
}

function startCountdown(roundId) {
  stopCountdown();
  countdownInterval = setInterval(() => {
    if (linkGameState.roundId !== roundId || linkGameState.isLocked) return;
    linkGameState.remainingTime += getLinkTimerDirection(linkGameState.mode) === "up" ? 1 : -1;
    updateLinkHud();
    if (linkGameState.remainingTime <= 0 && !isLinkEndlessMode(linkGameState.mode)) {
      handleLinkTimeUp();
    }
  }, 1000);
}

function handleLinkTimeUp() {
  stopCountdown();
  linkGameState.isLocked = true;
  openAppModal({
    id: "link-time-up-modal",
    icon: "timer",
    title: "Hết giờ",
    content: "<p>Hãy quan sát đường nối nhanh hơn ở lượt tiếp theo.</p>",
    actions: [
      { label: "Menu", icon: "home", onClick: () => returnToLinkMenu() },
      { label: "Chơi lại", icon: "restart", variant: "primary", onClick: () => startLinkLevel({ mode: linkGameState.mode, level: 1 }) },
    ],
  });
}

function updateLinkHud() {
  setText("link-level-label", `Cấp ${linkGameState.level}`);
  setText("link-moves", linkGameState.moves);
  setText("link-misses", linkGameState.misses);
  setText("link-combo", linkGameState.combo);
  setText("link-score", linkGameState.score);
  setText("link-pair-progress", `${linkGameState.matchedPairs}/${linkGameState.totalPairs} cặp`);
  setText("link-timer", formatTime(linkGameState.remainingTime));
}

function stopCountdown() {
  clearInterval(countdownInterval);
  countdownInterval = undefined;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = String(value);
}

function formatTime(seconds) {
  const value = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function samePosition(left, right) {
  return left.row === right.row && left.column === right.column;
}
