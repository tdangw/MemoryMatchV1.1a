// Mainmenu.js
import { createGameShellLifecycle } from "./gameShell/gameShellLifecycle.js";
import { mountAdventureMap } from "./adventureMap.js";
import { renderMasteryCollection } from './progression/masteryCollection.js';

import { syncDefaultMusic } from "./sound.js";
import { gameState, resetGame } from "./gameState.js";
import { openAppModal, showAppToast } from "./modal.js";
import { createIcon } from "./icons.js";
import { THEMES, getTheme, isThemePlayable } from "./themeCatalog.js";
import { saveAppearance } from "./persistence.js";
import { mountCatalogTabs } from "./catalogPreferences.js";
import {
  clearActiveSession,
  getActiveSession,
} from "./sessionProgress.js";
import { showThemeChangeNotice } from "./themeChangeNotice.js";
import {
  CARD_BACKS,
  equipTheme,
  FLIP_EFFECTS,
  getCardBackClass,
  getEquippedThemeId,
  getOwnedThemeIds,
} from "./appearance.js";
import { LINK_EXIT_EFFECTS, LINK_PATH_EFFECTS } from "./linkConnect/linkEffects.js";
import { equipTripleEffect, equipTripleTheme } from "./tripleConnect/tripleTransactions.js";
import {
  GAME_MODES,
  getGameModeLabel,
} from "./gameCatalog.js";
import { createThemeSummary, UI_TIMING } from "./uiCatalog.js";

let onStartGame = () => {};
let onContinueGame = () => {};

export function configureMainMenu({
  startGame,
  continueGame,
} = {}) {
  onStartGame = startGame || onStartGame;
  onContinueGame = continueGame || onContinueGame;
}

/**
 * 📌 Định nghĩa và export hàm showInfoModal để tránh lỗi 'no-undef'
 */
export function showInfoModal(title, message, icon = "info") {
  openAppModal({
    id: "info-modal",
    icon,
    title,
    content: message,
    onClose: () => {
      createMainMenu();
      syncDefaultMusic(gameState.settings);
    },
  });
}

/**
 * Tạo giao diện menu chính của game
 */
export function createMainMenu() {
  if (document.getElementById("menu-container")) return;
  mountAdventureMap("memory-match");
}

/**
 * Hiển thị overlay chọn chế độ chơi (popup gọn)
 */
export function showDifficultyOverlay(fromGame = false) {
  gameState.isPaused = true;
  let modeSelected = false;

  const startMode = async (mode, close) => {
    modeSelected = true;
    gameState.fromDefeat = false;
    (await clearActiveSession("memory-match", mode));
    resetGame();
    gameState.settings.mode = mode;
    document.getElementById("menu-container")?.remove();
    close();
    onStartGame(1);
  };

  const content = document.createElement("div");
  content.className = "difficulty-content";
  const activeTheme = getTheme(getEquippedThemeId(gameState.appearance));
  const themeRow = document.createElement("div");
  themeRow.className = "difficulty-theme";
  themeRow.append(createIcon(activeTheme.icon));
  const themeText = createThemeSummary(activeTheme.title);
  const changeThemeButton = document.createElement("button");
  changeThemeButton.type = "button";
  changeThemeButton.className = "difficulty-theme__change";
  changeThemeButton.textContent = "Đổi";
  themeRow.append(themeText, changeThemeButton);

  const options = document.createElement("div");
  options.className = "difficulty-options";
  const modal = openAppModal({
    id: "difficulty-modal",
    icon: "play",
    title: "Chọn chế độ chơi",
    content,
    onClose: () => {
      if (modeSelected) return;
      gameState.isPaused = false;
      handleCancelAction(fromGame);
    },
  });
  changeThemeButton.onclick = () => {
    modal.close();
    setTimeout(
      async () => (await showCollectionModal({ fromGame, gameId: "memory-match" })),
      UI_TIMING.modalCloseMs,
    );
  };
  GAME_MODES.forEach(({ id: mode, label, icon }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "difficulty-option";
    button.append(createIcon(icon), document.createTextNode(label));
    button.onclick = async () =>
      (await chooseMemoryMode(mode, label, startMode, modal.close, () => {
        modeSelected = true;
      }));
    options.append(button);
  });
  content.append(themeRow, options);
}

async function chooseMemoryMode(
  mode,
  label,
  startMode,
  closeDifficulty,
  confirmModeSelection,
) {
  const session = getActiveSession("memory-match", mode);
  if (!session) return (await startMode(mode, closeDifficulty));
  showSessionChoice({
    label,
    session,
    onContinue: () => {
      // Đánh dấu trước khi đóng vì callback close chạy sau hoạt ảnh đóng modal.
      confirmModeSelection();
      document.getElementById("menu-container")?.remove();
      closeDifficulty();
      onContinueGame(session);
    },
    onNew: async () => (await startMode(mode, closeDifficulty)),
  });
}

