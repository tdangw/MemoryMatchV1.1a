// Mainmenu.js

import { syncDefaultMusic } from "./sound.js";
import { showSettingsPanel } from "./settings.js";
import { gameState, resetGame } from "./gameState.js";
import { openAppModal, showAppToast } from "./modal.js";
import { createIcon } from "./icons.js";
import { APP_VERSION } from "./appMeta.js";
import { THEMES, getTheme, isThemePlayable } from "./themeCatalog.js";
import { saveAppearance } from "./persistence.js";
import { openShopOverlay } from "./shop.js";
import { showThemeChangeNotice } from "./themeChangeNotice.js";
import { CARD_BACKS, FLIP_EFFECTS, getCardBackClass } from "./appearance.js";

let onStartGame = () => {};
let onChangeGame = () => {};

export function configureMainMenu({ startGame, changeGame } = {}) {
  onStartGame = startGame || onStartGame;
  onChangeGame = changeGame || onChangeGame;
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

  const menuOverlay = document.createElement("div");
  menuOverlay.id = "menu-container";
  menuOverlay.className = "menu-overlay";

  const wrapper = document.createElement("div");
  wrapper.className = "menu-wrapper";

  const title = document.createElement("h1");
  title.className = "game-title";
  title.textContent = "Memory Match";
  wrapper.appendChild(title);
  const description = document.createElement("p");
  description.className = "menu-description";
  description.textContent = "Ghi nhớ và tìm các cặp hình giống nhau khi lật thẻ.";
  wrapper.appendChild(description);

  const menuList = document.createElement("ul");
  menuList.className = "menu-list";

  const menuItems = [
    {
      icon: "play",
      text: "Bắt đầu",
      action: () => {
        showDifficultyOverlay();
      },
    },
    {
      icon: "settings",
      text: "Cài đặt",
      action: () => {
        showSettingsPanel();
      },
    },
    {
      icon: "book",
      text: "Hướng dẫn",
      action: () => {
        showInfoModal(
          "Cách chơi",
          `<ul class="app-feature-list">
            <li>Lật hai thẻ để tìm cặp hình giống nhau.</li>
            <li>Ghép hết các cặp trước khi thời gian kết thúc.</li>
            <li>Ghép đúng liên tiếp để tạo Combo và nhận thêm thời gian; mỗi lần ghép sai sẽ làm Combo về 0 và giảm phần thưởng Xu của màn.</li>
            <li>Dùng gợi ý hoặc vật phẩm trong cửa hàng khi cần.</li>
          </ul>`,
          "book",
        );
      },
    },
    {
      icon: "restart",
      text: "Đổi trò chơi",
      action: onChangeGame,
    },
    {
      icon: "collection",
      text: "Bộ sưu tập",
      action: () => {
        showCollectionModal();
      },
    },
    {
      icon: "shop",
      text: "Cửa hàng",
      action: () => openShopOverlay({ fromMenu: true }),
    },
    {
      icon: "info",
      text: "Thông tin",
      action: () => {
        showInfoModal(
          "Giới thiệu",
          `<p><strong>Memory Match</strong> là trò chơi ghép cặp giúp rèn luyện trí nhớ.</p>
           <p>Chúc bạn có những phút giây thư giãn vui vẻ!</p>
           <p class="app-modal__note">Tác giả: Đăng · Phiên bản ${APP_VERSION}</p>`,
        );
      },
    },
  ];

  menuItems.forEach(({ icon, text, action }) => {
    const li = document.createElement("li");
    li.className = "menu-item";
    li.append(createIcon(icon), document.createTextNode(text));
    li.onclick = action;
    menuList.appendChild(li);
  });

  wrapper.appendChild(menuList);
  menuOverlay.appendChild(wrapper);
  document.body.appendChild(menuOverlay);
}

/**
 * Hiển thị overlay chọn chế độ chơi (popup gọn)
 */
