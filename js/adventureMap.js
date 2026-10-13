import { gameState } from "./gameState.js";
import { GAME_MODES, getGameDefinition, getGameModeLabel } from "./gameCatalog.js";
import { MAP_LEVEL_STEP, getMapLevelPoint, getMapChestPoint, createMapDecorations } from "./adventureMapLayout.js";
import { decorateAdventureMenu, refreshAppWallet } from "./appNavigation.js";
import { prepareAdventureChapter } from "./adventureLaunch.js";
import { createAdventureChapterNodes, getAdventureSummary, getAdventureLevelState, getAdventureChestState, isNormalAdventureMode } from "./adventureProgress.js";
import { loadPersistentChapter } from "./persistence.js";
import { claimAdventureChest } from "./adventureRewards.js";
import { openAppModal, showAppToast } from "./modal.js";
import { canLaunchGame } from "./profileOperations.js";

const views = new Map(); // One bounded view per released game, independent of durable progress.
const MAP_TEXTURE_HEIGHT = 660;
let adapters = {};
export function configureAdventureMap(options) {
  adapters = options.adapters;
}

export function mountAdventureMap(gameId) {
  const game = getGameDefinition(gameId);
  const adapter = adapters[gameId];
  if (!game || !adapter) throw new RangeError("Missing adventure navigation adapter.");
  const profile = gameState.progress[game.progressKey];
  const frontier = profile.adventure || getAdventureSummary(profile.bestByLevel);
  const view = views.get(gameId) || { mode: "easy", chapter: frontier.currentChapter, scroll: null };
  view.chapter = frontier.currentChapter;
  view.scroll = null; view.anchor = null;
  views.set(gameId, view);
  const root = document.createElement("section");
  root.id = "menu-container";
  root.className = `adventure-map-page ${gameId}-menu`;
  const body = document.createElement("main");
  body.className = "adventure-map-view";
  const scroll = document.createElement("div");
  scroll.className = "adventure-map-scroll";
  scroll.setAttribute("aria-label", "Bản đồ màn chơi");
  scroll.tabIndex = 0;
  const trail = document.createElement("div");
  trail.className = "adventure-map-trail";
  scroll.append(trail);
  body.append(scroll);
  root.append(body);
  document.body.append(root);
  const scope = decorateAdventureMenu(root, { gameId });
  root.classList.add("game-shell-tokens");
  const title = document.createElement("h1");
  title.className = "adventure-map-title";
  title.textContent = game.title;
  root.querySelector(".adventure-header").insertBefore(title, root.querySelector(".adventure-wallet"));
  const selector = document.createElement("div");
  selector.className = "adventure-mode-selector";
  const modeButton = button("", "adventure-mode-toggle");
  modeButton.setAttribute("aria-haspopup", "menu");
  modeButton.setAttribute("aria-expanded", "false");
  modeButton.setAttribute("aria-controls", "adventure-mode-menu");
  const modes = document.createElement("div");
  modes.id = "adventure-mode-menu";
  modes.className = "adventure-mode-menu";
  modes.setAttribute("role", "menu");
  modes.setAttribute("aria-label", "Chọn chế độ");
  modes.hidden = true;
  for (const mode of GAME_MODES) {
    const option = button(mode.label, "adventure-mode-option");
    option.dataset.mode = mode.id;
    option.setAttribute("role", "menuitemradio");
    option.tabIndex = -1;
    modes.append(option);
  }
  selector.append(modeButton, modes);
  root.querySelector(".adventure-footer").prepend(selector);
  function closeModes(focus = false) {
    modes.hidden = true; modeButton.setAttribute("aria-expanded", "false");
    if (focus) modeButton.focus();
  }
  function showModes() {
    modes.hidden = false; modeButton.setAttribute("aria-expanded", "true");
    (modes.querySelector('[aria-checked="true"]') || modes.firstElementChild).focus();
  }
  scope.listen(modeButton, "click", () => modes.hidden ? showModes() : closeModes());
  scope.listen(modeButton, "keydown", event => {
    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation(); showModes();
  });
  scope.listen(document, "pointerdown", event => { if (!selector.contains(event.target)) closeModes(); });
  scope.listen(selector, "focusout", event => { if (!selector.contains(event.relatedTarget)) closeModes(); });
  scope.listen(modes, "click", event => {
    const option = event.target.closest("[data-mode]");
    if (!option || loading) return;
    closeModes(true);
    if (!isNormalAdventureMode(option.dataset.mode)) { openSpecialMode(option.dataset.mode); return; }
    view.mode = option.dataset.mode; patchNodes();
  });
  scope.listen(selector, "keydown", event => {
    if (event.key === "Escape") { closeModes(true); return; }
    if (modes.hidden || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = [...modes.children];
    const index = items.indexOf(document.activeElement);
    const target = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length;
    items[target].focus();
  });
  let chapterGeneration = 0;
  let renderedNodes = [];
  let loading = false;
  let adjacentBest = {};
  let adjacentChests = {};
  let extraLevels = [];
  let topLevel = view.chapter * 100;
  let bottomLevel = topLevel - 99;
  const step = MAP_LEVEL_STEP;
  const position = level => getMapLevelPoint(gameId, level, topLevel);
  function mapNodes() {
    const summary = profile.adventure || getAdventureSummary(profile.bestByLevel);
    const best = { ...adjacentBest, ...profile.bestByLevel };
    const chests = { ...adjacentChests, ...profile.claimedChests };
    const nodes = createAdventureChapterNodes(best, view.mode, view.chapter, chests, summary);
    for (const level of extraLevels) {
      nodes.push({ kind: "level", ...getAdventureLevelState(best, view.mode, level, summary) });
      if (level % 10 === 0) nodes.push({ kind: "chest", ...getAdventureChestState(best, level / 10, chests) });
    }
    return nodes.sort((a, b) => (b.level || b.lastLevel) - (a.level || a.lastLevel) || (a.kind === "chest" ? -1 : 1));
  }

  function currentLevelInMap(summary) {
    for (let level = summary.lastLevel; level >= summary.firstLevel; level -= 1) {
      if (!getAdventureLevelState(profile.bestByLevel, view.mode, level, summary).locked) return level;
    }
    return summary.firstLevel;
  }

  function patchNodes() {
    if (!scope.active || loading) return;
    const summary = profile.adventure || getAdventureSummary(profile.bestByLevel);
    const currentLevel = currentLevelInMap(summary);
    const nodes = mapNodes();
    nodes.forEach((node, index) => {
      const element = renderedNodes[index];
      element.node = node;
      const control = element.control;
      if (node.kind === "level") {
        control.disabled = node.locked;
        control.classList.toggle("is-cleared", node.cleared);
        control.classList.toggle("is-mode-cleared", node.modeCleared);
        control.classList.toggle("is-current", node.level === currentLevel);
        element.stars.textContent = "★".repeat(node.stars) + "☆".repeat(3 - node.stars);
        element.detail.textContent = node.modeCleared ? `${node.score.toLocaleString("vi-VN")} điểm` : node.cleared ? "Đã thắng ở độ khó khác" : "";
        control.setAttribute("aria-label", `Màn ${node.level}, ${node.locked ? "chưa mở" : node.cleared ? "đã thắng" : "đã mở"}, ${node.stars} sao`);
      } else {
        control.disabled = false;
        control.classList.toggle("is-claimed", node.claimed);
        control.classList.toggle("is-ready", node.eligible);
        element.detail.textContent = node.claimed ? "Đã nhận" : `${node.completedCount}/10 màn`;
        control.setAttribute("aria-label", `Rương ${node.chestNumber}, ${element.detail.textContent}`);
      }
    });
    for (const tab of modes.children) {
      const selected = tab.dataset.mode === view.mode;
      tab.setAttribute("aria-checked", String(selected));
    }
    modeButton.textContent = `Chế độ: ${getGameModeLabel(view.mode)} ▾`;
  }

  async function renderChapter() {
    const generation = ++chapterGeneration;
    loading = true;
    root.dataset.mapReady = "false";
    body.setAttribute("aria-busy", "true");
    modeButton.disabled = true;
    if (!await prepareAdventureChapter(gameId, view.chapter, () => scope.active && generation === chapterGeneration)) return;
    const neighbors = [view.chapter - 1, view.chapter + 1].filter(chapter => chapter >= 1 && chapter <= profile.adventure.currentChapter);
    const records = await Promise.all(neighbors.map(chapter => loadPersistentChapter(game.progressKey, chapter)));
    if (!scope.active || generation !== chapterGeneration) return;
    adjacentBest = {}; adjacentChests = {}; extraLevels = [];
    neighbors.forEach((chapter, index) => {
      Object.assign(adjacentBest, records[index].bestByLevel);
      Object.assign(adjacentChests, records[index].claimedChests);
      const first = chapter < view.chapter ? chapter * 100 - 4 : (chapter - 1) * 100 + 1;
      for (let level = first; level < first + 5; level += 1) extraLevels.push(level);
    });
    topLevel = view.chapter * 100 + (neighbors.includes(view.chapter + 1) ? 5 : 0);
    bottomLevel = (view.chapter - 1) * 100 + 1 - (neighbors.includes(view.chapter - 1) ? 5 : 0);
    trail.style.setProperty("--adventure-map-texture-height", `${MAP_TEXTURE_HEIGHT}px`);
    trail.style.backgroundPositionY = `${((topLevel % MAP_TEXTURE_HEIGHT) * step) % MAP_TEXTURE_HEIGHT}px`;
    const nodes = mapNodes();
    renderedNodes = [];
    trail.replaceChildren();
    const path = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    path.classList.add("adventure-map-path");
    const levelNodes = nodes.filter(node => node.kind === "level");
    const height = levelNodes.length * step + 60;
    path.setAttribute("viewBox", `0 0 400 ${height}`);
    path.setAttribute("preserveAspectRatio", "none");
    path.setAttribute("aria-hidden", "true");
    const line = document.createElementNS(path.namespaceURI, "path");
    const points = levelNodes.map(node => position(node.level));
    line.setAttribute("d", points.reduce((d, point, index) => index === 0 ? `M ${point.x} ${point.y}` : `${d} C ${points[index - 1].x} ${point.y - step / 2} ${point.x} ${point.y - step / 2} ${point.x} ${point.y}`, ""));
    const ornament = line.cloneNode();
    ornament.classList.add("adventure-map-path-ornament");
    path.append(line, ornament);
    trail.append(path);
    trail.style.height = `${height}px`;
    const scenery = document.createDocumentFragment();
    for (const decoration of createMapDecorations(gameId, bottomLevel, topLevel)) {
      const sprite = document.createElement("span");
      sprite.className = "adventure-map-decoration adventure-map-sprite";
      sprite.setAttribute("aria-hidden", "true");
      sprite.dataset.scenery = String(decoration.id);
      sprite.style.left = `${decoration.x / 4}%`;
      sprite.style.top = `${decoration.y}px`;
      sprite.style.width = `${decoration.size / 4}%`;
      sprite.style.backgroundPosition = `${(decoration.slot % 4) * 100 / 3}% ${Math.floor(decoration.slot / 4) * 100 / 3}%`;
      scenery.append(sprite);
    }
    trail.append(scenery);
    nodes.forEach((node, index) => {
      const cell = document.createElement("div");
      cell.className = "adventure-map-cell";
      const point = node.kind === "level" ? position(node.level) : getMapChestPoint(gameId, node.chestNumber, topLevel);
      cell.style.top = `${point.y - (node.kind === "level" ? 22 : 32)}px`;
      cell.style.left = `${point.x / 4}%`;
      cell.classList.toggle("adventure-map-cell--chest", node.kind === "chest");
      const control = button(node.kind === "level" ? String(node.level) : "", `adventure-map-node adventure-map-node--${node.kind}`);
      const stars = document.createElement("span");
      stars.className = "adventure-map-stars";
      const detail = document.createElement("small");
      detail.className = "adventure-map-detail";
      if (node.kind === "level") control.dataset.level = String(node.level);
      else {
        control.dataset.chest = String(node.chestNumber);
        const art = document.createElement("span");
        art.className = "adventure-map-chest-art adventure-map-sprite";
        art.setAttribute("aria-hidden", "true");
        control.append(art);
      }
      cell.append(control, stars, detail);
      trail.append(cell);
      renderedNodes.push({ node, control, stars, detail });
    });
    root.dataset.mapChapter = String(view.chapter);
    modeButton.disabled = false;
    loading = false;
    patchNodes();
    body.removeAttribute("aria-busy");
    root.dataset.mapReady = "true";
    if (view.anchor) {
      scroll.scrollTop = position(view.anchor.level).y - view.anchor.screenY;
      view.anchor = null;
    } else if (view.scroll === null) {
      const currentLevel = currentLevelInMap(profile.adventure);
      scroll.scrollTop = view.chapter === profile.adventure.currentChapter ? Math.max(0, position(currentLevel).y - scroll.clientHeight * .5) : scroll.scrollHeight;
    }
    else scroll.scrollTop = view.scroll;
  }

  async function launch(mode, level) {
    if (!scope.active || loading || !canLaunchGame()) return false;
    loading = true;
    modeButton.disabled = true;
    body.setAttribute("aria-busy", "true");
    try { return await adapter.launch({ mode, level }); }
    catch (error) {
      console.error("Level launch failed", error);
      if (scope.active) showAppToast("Chưa mở được màn chơi. Hãy thử lại.");
      return false;
    } finally {
      if (scope.active) { loading = false; modeButton.disabled = false; body.removeAttribute("aria-busy"); }
    }
  }
  function openLevel(level) { return launch(view.mode, level); }
  function openSpecialMode(mode) { return launch(mode, 1); }

  function openChest(node) {
    const outcome = profile.claimedChests?.[node.chestNumber] || adjacentChests[node.chestNumber];
    const describe = reward => reward.grants.map(grant => `${grant.amount} Xu`).join(" · ");
    openAppModal({ id: "adventure-chest-modal", title: `Rương ${node.chestNumber}`, icon: "collection", content: `<p>${outcome ? describe(outcome) : `Thắng đủ màn ${node.firstLevel}–${node.lastLevel} để nhận rương (${node.completedCount}/10).`}</p>`, actions: node.eligible ? [{ label: "Nhận thưởng", variant: "primary", onClick: async () => {
      const reward = await claimAdventureChest(gameId, node.chestNumber);
      if (!scope.active) return false;
      if (!reward) { showAppToast("Chưa nhận được rương. Bản lưu vẫn được bảo vệ."); return false; }
      patchNodes(); refreshAppWallet();
      openAppModal({ id: "adventure-chest-modal", title: "Đã nhận thưởng", icon: "coin", content: `<p>${describe(reward)}</p>` });
      return false;
    } }] : [] });
  }

  scope.listen(trail, "click", event => {
    if (loading) return;
    const control = event.target.closest(".adventure-map-node");
    if (!control || control.disabled) return;
    const entry = renderedNodes.find(candidate => candidate.control === control);
    if (entry.node.kind === "level") openLevel(entry.node.level);
    else openChest(entry.node);
  });
  scope.listen(scroll, "scroll", () => { if (!loading) view.scroll = scroll.scrollTop; }, { passive: true });
  const changeChapter = (direction, continuous = false) => {
    if (loading) return;
    const candidate = view.chapter + direction;
    if (candidate < 1 || candidate > profile.adventure.currentChapter) return;
    if (continuous) {
      const level = direction > 0 ? topLevel : bottomLevel;
      view.anchor = { level, screenY: position(level).y - scroll.scrollTop };
    }
    view.chapter = candidate; view.scroll = null;
    void renderChapter().catch(error => { if (scope.active) { console.error("Map load failed", error); showAppToast("Chưa tải được chặng này."); } });
  };
  // Rebase at chapter boundaries: DOM/scroll height remain bounded independently of history.
  scope.listen(scroll, "wheel", event => {
    if (loading) return;
    if (event.deltaY < 0 && scroll.scrollTop < 2 && view.chapter < profile.adventure.currentChapter) { event.preventDefault(); changeChapter(1, true); }
    else if (event.deltaY > 0 && scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop < 2 && view.chapter > 1) { event.preventDefault(); changeChapter(-1, true); }
  }, { passive: false });
  scope.listen(scroll, "keydown", event => {
    if (event.target !== scroll || loading) return;
    if (["ArrowUp", "PageUp"].includes(event.key) && scroll.scrollTop < 2 && view.chapter < profile.adventure.currentChapter) {
      event.preventDefault(); changeChapter(1, true);
    } else if (["ArrowDown", "PageDown"].includes(event.key) && scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop < 2 && view.chapter > 1) {
      event.preventDefault(); changeChapter(-1, true);
    }
  });
  let touchY = null;
  scope.listen(scroll, "touchstart", event => { touchY = event.touches[0]?.clientY ?? null; }, { passive: true });
  scope.listen(scroll, "touchend", event => {
    const y = event.changedTouches[0]?.clientY;
    if (touchY === null || !Number.isFinite(y) || Math.abs(y - touchY) < 24) return;
    if (y > touchY && scroll.scrollTop < 2) changeChapter(1, true);
    else if (y < touchY && scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop < 2) changeChapter(-1, true);
    touchY = null;
  }, { passive: true });
  scope.own(() => { if (!loading) view.scroll = scroll.scrollTop; renderedNodes = []; adjacentBest = {}; adjacentChests = {}; extraLevels = []; });
  void renderChapter().catch(error => { if (scope.active) { console.error("Map load failed", error); showAppToast("Chưa tải được bản đồ. Hãy tải lại trang."); } });
  return root;
}

function button(text, className) {
  const element = document.createElement("button");
  element.type = "button"; element.className = className; element.textContent = text;
  return element;
}
