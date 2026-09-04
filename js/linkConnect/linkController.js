import { createIcon } from "../icons.js";
import { openAppModal, showAppToast } from "../modal.js";
import { pauseBackgroundMusic, sounds, syncDefaultMusic } from "../sound.js";
import { getEquippedThemeId } from "../appearance.js";
import { GAMEPLAY_TIMING } from "../gameplayTuning.js";
import { gameState, increaseCoins, recordLinkConnectResult, spendCoins } from "../gameState.js";
import { saveCoins, saveProgress } from "../persistence.js";
import { getTheme } from "../themeCatalog.js";
import { GAME_MODES } from "../gameCatalog.js";
import { TIME_UP_PURCHASES } from "../shopCatalog.js";
import {
  createThemeSummary,
  formatClockTime,
  UI_TIMING,
} from "../uiCatalog.js";
import {
  calculateLinkMatchPoints,
  calculateLinkCoinReward,
  getLinkChallengeTime,
  getLinkChallengeLayout,
  LINK_CONNECT_CONFIG,
  getLinkLevelHintBonus,
  getLinkLevelTimeBonus,
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
  getLinkBoardTile,
  removeLinkBoardPair,
  removeRandomLinkPair,
  shuffleLinkBoard,
  makeRandomLinkPairSpecial,
  unlockAllFrozenLinkPairs,
  unlockFrozenLinkPairs,
} from "./linkBoard.js";
import { findAvailableConnections, findConnectionPath } from "./pathfinder.js";
import { consumeLinkItem, getLinkItemCount, grantLinkItem, LINK_ITEMS } from "./linkItems.js";
import { clearActiveSession, getActiveSession, saveActiveSession } from "../sessionProgress.js";
import {
  clearGameplayRewardPopups,
  openTimeUpModal,
  showComboEffect,
  showGameplayRewardPopup,
  showLevelRewardOverlay,
  showLevelSummaryOverlay,
  showScoreEffect,
} from "../ui.js";
import {
  clearLinkPath,
  clearLinkThunderStrikes,
  clearLinkMatchedPair,
  clearLinkTileSelection,
  clearLinkTileHints,
  drawLinkPath,
  playLinkMatchExit,
  playLinkMismatch,
  playLinkThunderStrike,
  renderLinkBoard,
  renderLinkBoardShift,
  setLinkTileSelected,
  setLinkTileHinted,
} from "./linkRenderer.js";
import { beginLinkRound, linkGameState, resetLinkGame } from "./linkState.js";

let countdownInterval;
let selectedPosition = null;
let linkTimeWarningPlayed = false;
let linkHudElements = null;
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

export function startLinkLevel({ mode = linkGameState.mode, level = 1, resume = false, gravityShift } = {}) {
  stopCountdown();
  clearGameplayRewardPopups();
  clearLinkPath();
  clearLinkTileHints();
  clearLinkThunderStrikes();
  selectedPosition = null;
  linkTimeWarningPlayed = false;
  const modeLayout = getLinkModeLayout(mode);
  const layout = isLinkChallengeMode(mode) ? getLinkChallengeLayout(level) : modeLayout;
  const board = createLinkBoard({
    layout,
    themeId: getEquippedThemeId(gameState.appearance, "link-connect"),
    level,
    mode,
  });
  if (level === 1 && !resume) {
    linkGameState.specialProgress = 0;
    clearActiveSession("link-connect", mode);
  }
  const resolvedGravityShift = gravityShift || getLinkGravityShift(level);
  saveActiveSession("link-connect", { mode, level, gravityShift: resolvedGravityShift });
  const roundId = beginLinkRound({ mode, level, layout, board, gravityShift: resolvedGravityShift });
  if (isLinkEndlessMode(mode)) linkGameState.remainingTime = 0;
  else if (isLinkChallengeMode(mode)) linkGameState.remainingTime = getLinkChallengeTime(level);
  else {
    linkGameState.remainingTime = modeLayout.timeSeconds + getLinkLevelTimeBonus(level);
  }
  if (!resume) {
    const hintBonus = getLinkLevelHintBonus(level, getLinkItemCount("hint"));
    if (hintBonus > 0) grantLinkItem("hint", hintBonus);
  }
  showLinkGame();
  renderLinkBoard(board, { onTileClick: handleLinkTileClick });
  updateLinkHud();
  linkGameState.isLocked = true;
  showLevelRewardOverlay({
    level,
    mode,
    themeId: getEquippedThemeId(gameState.appearance, "link-connect"),
    totalPairs: linkGameState.totalPairs,
    remainingTime: linkGameState.remainingTime,
    assistText: `Gợi ý: ${getLinkItemCount("hint")}`,
    onComplete: () => {
      if (linkGameState.roundId !== roundId) return;
      const startRound = () => {
        if (linkGameState.roundId !== roundId) return;
        linkGameState.isLocked = false;
        startCountdown(roundId);
      };
      if (resolvedGravityShift === "static") startRound();
      else showLinkGravityRuleModal(resolvedGravityShift, startRound);
    },
  });
}

