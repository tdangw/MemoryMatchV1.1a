import { getTheme } from "./themeCatalog.js";
import { getEquippedThemeId } from "./appearance.js";
import { createIcon } from "./icons.js";
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
  root.querySelector(".adventure-header").insertBefore(title, root.querySelector(".adventure-account"));
  const specials = document.createElement("nav");
  specials.className = "adventure-special-modes";
  specials.setAttribute("aria-label", "Chế độ đặc biệt");
  for (const mode of GAME_MODES.filter(mode => !isNormalAdventureMode(mode.id))) {
    const control = button("", "adventure-special-mode");
    control.dataset.specialMode = mode.id;
    control.setAttribute("aria-label", mode.label);
    control.append(createIcon(mode.id === "endless" ? "infinity" : "energy"));
    const label = document.createElement("span"); label.textContent = mode.label;
    control.append(label); specials.append(control);
    scope.listen(control, "click", () => openSpecialMode(mode.id));
  }
  body.append(specials);
  function setBusy(busy) {
    loading = busy;
    for (const control of specials.children) control.disabled = busy;
    for (const control of document.querySelectorAll('#adventure-level-modal input')) control.disabled = busy;
    if (busy) body.setAttribute("aria-busy", "true");
    else body.removeAttribute("aria-busy");
  }
  let chapterGeneration = 0;
  let renderedNodes = [];
  let loading = false;
  let adjacentBest = {};
  let adjacentChests = {};
  let adjacentStarted = {};
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
        element.detail.textContent = '';
        control.setAttribute("aria-label", `Màn ${node.level}, ${node.locked ? "chưa mở" : node.cleared ? "đã thắng" : "đã mở"}, ${node.stars} sao`);
      } else {
        control.disabled = false;
        control.classList.toggle("is-claimed", node.claimed);
        control.classList.toggle("is-ready", node.eligible);
        element.detail.textContent = node.claimed ? "Đã nhận" : `${node.completedCount}/10 màn`;
        control.setAttribute("aria-label", `Rương ${node.chestNumber}, ${element.detail.textContent}`);
      }
    });

  }

  async function renderChapter() {
    const generation = ++chapterGeneration;
    setBusy(true);
    root.dataset.mapReady = "false";
    if (!await prepareAdventureChapter(gameId, view.chapter, () => scope.active && generation === chapterGeneration)) return;
    const neighbors = [view.chapter - 1, view.chapter + 1].filter(chapter => chapter >= 1 && chapter <= profile.adventure.currentChapter);
    const records = await Promise.all(neighbors.map(chapter => loadPersistentChapter(game.progressKey, chapter)));
    if (!scope.active || generation !== chapterGeneration) return;
    adjacentBest = {}; adjacentChests = {}; adjacentStarted = {}; extraLevels = [];
    neighbors.forEach((chapter, index) => {
      Object.assign(adjacentBest, records[index].bestByLevel);
      Object.assign(adjacentChests, records[index].claimedChests);
      Object.assign(adjacentStarted, records[index].startedLevels);
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
      const control = button("", `adventure-map-node adventure-map-node--${node.kind}`);
      const stars = document.createElement("span");
      stars.className = "adventure-map-stars";
      const detail = document.createElement("small");
      detail.className = "adventure-map-detail";
      if (node.kind === "level") {
        control.dataset.level = String(node.level);
        const number = document.createElement("span"); number.className = "adventure-level-number";
        number.textContent = String(node.level);
        number.style.fontSize = `${Math.min(15, 52 / number.textContent.length)}px`;
        control.append(number);
      }
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
    setBusy(false);
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

  async function launch(mode, level, { skipIntro = false } = {}) {
    if (!scope.active || loading || !canLaunchGame()) return false;
    setBusy(true);
    try { return await adapter.launch({ mode, level, skipIntro }); }
    catch (error) {
      console.error("Level launch failed", error);
      if (scope.active) showAppToast("Chưa mở được màn chơi. Hãy thử lại.");
      return false;
    } finally {
      if (scope.active) setBusy(false);
    }
  }
  function openLevel(level, specialMode = null) {
    if (!scope.active || loading) return;
    const selectedMode = () => specialMode || view.mode;
    const title = () => specialMode ? `${getGameModeLabel(specialMode)} · Màn ${level}` : `Màn ${level} · ${getGameModeLabel(view.mode)}`;
    const content = document.createElement("div");
    content.className = "adventure-level-preview";
    const goal = document.createElement("p"); goal.className = "adventure-level-goal";
    goal.textContent = adapter.goal;
    const choices = document.createElement("fieldset"); choices.className = "adventure-level-modes";
    const legend = document.createElement("legend"); legend.textContent = "Chọn độ khó";
    choices.append(legend);
    for (const [index, mode] of (specialMode ? [] : GAME_MODES.filter(mode => isNormalAdventureMode(mode.id))).entries()) {
      const label = document.createElement("label");
      label.dataset.grade = ["C", "B", "A", "S"][index]; label.title = mode.label;
      const input = document.createElement("input");
      input.type = "radio"; input.name = "adventure-level-mode"; input.value = mode.id;
      input.checked = mode.id === view.mode;
      input.setAttribute("aria-label", mode.label);
      const text = document.createElement("span"); text.textContent = label.dataset.grade;
      label.append(input, text); choices.append(label);
    }
    const details = document.createElement("ul"); details.className = "adventure-level-details";
    details.setAttribute("aria-live", "polite");
    function updatePreview() {
      const info = adapter.preview({ mode: selectedMode(), level, startedLevels: { ...adjacentStarted, ...profile.startedLevels } });
      const theme = getTheme(getEquippedThemeId(gameState.appearance, gameId));
      goal.textContent = info.goal || adapter.goal;
      details.replaceChildren(...[
        `Thời gian: ${info.timeSeconds === 0 ? "Không giới hạn" : `${info.timeSeconds} giây`}`,
        `Mục tiêu: ${info.target}`,
        `Gợi ý: ${info.hints}${info.assistNote ? ` · ${info.assistNote}` : ""}`,
        `Chủ đề: ${theme.title}`,
      ].map(text => { const row = document.createElement("li"); row.textContent = text; return row; }));
    }
    updatePreview();
    if (!specialMode) content.append(choices);
    content.append(goal, details);
    if (specialMode) {
      const rules = document.createElement("p");
      rules.className = "adventure-level-goal";
      rules.textContent = "Mỗi lượt mới bắt đầu từ màn 1. Xếp hạng theo màn cao nhất đã vượt qua trong một lượt.";
      content.append(rules);
    }
    const release = specialMode ? undefined : scope.listen(choices, "change", event => {
      if (loading || !isNormalAdventureMode(event.target.value)) return;
      view.mode = event.target.value; patchNodes(); updatePreview();
      modal.panel.querySelector(".app-modal__title").lastChild.textContent = title();
      modal.panel.setAttribute("aria-label", `${game.title} · ${title()}`);
    });
    const modal = openAppModal({ id: "adventure-level-modal", title: title(), content, owner: scope,
      onDestroy: release,
      actions: [{ label: "Chơi", variant: "primary", onClick: async () => await launch(selectedMode(), level, { skipIntro: true }) ? undefined : false }],
    });
    modal.panel.classList.add("adventure-level-dialog");
    modal.panel.setAttribute("aria-label", `${game.title} · ${title()}`);
  }
  function openSpecialMode(mode) { openLevel(1, mode); }

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
  scope.own(() => { if (!loading) view.scroll = scroll.scrollTop; renderedNodes = []; adjacentBest = {}; adjacentChests = {}; adjacentStarted = {}; extraLevels = []; });
  void renderChapter().catch(error => { if (scope.active) { console.error("Map load failed", error); showAppToast("Chưa tải được bản đồ. Hãy tải lại trang."); } });
  return root;
}

function button(text, className) {
  const element = document.createElement("button");
  element.type = "button"; element.className = className; element.textContent = text;
  return element;
}
