// Mainmenu.js

import { syncDefaultMusic } from "./sound.js";
import { showSettingsPanel } from "./settings.js";
import { gameState, resetGame } from "./gameState.js";
import { openAppModal, showAppToast } from "./modal.js";
import { createIcon } from "./icons.js";
import { APP_VERSION } from "./appMeta.js";
import { THEMES, getTheme } from "./themeCatalog.js";
import { saveAppearance } from "./persistence.js";
import { openShopOverlay } from "./shop.js";

let onStartGame = () => {};

export function configureMainMenu({ startGame } = {}) {
  onStartGame = startGame || onStartGame;
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
    setTimeout(showCollectionModal, 180);
  };
  [
    ["easy", "Dễ", "status-easy"],
    ["normal", "Trung bình", "status-normal"],
    ["hard", "Khó", "status-hard"],
    ["superHard", "Siêu khó", "status-super-hard"],
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

  const render = () => {
    content.replaceChildren();
    const intro = document.createElement("p");
    intro.textContent = "Chọn một chủ đề đã sở hữu để dùng cho màn chơi tiếp theo.";
    const list = document.createElement("div");
    list.className = "collection-theme-list";
    THEMES.forEach((theme) => {
      const owned = gameState.appearance.ownedThemes.includes(theme.id);
      const equipped = gameState.appearance.theme === theme.id;
      const item = document.createElement("article");
      item.className = `collection-theme${equipped ? " is-equipped" : ""}`;
      const preview = document.createElement("span");
      preview.className = "collection-theme__preview";
      preview.append(createIcon(theme.icon));
      const details = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = theme.title;
      details.append(name);
      item.append(preview, details);
      if (equipped) {
        const status = document.createElement("span");
        status.className = "collection-theme__status";
        status.textContent = "Đang dùng";
        item.append(status);
      } else if (owned) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "app-button app-button--purchase collection-theme__equip";
        button.textContent = "Trang bị";
        button.onclick = () => {
          gameState.appearance.theme = theme.id;
          saveAppearance(gameState.appearance);
          render();
          showAppToast(`Đã trang bị chủ đề ${theme.title}.`, {
            tone: "info",
          });
        };
        item.append(button);
      } else {
        const status = document.createElement("span");
        status.className = "collection-theme__status";
        status.textContent = theme.comingSoon ? "Sắp có" : "Chưa sở hữu";
        item.append(status);
      }
      list.append(item);
    });
    content.append(intro, list);
  };
  render();
  return modal;
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
