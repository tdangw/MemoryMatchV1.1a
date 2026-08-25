// Mainmenu.js

import { syncDefaultMusic } from "./sound.js";
import { showSettingsPanel } from "./settings.js";
import { gameState, resetGame } from "./gameState.js";
import { openAppModal } from "./modal.js";
import { createIcon } from "./icons.js";
import { APP_VERSION } from "./appMeta.js";

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

  openAppModal({
    id: "difficulty-modal",
    icon: "play",
    title: "Chọn chế độ chơi",
    content: "<p>Chọn độ khó phù hợp để bắt đầu.</p>",
    actions: [
      {
        label: "Dễ",
        icon: "status-easy",
        variant: "primary",
        onClick: (close) => startMode("easy", close),
      },
      {
        label: "Trung bình",
        icon: "status-normal",
        variant: "primary",
        onClick: (close) => startMode("normal", close),
      },
      {
        label: "Khó",
        icon: "status-hard",
        variant: "primary",
        onClick: (close) => startMode("hard", close),
      },
      {
        label: "Siêu khó",
        icon: "status-super-hard",
        variant: "primary",
        onClick: (close) => startMode("superHard", close),
      },
    ],
    onClose: () => {
      if (modeSelected) return;
      gameState.isPaused = false;
      handleCancelAction(fromGame);
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

// ==========================
// 🌌 Hiệu ứng nền menu: Mưa sao băng + Mây + Sương mù
// ==========================
const fog = document.createElement("div");
fog.className = "fog";
document.body.appendChild(fog);

const cloudConfigs = [
  { top: 80, delay: 0 },
  { top: 180, delay: 30 },
  { top: 250, delay: 20 },
  { top: 300, delay: 45 },
];

cloudConfigs.forEach(({ top, delay }) => {
  const cloud = document.createElement("div");
  cloud.className = "cloud";
  cloud.style.top = `${top}px`;
  cloud.style.animationDelay = `${delay}s`;
  document.body.appendChild(cloud);
});

function createShootingStar() {
  const star = document.createElement("div");
  star.classList.add("shooting-star");

  const left = Math.random() * window.innerWidth;
  const isBright = Math.random() < 0.15;
  const length = isBright ? 160 : 60 + Math.random() * 100;
  const duration = 0.3 + Math.random() * 5;
  const brightness = isBright ? 0.95 : 0.4 + Math.random() * 0.5;

  star.style.left = `${left}px`;
  star.style.height = `${length}px`;
  star.style.opacity = brightness;
  star.style.animationDuration = `${duration}s`;

  if (isBright) {
    const head = document.createElement("div");
    head.className = "star-head";
    star.appendChild(head);
  }

  document.body.appendChild(star);
  setTimeout(() => star.remove(), duration * 1000 + 100);
}

setInterval(createShootingStar, 800);

window.addEventListener(
  "click",
  () => {
    if (document.getElementById("menu-container"))
      syncDefaultMusic(gameState.settings);
  },
  { once: true },
);
