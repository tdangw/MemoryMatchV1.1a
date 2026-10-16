import { createIcon } from "./icons.js";
import { unmountActiveGameShell } from "./gameShell/gameShell.js";
import { createMainMenu } from "./mainmenu.js";

import { gameState } from "./gameState.js";

import {
  getGameNavigation,
  getReleasedGames,
  registerGameNavigation,
} from "./gameRegistry.js";

import { cancelPendingTripleGeneration } from "./tripleConnect/tripleController.js";
import { restoreBackgroundMusic } from "./sound.js";
import {
  cancelGameBackgroundTransition,
  completeGameBackgroundTransition,
  prepareGameBackgroundTransition,
  preloadGameBackground,
} from "./gameShell/gameBackgroundTransition.js";

import { mountAdventureMap } from "./adventureMap.js";
import { decorateAdventureMenu } from "./appNavigation.js";

const HOME_ART = Object.freeze({
  'memory-match': 'memory-match.webp',
  'link-connect': 'link-connect.webp',
  'triple-connect': 'triple-connect.webp',
});
let activeGameId = null;

export function showGameSelector() {
  restoreBackgroundMusic(gameState.settings);
  cancelGameBackgroundTransition();
  cancelPendingTripleGeneration();
  unmountActiveGameShell();
  activeGameId = null;
  document.documentElement.dataset.activeGame = "selector";
  document.getElementById("menu-container")?.remove();
  document
    .getElementById("game-container")
    ?.style.setProperty("display", "none");

  const overlay = createMenuOverlay("game-selector");
  const wrapper = createMenuWrapper("Memory Match Adventure");
  const title = wrapper.querySelector(".game-title");
  const titleLine = document.createElement("span");
  titleLine.className = "game-selector__title-line";
  titleLine.textContent = "Memory Match";
  const adventureLine = document.createElement("span");
  adventureLine.className = "game-selector__title-line game-selector__title-line--adventure";
  adventureLine.textContent = "Adventure";
  title.replaceChildren(titleLine, document.createTextNode(" "), adventureLine);
  title.setAttribute("aria-label", "Memory Match Adventure");
  const choices = document.createElement("div");
  choices.className = "game-selector__choices";
  choices.setAttribute('aria-label', 'Các trò chơi');
  const carousel = document.createElement('section');
  carousel.className = 'game-selector__carousel';
  carousel.setAttribute('aria-label', 'Chọn trò chơi');
  const games = getReleasedGames();
  carousel.append(choices);
  wrapper.append(carousel);
  overlay.append(wrapper);
  document.body.append(overlay);
  const scope = decorateAdventureMenu(overlay, { gameId: activeGameId, onHome: showGameSelector });
  for (const game of games) choices.append(createGameChoice({
    ...game,
    priority: game.id === games[0].id,
    onClick: () => openGameMenu(game.id),
    onWarm: () => preloadGameBackground(game.id),
  }, scope));
  mountGameCarousel(carousel, choices, games, scope);
}

function mountGameCarousel(carousel, choices, games, scope) {
  const cards = [...choices.children];
  const controls = document.createElement('nav');
  controls.className = 'game-selector__controls';
  controls.setAttribute('aria-label', 'Chuyển trò chơi');
  function arrow(label, icon) {
    const control = document.createElement('button');
    control.type = 'button'; control.className = 'game-selector__arrow';
    control.setAttribute('aria-label', label); control.append(createIcon(icon));
    return control;
  }
  const previous = arrow('Trò trước', 'arrow-right');
  const next = arrow('Trò sau', 'arrow-right');
  const dots = document.createElement('div'); dots.className = 'game-selector__dots';
  const indicators = games.map((game, index) => {
    const dot = document.createElement('button');
    dot.type = 'button'; dot.className = 'game-selector__dot';
    dot.setAttribute('aria-label', `Chọn ${game.title}`);
    scope.listen(dot, 'click', () => select(index));
    dots.append(dot); return dot;
  });
  controls.append(previous, dots, next); carousel.append(controls);
  let selected = 0;
  function update(index) {
    selected = index;
    cards.forEach((card, position) => {
      const current = position === selected;
      card.classList.toggle('is-selected', current);
      card.tabIndex = current ? 0 : -1;
      if (current) card.setAttribute('aria-current', 'true');
      else card.removeAttribute('aria-current');
      indicators[position].setAttribute('aria-pressed', String(current));
    });
    previous.disabled = selected === 0;
    next.disabled = selected === cards.length - 1;
  }
  function select(index, focus = false) {
    if (!scope.active || !cards.length) return;
    const target = Math.max(0, Math.min(cards.length - 1, index));
    update(target);
    // Native touch scrolling owns momentum; explicit controls move to an exact snap.
    choices.scrollTo({ left: cards[target].offsetLeft - cards[0].offsetLeft, behavior: 'auto' });
    if (focus) cards[target].focus({ preventScroll: true });
  }
  let queued = false;
  scope.listen(choices, 'scroll', () => {
    if (queued) return;
    queued = true;
    scope.frame(() => {
      queued = false;
      const center = choices.scrollLeft + choices.clientWidth / 2;
      let nearest = 0, distance = Infinity;
      cards.forEach((card, index) => {
        const delta = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
        if (delta < distance) { nearest = index; distance = delta; }
      });
      if (nearest !== selected) update(nearest);
    });
  }, { passive: true });
  scope.listen(previous, 'click', () => select(selected - 1));
  scope.listen(next, 'click', () => select(selected + 1));
  scope.listen(carousel, 'keydown', event => {
    const target = event.key === 'ArrowLeft' ? selected - 1 : event.key === 'ArrowRight' ? selected + 1 : event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : null;
    if (target === null) return;
    event.preventDefault(); select(target, true);
  });
  cards.forEach((card, index) => scope.listen(card, 'focus', () => select(index)));
  const observer = new ResizeObserver(() => select(selected));
  observer.observe(choices); scope.own(() => observer.disconnect());
  select(0);
}