export function continueLinkSession(session) {
  if (!session) return;
  startLinkLevel({ ...session, resume: true });
}

export function returnToLinkMenu() {
  stopCountdown();
  clearGameplayRewardPopups();
  resetLinkGame();
  selectedPosition = null;
  clearLinkPath();
  clearLinkTileHints();
  clearLinkThunderStrikes();
  document.getElementById("link-connect-container")?.setAttribute("hidden", "");
  navigation.showMenu();
  syncDefaultMusic(gameState.settings);
}

function showLinkGame() {
  let container = document.getElementById("link-connect-container");
  if (!container) {
    container = document.createElement("section");
    container.id = "link-connect-container";
    container.className = "link-connect-game";
    container.innerHTML = `
      <div id="link-game-logo" class="link-game-name game-name">Link Connect</div>
      <div class="link-game-progress-hud game-progress-hud" aria-label="Tiến trình màn chơi">
        <span class="info stat-card stat-moves"><span class="stat-label">MOVES</span><span id="link-moves">0</span></span>
        <span class="info stat-card stat-misses"><span class="stat-label">MISS</span><span id="link-misses">0</span></span>
        <span class="info stat-card stat-combo"><span class="stat-label">COMBO</span><span id="link-combo">0</span></span>
        <span class="info stat-card stat-star-progress" aria-label="Tiến trình sao màn hiện tại">
          <span id="link-level-stars" class="star-progress__stars" role="img" aria-label="0 trên 3 sao">
            <span class="star-progress__milestone" aria-hidden="true">★</span>
            <span class="star-progress__milestone" aria-hidden="true">★</span>
            <span class="star-progress__milestone" aria-hidden="true">★</span>
          </span>
          <span class="star-progress__track"><span id="link-level-stars-fill" class="star-progress__fill"></span></span>
        </span>
        <span class="info stat-card stat-points"><span class="stat-label">ĐIỂM</span><span id="link-score">0</span></span>
        <span class="info stat-card stat-progress" id="link-pair-progress"><span data-link-icon="trophy"></span><span id="link-matched-pairs">0</span>/<span id="link-total-pairs">0</span></span>
        <span class="info stat-card stat-hints" aria-label="Lượt gợi ý còn lại"><span data-link-icon="search"></span><span id="link-hint">0</span></span>
      </div>
      <header id="link-game-title" class="link-game-hud game-hud">
        <button id="link-actions-menu-toggle" class="link-connect-game__menu game-menu-toggle" type="button" aria-label="Mở menu chức năng" aria-controls="link-actions-menu" aria-expanded="false"></button>
        <div id="link-actions-menu" class="link-connect-game__actions game-actions-menu" hidden>
          <button class="game-action-item" type="button" data-action="restart">Chơi lại</button>
          <button class="game-action-item" type="button" data-action="menu">Menu</button>
          <button class="game-action-item" type="button" data-action="settings">Cài đặt</button>
          <button class="game-action-item" type="button" data-action="shop">Cửa hàng</button>
          <button class="game-action-item" type="button" data-action="collection">Bộ sưu tập</button>
          <button class="game-action-item" type="button" data-action="help">Hướng dẫn</button>
          <button class="game-action-item" type="button" data-action="info">Thông tin</button>
          <button class="game-action-item" type="button" data-action="reset">Xóa dữ liệu</button>
        </div>
        <div class="game-stats" aria-label="Thông tin màn chơi">
          <span class="info stat-card stat-level"><span class="stat-label">LV</span><span id="link-level-label">1</span></span>
          <span class="info stat-card stat-timer"><span data-link-icon="timer"></span><span id="link-timer">00:00</span></span>
          <span class="info stat-card stat-score"><span data-link-icon="star"></span><span id="link-total-stars">0</span></span>
        </div>
        <button id="link-tools-toggle" class="link-tools-toggle" type="button" aria-label="Mở công cụ hỗ trợ" aria-controls="link-tools-menu" aria-expanded="false"></button>
        <div id="link-tools-menu" class="link-tools-menu" hidden>
          <aside id="link-item-actions" class="link-tool-list" aria-label="Vật phẩm hỗ trợ"></aside>
        </div>
      </header>
      <section class="link-special-hud" aria-label="Tiến trình cặp đặc biệt">
        <div class="link-special-hud__milestones" aria-label="Các mốc kích hoạt đặc biệt">
          <span data-link-special-milestone="1">1</span><span data-link-special-milestone="3">3</span><span data-link-special-milestone="5">5</span><span data-link-special-milestone="7">7</span><span data-link-special-milestone="9">9</span><span data-link-special-milestone="10">10</span>
        </div>
      </section>
      <div id="link-board-frame" class="link-board-frame">
        <div id="link-board" class="link-board" aria-label="Bàn Link Connect"></div>
        <svg id="link-path-overlay" class="link-path-overlay" aria-hidden="true"></svg>
      </div>`;
    applyLinkTimingStyles(container);
    document.querySelector(".main-wrapper")?.append(container);
    configureLinkGameActions(container);
    configureLinkItemActions(container);
    linkHudElements = null;
  }
  document.getElementById("menu-container")?.remove();
  document.getElementById("game-container")?.style.setProperty("display", "none");
  container.removeAttribute("hidden");
}

