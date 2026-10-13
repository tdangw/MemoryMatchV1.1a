import { gameState } from "./gameState.js";
import { GAME_MODES, getGameDefinition, getGameModeLabel } from "./gameCatalog.js";
import { createIcon } from "./icons.js";
import { decorateAdventureMenu, refreshAppWallet } from "./appNavigation.js";
import { prepareAdventureChapter } from "./adventureLaunch.js";
import { createAdventureChapterNodes, getAdventureSummary, isNormalAdventureMode } from "./adventureProgress.js";
import { claimAdventureChest } from "./adventureRewards.js";
import { getActiveSessions } from "./sessionProgress.js";
import { getEquippedThemeId } from "./appearance.js";
import { getTheme } from "./themeCatalog.js";
import { openAppModal, showAppToast } from "./modal.js";
import { canLaunchGame } from "./profileOperations.js";

const views = new Map(); // One bounded view per released game, independent of durable progress.
let adapters = {};
let onHome = () => {};
export function configureAdventureMap(options) {
  adapters = options.adapters;
  onHome = options.onHome;
}

export function mountAdventureMap(gameId) {
  const game = getGameDefinition(gameId);
  const adapter = adapters[gameId];
  if (!game || !adapter) throw new RangeError("Missing adventure navigation adapter.");
  const profile = gameState.progress[game.progressKey];
  const frontier = profile.adventure || getAdventureSummary(profile.bestByLevel);
  const view = views.get(gameId) || { mode: "easy", chapter: frontier.currentChapter, scroll: null };
  view.chapter = Math.min(view.chapter, frontier.currentChapter);
  views.set(gameId, view);
  const root = document.createElement("section");
  root.id = "menu-container";
  root.className = `adventure-map-page ${gameId}-menu`;
  const body = document.createElement("main");
  body.className = "adventure-map-view";
  const titlebar = document.createElement("div");
  titlebar.className = "adventure-map-titlebar";
  const title = document.createElement("h1");
  title.textContent = game.title;
  const chapterLabel = document.createElement("span");
  chapterLabel.className = "adventure-chapter-label";
  const chapterControls = document.createElement("div");
  chapterControls.className = "adventure-chapter-controls";
  const previous = button("←", "adventure-chapter-button");
  previous.setAttribute("aria-label", "Chặng trước");
  const next = button("→", "adventure-chapter-button");
  next.setAttribute("aria-label", "Chặng sau");
  chapterControls.append(previous, chapterLabel, next);
  titlebar.append(title, chapterControls);
  const theme = button("", "adventure-map-theme");
  const sessions = document.createElement("div");
  sessions.className = "adventure-map-sessions";
  const scroll = document.createElement("div");
  scroll.className = "adventure-map-scroll";
  scroll.setAttribute("aria-label", "Bản đồ màn chơi");
  scroll.tabIndex = 0;
  const trail = document.createElement("div");
  trail.className = "adventure-map-trail";
  scroll.append(trail);
  body.append(titlebar, theme, sessions, scroll);
  root.append(body);
  document.body.append(root);
  const scope = decorateAdventureMenu(root, { gameId, onHome });
  const footer = root.querySelector(".adventure-footer");
  const modes = document.createElement("div");
  modes.className = "adventure-mode-tabs";
  modes.setAttribute("role", "tablist");
  modes.setAttribute("aria-label", "Độ khó");
  for (const mode of GAME_MODES.filter(({ id }) => isNormalAdventureMode(id))) {
    const tab = button(mode.label, "adventure-mode-tab");
    tab.dataset.mode = mode.id;
    tab.setAttribute("role", "tab");
    scope.listen(tab, "click", () => { view.mode = mode.id; patchNodes(); });
    modes.append(tab);
  }
  const special = document.createElement("div");
  special.className = "adventure-special-modes";
  for (const mode of GAME_MODES.filter(({ id }) => !isNormalAdventureMode(id))) {
    const entry = button(mode.label, "adventure-special-button");
    entry.append(createIcon(mode.icon));
    scope.listen(entry, "click", () => openSpecialMode(mode.id));
    special.append(entry);
  }
  footer.prepend(modes, special);
  let chapterGeneration = 0;
  let renderedNodes = [];
  let loading = false;

  function patchNodes() {
    if (!scope.active || loading) return;
    const summary = profile.adventure || getAdventureSummary(profile.bestByLevel);
    const nodes = createAdventureChapterNodes(profile.bestByLevel, view.mode, view.chapter, profile.claimedChests, summary);
    nodes.reverse().forEach((node, index) => {
      const element = renderedNodes[index];
      element.node = node;
      const control = element.control;
      if (node.kind === "level") {
        control.disabled = node.locked;
        control.classList.toggle("is-cleared", node.cleared);
        control.classList.toggle("is-mode-cleared", node.modeCleared);
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
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
  }

  async function renderChapter() {
    const generation = ++chapterGeneration;
    loading = true;
    root.dataset.mapReady = "false";
    body.setAttribute("aria-busy", "true");
    previous.disabled = next.disabled = true;
    if (!await prepareAdventureChapter(gameId, view.chapter, () => scope.active && generation === chapterGeneration)) return;
    const nodes = createAdventureChapterNodes(profile.bestByLevel, view.mode, view.chapter, profile.claimedChests, profile.adventure).reverse();
    renderedNodes = [];
    trail.replaceChildren();
    const path = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    path.classList.add("adventure-map-path");
    path.setAttribute("viewBox", `0 0 400 ${nodes.length * 92 + 40}`);
    path.setAttribute("preserveAspectRatio", "none");
    path.setAttribute("aria-hidden", "true");
    const line = document.createElementNS(path.namespaceURI, "polyline");
    line.setAttribute("points", nodes.map((_, index) => `${200 + Math.sin(index * .62) * 105},${index * 92 + 50}`).join(" "));
    path.append(line);
    trail.append(path);
    trail.style.height = `${nodes.length * 92 + 40}px`;
    nodes.forEach((node, index) => {
      const cell = document.createElement("div");
      cell.className = "adventure-map-cell";
      cell.style.top = `${index * 92 + 15}px`;
      cell.style.left = `${50 + Math.sin(index * .62) * 26.25}%`;
      const control = button(node.kind === "level" ? String(node.level) : "", `adventure-map-node adventure-map-node--${node.kind}`);
      const stars = document.createElement("span");
      stars.className = "adventure-map-stars";
      const detail = document.createElement("small");
      detail.className = "adventure-map-detail";
      if (node.kind === "level") control.dataset.level = String(node.level);
      else { control.dataset.chest = String(node.chestNumber); control.append(createIcon("collection")); }
      cell.append(control, stars, detail);
      trail.append(cell);
      renderedNodes.push({ node, control, stars, detail });
    });
    const equipped = getTheme(getEquippedThemeId(gameState.appearance, gameId));
    theme.replaceChildren(createIcon(equipped.icon), document.createTextNode(`${equipped.title} · Đổi chủ đề`));
    sessions.replaceChildren();
    for (const session of getActiveSessions(gameId).filter(session => !adapter.validateSession || adapter.validateSession(session))) {
      const resume = button(`Tiếp tục ${getGameModeLabel(session.mode)} · Màn ${session.level}`, "adventure-resume-button");
      resume.dataset.resumeMode = session.mode;
      sessions.append(resume);
    }
    chapterLabel.textContent = `Chặng ${view.chapter}`;
    previous.disabled = view.chapter === 1;
    next.disabled = view.chapter >= profile.adventure.currentChapter;
    loading = false;
    patchNodes();
    body.removeAttribute("aria-busy");
    root.dataset.mapReady = "true";
    if (view.scroll === null) scroll.scrollTop = scroll.scrollHeight;
    else scroll.scrollTop = view.scroll;
  }

  function launch(mode, level, session = null) {
    if (!scope.active || loading || !canLaunchGame()) return false;
    view.scroll = scroll.scrollTop;
    return session ? adapter.resume(session) : adapter.launch({ mode, level });
  }

  function openLevel(level, mode = view.mode, explicitSession = null) {
    const result = profile.bestByLevel[`${mode}:${level}`];
    const session = explicitSession || getActiveSessions(gameId).find(candidate => candidate.mode === mode && candidate.level === level);
    const content = document.createElement("div");
    const text = document.createElement("p");
    text.textContent = adapter.description;
    content.append(text);
    if (result) {
      const best = document.createElement("p");
      best.textContent = `Kỷ lục: ${result.score.toLocaleString("vi-VN")} điểm · ${result.stars} sao${result.durationMs ? ` · ${(result.durationMs / 1000).toFixed(2)}s` : ""}`;
      content.append(best);
    }
    const otherSession = getActiveSessions(gameId).find(candidate => candidate.mode === mode && candidate.level !== level);
    if (otherSession) {
      const warning = document.createElement("p");
      warning.textContent = `Chơi mới sẽ thay phiên đang dở ở màn ${otherSession.level} của độ khó này.`;
      content.append(warning);
    }
    const actions = [];
    if (session && (!adapter.validateSession || adapter.validateSession(session))) actions.push({ label: "Tiếp tục", icon: "play", variant: "primary", onClick: () => launch(mode, level, session) });
    actions.push({ label: result || session ? "Chơi lại" : "Chơi", icon: "play", variant: session ? "secondary" : "primary", onClick: () => launch(mode, level) });
    openAppModal({ id: "adventure-level-modal", title: `Màn ${level} · ${getGameModeLabel(mode)}`, content, actions });
  }

  function openSpecialMode(mode) {
    const session = getActiveSessions(gameId).find(candidate => candidate.mode === mode);
    openAppModal({ id: "adventure-special-modal", title: getGameModeLabel(mode), content: `<p>${mode === "endless" ? "Tiếp tục qua nhiều màn, không đếm ngược." : "Chuỗi màn thử thách với đồng hồ hiện tại."}</p>`, actions: [
      ...(session && (!adapter.validateSession || adapter.validateSession(session)) ? [{ label: "Tiếp tục", variant: "primary", onClick: () => launch(mode, session.level, session) }] : []),
      { label: "Chơi mới", icon: "play", onClick: () => launch(mode, 1) },
    ] });
  }

  function openChest(node) {
    const outcome = profile.claimedChests?.[node.chestNumber];
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
  scope.listen(theme, "click", () => adapter.collection(() => {
    if (!scope.active) return;
    const equipped = getTheme(getEquippedThemeId(gameState.appearance, gameId));
    theme.replaceChildren(createIcon(equipped.icon), document.createTextNode(`${equipped.title} · Đổi chủ đề`));
    refreshAppWallet();
  }));
  scope.listen(scroll, "scroll", () => { if (!loading) view.scroll = scroll.scrollTop; }, { passive: true });
  scope.listen(sessions, "click", event => {
    if (loading) return;
    const mode = event.target.closest("[data-resume-mode]")?.dataset.resumeMode;
    const session = getActiveSessions(gameId).find(candidate => candidate.mode === mode);
    if (session) openLevel(session.level, session.mode, session);
  });
  scope.listen(modes, "keydown", event => {
    const index = [...modes.children].indexOf(event.target);
    if (index < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const target = event.key === "Home" ? 0 : event.key === "End" ? 3 : (index + (event.key === "ArrowRight" ? 1 : 3)) % 4;
    modes.children[target].click(); modes.children[target].focus();
  });
  const changeChapter = direction => {
    if (loading) return;
    const candidate = view.chapter + direction;
    if (candidate < 1 || candidate > profile.adventure.currentChapter) return;
    view.chapter = candidate; view.scroll = null;
    void renderChapter().catch(error => { if (scope.active) { console.error("Map load failed", error); showAppToast("Chưa tải được chặng này."); } });
  };
  scope.listen(previous, "click", () => changeChapter(-1));
  scope.listen(next, "click", () => changeChapter(1));
  scope.own(() => { if (!loading) view.scroll = scroll.scrollTop; renderedNodes = []; });
  void renderChapter().catch(error => { if (scope.active) { console.error("Map load failed", error); showAppToast("Chưa tải được bản đồ. Hãy tải lại trang."); } });
  return root;
}

function button(text, className) {
  const element = document.createElement("button");
  element.type = "button"; element.className = className; element.textContent = text;
  return element;
}
