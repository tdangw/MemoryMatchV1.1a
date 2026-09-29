import { createGameShell } from "../gameShell/gameShell.js";
import { createGameShellHud } from "../gameShell/gameShellHud.js";
import { formatClockTime } from "../uiCatalog.js";
import { createIcon } from "../icons.js";
import { LINK_ITEMS } from "./linkItems.js";

let shell;
let linkHudElements = null;
export function getLinkShell() {
  if (shell) return shell;
  const container = document.createElement("section");
  container.id = "link-connect-container";
  container.className = "link-connect-game game-shell-tokens";
  container.hidden = true;
  container.innerHTML = `
      <div id="link-game-logo" data-shell-region="title" class="link-game-name game-name">Link Connect</div>
      <div class="link-game-progress-hud game-progress-hud" data-shell-region="progress" aria-label="Tiến trình màn chơi">
        <span class="info stat-card stat-moves"><span class="stat-label">MOVES</span><span id="link-moves">0</span></span>
        <span class="info stat-card stat-misses"><span class="stat-label">MISS</span><span id="link-misses">0</span></span>
        <span class="info stat-card stat-combo"><span class="stat-label">COMBO</span><span id="link-combo">0</span><span class="combo-window-progress" aria-hidden="true"></span></span>
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
      <header id="link-game-title" data-shell-region="hud" class="link-game-hud game-hud">
        <button id="link-actions-menu-toggle" class="link-connect-game__menu game-menu-toggle" type="button" aria-label="Mở menu chức năng" aria-controls="link-actions-menu" aria-expanded="false"></button>
        <div id="link-actions-menu" class="link-connect-game__actions game-actions-menu" hidden>
          <button class="game-action-item" type="button" data-action="restart">Chơi lại</button>
          <button class="game-action-item" type="button" data-action="menu">Menu</button>
          <button class="game-action-item" type="button" data-action="settings">Cài đặt</button>
          <button class="game-action-item" type="button" data-action="shop">Cửa hàng</button>
          <button class="game-action-item" type="button" data-action="collection">Bộ sưu tập</button>
          <button class="game-action-item" type="button" data-action="help">Hướng dẫn</button>
          <button class="game-action-item" type="button" data-action="reset">Xóa dữ liệu</button>
        </div>
        <div class="game-stats" aria-label="Thông tin màn chơi">
          <span class="info stat-card stat-level"><span class="stat-label">LV</span><span id="link-level-label">1</span></span>
          <span class="info stat-card stat-timer"><span class="link-timer-icon" data-link-icon="timer"></span><span id="link-timer">00:00</span></span>
          <span class="info stat-card stat-score"><span data-link-icon="star"></span><span id="link-total-stars">0</span></span>
        </div>
        <button id="link-tools-toggle" class="link-tools-toggle" type="button" aria-label="Mở công cụ hỗ trợ" aria-controls="link-tools-menu" aria-expanded="false"></button>
        <div id="link-tools-menu" class="link-tools-menu" hidden>
          <aside id="link-item-actions" class="link-tool-list" aria-label="Vật phẩm hỗ trợ"></aside>
        </div>
      </header>
      <section class="link-special-hud" data-shell-region="milestones" aria-label="Tiến trình năng lượng đặc biệt">
        <span id="link-special-coins" class="link-special-hud__coins game-coin-hud" aria-label="Xu"><span data-link-icon="coin"></span><strong id="link-coin-balance">0</strong></span>
        <div class="link-special-hud__milestones" aria-label="Các mốc kích hoạt đặc biệt">
          ${Array.from({ length: 10 }, (_, index) => `<span data-link-special-milestone="${index + 1}" style="--link-milestone-position: ${5 + index * 10}%">${index + 1}</span>`).join("")}
        </div>
      </section>
      <div id="link-board-frame" data-shell-region="frame" class="link-board-frame">
        <div id="link-board" data-shell-region="board" class="link-board" aria-label="Bàn Link Connect"></div>
        <svg id="link-path-overlay" class="link-path-overlay" aria-hidden="true"></svg>
      </div>`;
  createItemButtons(container);
  decorateShell(container);
  document.querySelector(".main-wrapper").append(container);
  const regions = Object.fromEntries([...container.querySelectorAll("[data-shell-region]")].map(node => [node.dataset.shellRegion, node]));
  shell = createGameShell({ root: container, regions, title: "Link Connect" });
  return shell;
}

