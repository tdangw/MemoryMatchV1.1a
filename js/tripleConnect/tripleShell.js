import { createGameShell } from "../gameShell/gameShell.js";
import { createGameShellHud } from "../gameShell/gameShellHud.js";
import { createIcon } from "../icons.js";
import { TRIPLE_ITEMS } from "./tripleItems.js";
import { formatClockTime } from "../uiCatalog.js";

let shell;
const tripleHud = new WeakMap();

export function getTripleShell() {
  if (shell) return shell;
  const root = document.createElement("section");
  root.id = "triple-connect-container";
  root.className = "triple-connect-game";
  root.hidden = true;
  root.innerHTML = `<header data-shell-region="title" class="triple-connect__title game-name">Triple Connect</header>
    <div data-shell-region="progress" class="triple-connect__progress triple-game-progress-hud game-progress-hud" aria-label="Tiến trình màn chơi"><span class="info stat-card stat-moves"><span class="stat-label">MOVES</span><span data-triple-stat="moves">0</span></span><span class="info stat-card stat-misses"><span class="stat-label">MISS</span><span data-triple-stat="misses">0</span></span><span class="info stat-card stat-combo"><span class="stat-label">COMBO</span><span data-triple-stat="combo">0</span></span><span class="info stat-card stat-star-progress" aria-label="Tiến trình sao màn hiện tại"><span data-triple-stars class="star-progress__stars" role="img" aria-label="0 trên 3 sao"><span class="star-progress__milestone" aria-hidden="true">★</span><span class="star-progress__milestone" aria-hidden="true">★</span><span class="star-progress__milestone" aria-hidden="true">★</span></span><span class="star-progress__track"><span data-triple-stars-fill class="star-progress__fill"></span></span></span><span class="info stat-card stat-points"><span class="stat-label">ĐIỂM</span><span data-triple-stat="score">0</span></span><span class="info stat-card stat-progress"><span data-triple-icon="trophy"></span><span data-triple-stat="matched">0</span>/<span data-triple-total>4</span></span><span class="info stat-card stat-hints" aria-label="Lượt gợi ý còn lại"><span data-triple-icon="search"></span><span data-triple-stat="hint">0</span></span></div>
    <div data-shell-region="hud" class="triple-connect__hud triple-game-hud game-hud"><button id="triple-actions-menu-toggle" class="game-menu-toggle" type="button" aria-label="Mở menu chức năng" aria-controls="triple-actions-menu" aria-expanded="false"></button><div id="triple-actions-menu" class="game-actions-menu" hidden><button class="game-action-item" type="button" data-triple-action="restart">Chơi lại</button><button class="game-action-item" type="button" data-triple-action="menu">Menu</button><button class="game-action-item" type="button" data-triple-action="settings">Cài đặt</button><button class="game-action-item" type="button" data-triple-action="shop">Cửa hàng</button><button class="game-action-item" type="button" data-triple-action="collection">Bộ sưu tập</button><button class="game-action-item" type="button" data-triple-action="help">Hướng dẫn</button><button class="game-action-item" type="button" data-triple-action="info">Thông tin</button><button class="game-action-item" type="button" data-triple-action="reset">Xóa dữ liệu</button></div><div class="game-stats" aria-label="Thông tin màn chơi"><span class="info stat-card stat-level"><span class="stat-label">LV</span><span data-triple-level>1</span></span><span class="info stat-card stat-timer"><span data-triple-icon="timer"></span><span data-triple-timer>01:00</span></span><span class="info stat-card stat-score"><span data-triple-icon="star"></span><span data-triple-total-stars>0</span></span></div><button id="triple-tools-toggle" class="triple-tools-toggle" type="button" aria-label="Mở công cụ hỗ trợ" aria-controls="triple-tools-menu" aria-expanded="false"></button><div id="triple-tools-menu" class="triple-tools-menu" hidden><div class="triple-connect__items" aria-label="Vật phẩm hỗ trợ"></div></div></div>
    <section data-shell-region="milestones" class="triple-connect__milestones" aria-label="Mốc thưởng Triple"><span class="triple-connect__milestone-coins game-coin-hud"><span data-triple-icon="coin"></span><strong data-triple-milestone-coins>0</strong></span><div class="triple-connect__milestone-track" data-triple-milestone-track>${Array.from({ length: 10 }, (_, index) => `<span data-triple-milestone="${index + 1}" style="--triple-milestone-position:${5 + index * 10}%">${index + 1}</span>`).join("")}</div></section>
    <div data-shell-region="frame" class="triple-connect__frame"><div data-shell-region="board" class="triple-connect__surface"><div class="triple-connect__board"></div><svg class="triple-connect__line" aria-hidden="true"></svg><div class="triple-connect__tray" aria-label="Khay 7 ô"></div></div></div>`;
  document.querySelector(".main-wrapper").append(root);
  root.querySelectorAll("[data-triple-icon]").forEach((element) => element.append(createIcon(element.dataset.tripleIcon)));
  root.querySelector("#triple-tools-toggle").append(createIcon("wand"));
  root.querySelector("#triple-actions-menu-toggle").append(createIcon("menu"));
  const actionIcons = { restart: "restart", menu: "home", collection: "collection", shop: "shop", settings: "settings", help: "book", info: "info", reset: "wand" };
  root.querySelectorAll("[data-triple-action]").forEach((button) => button.prepend(createIcon(actionIcons[button.dataset.tripleAction])));
  const items = root.querySelector(".triple-connect__items");
  TRIPLE_ITEMS.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.tripleItem = item.id;
    button.textContent = item.title;
    const count = document.createElement("b");
    count.dataset.tripleItemCount = item.id;
    button.append(count);
    items.append(button);
  });
  const regions = Object.fromEntries([...root.querySelectorAll("[data-shell-region]")].map(node => [node.dataset.shellRegion, node]));
  shell = createGameShell({ root, regions, title: "Triple Connect" });
  return shell;
}

