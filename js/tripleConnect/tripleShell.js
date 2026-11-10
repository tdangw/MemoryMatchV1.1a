import { createGameShell } from "../gameShell/gameShell.js";
import { createGameShellHud } from "../gameShell/gameShellHud.js";
import { createIcon } from "../icons.js";
import { TRIPLE_ITEMS } from "./tripleItems.js";
import { formatClockTime } from "../uiCatalog.js";
import { TRIPLE_PRODUCT_DECISIONS, TRIPLE_TIME_ITEM_SECONDS } from "./tripleConfig.js";

let shell;
const tripleHud = new WeakMap();

export function getTripleShell() {
  if (shell) return shell;
  const root = document.createElement("section");
  root.id = "triple-connect-container";
  root.className = "triple-connect-game";
  root.hidden = true;
  root.innerHTML = `<header data-shell-region="title" class="triple-connect__title game-name"><span class="game-wordmark" data-wordmark-game="triple-connect">Triple Connect</span></header>
    <div data-shell-region="progress" class="triple-connect__progress" hidden></div>
    <div data-shell-region="hud" class="triple-connect__hud triple-game-hud game-hud"><button id="triple-actions-menu-toggle" data-triple-icon="menu" class="game-menu-toggle" type="button" aria-label="Tạm dừng" aria-controls="game-exit-modal" aria-haspopup="dialog" aria-expanded="false"></button><div class="game-stats game-hud__stats" aria-label="Thông tin màn chơi"><div class="game-hud__stats-group game-hud__stats-group--left"><span class="info stat-card game-hud__metric stat-moves"><span class="stat-label">LƯỢT</span><span data-triple-stat="moves">0</span></span><span class="info stat-card game-hud__metric stat-misses"><span class="stat-label">SAI</span><span data-triple-stat="misses">0</span></span></div><div class="game-hud__stats-group game-hud__stats-group--center"><span class="info stat-card game-hud__metric stat-level"><span class="stat-label">MÀN</span><span data-triple-level>1</span></span><span class="info stat-card game-hud__metric stat-timer"><span class="stat-label">THỜI GIAN</span><span data-triple-timer>01:00</span></span><span class="info stat-card game-hud__metric stat-stars"><span class="stat-label"><span data-triple-icon="star"></span></span><span data-triple-total-stars>0</span></span></div><div class="game-hud__stats-group game-hud__stats-group--right"><span class="info stat-card game-hud__metric stat-combo"><span class="stat-label">CHUỖI</span><span data-triple-stat="combo">0</span><span class="combo-window-progress" aria-hidden="true"></span></span><span class="info stat-card game-hud__metric stat-points"><span class="stat-label">ĐIỂM</span><span data-triple-stat="score" class="game-hud__score-value">0</span></span></div></div><button id="triple-tools-toggle" data-triple-icon="wand" class="triple-tools-toggle" type="button" aria-label="Mở công cụ hỗ trợ" aria-controls="triple-tools-menu" aria-expanded="false"></button><div id="triple-tools-menu" class="triple-tools-menu" hidden><div class="triple-connect__items hud-tool-list" aria-label="Vật phẩm hỗ trợ">${TRIPLE_ITEMS.map(item => `<button type="button" data-triple-item="${item.id}" data-triple-icon="${item.icon}" class="hud-tool-item"><span>${item.title}</span><b data-triple-item-count="${item.id}" class="hud-tool-count"></b></button>`).join('')}</div></div></div>
    <section data-shell-region="milestones" class="triple-connect__milestones" aria-label="Mốc thưởng Triple"><span class="triple-connect__milestone-coins game-coin-hud"><span data-triple-icon="coin"></span><strong data-triple-milestone-coins>0</strong></span><div class="triple-connect__milestone-track" data-triple-milestone-track>${TRIPLE_PRODUCT_DECISIONS.milestones.rewards.map((_, index) => `<span data-triple-milestone="${index + 1}" style="--triple-milestone-position:${5 + index * 10}%">${index + 1}</span>`).join("")}</div><span class="game-milestone-stars stat-star-progress" aria-label="Tiến trình sao màn hiện tại"><span data-triple-stars class="star-progress__stars" role="img" aria-label="0 trên 3 sao"><span class="star-progress__milestone" aria-hidden="true" data-triple-icon="star"></span><span class="star-progress__milestone" aria-hidden="true" data-triple-icon="star"></span><span class="star-progress__milestone" aria-hidden="true" data-triple-icon="star"></span></span><span class="star-progress__track"><span data-triple-stars-fill class="star-progress__fill"></span></span></span></section>
    <div data-shell-region="frame" class="triple-connect__frame"><div data-shell-region="board" class="triple-connect__surface"><div class="triple-connect__board"></div><svg class="triple-connect__line" aria-hidden="true"></svg><div class="triple-connect__tray-divider" aria-hidden="true"><span>◆</span></div><div class="triple-connect__tray" aria-label="Khay 10 ô, 3 ô đang khóa"></div></div></div>`;
  const regions = Object.fromEntries([...root.querySelectorAll("[data-shell-region]")].map(node => [node.dataset.shellRegion, node]));
  shell = createGameShell({ root, regions, title: "Triple Connect", backgroundScene: 'triple-connect' });
  document.querySelector(".main-wrapper").append(root);
  return shell;
}

/** Complete cached shell artwork within the cancellable startup batch budget. */
export async function prepareTripleShellArtwork(startup) {
  const targets = getTripleShell().refs.root.querySelectorAll('[data-triple-icon]');
  await startup.batch(targets, target => {
    if (!target.querySelector(':scope > .ui-icon')) target.prepend(createIcon(target.dataset.tripleIcon));
  });
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
    comboCard: find(".stat-combo"),
    score: find('[data-triple-stat="score"]'),
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
  const stats = Object.fromEntries(["level", "timer", "totalStars", "moves", "misses", "combo", "score"].map((key) => [key, { element: elements[key] }]));
  stats.timer.format = formatClockTime;
  const toolCopy = { hint: "Chỉ ra thẻ có thể ghép bộ ba.", time: `Thêm ${TRIPLE_TIME_ITEM_SECONDS} giây vào đồng hồ.`, undo: "Hoàn tác lượt chọn gần nhất.", shuffle: "Xáo vị trí các thẻ còn lại." };
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
    milestones: { track: elements.milestoneTrack, markers: elements.milestones, step: 3, format: (progress, target) => `Tiến trình phần thưởng: ${progress}/${target}` },
  });
  tripleHud.set(elements.root, component);
  return component;
}