function configureLinkItemActions(container) {
  const actions = container.querySelector("#link-item-actions");
  LINK_ITEMS.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "link-connect-game__item";
    button.dataset.item = item.id;
    button.setAttribute("aria-label", item.title);
    button.append(createIcon(item.icon));
    const label = document.createElement("span");
    label.textContent = item.id === "hint" ? "Gợi ý" : item.title;
    const count = document.createElement("strong");
    count.dataset.itemCount = item.id;
    button.append(label, count);
    button.addEventListener("click", () => useLinkItem(item.id));
    actions?.append(button);
  });
}

function configureLinkGameActions(container) {
  const toggle = container.querySelector("#link-actions-menu-toggle");
  const actions = container.querySelector("#link-actions-menu");
  const toolsToggle = container.querySelector("#link-tools-toggle");
  const toolsMenu = container.querySelector("#link-tools-menu");
  container.querySelectorAll("[data-link-icon]").forEach((element) => {
    element.append(createIcon(element.dataset.linkIcon));
  });
  toggle?.append(createIcon("menu"));
  toolsToggle?.append(createIcon("wand"));
  const actionIcons = {
    restart: "restart",
    menu: "home",
    settings: "settings",
    collection: "collection",
    shop: "shop",
    help: "book",
    info: "info",
    reset: "wand",
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
  toolsToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    const nextHidden = !toolsMenu.hidden;
    toolsMenu.hidden = nextHidden;
    toolsToggle.setAttribute("aria-expanded", String(!nextHidden));
  });
  actions?.addEventListener("click", (event) => {
    const action = event.target.closest("button")?.dataset.action;
    if (!action) return;
    actions.hidden = true;
    toggle?.setAttribute("aria-expanded", "false");
    runLinkGameAction(action);
  });
  document.addEventListener("click", (event) => {
    if (!actions?.hidden && !event.target.closest("#link-game-title")) {
      actions.hidden = true;
      toggle?.setAttribute("aria-expanded", "false");
    }
    if (!toolsMenu?.hidden && !event.target.closest("#link-game-title")) {
      toolsMenu.hidden = true;
      toolsToggle?.setAttribute("aria-expanded", "false");
    }
  });
}