function showSessionChoice({ label, session, onContinue, onNew }) {
  const modal = openAppModal({
    id: "session-choice-modal",
    icon: "play",
    title: `${label} - Level ${session.level}`,
    content:
      "<p>Bạn muốn tiếp tục hành trình đã lưu hay bắt đầu lại từ cấp 1?</p>",
    actions: [
      { label: "Chơi mới", icon: "restart", onClick: onNew },
      {
        label: "Tiếp tục",
        icon: "play",
        variant: "primary",
        onClick: onContinue,
      },
    ],
  });
  modal.panel.classList.add("session-choice-modal");
}

export async function showCollectionModal({
  fromGame = false,
  gameId = "memory-match",
  onClose = () => {},
  surface = {},
} = {}) {
  // Khi mở từ item menu, trình duyệt truyền MouseEvent làm đối số đầu tiên.
  // Chỉ callback thực sự mới được dùng khi đóng để không gọi nhầm event như hàm.
  const closeHandler = typeof onClose === "function" ? onClose : () => {};
  if (fromGame) gameState.isPaused = true;
  const content = document.createElement("div");
  content.className = "collection-content";
  const collectionScope = createGameShellLifecycle();
  const modal = openAppModal({
    ...surface,
    id: "collection-modal",
    onDestroy: () => collectionScope.dispose(),
    icon: "collection",
    title: "Bộ sưu tập",
    content,
    size: "large",
    onClose: () => {
      if (fromGame) gameState.isPaused = false;
      syncDefaultMusic(gameState.settings);
      closeHandler();
    },
  });

  const tabs = document.createElement("div");
  tabs.className = "shop-tabs";
  tabs.setAttribute("role", "tablist");
  const grid = document.createElement("div");
  grid.className = "shop-item-grid";
  content.append(tabs, grid);

  const renderAppearance = () => {
    grid.className = "shop-item-grid shop-item-grid--appearance";
    grid.replaceChildren();
    renderCollectionAppearanceGroup(
      grid,
      "Mặt lưng thẻ",
      "cardBack",
      CARD_BACKS,
    );
  };
  const renderFlipEffects = () => {
    grid.className = "shop-item-grid shop-item-grid--appearance";
    grid.replaceChildren();
    renderCollectionAppearanceGroup(
      grid,
      "Hiệu ứng lật",
      "flipEffect",
      FLIP_EFFECTS,
    );
  };
  const renderThemes = () => {
    grid.className = "shop-item-grid shop-item-grid--themes";
    grid.replaceChildren();
    const group = document.createElement("section");
    group.className = "appearance-group theme-group";
    const heading = document.createElement("h3");
    heading.textContent = "Chủ đề thẻ";
    const choices = document.createElement("div");
    choices.className = "theme-choice-grid";
    THEMES.filter((theme) =>
      getOwnedThemeIds(gameState.appearance, gameId).includes(theme.id),
    ).forEach((theme) => {
      const playable = isThemePlayable(theme);
      const equipped =
        getEquippedThemeId(gameState.appearance, gameId) === theme.id;
      const card = document.createElement("article");
      card.className = `theme-choice${equipped ? " is-equipped" : ""}`;
      const preview = document.createElement("div");
      preview.className = "appearance-preview theme-preview";
      preview.append(createIcon(theme.icon));
      const name = document.createElement("strong");
      name.textContent = theme.title;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "app-button app-button--purchase shop-buy-button";
      if (!playable) {
        button.textContent = "Chờ ảnh";
        button.disabled = true;
      } else if (equipped) {
        button.classList.add("appearance-action--equipped");
        button.textContent = "Đang dùng";
        button.disabled = true;
      } else {
        button.classList.add("appearance-action--equip");
        button.textContent = "Trang bị";
        button.onclick = async () => {
          const saved = gameId === "triple-connect"
            ? (await equipTripleTheme(theme.id))
            : equipTheme(gameState.appearance, gameId, theme.id) && (await saveAppearance(gameState.appearance));
          if (!saved) {
            showAppToast("Không thể lưu thay đổi chủ đề.", { tone: "error" });
            return;
          }
          renderThemes();
          if (fromGame) showThemeChangeNotice();
          else
            showAppToast(`Đã trang bị chủ đề ${theme.title}.`, {
              tone: "info",
            });
        };
      }
      card.append(preview, name, button);
      choices.append(card);
    });
    group.append(heading, choices);
    grid.append(group);
  };

  if (gameId === "link-connect") {
    const renderLinkEffects = (title, equippedKey, ownedKey, effects) => {
      grid.className = "shop-item-grid shop-item-grid--appearance";
      grid.replaceChildren();
      const group = document.createElement("section");
      group.className = "appearance-group";
      const heading = document.createElement("h3");
      heading.textContent = title;
      const choices = document.createElement("div");
      choices.className = "appearance-choice-grid";
      effects
        .filter((item) => gameState.appearance[ownedKey].includes(item.id))
        .forEach((item) => {
          const equipped = gameState.appearance[equippedKey] === item.id;
          const card = document.createElement("article");
          card.className = `appearance-choice${equipped ? " is-equipped" : ""}`;
          const preview = document.createElement("div");
          preview.className = `link-effect-preview ${item.className}`;
          preview.append(createIcon(item.icon));
          const name = document.createElement("strong");
          name.textContent = item.title;
          const button = document.createElement("button");
          button.type = "button";
          button.className = "app-button app-button--purchase shop-buy-button";
          if (equipped) {
            button.classList.add("appearance-action--equipped");
            button.textContent = "Đang dùng";
            button.disabled = true;
          } else {
            button.classList.add("appearance-action--equip");
            button.textContent = "Trang bị";
            button.onclick = async () => {
              gameState.appearance[equippedKey] = item.id;
              (await saveAppearance(gameState.appearance));
              renderLinkEffects(title, equippedKey, ownedKey, effects);
              showAppToast(`Đã trang bị ${item.title}.`, { tone: "info" });
            };
          }
          card.append(preview, name, button);
          choices.append(card);
        });
      group.append(heading, choices);
      grid.append(group);
    };
    (await mountCatalogTabs({ gameId, surface: "collection", tablist: tabs, panel: grid, tabs: [
      { id: "pictures", label: "Tranh", render: () => renderMasteryCollection(grid, gameId, { owner: collectionScope }) },
      { id: "themes", label: "Chủ đề", render: renderThemes },
      { id: "path", label: "Đường nối", render: () => renderLinkEffects("Hiệu ứng đường nối", "linkPathEffect", "ownedLinkPathEffects", LINK_PATH_EFFECTS) },
      { id: "exit", label: "Xóa thẻ", render: () => renderLinkEffects("Hiệu ứng xóa thẻ", "linkExitEffect", "ownedLinkExitEffects", LINK_EXIT_EFFECTS) },
    ] }));
  } else if (gameId === "triple-connect") {
    const renderTripleEffects = (title, kind, ownedKey, equippedKey, effects) => {
      grid.className = "shop-item-grid shop-item-grid--appearance";
      grid.replaceChildren();
      const group = document.createElement("section");
      group.className = "appearance-group";
      const heading = document.createElement("h3");
      heading.textContent = title;
      const choices = document.createElement("div");
      choices.className = "appearance-choice-grid";
      effects.filter((item) => gameState.appearance[ownedKey].includes(item.id)).forEach((item) => {
        const equipped = gameState.appearance[equippedKey] === item.id;
        const card = document.createElement("article");
        card.className = `appearance-choice${equipped ? " is-equipped" : ""}`;
        const preview = document.createElement("div");
        preview.className = `link-effect-preview ${item.className}`;
        preview.append(createIcon(item.icon));
        const name = document.createElement("strong");
        name.textContent = item.title;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "app-button app-button--purchase shop-buy-button";
        if (equipped) {
          button.classList.add("appearance-action--equipped");
          button.textContent = "Đang dùng";
          button.disabled = true;
        } else {
          button.classList.add("appearance-action--equip");
          button.textContent = "Trang bị";
          button.onclick = async () => {
            if (!(await equipTripleEffect(kind, item.id))) {
              showAppToast("Không thể lưu thay đổi hiệu ứng.", { tone: "error" });
              return;
            }
            renderTripleEffects(title, kind, ownedKey, equippedKey, effects);
            showAppToast(`Đã trang bị ${item.title}.`, { tone: "info" });
          };
        }
        card.append(preview, name, button);
        choices.append(card);
      });
      group.append(heading, choices);
      grid.append(group);
    };
    (await mountCatalogTabs({ gameId, surface: "collection", tablist: tabs, panel: grid, tabs: [
      { id: "pictures", label: "Tranh", render: () => renderMasteryCollection(grid, gameId, { owner: collectionScope }) },
      { id: "themes", label: "Chủ đề", render: renderThemes },
      { id: "path", label: "Đường nối", render: () => renderTripleEffects("Hiệu ứng đường nối", "path", "ownedTriplePathEffects", "triplePathEffect", LINK_PATH_EFFECTS) },
      { id: "exit", label: "Xóa thẻ", render: () => renderTripleEffects("Hiệu ứng xóa thẻ", "exit", "ownedTripleExitEffects", "tripleExitEffect", LINK_EXIT_EFFECTS) },
    ] }));
  } else {
    (await mountCatalogTabs({ gameId, surface: "collection", tablist: tabs, panel: grid, tabs: [
      { id: "pictures", label: "Tranh", render: () => renderMasteryCollection(grid, gameId, { owner: collectionScope }) },
      { id: "appearance", label: "Ngoại hình", render: renderAppearance },
      { id: "flip", label: "Hiệu ứng lật", render: renderFlipEffects },
      { id: "themes", label: "Chủ đề", render: renderThemes },
    ] }));
  }
  return modal;
}