export function showDifficultyOverlay(fromGame = false) {
  gameState.isPaused = true;
  let modeSelected = false;

  const startMode = (mode, close) => {
    modeSelected = true;
    gameState.fromDefeat = false;
    resetGame();
    gameState.settings.mode = mode;
    document.getElementById("menu-container")?.remove();
    close();
    onStartGame(1);
  };

  const content = document.createElement("div");
  content.className = "difficulty-content";
  const activeTheme = getTheme(gameState.appearance.theme);
  const themeRow = document.createElement("div");
  themeRow.className = "difficulty-theme";
  themeRow.append(createIcon(activeTheme.icon));
  const themeText = document.createElement("div");
  const themeLabel = document.createElement("small");
  themeLabel.textContent = "Chủ đề đang dùng";
  const themeName = document.createElement("strong");
  themeName.textContent = activeTheme.title;
  themeText.append(themeLabel, themeName);
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
    setTimeout(() => showCollectionModal({ fromGame }), 180);
  };
  [
    ["easy", "Dễ", "status-easy"],
    ["normal", "Trung bình", "status-normal"],
    ["hard", "Khó", "status-hard"],
    ["superHard", "Siêu khó", "status-super-hard"],
    ["endless", "Vô tận", "timer"],
    ["challenge", "Thử thách", "trophy"],
  ].forEach(([mode, label, icon]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "difficulty-option";
    button.append(createIcon(icon), document.createTextNode(label));
    button.onclick = () => startMode(mode, modal.close);
    options.append(button);
  });
  content.append(themeRow, options);
}

export function showCollectionModal({ fromGame = false } = {}) {
  if (fromGame) gameState.isPaused = true;
  const content = document.createElement("div");
  content.className = "collection-content";
  const modal = openAppModal({
    id: "collection-modal",
    icon: "collection",
    title: "Bộ sưu tập",
    content,
    size: "large",
    onClose: () => {
      if (fromGame) gameState.isPaused = false;
      syncDefaultMusic(gameState.settings);
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
    renderCollectionAppearanceGroup(grid, "Mặt lưng thẻ", "cardBack", CARD_BACKS);
  };
  const renderFlipEffects = () => {
    grid.className = "shop-item-grid shop-item-grid--appearance";
    grid.replaceChildren();
    renderCollectionAppearanceGroup(grid, "Hiệu ứng lật", "flipEffect", FLIP_EFFECTS);
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
    THEMES.filter((theme) => gameState.appearance.ownedThemes.includes(theme.id)).forEach((theme) => {
      const playable = isThemePlayable(theme);
      const equipped = gameState.appearance.theme === theme.id;
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
        button.onclick = () => {
          gameState.appearance.theme = theme.id;
          saveAppearance(gameState.appearance);
          renderThemes();
          if (fromGame) showThemeChangeNotice();
          else showAppToast(`Đã trang bị chủ đề ${theme.title}.`, { tone: "info" });
        };
      }
      card.append(preview, name, button);
      choices.append(card);
    });
    group.append(heading, choices);
    grid.append(group);
  };

  const appearanceTab = createCollectionTab("Ngoại hình", true, renderAppearance);
  const flipEffectsTab = createCollectionTab("Hiệu ứng lật", false, renderFlipEffects);
  const themesTab = createCollectionTab("Chủ đề", false, renderThemes);
  tabs.append(appearanceTab, flipEffectsTab, themesTab);
  renderAppearance();
  return modal;
}

function createCollectionTab(label, selected, onSelect) {
  const tab = document.createElement("button");
  tab.type = "button";
  tab.className = "shop-tab";
  tab.textContent = label;
  tab.setAttribute("role", "tab");
  tab.setAttribute("aria-selected", String(selected));
  tab.onclick = () => {
    tab.parentElement.querySelectorAll(".shop-tab").forEach((button) => {
      button.classList.toggle("is-active", button === tab);
      button.setAttribute("aria-selected", String(button === tab));
    });
    onSelect();
  };
  if (selected) tab.classList.add("is-active");
  return tab;
}

function renderCollectionAppearanceGroup(grid, title, type, items) {
  const ownedKey = type === "cardBack" ? "ownedCardBacks" : "ownedFlipEffects";
  const group = document.createElement("section");
  group.className = "appearance-group";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const choices = document.createElement("div");
  choices.className = "appearance-choice-grid";
  items.filter((item) => gameState.appearance[ownedKey].includes(item.id)).forEach((item) => {
    const equipped = gameState.appearance[type] === item.id;
    const card = document.createElement("article");
    card.className = `appearance-choice${equipped ? " is-equipped" : ""}`;
    const preview = document.createElement("div");
    if (type === "cardBack") preview.className = `appearance-preview ${item.previewClass}`;
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
      button.onclick = () => {
        gameState.appearance[type] = item.id;
        saveAppearance(gameState.appearance);
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

export function showGameInfoModal(title, message, icon = "info") {
  gameState.isPaused = true;
  openAppModal({
    id: "info-modal",
    icon,
    title,
    content: message,
    onClose: () => {
      gameState.isPaused = false;
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