function runLinkGameAction(action) {
  if (action === "menu") return returnToLinkMenu();
  if (action === "restart") {
    return startLinkLevel({ mode: linkGameState.mode, level: linkGameState.level, resume: true });
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
    return showLinkGameModal("Cách chơi Link Connect", "<p>Quan sát các hình đang mở và nối hai hình giống nhau bằng đường đi không có vật cản.</p><p>Đường nối có tối đa hai lần rẽ.</p>", "book");
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

function pauseLinkForModal() {
  linkGameState.isPaused = true;
}

function resumeLinkAfterModal() {
  linkGameState.isPaused = false;
}

function resumeLinkAfterShop() {
  resumeLinkAfterModal();
  updateLinkHud();
}

function handleLinkTileClick(position) {
  if (linkGameState.isLocked || linkGameState.isPaused) return;
  const tile = getLinkBoardTile(linkGameState.board, position);
  if (!tile || tile.frozen) return;
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
    const roundId = linkGameState.roundId;
    const board = linkGameState.board;
    playLinkSound("wrong");
    linkGameState.misses += 1;
    linkGameState.combo = 0;
    linkGameState.isLocked = true;
    const wrongTiles = playLinkMismatch(selectedPosition, position);
    updateLinkHud();
    setTimeout(() => {
      if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
      wrongTiles.forEach((tileElement) => tileElement.classList.remove("is-wrong"));
      clearLinkTileSelection();
      selectedPosition = null;
      linkGameState.isLocked = false;
    }, LINK_CONNECT_TIMING.mismatchFeedbackMs);
    return;
  }

  linkGameState.isLocked = true;
  playLinkSound("match");
  linkGameState.combo += 1;
  const isSpecialMatch = firstTile.special && tile.special;
  const roundId = linkGameState.roundId;
  const board = linkGameState.board;
  const matchedStart = selectedPosition;
  const matchPoints = calculateLinkMatchPoints(linkGameState.combo, {
    special: isSpecialMatch,
  });
  linkGameState.score += matchPoints;
  drawLinkPath(path, linkGameState.board);
  const matchedTiles = playLinkMatchExit(selectedPosition, position);
  showScoreEffect(matchedTiles[0], matchPoints);
  showComboEffect(matchedTiles[1] || matchedTiles[0], linkGameState.combo);
  setTimeout(() => {
    // Người chơi có thể khởi động màn khác trước khi hiệu ứng kết thúc.
    // Khi đó callback cũ không được phép thay đổi trạng thái của bàn mới.
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    removeLinkBoardPair(board, matchedStart, position);
    linkGameState.matchedPairs += 1;
    const specialBoardChanged = isSpecialMatch && applySpecialMatchRewards();
    if (firstTile.luckyReward) applyLinkLuckyReward(firstTile.luckyReward);
    const boardShifted = applyLinkGravityShift(board, linkGameState.gravityShift);
    selectedPosition = null;
    clearLinkPath();
    if (boardShifted) renderLinkBoardShift(linkGameState.board, { onTileClick: handleLinkTileClick });
    else if (specialBoardChanged) renderLinkBoard(linkGameState.board, { onTileClick: handleLinkTileClick });
    else clearLinkMatchedPair(matchedStart, position);
    updateLinkHud();
    if (linkGameState.matchedPairs >= linkGameState.totalPairs) {
      completeLinkLevel();
      return;
    }
    if (ensurePlayableBoard(linkGameState.board)) {
      renderLinkBoardShift(linkGameState.board, { onTileClick: handleLinkTileClick });
      showAppToast("Không còn đường nối. Bàn đã được xáo lại.");
    }
    linkGameState.isLocked = false;
  }, getLinkMatchResolveDelay());
}

function useLinkItem(id) {
  if (linkGameState.isLocked || linkGameState.isPaused) return;
  if (id === "freeze" && isLinkEndlessMode(linkGameState.mode)) {
    showAppToast("Chế độ Vô tận không dùng đóng băng thời gian.");
    return;
  }
  if (!consumeLinkItem(id)) {
    showAppToast("Bạn chưa có vật phẩm này.");
    return;
  }
  closeLinkToolsMenu();
  playLinkSound("overlay");
  if (id === "hint") useLinkHint();
  else if (id === "reshuffle") useLinkReshuffle();
  else if (id === "thunder") useLinkThunder();
  else if (id === "freeze") useLinkFreeze();
  updateLinkHud();
}

function closeLinkToolsMenu() {
  const menu = document.getElementById("link-tools-menu");
  const toggle = document.getElementById("link-tools-toggle");
  if (menu) menu.hidden = true;
  toggle?.setAttribute("aria-expanded", "false");
}

function useLinkHint() {
  const connection = findAvailableConnections(linkGameState.board.grid)[0];
  if (!connection) {
    showAppToast("Không có đường nối khả dụng để gợi ý.");
    grantLinkItem("hint");
    return;
  }
  linkGameState.isLocked = true;
  const roundId = linkGameState.roundId;
  const board = linkGameState.board;
  setLinkTileHinted(connection.start, true);
  setLinkTileHinted(connection.end, true);
  drawLinkPath(connection.path, linkGameState.board);
  showAppToast("Đây là một đường nối khả dụng.");
  setTimeout(() => {
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    clearLinkPath();
    clearLinkTileHints();
    linkGameState.isLocked = false;
  }, LINK_CONNECT_TIMING.hintPreviewMs);
}

function useLinkReshuffle() {
  shuffleLinkBoard(linkGameState.board);
  renderLinkBoardShift(linkGameState.board, { onTileClick: handleLinkTileClick });
  showAppToast("Đã xáo lại các thẻ còn lại.");
}

function useLinkThunder() {
  const pairCount = randomInteger(1, 3);
  const removedPairs = [];
  for (let index = 0; index < pairCount; index += 1) {
    const pair = removeRandomLinkPair(linkGameState.board);
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
  setTimeout(() => {
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    playLinkMatchExit(start, end);
  }, LINK_CONNECT_TIMING.thunderCardExitDelayMs);
  setTimeout(() => {
    strike?.remove();
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
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
    finishLinkThunder(board, roundId);
  }, getLinkThunderResolveDelay());
}

function getThunderColor(pairCount) {
  return pairCount === 1 ? "yellow" : pairCount === 2 ? "blue" : "red";
}

function finishLinkThunder(board, roundId) {
  if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
  if (linkGameState.matchedPairs >= linkGameState.totalPairs) {
    completeLinkLevel();
    return;
  }
  const boardShifted = applyLinkGravityShift(board, linkGameState.gravityShift);
  if (boardShifted) renderLinkBoardShift(board, { onTileClick: handleLinkTileClick });
  if (ensurePlayableBoard(board)) {
    renderLinkBoardShift(board, { onTileClick: handleLinkTileClick });
    showAppToast("Không còn đường nối. Bàn đã được xáo lại.");
  }
  linkGameState.isLocked = false;
}

function getGravityShiftLabel(direction) {
  return {
    down: "Dồn xuống",
    up: "Dồn lên",
    left: "Dồn sang trái",
    right: "Dồn sang phải",
  }[direction] || "Bàn cờ tĩnh";
}

function showLinkGravityRuleModal(direction, onComplete) {
  const content = document.createElement("p");
  content.className = "link-gravity-rule__copy";
  const directionText = {
    down: "dồn xuống dưới",
    up: "dồn lên trên",
    left: "dồn sang bên trái",
    right: "dồn sang bên phải",
  }[direction] || "giữ nguyên vị trí";
  content.textContent = `Sau mỗi cặp ghép, các thẻ còn lại sẽ ${directionText}.`;
  openAppModal({
    id: "link-gravity-rule-modal",
    icon: "restart",
    title: "Quy tắc màn chơi",
    content,
    dismissible: false,
    closeOnBackdrop: false,
    actions: [{ label: "Đã hiểu", icon: "play", variant: "primary" }],
    onClose: onComplete,
  });
}


function useLinkFreeze() {
  linkGameState.freezeSeconds += 10;
  showAppToast("Đồng hồ đã đóng băng trong 10 giây.");
}

function completeLinkLevel() {
  stopCountdown();
  linkGameState.isLocked = true;
  pauseBackgroundMusic();
  playLinkSound("victory");
  const coinsEarned = calculateLinkCoinReward(linkGameState.mode, linkGameState.remainingTime);
  const stars = calculateLinkStars();
  recordLinkConnectResult({
    mode: linkGameState.mode,
    level: linkGameState.level,
    score: linkGameState.score,
    stars,
  });
  saveProgress(gameState.progress);
  updateLinkStarsHud();
  increaseCoins(coinsEarned);
  saveCoins(gameState.coins);
  showLevelSummaryOverlay({
    fireworksContainerId: "link-connect-container",
    level: linkGameState.level,
    remainingTime: linkGameState.remainingTime,
    moves: linkGameState.moves,
    misses: linkGameState.misses,
    coinsEarned,
    score: linkGameState.score,
    stars,
    timeBonus: 0,
    luckyAwards: linkGameState.luckyAwards,
    settings: { mode: linkGameState.mode },
    onMenu: returnToLinkMenu,
    onNext: () => startLinkLevel({ mode: linkGameState.mode, level: linkGameState.level + 1 }),
  });
}

function applyLinkLuckyReward(reward) {
  playLinkSound("bonus");
  linkGameState.luckyAwards.push(reward);
  if (reward.type === "coins") {
    increaseCoins(reward.value);
    saveCoins(gameState.coins);
    showGameplayRewardPopup({ title: "Ô may mắn!", type: "coins", value: reward.value, sound: false });
    return;
  }
  linkGameState.remainingTime += reward.value;
  showGameplayRewardPopup({ title: "Ô may mắn!", type: "time", value: reward.value, sound: false });
}

function playLinkSound(name) {
  const sound = sounds[name];
  if (!gameState.settings?.sound || !sound) return;
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function calculateLinkStars() {
  const pairCount = Math.max(1, linkGameState.totalPairs);
  const targets = isLinkEndlessMode(linkGameState.mode) ? [10, 15, 20] : [12, 18, 25];
  const score = linkGameState.score;
  return score >= pairCount * targets[2] ? 3
    : score >= pairCount * targets[1] ? 2
      : score >= pairCount * targets[0] ? 1 : 0;
}

function startCountdown(roundId) {
  stopCountdown();
  syncDefaultMusic(gameState.settings);
  countdownInterval = setInterval(() => {
    if (linkGameState.roundId !== roundId || linkGameState.isLocked || linkGameState.isPaused) return;
    if (linkGameState.freezeSeconds > 0) {
      linkGameState.freezeSeconds -= 1;
      return;
    }
    linkGameState.remainingTime += getLinkTimerDirection(linkGameState.mode) === "up" ? 1 : -1;
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
  const returnToMenu = () => returnToLinkMenu();
  const buyMoreTime = (seconds, price, close) => {
    if (!spendCoins(price)) {
      showAppToast("Bạn không đủ Xu để mua thêm thời gian.");
      playLinkSound("overlay");
      return true;
    }
    actionSelected = true;
    saveCoins(gameState.coins);
    linkGameState.remainingTime = seconds;
    linkTimeWarningPlayed = false;
    linkGameState.isLocked = false;
    updateLinkTimerHud();
    close();
    showAppToast(`Đã mua +${seconds}s với ${price} Xu.`);
    playLinkSound("bonus");
    syncDefaultMusic(gameState.settings);
    setTimeout(() => startCountdown(linkGameState.roundId), LINK_CONNECT_TIMING.countdownResumeDelayMs);
    return true;
  };
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
          startLinkLevel({ mode: linkGameState.mode, level: linkGameState.level, resume: true });
        },
      },
      ...TIME_UP_PURCHASES.map(({ seconds, price }) => ({
        label: `+${seconds} giây · ${price} Xu`,
        icon: "coin",
        variant: "time-purchase",
        onClick: (close) => buyMoreTime(seconds, price, close),
      })),
    ],
    onClose: () => {
      if (!actionSelected) returnToMenu();
    },
  });
}