export function getTripleHudElements() {
  const root = getTripleShell().refs.root;
  const find = (selector) => root.querySelector(selector);
  return {
    root,
    gameHud: find(".triple-game-hud"),
    level: find("[data-triple-level]"),
    timer: find("[data-triple-timer]"),
    totalStars: find("[data-triple-total-stars]"),
    moves: find('[data-triple-stat="moves"]'),
    misses: find('[data-triple-stat="misses"]'),
    combo: find('[data-triple-stat="combo"]'),
    score: find('[data-triple-stat="score"]'),
    matchedTriples: find('[data-triple-stat="matched"]'),
    totalTriples: find("[data-triple-total]"),
    hint: find('[data-triple-stat="hint"]'),
    stars: find("[data-triple-stars]"),
    starsFill: find("[data-triple-stars-fill]"),
    starsCard: find(".stat-star-progress"),
    scoreCard: find(".stat-points"),
    toolsToggle: find("#triple-tools-toggle"),
    itemCounts: [...root.querySelectorAll("[data-triple-item-count]")],
    milestoneCoins: find("[data-triple-milestone-coins]"),
    milestoneTrack: find("[data-triple-milestone-track]"),
    milestones: [...root.querySelectorAll("[data-triple-milestone]")],
  };
}

export function getTripleHud(elements = getTripleHudElements()) {
  if (tripleHud.has(elements.root)) return tripleHud.get(elements.root);
  const stats = Object.fromEntries(["level", "timer", "totalStars", "moves", "misses", "combo", "score", "matchedTriples", "totalTriples", "hint"].map((key) => [key, { element: elements[key] }]));
  stats.timer.format = formatClockTime;
  const toolCopy = { hint: "Chỉ ra thẻ có thể ghép bộ ba.", time: "Thêm một giây vào đồng hồ.", undo: "Hoàn tác lượt chọn gần nhất.", shuffle: "Xáo vị trí các thẻ còn lại." };
  const tools = Object.fromEntries(elements.itemCounts.map((count) => {
    const key = count.dataset.tripleItemCount;
    return [key, { count, element: count.closest("button"), tooltip: toolCopy[key] }];
  }));
  tools.toggle = { element: elements.toolsToggle, tooltip: "Dùng vật phẩm khi cần trợ giúp." };
  const component = createGameShellHud({
    stats,
    tools,
    stars: { element: elements.stars, fill: elements.starsFill, card: elements.starsCard, scoreCard: elements.scoreCard },
    coins: { element: elements.milestoneCoins?.closest(".game-coin-hud"), balance: elements.milestoneCoins },
    milestones: { track: elements.milestoneTrack, markers: elements.milestones, step: 3, format: (progress, target) => `Tiến trình mốc: ${progress}/${target}` },
  });
  tripleHud.set(elements.root, component);
  return component;
}
