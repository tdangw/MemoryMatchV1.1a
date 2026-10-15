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
  const games = getReleasedGames();
  choices.dataset.layout = games.length === 3 ? 'featured' : 'grid';
  wrapper.append(choices);
  overlay.append(wrapper);
  document.body.append(overlay);
  const scope = decorateAdventureMenu(overlay, { gameId: activeGameId, onHome: showGameSelector });
  for (const game of games) choices.append(createGameChoice({
    ...game,
    featured: games.length === 3 && game.id === 'memory-match',
    onClick: () => openGameMenu(game.id),
    onWarm: () => preloadGameBackground(game.id),
  }, scope));
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

function createGameChoice({ id, title, featured, onClick, onWarm }, scope) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `game-selector__choice${featured ? ' game-selector__choice--featured' : ''}`;
  button.dataset.gameId = id;
  button.setAttribute('aria-label', title);
  if (HOME_ART[id]) {
    const art = document.createElement('img');
    art.className = 'game-selector__art';
    art.alt = ''; art.setAttribute('aria-hidden', 'true'); art.draggable = false;
    art.decoding = 'async'; art.fetchPriority = featured ? 'high' : 'auto';
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