function updateLinkHud() {
  const hud = getLinkHudElements();
  setHudText(hud.level, linkGameState.level);
  setHudText(hud.moves, linkGameState.moves);
  setHudText(hud.misses, linkGameState.misses);
  setHudText(hud.combo, linkGameState.combo);
  setHudText(hud.score, linkGameState.score);
  setHudText(hud.matchedPairs, linkGameState.matchedPairs);
  setHudText(hud.totalPairs, linkGameState.totalPairs);
  setHudText(hud.hint, getLinkItemCount("hint"));
  updateLinkTimerHud(hud);
  updateLinkStarsHud(hud);
  updateLinkSpecialMilestones(hud);
  hud.itemCounts.forEach((element) => {
    setHudText(element, getLinkItemCount(element.dataset.itemCount));
  });
  hud.freezeButton?.classList.toggle("is-disabled", isLinkEndlessMode(linkGameState.mode));
  hud.freezeButton?.setAttribute("aria-disabled", String(isLinkEndlessMode(linkGameState.mode)));
}

function updateLinkTimerHud(hud = getLinkHudElements()) {
  setHudText(hud.timer, formatClockTime(linkGameState.remainingTime));
}

function updateLinkStarsHud(hud = getLinkHudElements()) {
  const stars = calculateLinkStars();
  const targets = isLinkEndlessMode(linkGameState.mode) ? [10, 15, 20] : [12, 18, 25];
  const target = Math.max(1, linkGameState.totalPairs * targets[2]);
  const levelStars = hud.levelStars;
  if (levelStars) {
    levelStars.setAttribute("aria-label", `${stars} trên 3 sao`);
    levelStars.querySelectorAll(".star-progress__milestone").forEach((star, index) => {
      star.classList.toggle("is-earned", index < stars);
    });
  }
  const fill = hud.starsFill;
  if (fill) fill.style.width = `${Math.min(100, Math.round(linkGameState.score / target * 100))}%`;
  setHudText(hud.totalStars, gameState.progress.linkConnect.totalStars);
  if (hud.scoreCard) {
    hud.scoreCard.dataset.tooltip = `Tổng điểm: ${gameState.progress.linkConnect.totalScore}`;
  }
}