export function openGameMenu(gameId) {
  const navigation = getGameNavigation(gameId);
  if (!navigation) return false;

  const backgroundTransition = prepareGameBackgroundTransition(gameId);
  cancelPendingTripleGeneration();
  unmountActiveGameShell();
  restoreBackgroundMusic(gameState.settings);
  activeGameId = gameId;
  document.getElementById("menu-container")?.remove();
  navigation.openMenu();
  const menu = document.getElementById("menu-container");
  if (menu && !menu.classList.contains("adventure-page")) {
    decorateAdventureMenu(menu, { gameId, onHome: showGameSelector });
  }

  void backgroundTransition
    .then((backgroundStatus) => {
      if (activeGameId !== gameId || backgroundStatus === "cancelled") return;
      document.documentElement.dataset.activeGame = gameId;
      if (backgroundStatus === "ready") completeGameBackgroundTransition();
    })
    .catch((error) => {
      if (activeGameId !== gameId) return;
      cancelGameBackgroundTransition();
      document.documentElement.dataset.activeGame = gameId;
      console.error("Game menu background transition failed", error);
    });
  return true;
}

export function createActiveGameMenu() {
  if (!activeGameId) {
    showGameSelector();
    return;
  }
  openGameMenu(activeGameId);
}

function createMenuOverlay(variant) {
  const overlay = document.createElement("div");
  overlay.id = "menu-container";
  overlay.className = `menu-overlay ${variant}`;
  return overlay;
}

function createMenuWrapper(titleText) {
  const wrapper = document.createElement("div");
  wrapper.className = "menu-wrapper menu-wrapper--game-selector";
  const title = document.createElement("h1");
  title.className = "game-title";
  title.textContent = titleText;
  wrapper.append(title);
  return wrapper;
}

function createGameChoice({ id, title, priority, onClick, onWarm }, scope) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = 'game-selector__choice';
  button.dataset.gameId = id;
  button.setAttribute('aria-label', title);
  if (HOME_ART[id]) {
    const art = document.createElement('img');
    art.className = 'game-selector__art';
    art.alt = ''; art.setAttribute('aria-hidden', 'true'); art.draggable = false;
    art.decoding = 'async'; art.fetchPriority = priority ? 'high' : 'auto';
    scope.listen(art, 'error', () => { art.hidden = true; }, { once: true });
    art.src = `${import.meta.env.BASE_URL}assets/images/home/${HOME_ART[id]}`;
    button.append(art);
  }
  const label = document.createElement('span'); label.className = 'game-selector__label';
  const heading = document.createElement("strong"); heading.textContent = title;
  label.append(heading, createIcon("arrow-right")); button.append(label);
  scope.listen(button, 'click', onClick);
  scope.listen(button, 'pointerenter', onWarm, { passive: true });
  scope.listen(button, 'focus', onWarm);
  return button;
}

registerGameNavigation("memory-match", createMainMenu);
registerGameNavigation("link-connect", () => mountAdventureMap("link-connect"));
registerGameNavigation("triple-connect", () => mountAdventureMap("triple-connect"));
