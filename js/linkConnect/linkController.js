import { createIcon } from "../icons.js";
import { openAppModal, showAppToast } from "../modal.js";
import { syncDefaultMusic } from "../sound.js";
import { getEquippedThemeId } from "../appearance.js";
import { gameState } from "../gameState.js";
import { getTheme } from "../themeCatalog.js";
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
  playLinkMatchExit,
  renderLinkBoard,
  setLinkTileSelected,
} from "./linkRenderer.js";
import { beginLinkRound, linkGameState, resetLinkGame } from "./linkState.js";

// Đồng bộ với CSS: tia hoàn tất trước, sau đó mới bắt đầu hiệu ứng tan thẻ.
const LINK_MATCH_DELAY_MS = 1020;
let countdownInterval;
let selectedPosition = null;
let navigation = {
  showMenu: () => {},
  showGameSelector: () => {},
  showCollection: () => {},
  showShop: () => {},
  showSettings: () => {},
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
  const themeText = document.createElement("div");
  const themeLabel = document.createElement("small");
  themeLabel.textContent = "Chủ đề đang dùng";
  const themeName = document.createElement("strong");
  themeName.textContent = activeTheme.title;
  themeText.append(themeLabel, themeName);
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
    setTimeout(() => navigation.showCollection(), 180);
  });
  [
    ["easy", "Dễ", "status-easy"],
    ["normal", "Trung bình", "status-normal"],
    ["hard", "Khó", "status-hard"],
    ["superHard", "Siêu khó", "status-super-hard"],
    ["endless", "Vô tận", "timer"],
    ["challenge", "Thử thách", "trophy"],
  ].forEach(([mode, label, icon]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "difficulty-option";
    button.append(createIcon(icon), document.createTextNode(label));
    button.addEventListener("click", () => {
      modal.close();
      startLinkLevel({ mode, level: 1 });
    });
    options.append(button);
  });
  content.append(themeRow, options);
}

export function startLinkLevel({ mode = linkGameState.mode, level = 1 } = {}) {
  stopCountdown();
  clearLinkPath();
  selectedPosition = null;
  const modeLayout = getLinkModeLayout(mode);
  const layout = isLinkChallengeMode(mode) ? getLinkChallengeLayout(level) : modeLayout;
  const board = createLinkBoard({
    layout,
    themeId: getEquippedThemeId(gameState.appearance, "link-connect"),
  });
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

function returnToGameSelector() {
  stopCountdown();
  resetLinkGame();
  selectedPosition = null;
  clearLinkPath();
  document.getElementById("link-connect-container")?.setAttribute("hidden", "");
  navigation.showGameSelector();
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
        <button id="link-actions-menu-toggle" class="link-connect-game__menu" type="button" aria-label="Mở menu chức năng" aria-controls="link-actions-menu" aria-expanded="false"></button>
        <div id="link-actions-menu" class="link-connect-game__actions game-actions-menu" hidden>
          <button class="game-action-item" type="button" data-action="menu">Menu</button>
          <button class="game-action-item" type="button" data-action="restart">Chơi lại</button>
          <button class="game-action-item" type="button" data-action="settings">Cài đặt</button>
          <button class="game-action-item" type="button" data-action="collection">Bộ sưu tập</button>
          <button class="game-action-item" type="button" data-action="shop">Cửa hàng</button>
          <button class="game-action-item" type="button" data-action="help">Hướng dẫn</button>
          <button class="game-action-item" type="button" data-action="info">Thông tin</button>
        </div>
        <div><strong>Link Connect</strong><span id="link-level-label">Cấp 1</span></div>
        <button id="link-game-exit" class="link-connect-game__menu" type="button" aria-label="Đổi trò chơi"></button>
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
    configureLinkGameActions(container);
  }
  document.getElementById("menu-container")?.remove();
  document.getElementById("game-container")?.style.setProperty("display", "none");
  container.removeAttribute("hidden");
}

function configureLinkGameActions(container) {
  const toggle = container.querySelector("#link-actions-menu-toggle");
  const actions = container.querySelector("#link-actions-menu");
  const exit = container.querySelector("#link-game-exit");
  toggle?.append(createIcon("menu"));
  exit?.append(createIcon("exit"));
  const actionIcons = {
    menu: "home",
    restart: "restart",
    settings: "settings",
    collection: "collection",
    shop: "shop",
    help: "book",
    info: "info",
  };
  actions?.querySelectorAll("button[data-action]").forEach((button) => {
    button.prepend(createIcon(actionIcons[button.dataset.action]));
  });
  toggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    const nextHidden = !actions.hidden;
    actions.hidden = nextHidden;
    toggle.setAttribute("aria-expanded", String(!nextHidden));
  });
  actions?.addEventListener("click", (event) => {
    const action = event.target.closest("button")?.dataset.action;
    if (!action) return;
    actions.hidden = true;
    toggle?.setAttribute("aria-expanded", "false");
    runLinkGameAction(action);
  });
  exit?.addEventListener("click", showLinkGameExitConfirmation);
  document.addEventListener("click", (event) => {
    if (!actions?.hidden && !event.target.closest(".link-connect-game__header")) {
      actions.hidden = true;
      toggle?.setAttribute("aria-expanded", "false");
    }
  });
}

function runLinkGameAction(action) {
  if (action === "menu") return returnToLinkMenu();
  if (action === "restart") return showLinkDifficultyOverlay();
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
    return navigation.showShop(resumeLinkAfterModal);
  }
  if (action === "help") {
    return showLinkGameModal("Cách chơi Link Connect", "<p>Quan sát các hình đang mở và nối hai hình giống nhau bằng đường đi không có vật cản.</p><p>Đường nối có tối đa hai lần rẽ.</p>", "book");
  }
  if (action === "info") {
    return showLinkGameModal("Giới thiệu", "<p><strong>Link Connect</strong> là trò chơi nối cặp hình giúp rèn luyện khả năng quan sát.</p>", "info");
  }
}

function showLinkGameModal(title, content, icon) {
  pauseLinkForModal();
  openAppModal({ id: "link-game-info-modal", title, content, icon, onClose: resumeLinkAfterModal });
}

function pauseLinkForModal() {
  linkGameState.isPaused = true;
}

function resumeLinkAfterModal() {
  linkGameState.isPaused = false;
}

function showLinkGameExitConfirmation() {
  pauseLinkForModal();
  openAppModal({
    id: "link-game-exit-modal",
    icon: "exit",
    title: "Đổi trò chơi",
    content: "<p>Ván hiện tại sẽ kết thúc và không được lưu.</p>",
    actions: [
      { label: "Đổi trò chơi", variant: "primary", onClick: returnToGameSelector },
    ],
    onClose: resumeLinkAfterModal,
  });
}

function handleLinkTileClick(position) {
  if (linkGameState.isLocked || linkGameState.isPaused) return;
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
  playLinkMatchExit(selectedPosition, position);
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
    if (linkGameState.roundId !== roundId || linkGameState.isLocked || linkGameState.isPaused) return;
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