function renderCollectionAppearanceGroup(grid, title, type, items) {
  const ownedKey = type === "cardBack" ? "ownedCardBacks" : "ownedFlipEffects";
  const group = document.createElement("section");
  group.className = "appearance-group";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const choices = document.createElement("div");
  choices.className = "appearance-choice-grid";
  items
    .filter((item) => gameState.appearance[ownedKey].includes(item.id))
    .forEach((item) => {
      const equipped = gameState.appearance[type] === item.id;
      const card = document.createElement("article");
      card.className = `appearance-choice${equipped ? " is-equipped" : ""}`;
      const preview = document.createElement("div");
      if (type === "cardBack")
        preview.className = `appearance-preview ${item.previewClass}`;
      else {
        preview.className = `appearance-effect-preview ${item.animationClass}`;
        preview.textContent = "A";
      }
      preview.setAttribute("aria-hidden", "true");
      const name = document.createElement("strong");
      name.textContent = item.title;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "app-button app-button--purchase shop-buy-button";
      if (equipped) {
        button.classList.add("appearance-action--equipped");
        button.textContent = "Đang dùng";
        button.disabled = true;
      } else {
        button.classList.add("appearance-action--equip");
        button.textContent = "Trang bị";
        button.onclick = async () => {
          const previousId = gameState.appearance[type];
          gameState.appearance[type] = item.id;
          if (!(await saveAppearance(gameState.appearance))) {
            gameState.appearance[type] = previousId;
            showAppToast("Không thể lưu thay đổi ngoại hình.", { tone: "error" });
            return;
          }
          if (type === "cardBack") applyCollectionCardBack();
          grid.replaceChildren();
          renderCollectionAppearanceGroup(
            grid,
            type === "cardBack" ? "Mặt lưng thẻ" : "Hiệu ứng lật",
            type,
            type === "cardBack" ? CARD_BACKS : FLIP_EFFECTS,
          );
        };
      }
      card.append(preview, name, button);
      choices.append(card);
    });
  group.append(heading, choices);
  grid.append(group);
}

