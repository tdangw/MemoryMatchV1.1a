import { mountHomeExit } from './appExit.js';
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
import { mountHomeAmbient } from './background/bindings.js';
import { refreshAmbientBackground } from './backgroundEffects.js';

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
  const choices = document.createElement('section');
  choices.className = 'game-selector__choices';
  choices.setAttribute('aria-label', 'Chọn trò chơi');
  const art = document.createElement('img');
  art.className = 'game-selector__cover';
  art.src = `${import.meta.env.BASE_URL}assets/images/home/adventure-cover.webp`;
  art.alt = ''; art.draggable = false; art.fetchPriority = 'high';
  choices.append(art);
  wrapper.append(choices);
  const games = getReleasedGames();
  overlay.append(wrapper);
  document.body.append(overlay);
  const scope = decorateAdventureMenu(overlay, { gameId: activeGameId, onHome: showGameSelector });
  mountHomeExit(overlay, scope);
  for (const game of games) choices.append(createGameChoice({
    ...game,
    onClick: event => { void departHome(overlay, event.currentTarget, game.id, scope); },
    onWarm: () => preloadGameBackground(game.id),
  }, scope));
  mountHomeAmbient(scope, overlay);
}

// The mounted Home owns both phases; disposing it cancels pending navigation.
const HOME_PRESS_MS = 140;
const HOME_FADE_MS = 260;
async function departHome(overlay, button, gameId, scope) {
  if (overlay.inert || !scope.active) return;
  overlay.inert = true;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  async function phase(node, frames, duration) {
    if (!scope.active || !overlay.isConnected) return false;
    if (motion.matches || typeof node.animate !== 'function') return true;
    const animation = scope.animation(node.animate(frames, { duration, easing: 'ease-out', fill: 'forwards' }));
    const finish = () => animation.finish();
    const unlisten = scope.listen(motion, 'change', event => { if (event.matches) finish(); });
    const unhide = scope.listen(document, 'visibilitychange', () => { if (document.hidden) finish(); });
    if (document.hidden) finish();
    try {
      await animation.finished;
      return scope.active && overlay.isConnected;
    } catch (error) {
      if (error.name !== 'AbortError') console.warn('Home transition unavailable', error.name);
      return error.name !== 'AbortError' && scope.active && overlay.isConnected;
    } finally {
      unlisten(); unhide();
    }
  }
  const pressed = await phase(button, [
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'translateY(3px) scale(.96)', opacity: .85, offset: .55 },
    { transform: 'scale(1)', opacity: 1 },
  ], HOME_PRESS_MS);
  if (!pressed) return;
  if (await phase(overlay, [{ opacity: 1 }, { opacity: 0 }], HOME_FADE_MS)) openGameMenu(gameId);
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
      refreshAmbientBackground();
    })
    .catch((error) => {
      if (activeGameId !== gameId) return;
      cancelGameBackgroundTransition();
      document.documentElement.dataset.activeGame = gameId;
      refreshAmbientBackground();
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

function createGameChoice({ id, title, onClick, onWarm }, scope) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = 'game-selector__choice';
  button.dataset.gameId = id;
  button.dataset.clickSound = 'homeStart';
  button.setAttribute('aria-label', title);
  const label = document.createElement('span');
  label.className = 'game-selector__label';
  label.textContent = title;
  button.append(label);
  scope.listen(button, 'click', onClick);
  scope.listen(button, 'pointerenter', onWarm, { passive: true });
  scope.listen(button, 'focus', onWarm);
  return button;
}

registerGameNavigation("memory-match", createMainMenu);
registerGameNavigation("link-connect", () => mountAdventureMap("link-connect"));
registerGameNavigation("triple-connect", () => mountAdventureMap("triple-connect"));
