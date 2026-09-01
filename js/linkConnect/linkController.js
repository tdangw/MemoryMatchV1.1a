import { createIcon } from "../icons.js";
import { openAppModal, showAppToast } from "../modal.js";
import { pauseBackgroundMusic, sounds, syncDefaultMusic } from "../sound.js";
import { getEquippedThemeId } from "../appearance.js";
import { gameState, increaseCoins, spendCoins } from "../gameState.js";
import { saveCoins } from "../persistence.js";
import { getTheme } from "../themeCatalog.js";
import {
  calculateLinkMatchPoints,
  calculateLinkCoinReward,
  getLinkChallengeTime,
  getLinkChallengeLayout,
  LINK_CONNECT_CONFIG,
  getLinkLevelHintBonus,
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
  removeRandomLinkPair,
  shuffleLinkBoard,
  makeRandomLinkPairSpecial,
  unlockAllFrozenLinkTiles,
  unlockFrozenLinkTiles,
} from "./linkBoard.js";
import { findAvailableConnections, findConnectionPath } from "./pathfinder.js";
import { consumeLinkItem, getLinkItemCount, grantLinkItem, LINK_ITEMS } from "./linkItems.js";
import { clearActiveSession, getActiveSession, saveActiveSession } from "../sessionProgress.js";
import { openTimeUpModal, showLevelRewardOverlay, showLevelSummaryOverlay } from "../ui.js";
import {
  clearLinkPath,
  clearLinkMatchedPair,
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
let linkTimeWarningPlayed = false;
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

export function startLinkLevel({ mode = linkGameState.mode, level = 1, resume = false } = {}) {
  stopCountdown();
  clearLinkPath();
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
  saveActiveSession("link-connect", { mode, level });
  const roundId = beginLinkRound({ mode, level, layout, board });
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
      linkGameState.isLocked = false;
      startCountdown(roundId);
    },
  });
}

export function continueLinkSession(session) {
  if (!session) return;
  startLinkLevel({ ...session, resume: true });
}

