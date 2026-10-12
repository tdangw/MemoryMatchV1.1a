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
  const wrapper = createMenuWrapper(
    "Memory Match Adventure",
    "Trí nhớ là hành trang. Cuộc phiêu lưu là lẽ sống.",
    { gameSelector: true },
  );
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
  getReleasedGames().forEach((game) => {
    choices.append(
      createGameChoice({
        ...game,
        onClick: () => openGameMenu(game.id),
        onWarm: () => preloadGameBackground(game.id),
      }),
    );
  });
  wrapper.append(choices);
  overlay.append(wrapper);
  document.body.append(overlay);
  decorateAdventureMenu(overlay, { gameId: activeGameId, onHome: showGameSelector });
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

function createMenuWrapper(
  titleText,
  description,
  { gameSelector = false } = {},
) {
  const wrapper = document.createElement("div");
  wrapper.className = gameSelector
    ? "menu-wrapper menu-wrapper--game-selector"
    : "menu-wrapper";
  const title = document.createElement("h1");
  title.className = "game-title";
  title.textContent = titleText;
  const subtitle = document.createElement("p");
  subtitle.className = "menu-description";
  subtitle.textContent = description;
  wrapper.append(title, subtitle);
  return wrapper;
}

function createGameChoice({ icon, title, description, onClick, onWarm }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "game-selector__choice";
  button.append(createIcon(icon));
  const content = document.createElement("span");
  const heading = document.createElement("strong");
  heading.textContent = title;
  const copy = document.createElement("small");
  copy.textContent = description;
  content.append(heading, copy);
  button.append(content, createIcon("arrow-right"));
  button.addEventListener("click", onClick);
  button.addEventListener("pointerenter", onWarm, { passive: true });
  button.addEventListener("focus", onWarm);
  return button;
}

registerGameNavigation("memory-match", createMainMenu);
registerGameNavigation("link-connect", () => mountAdventureMap("link-connect"));
registerGameNavigation("triple-connect", () => mountAdventureMap("triple-connect"));