function applyCollectionCardBack() {
  const backClasses = CARD_BACKS.map((item) => item.previewClass);
  const equippedClass = getCardBackClass(gameState.appearance.cardBack);
  document.querySelectorAll(".tile").forEach((tile) => {
    tile.classList.remove(...backClasses);
    tile.classList.add(equippedClass);
  });
}

export function showGameInfoModal(title, message, icon = "info", onClose = () => {}) {
  gameState.isPaused = true;
  openAppModal({
    id: "info-modal",
    icon,
    title,
    content: message,
    onClose: () => {
      gameState.isPaused = false;
      onClose();
    },
  });
}

function handleCancelAction(fromGame) {
  if (fromGame && gameState.fromDefeat) {
    resetGame();
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) gameContainer.style.display = "none";
    createMainMenu();
    gameState.fromDefeat = false; // Reset cờ
  } else if (fromGame) {
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) gameContainer.style.display = "flex";
  } else {
    if (!document.getElementById("menu-container")) {
      createMainMenu();
    }
  }
}

// Lớp nền động nhẹ: chỉ giữ hai mây để không che nền sao hoặc tăng chi phí vẽ trên mobile.
const fog = document.createElement("div");
fog.className = "fog";
document.body.appendChild(fog);

const cloudConfigs = [
  { top: 110, delay: 0 },
  { top: 280, delay: 55 },
];

cloudConfigs.forEach(({ top, delay }) => {
  const cloud = document.createElement("div");
  cloud.className = "cloud";
  cloud.style.top = `${top}px`;
  cloud.style.animationDelay = `${delay}s`;
  document.body.appendChild(cloud);
});

window.addEventListener(
  "click",
  () => {
    if (document.getElementById("menu-container"))
      syncDefaultMusic(gameState.settings);
  },
  { once: true },
);