function updateLinkSpecialMilestones(hud = getLinkHudElements()) {
  const progress = linkGameState.specialProgress;
  const { milestones, specialTrack: track } = hud;
  const target = LINK_CONNECT_CONFIG.special.progressTarget;
  track?.style.setProperty(
    "--link-special-progress",
    // Điểm đầu thanh là mốc 1: vừa đạt 1 chỉ sáng marker, không tô sang mốc 2.
    String(Math.max(0, Math.min(1, (progress - 1) / Math.max(1, target - 1)))),
  );
  let nextMarked = false;
  milestones.forEach((marker) => {
    const milestone = Number(marker.dataset.linkSpecialMilestone);
    const reward = linkGameState.specialMilestoneRewards[milestone]
      || getLinkSpecialMilestoneTooltip(milestone);
    marker.dataset.tooltip = `Mốc ${milestone}: ${reward}`;
    marker.setAttribute("aria-label", marker.dataset.tooltip);
    const earned = milestone <= progress;
    marker.classList.toggle("is-earned", earned);
    const isNext = !earned && !nextMarked;
    marker.classList.toggle("is-next", isNext);
    if (isNext) nextMarked = true;
  });
}

function applySpecialMatchRewards() {
  linkGameState.specialProgress += 1;
  const special = LINK_CONNECT_CONFIG.special;
  const endless = isLinkEndlessMode(linkGameState.mode);
  const rewardType = endless || Math.random() < 0.5 ? "coins" : "time";
  const amount = rewardType === "coins"
    ? randomInteger(special.coinReward.min, special.coinReward.max)
    : randomInteger(special.timeReward.min, special.timeReward.max);
  if (rewardType === "coins") {
    increaseCoins(amount);
    saveCoins(gameState.coins);
    showGameplayRewardPopup({ title: "Phần thưởng!", type: "coins", value: amount, sound: false });
  } else {
    linkGameState.remainingTime += amount;
    showGameplayRewardPopup({ title: "Phần thưởng!", type: "time", value: amount, sound: false });
  }
  // Mỗi màn luôn có ít nhất một cặp đặc biệt; ghép cặp này mở một cặp băng để ván không thể kẹt.
  const thawedPairs = unlockFrozenLinkPairs(linkGameState.board, 1);
  const boardChanged = Boolean(thawedPairs) || applySpecialMilestone(linkGameState.specialProgress);
  if (thawedPairs) showGameplayRewardPopup({ title: "Đã mở khóa!", icon: "wand", label: "Cặp thẻ đóng băng", sound: false });
  if (linkGameState.specialProgress >= special.progressTarget) {
    linkGameState.specialProgress = 0;
  }
  return boardChanged;
}