function decorateShell(container) {
  const toggle = container.querySelector("#link-actions-menu-toggle");
  const actions = container.querySelector("#link-actions-menu");
  const toolsToggle = container.querySelector("#link-tools-toggle");
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
    reset: "wand",
  };
  actions?.querySelectorAll("button[data-action]").forEach((button) => {
    button.prepend(createIcon(actionIcons[button.dataset.action]));
  });
}

function createItemButtons(container) {
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
    actions?.append(button);
  });
}

export function bindLinkControls(scope, { onAction, onItem }) {
  const container = getLinkShell().refs.root;
  scope.listen(container.querySelector("#link-item-actions"), "click", event => {
    const button = event.target.closest("[data-item]");
    if (button) onItem(button.dataset.item);
  });
  const toggle = container.querySelector("#link-actions-menu-toggle");
  const actions = container.querySelector("#link-actions-menu");
  const toolsToggle = container.querySelector("#link-tools-toggle");
  const toolsMenu = container.querySelector("#link-tools-menu");
  scope.listen(toggle, "click", (event) => {
    event.stopPropagation();
    const nextHidden = !actions.hidden;
    actions.hidden = nextHidden;
    toggle.setAttribute("aria-expanded", String(!nextHidden));
  });
  scope.listen(toolsToggle, "click", (event) => {
    event.stopPropagation();
    const nextHidden = !toolsMenu.hidden;
    toolsMenu.hidden = nextHidden;
    toolsToggle.setAttribute("aria-expanded", String(!nextHidden));
  });
  scope.listen(actions, "click", (event) => {
    const action = event.target.closest("button")?.dataset.action;
    if (!action) return;
    actions.hidden = true;
    toggle?.setAttribute("aria-expanded", "false");
    onAction(action);
  });
  scope.listen(document, "click", (event) => {
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

export function getLinkHudElements() {
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
    coins: find("#link-special-coins"),
    coinBalance: find("#link-coin-balance"),
    timer: find("#link-timer"),
    timerCard: find(".stat-timer"),
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



const link = new WeakMap();
export function getLinkHud(hud) {
  if (!hud.root) return createGameShellHud();
  if (link.has(hud.root)) return link.get(hud.root);
  const stats = Object.fromEntries(["level", "moves", "misses", "combo", "score", "matchedPairs", "totalPairs", "hint", "totalStars", "timer"].map(key => [key, { element: hud[key] }]));
  stats.timer.format = formatClockTime;
  const copy = { hint: "Chỉ ra hai thẻ nối được.", reshuffle: "Đổi chỗ thẻ để tìm đường mới.", thunder: "Xóa ngẫu nhiên vài cặp thẻ.", freeze: "Dừng thời gian trong chốc lát." };
  const tools = Object.fromEntries(hud.itemCounts.map(count => {
    const key = count.dataset.itemCount;
    return [key, { count, element: count.closest("button"), tooltip: copy[key] }];
  }));
  tools.toggle = { element: hud.root.querySelector("#link-tools-toggle"), tooltip: "Dùng vật phẩm khi cần trợ giúp." };
  const component = createGameShellHud({ stats, tools,
    stars: { element: hud.levelStars, fill: hud.starsFill, card: hud.starProgressCard, scoreCard: hud.scoreCard },
    coins: { element: hud.coins, balance: hud.coinBalance },
    milestones: { track: hud.specialTrack, markers: hud.milestones },
  });
  link.set(hud.root, component);
  return component;
}

export function applyLinkTimingStyles(container, timing) {
  container.style.setProperty("--link-path-animation-duration", `${timing.pathAnimationMs}ms`);
  container.style.setProperty("--link-tile-exit-delay", `${timing.tileExitDelayMs}ms`);
  container.style.setProperty("--link-tile-exit-duration", `${timing.tileExitAnimationMs}ms`);
  container.style.setProperty("--link-mismatch-feedback-duration", `${timing.mismatchFeedbackMs}ms`);
  container.style.setProperty("--link-thunder-strike-duration", `${timing.thunderStrikeMs}ms`);
  container.style.setProperty("--link-special-transform-duration", `${timing.specialPairTransformMs}ms`);
  container.style.setProperty("--link-frozen-unlock-duration", `${timing.frozenPairUnlockMs}ms`);
  container.style.setProperty("--link-board-shift-duration", `${timing.boardShiftMs}ms`);
  container.style.setProperty("--link-board-shuffle-duration", `${timing.boardShuffleMs}ms`);
  container.style.setProperty("--link-board-shuffle-stagger", `${timing.boardShuffleStaggerMs}ms`);
}