export function returnToLinkMenu() {
  stopCountdown();
  resetLinkGame();
  selectedPosition = null;
  clearLinkPath();
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
      <header class="link-connect-game__header">
        <button id="link-actions-menu-toggle" class="link-connect-game__menu" type="button" aria-label="Mở menu chức năng" aria-controls="link-actions-menu" aria-expanded="false"></button>
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
        <div><strong>Link Connect</strong><span id="link-level-label">Cấp 1</span></div>
        <span class="link-connect-game__header-spacer" aria-hidden="true"></span>
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
        <span id="link-special-progress">Đặc biệt 0/10</span>
        <strong id="link-timer">00:00</strong>
      </footer>
      <aside id="link-item-actions" class="link-connect-game__items" aria-label="Vật phẩm hỗ trợ"></aside>`;
    document.querySelector(".main-wrapper")?.append(container);
    configureLinkGameActions(container);
    configureLinkItemActions(container);
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
    button.append(createIcon(item.icon));
    const label = document.createElement("span");
    label.textContent = item.title;
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
  toggle?.append(createIcon("menu"));
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
  actions?.addEventListener("click", (event) => {
    const action = event.target.closest("button")?.dataset.action;
    if (!action) return;
    actions.hidden = true;
    toggle?.setAttribute("aria-expanded", "false");
    runLinkGameAction(action);
  });
  document.addEventListener("click", (event) => {
    if (!actions?.hidden && !event.target.closest(".link-connect-game__header")) {
      actions.hidden = true;
      toggle?.setAttribute("aria-expanded", "false");
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
    return navigation.showShop(resumeLinkAfterModal);
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
    playLinkSound("wrong");
    linkGameState.misses += 1;
    linkGameState.combo = 0;
    clearLinkTileSelection();
    selectedPosition = null;
    updateLinkHud();
    return;
  }

  linkGameState.isLocked = true;
  playLinkSound("match");
  linkGameState.combo += 1;
  const isSpecialMatch = firstTile.special && tile.special;
  linkGameState.score += calculateLinkMatchPoints(linkGameState.combo, { special: isSpecialMatch });
  drawLinkPath(path, linkGameState.board);
  playLinkMatchExit(selectedPosition, position);
  setTimeout(() => {
    const matchedStart = selectedPosition;
    removeLinkBoardPair(linkGameState.board, matchedStart, position);
    linkGameState.matchedPairs += 1;
    const specialBoardChanged = isSpecialMatch && applySpecialMatchRewards();
    if (firstTile.luckyReward) applyLinkLuckyReward(firstTile.luckyReward);
    selectedPosition = null;
    clearLinkPath();
    if (specialBoardChanged) renderLinkBoard(linkGameState.board, { onTileClick: handleLinkTileClick });
    else clearLinkMatchedPair(matchedStart, position);
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
  playLinkSound("overlay");
  if (id === "hint") useLinkHint();
  else if (id === "reshuffle") useLinkReshuffle();
  else if (id === "thunder") useLinkThunder();
  else if (id === "freeze") useLinkFreeze();
  updateLinkHud();
}

function useLinkHint() {
  const connection = findAvailableConnections(linkGameState.board.grid)[0];
  if (!connection) {
    showAppToast("Không có đường nối khả dụng để gợi ý.");
    grantLinkItem("hint");
    return;
  }
  linkGameState.isLocked = true;
  drawLinkPath(connection.path, linkGameState.board);
  showAppToast("Đây là một đường nối khả dụng.");
  setTimeout(() => {
    clearLinkPath();
    linkGameState.isLocked = false;
  }, 1000);
}

function useLinkReshuffle() {
  shuffleLinkBoard(linkGameState.board);
  renderLinkBoard(linkGameState.board, { onTileClick: handleLinkTileClick });
  showAppToast("Đã xáo lại các thẻ còn lại.");
}

function useLinkThunder() {
  const pairCount = randomInteger(1, 3);
  let removed = 0;
  for (let index = 0; index < pairCount; index += 1) {
    if (!removeAutomaticPair()) break;
    removed += 1;
  }
  renderLinkBoard(linkGameState.board, { onTileClick: handleLinkTileClick });
  showAppToast(`Sấm sét đã phá hủy ${removed} cặp thẻ.`);
  if (linkGameState.matchedPairs >= linkGameState.totalPairs) completeLinkLevel();
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
    stars: calculateLinkStars(),
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
    showAppToast(`Ô may mắn: +${reward.value} Xu`);
    return;
  }
  linkGameState.remainingTime += reward.value;
  showAppToast(`Ô may mắn: +${reward.value} giây`);
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
      updateLinkHud();
      return;
    }
    linkGameState.remainingTime += getLinkTimerDirection(linkGameState.mode) === "up" ? 1 : -1;
    updateLinkHud();
    if (!isLinkEndlessMode(linkGameState.mode) && linkGameState.remainingTime <= 10 && !linkTimeWarningPlayed) {
      playLinkSound("timerunningout");
      linkTimeWarningPlayed = true;
    }
    if (linkGameState.remainingTime <= 0 && !isLinkEndlessMode(linkGameState.mode)) {
      handleLinkTimeUp();
    }
  }, 1000);
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
    close();
    showAppToast(`Đã mua +${seconds}s với ${price} Xu.`);
    playLinkSound("bonus");
    syncDefaultMusic(gameState.settings);
    setTimeout(() => startCountdown(linkGameState.roundId), 1000);
    return true;
  };
  openTimeUpModal({
    content: "<p>Chọn một cách để tiếp tục hành trình của bạn.</p>",
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
      { label: "+1 giây · 2 Xu", icon: "coin", variant: "time-purchase", onClick: (close) => buyMoreTime(1, 2, close) },
      { label: "+5 giây · 10 Xu", icon: "coin", variant: "time-purchase", onClick: (close) => buyMoreTime(5, 10, close) },
    ],
    onClose: () => {
      if (!actionSelected) returnToMenu();
    },
  });
}

function updateLinkHud() {
  setText("link-level-label", `Cấp ${linkGameState.level}`);
  setText("link-moves", linkGameState.moves);
  setText("link-misses", linkGameState.misses);
  setText("link-combo", linkGameState.combo);
  setText("link-score", linkGameState.score);
  setText("link-pair-progress", `${linkGameState.matchedPairs}/${linkGameState.totalPairs} cặp`);
  setText(
    "link-special-progress",
    `Đặc biệt ${linkGameState.specialProgress}/${LINK_CONNECT_CONFIG.special.progressTarget}`,
  );
  setText("link-timer", formatTime(linkGameState.remainingTime));
  document.querySelectorAll("[data-item-count]").forEach((element) => {
    const itemId = element.dataset.itemCount;
    element.textContent = String(getLinkItemCount(itemId));
  });
  const freezeButton = document.querySelector('[data-item="freeze"]');
  freezeButton?.classList.toggle("is-disabled", isLinkEndlessMode(linkGameState.mode));
  freezeButton?.setAttribute("aria-disabled", String(isLinkEndlessMode(linkGameState.mode)));
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
    showAppToast(`Cặp đặc biệt: +${amount} Xu`);
  } else {
    linkGameState.remainingTime += amount;
    showAppToast(`Cặp đặc biệt: +${amount} giây`);
  }
  // Mỗi màn luôn có ít nhất một cặp đặc biệt; ghép cặp này mở băng để ván không thể kẹt.
  const thawedCount = unlockFrozenLinkTiles(linkGameState.board, 1);
  const boardChanged = Boolean(thawedCount) || applySpecialMilestone(linkGameState.specialProgress);
  if (thawedCount) showAppToast("Cặp đặc biệt đã mở khóa thẻ đóng băng.");
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
    const unlocked = unlockFrozenLinkTiles(linkGameState.board, 1);
    boardChanged = Boolean(unlocked);
    if (unlocked) message = "Mốc đặc biệt 3: đã mở khóa một thẻ đóng băng.";
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
    const unlocked = unlockFrozenLinkTiles(linkGameState.board, 1);
    boardChanged = Boolean(unlocked);
    if (unlocked) message = "Mốc đặc biệt 9: đã mở khóa một thẻ đóng băng.";
    else {
      boardChanged = Boolean(removeAutomaticPair());
      message = "Mốc đặc biệt 9: không có thẻ đóng băng, đã phá hủy một cặp.";
    }
  } else if (progress === 10) {
    increaseCoins(LINK_CONNECT_CONFIG.special.milestoneTenCoins);
    saveCoins(gameState.coins);
    const unlocked = unlockAllFrozenLinkTiles(linkGameState.board);
    const specialPair = makeRandomLinkPairSpecial(linkGameState.board);
    const removedPair = removeAutomaticPair();
    boardChanged = Boolean(unlocked || specialPair || removedPair);
    message = "Mốc đặc biệt 10: +100 Xu, mở khóa băng và kích hoạt phần thưởng.";
  }
  if (message) showAppToast(message, { tone: "info", duration: 2400 });
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