function applySpecialMilestone(progress) {
  let message = "";
  let boardChanged = false;
  if (progress === 1) {
    boardChanged = Boolean(removeAutomaticPair());
    message = "Mốc đặc biệt 1: phá hủy một cặp thẻ.";
  } else if (progress === 3) {
    const unlocked = unlockFrozenLinkPairs(linkGameState.board, 1);
    boardChanged = Boolean(unlocked);
    if (unlocked) message = "Mốc đặc biệt 3: đã mở khóa một cặp thẻ đóng băng.";
    else {
      boardChanged = Boolean(removeAutomaticPair());
      message = "Mốc đặc biệt 3: không có thẻ đóng băng, đã phá hủy một cặp.";
    }
  } else if (progress === 5) {
    boardChanged = Boolean(makeRandomLinkPairSpecial(linkGameState.board));
    message = "Mốc đặc biệt 5: đã tạo một cặp đặc biệt.";
  } else if (progress === 7) {
    message = applyMilestoneSevenReward();
  } else if (progress === 9) {
    const unlocked = unlockFrozenLinkPairs(linkGameState.board, 1);
    boardChanged = Boolean(unlocked);
    if (unlocked) message = "Mốc đặc biệt 9: đã mở khóa một cặp thẻ đóng băng.";
    else {
      boardChanged = Boolean(removeAutomaticPair());
      message = "Mốc đặc biệt 9: không có thẻ đóng băng, đã phá hủy một cặp.";
    }
  } else if (progress === 10) {
    increaseCoins(LINK_CONNECT_CONFIG.special.milestoneTenCoins);
    saveCoins(gameState.coins);
    const unlocked = unlockAllFrozenLinkPairs(linkGameState.board);
    const specialPair = makeRandomLinkPairSpecial(linkGameState.board);
    const removedPair = removeAutomaticPair();
    boardChanged = Boolean(unlocked || specialPair || removedPair);
    message = "Mốc đặc biệt 10: +100 Xu, mở khóa băng và kích hoạt phần thưởng.";
  }
  if (message) {
    const reward = message.replace(/^Mốc đặc biệt \d+: /, "");
    linkGameState.specialMilestoneRewards[progress] = reward;
    showGameplayRewardPopup({ title: `Mốc đặc biệt ${progress}`, icon: "star", label: reward, sound: false });
  }
  return boardChanged;
}

