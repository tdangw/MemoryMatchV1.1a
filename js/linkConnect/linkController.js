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
  getLinkComboWindowMs,
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
  unlockFrozenLinkPairs,
  unlockAllFrozenLinkPairs,
} from "./linkBoard.js";
import { findAvailableConnections, findConnectionPath } from "./pathfinder.js";
import { consumeLinkItem, getLinkItemCount, grantLinkItem, LINK_ITEMS } from "./linkItems.js";
import { clearActiveSession, getActiveSession, saveActiveSession } from "../sessionProgress.js";
import {
  clearGameplayRewardPopups,
  openTimeUpModal,
  showComboEffect,
  showLevelRewardOverlay,
  showLevelSummaryOverlay,
  showGameplayRewardEffect,
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
  playLinkFrozenPairUnlock,
  playLinkEnergyFlight,
  playLinkSpecialPairTransform,
  playLinkThunderStrike,
  renderLinkBoard,
  renderLinkBoardShift,
  setLinkTileSelected,
  setLinkTileHinted,
} from "./linkRenderer.js";
import { beginLinkRound, linkGameState, resetLinkGame } from "./linkState.js";

let countdownInterval;
let linkTimeAnimationFrame = null;
let linkTimeProgressState = null;
let comboExpiryTimer;
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
    linkGameState.specialNoEnergyDropStreak = 0;
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
  linkGameState.timeLimit = linkGameState.remainingTime;
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
      <section class="link-special-hud" aria-label="Tiến trình năng lượng đặc biệt">
        <span id="link-special-energy" class="link-special-hud__energy" aria-label="Năng lượng đặc biệt"><span data-link-icon="energy"></span></span>
        <div class="link-special-hud__milestones" aria-label="Các mốc kích hoạt đặc biệt">
          <span data-link-special-milestone="1" style="--link-milestone-position: 0%">1</span><span data-link-special-milestone="3" style="--link-milestone-position: 22.22%">3</span><span data-link-special-milestone="5" style="--link-milestone-position: 44.44%">5</span><span data-link-special-milestone="7" style="--link-milestone-position: 66.67%">7</span><span data-link-special-milestone="9" style="--link-milestone-position: 88.89%">9</span><span data-link-special-milestone="10" style="--link-milestone-position: 100%">10</span>
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
      linkGameState.isLocked = false;
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
  const roundId = linkGameState.roundId;
  const board = linkGameState.board;
  startLinkComboWindow(comboWindowMs, matchedAt, roundId, board);
  const matchedStart = selectedPosition;
  const matchPoints = calculateLinkMatchPoints(linkGameState.combo, {
    special: isSpecialMatch,
  });
  linkGameState.score += matchPoints;
  drawLinkPath(path, linkGameState.board);
  if (isSpecialMatch && shouldDropLinkEnergy()) {
    playLinkEnergyFlight(selectedPosition, position, {
      onArrive: () => receiveLinkEnergy(roundId, board),
    });
  }
  const matchedTiles = playLinkMatchExit(selectedPosition, position);
  showScoreEffect(matchedTiles[0], matchPoints);
  showComboEffect(matchedTiles[1] || matchedTiles[0], linkGameState.combo);
  setTimeout(() => {
    // Người chơi có thể khởi động màn khác trước khi hiệu ứng kết thúc.
    // Khi đó callback cũ không được phép thay đổi trạng thái của bàn mới.
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    removeLinkBoardPair(board, matchedStart, position);
    linkGameState.matchedPairs += 1;
    const specialBoardChanged = isSpecialMatch && applySpecialMatchRewards(matchedTiles[0]);
    if (firstTile.luckyReward) applyLinkLuckyReward(firstTile.luckyReward, matchedTiles[1] || matchedTiles[0]);
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
    recoverBlockedLinkBoard(linkGameState.board);
    playPendingBoardTransforms();
    if (linkGameState.pendingSpecialMilestones.length) {
      processPendingSpecialMilestones(roundId, board);
      return;
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
  setTimeout(() => {
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    playLinkMatchExit(start, end);
  }, LINK_CONNECT_TIMING.thunderCardExitDelayMs);
  setTimeout(() => {
    strike?.remove();
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
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
  recoverBlockedLinkBoard(board);
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

function applyLinkLuckyReward(reward, anchor) {
  playLinkSound("bonus");
  linkGameState.luckyAwards.push(reward);
  if (reward.type === "coins") {
    increaseCoins(reward.value);
    saveCoins(gameState.coins);
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
  startLinkTimeProgress(roundId);
  syncDefaultMusic(gameState.settings);
  countdownInterval = setInterval(() => {
    if (linkGameState.roundId !== roundId || linkGameState.isLocked || linkGameState.isPaused) return;
    if (linkGameState.freezeSeconds > 0) {
      linkGameState.freezeSeconds -= 1;
      return;
    }
    linkGameState.remainingTime += getLinkTimerDirection(linkGameState.mode) === "up" ? 1 : -1;
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
    syncLinkTimeProgress();
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
  if (!linkTimeProgressState || linkTimeProgressState.roundId !== linkGameState.roundId) {
    setLinkTimeProgress(false, linkGameState.roundId, hud);
    return;
  }
  renderLinkTimeProgress(linkTimeProgressState.remainingMs, linkTimeProgressState, hud);
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
  linkTimeProgressState.lastFrameAt = performance.now();
  linkTimeAnimationFrame = requestAnimationFrame(updateLinkTimeProgressFrame);
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
}

function updateLinkTimeProgressFrame(timestamp) {
  const state = linkTimeProgressState;
  if (!state?.running || state.roundId !== linkGameState.roundId) return;
  const elapsed = Math.max(0, timestamp - (state.lastFrameAt ?? timestamp));
  state.lastFrameAt = timestamp;
  if (!linkGameState.isLocked && !linkGameState.isPaused && linkGameState.freezeSeconds <= 0) {
    state.remainingMs = Math.max(0, state.remainingMs - elapsed);
  }
  renderLinkTimeProgress(state.remainingMs, state);
  if (state.remainingMs > 0) {
    linkTimeAnimationFrame = requestAnimationFrame(updateLinkTimeProgressFrame);
  } else {
    linkTimeAnimationFrame = null;
    state.running = false;
  }
}

function renderLinkTimeProgress(remainingMs, state, hud = getLinkHudElements()) {
  const countdown = !state.endless && state.timeLimitMs > 0;
  const progress = state.endless ? 1
    : countdown ? Math.max(0, Math.min(1, remainingMs / state.timeLimitMs)) : 0;
  const warning = countdown && progress < 0.7 && progress >= 0.3;
  const critical = countdown && progress < 0.3;
  hud.gameHud?.style.setProperty("--link-timer-progress", String(progress));
  hud.gameHud?.classList.toggle("has-timer-progress", countdown || state.endless);
  hud.gameHud?.classList.toggle("is-timer-warning", warning);
  hud.gameHud?.classList.toggle("is-timer-critical", critical);
  hud.gameHud?.classList.toggle("is-timer-endless", state.endless);
}

function stopLinkTimeProgress() {
  if (linkTimeAnimationFrame !== null) cancelAnimationFrame(linkTimeAnimationFrame);
  linkTimeAnimationFrame = null;
  if (linkTimeProgressState) linkTimeProgressState.running = false;
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
  if (hud.starProgressCard) {
    hud.starProgressCard.dataset.tooltip = `Mục tiêu: ${target}`;
  }
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
  if (track) {
    track.dataset.tooltip = `Năng lượng: ${progress}/${target}`;
    track.setAttribute("aria-label", track.dataset.tooltip);
  }
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

function shouldDropLinkEnergy() {
  const energy = LINK_CONNECT_CONFIG.special.energyDrop;
  if (linkGameState.specialNoEnergyDropStreak >= energy.guaranteeAfterMisses) {
    linkGameState.specialNoEnergyDropStreak = 0;
    return true;
  }
  if (Math.random() < energy.chance) {
    linkGameState.specialNoEnergyDropStreak = 0;
    return true;
  }
  linkGameState.specialNoEnergyDropStreak += 1;
  return false;
}

function receiveLinkEnergy(roundId, board) {
  if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
  linkGameState.specialProgress += 1;
  linkGameState.pendingSpecialMilestones.push(linkGameState.specialProgress);
  updateLinkHud();
  if (!linkGameState.isLocked) processPendingSpecialMilestones(roundId, board);
}

function applySpecialMatchRewards(anchor) {
  const special = LINK_CONNECT_CONFIG.special;
  const thawedPairs = unlockFrozenLinkPairs(linkGameState.board, 1, { onUnlock: rememberFrozenPairForTransform });
  if (thawedPairs) return true;
  const rewardType = isLinkEndlessMode(linkGameState.mode) || Math.random() < 0.5 ? "coins" : "time";
  const range = special.frozenFallbackReward[rewardType === "coins" ? "coin" : "time"];
  const value = randomInteger(range.min, range.max);
  if (rewardType === "coins") {
    increaseCoins(value);
    saveCoins(gameState.coins);
  } else {
    linkGameState.remainingTime += value;
    syncLinkTimeProgress();
  }
  showGameplayRewardEffect(anchor, { type: rewardType, value });
  return false;
}

function processPendingSpecialMilestones(roundId, board) {
  if (linkGameState.isResolvingSpecialMilestone || linkGameState.roundId !== roundId || linkGameState.board !== board) return;
  const progress = linkGameState.pendingSpecialMilestones.shift();
  if (!progress) {
    linkGameState.isLocked = false;
    return;
  }
  linkGameState.isResolvingSpecialMilestone = true;
  const anchor = getLinkHudElements().energy;
  const finish = () => {
    linkGameState.isResolvingSpecialMilestone = false;
    if (progress >= LINK_CONNECT_CONFIG.special.progressTarget) linkGameState.specialProgress = 0;
    updateLinkHud();
    if (linkGameState.matchedPairs >= linkGameState.totalPairs) return completeLinkLevel();
    recoverBlockedLinkBoard(board);
    processPendingSpecialMilestones(roundId, board);
  };
  const rewardPairBreak = () => playAutomaticPairBreak(roundId, board, finish);
  if (progress === 1 || progress === 3) {
    linkGameState.specialMilestoneRewards[progress] = "Phá 1 cặp thường ngẫu nhiên.";
    rewardPairBreak();
  } else if (progress === 5) {
    const item = Math.random() < 0.5 ? "hint" : "reshuffle";
    grantLinkItem(item);
    showGameplayRewardEffect(anchor, { type: item, value: 1 });
    linkGameState.specialMilestoneRewards[progress] = `+1 ${item === "hint" ? "Gợi ý" : "Xáo trộn"}.`;
    finish();
  } else if (progress === 7) {
    const rules = LINK_CONNECT_CONFIG.special.milestones.seven;
    const seconds = randomInteger(rules.time.min, rules.time.max);
    linkGameState.remainingTime += seconds;
    syncLinkTimeProgress();
    increaseCoins(rules.coins);
    saveCoins(gameState.coins);
    showGameplayRewardEffect(anchor, { type: "time", value: seconds });
    showGameplayRewardEffect(anchor, { type: "coins", value: rules.coins });
    linkGameState.specialMilestoneRewards[progress] = `+${seconds}s và +${rules.coins} Xu.`;
    finish();
  } else if (progress === 9 || progress === 10) {
    grantLinkItem("hint");
    showGameplayRewardEffect(anchor, { type: "hint", value: 1 });
    if (progress === 10) {
      const coins = LINK_CONNECT_CONFIG.special.milestones.ten.coins;
      increaseCoins(coins);
      saveCoins(gameState.coins);
      grantLinkItem("reshuffle");
      showGameplayRewardEffect(anchor, { type: "coins", value: coins });
      showGameplayRewardEffect(anchor, { type: "reshuffle", value: 1 });
      linkGameState.specialMilestoneRewards[progress] = `+${coins} Xu, +1 Xáo trộn, +1 Gợi ý và phá cặp.`;
    } else linkGameState.specialMilestoneRewards[progress] = "+1 Gợi ý và phá 1 cặp thường.";
    rewardPairBreak();
  } else finish();
}

function recoverBlockedLinkBoard(board) {
  if (findAvailableConnections(board.grid).length) return false;
  if (ensurePlayableBoard(board)) {
    renderLinkBoardShift(board, { onTileClick: handleLinkTileClick });
    showAppToast("Không còn đường nối. Bàn đã được xáo lại.");
    return true;
  }
  // Khi cuối màn chỉ còn các cặp băng, xáo không thể tạo nước đi vì chúng đều
  // bị khóa. Mở toàn bộ cùng lúc để kết thúc màn liền mạch.
  const thawedPairs = unlockAllFrozenLinkPairs(board, { onUnlock: rememberFrozenPairForTransform });
  if (!thawedPairs) return false;
  renderLinkBoard(board, { onTileClick: handleLinkTileClick });
  playPendingBoardTransforms();
  showAppToast(`Đã mở ${thawedPairs} cặp băng còn lại để tiếp tục màn chơi.`);
  return true;
}

function playAutomaticPairBreak(roundId, board, onComplete) {
  const milestone = LINK_CONNECT_CONFIG.special.milestones;
  const pair = removeRandomLinkPair(board, {
    remove: false,
    eligiblePair: (candidate, currentBoard) => candidate.positions.every((position) => {
      const tile = getLinkBoardTile(currentBoard, position);
      return tile && !tile.frozen && !tile.special && !tile.luckyReward;
    }),
  });
  if (!pair) {
    increaseCoins(milestone.breakCoins);
    saveCoins(gameState.coins);
    showGameplayRewardEffect(getLinkHudElements().energy, { type: "coins", value: milestone.breakCoins });
    onComplete();
    return;
  }
  const [start, end] = pair.positions;
  setLinkTileSelected(start, true);
  setLinkTileSelected(end, true);
  setTimeout(() => {
    if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
    const strike = playLinkThunderStrike([start, end], "yellow");
    setTimeout(() => {
      if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
      playLinkMatchExit(start, end);
    }, LINK_CONNECT_TIMING.thunderCardExitDelayMs);
    setTimeout(() => {
      if (linkGameState.roundId !== roundId || linkGameState.board !== board) return;
      strike?.remove();
      removeLinkBoardPair(board, start, end);
      clearLinkMatchedPair(start, end);
      linkGameState.matchedPairs += 1;
      const shifted = applyLinkGravityShift(board, linkGameState.gravityShift);
      if (shifted) renderLinkBoardShift(board, { onTileClick: handleLinkTileClick });
      onComplete();
    }, getLinkThunderResolveDelay());
  }, LINK_CONNECT_TIMING.automaticPairMarkMs);
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

function stopCountdown() {
  clearInterval(countdownInterval);
  countdownInterval = undefined;
  stopLinkTimeProgress();
  stopLinkComboWindow();
}

function startLinkComboWindow(durationMs, matchedAt, roundId, board) {
  clearTimeout(comboExpiryTimer);
  const card = getLinkHudElements().comboCard;
  if (card) {
    card.style.setProperty("--link-combo-window-duration", `${durationMs}ms`);
    card.classList.remove("is-combo-window-active");
    // Khởi động lại vạch thời gian từ đầu cho mỗi cặp ghép đúng.
    void card.offsetWidth;
    card.classList.add("is-combo-window-active");
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
  getLinkHudElements().comboCard?.classList.remove("is-combo-window-active");
}

function applyLinkTimingStyles(container) {
  container.style.setProperty("--link-path-animation-duration", `${LINK_CONNECT_TIMING.pathAnimationMs}ms`);
  container.style.setProperty("--link-tile-exit-delay", `${LINK_CONNECT_TIMING.tileExitDelayMs}ms`);
  container.style.setProperty("--link-tile-exit-duration", `${LINK_CONNECT_TIMING.tileExitAnimationMs}ms`);
  container.style.setProperty("--link-mismatch-feedback-duration", `${LINK_CONNECT_TIMING.mismatchFeedbackMs}ms`);
  container.style.setProperty("--link-thunder-strike-duration", `${LINK_CONNECT_TIMING.thunderStrikeMs}ms`);
  container.style.setProperty("--link-special-transform-duration", `${LINK_CONNECT_TIMING.specialPairTransformMs}ms`);
  container.style.setProperty("--link-frozen-unlock-duration", `${LINK_CONNECT_TIMING.frozenPairUnlockMs}ms`);
  container.style.setProperty("--link-energy-burst-duration", `${LINK_CONNECT_TIMING.energyBurstMs}ms`);
  container.style.setProperty("--link-energy-hold-duration", `${LINK_CONNECT_TIMING.energyHoldMs}ms`);
  container.style.setProperty("--link-energy-flight-duration", `${LINK_CONNECT_TIMING.energyFlightMs}ms`);
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
    comboCard: find(".stat-combo"),
    score: find("#link-score"),
    scoreCard: find(".stat-points"),
    matchedPairs: find("#link-matched-pairs"),
    totalPairs: find("#link-total-pairs"),
    hint: find("#link-hint"),
    timer: find("#link-timer"),
    gameHud: find("#link-game-title"),
    levelStars: find("#link-level-stars"),
    starProgressCard: find(".stat-star-progress"),
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