function applyMilestoneSevenReward() {
  const choices = isLinkEndlessMode(linkGameState.mode)
    ? ["hint", "reshuffle"]
    : ["time", "hint", "reshuffle"];
  const reward = choices[Math.floor(Math.random() * choices.length)];
  if (reward === "time") {
    linkGameState.remainingTime += randomInteger(3, 10);
    return "Mốc đặc biệt 7: nhận thêm thời gian.";
  }
  if (reward === "hint") {
    grantLinkItem("hint");
    return "Mốc đặc biệt 7: nhận một lượt gợi ý.";
  }
  grantLinkItem("reshuffle");
  return "Mốc đặc biệt 7: nhận một lượt xáo trộn.";
}

function removeAutomaticPair(fallbackMessage = "") {
  const pair = removeRandomLinkPair(linkGameState.board);
  if (!pair) return null;
  linkGameState.matchedPairs += 1;
  return fallbackMessage || "Đã phá hủy một cặp thẻ.";
}

function randomInteger(minimum, maximum) {
  return minimum + Math.floor(Math.random() * (maximum - minimum + 1));
}

function stopCountdown() {
  clearInterval(countdownInterval);
  countdownInterval = undefined;
}

function applyLinkTimingStyles(container) {
  container.style.setProperty("--link-path-animation-duration", `${LINK_CONNECT_TIMING.pathAnimationMs}ms`);
  container.style.setProperty("--link-tile-exit-delay", `${LINK_CONNECT_TIMING.tileExitDelayMs}ms`);
  container.style.setProperty("--link-tile-exit-duration", `${LINK_CONNECT_TIMING.tileExitAnimationMs}ms`);
  container.style.setProperty("--link-mismatch-feedback-duration", `${LINK_CONNECT_TIMING.mismatchFeedbackMs}ms`);
  container.style.setProperty("--link-thunder-strike-duration", `${LINK_CONNECT_TIMING.thunderStrikeMs}ms`);
}

function getLinkHudElements() {
  const root = document.getElementById("link-connect-container");
  if (linkHudElements?.root === root) return linkHudElements;
  const find = (selector) => root?.querySelector(selector) || null;
  linkHudElements = {
    root,
    level: find("#link-level-label"),
    moves: find("#link-moves"),
    misses: find("#link-misses"),
    combo: find("#link-combo"),
    score: find("#link-score"),
    scoreCard: find(".stat-points"),
    matchedPairs: find("#link-matched-pairs"),
    totalPairs: find("#link-total-pairs"),
    hint: find("#link-hint"),
    timer: find("#link-timer"),
    levelStars: find("#link-level-stars"),
    starsFill: find("#link-level-stars-fill"),
    totalStars: find("#link-total-stars"),
    specialTrack: find(".link-special-hud__milestones"),
    milestones: root ? [...root.querySelectorAll("[data-link-special-milestone]")] : [],
    itemCounts: root ? [...root.querySelectorAll("[data-item-count]")] : [],
    freezeButton: find('[data-item="freeze"]'),
  };
  return linkHudElements;
}

function setHudText(element, value) {
  if (!element) return;
  const text = String(value);
  if (element.textContent !== text) element.textContent = text;
}

function samePosition(left, right) {
  return left.row === right.row && left.column === right.column;
}
