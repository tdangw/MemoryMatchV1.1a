import {
  applyEffectsSettings,
  enableButtonClickSounds,
  unlockSound,
} from "./sound.js";
import "./gameMenu.js";
import { decorateIcons } from "./icons.js";
import {
  createMainMenu,
  showDifficultyOverlay,
  configureMainMenu,
  showGameInfoModal,
  showCollectionModal,
} from "./mainmenu.js";
import { configureSettings, showSettingsPanel } from "./settings.js";
import { openQuickAssistOverlay, openShopOverlay } from "./shop.js";
import { showResetConfirmationOverlay, showReturnToMenuOverlay } from "./ui.js";
import { gameState, hydrateGameState } from "./gameState.js";
import { loadPersistentGameData } from "./persistence.js";
import {
  configureGameController,
  handleHintClick,
  initializeLevel,
  returnToMainMenu,
} from "./gameController.js";
import { registerProgressiveWebApp } from "./pwa.js";
import { initializeMeteorEffects } from "./backgroundEffects.js";

document.documentElement.dataset.buildTarget =
  import.meta.env.MODE === "android" ? "android" : "web";

// Entry point: nạp dữ liệu đã lưu và nối các module qua callback.
registerProgressiveWebApp();
hydrateGameState(loadPersistentGameData());
initializeMeteorEffects(gameState.settings.meteorEffects);
applyEffectsSettings(gameState.settings);
configureGameController({
  showDifficulty: showDifficultyOverlay,
  createMenu: createMainMenu,
});
configureMainMenu({ startGame: initializeLevel });
configureSettings({ onCloseMenu: createMainMenu });
unlockSound();
enableButtonClickSounds(() => gameState.settings);
decorateIcons();

// Tránh mở menu ngữ cảnh khi người chơi thao tác nhanh trên bàn chơi.
document.addEventListener("contextmenu", (event) => event.preventDefault());

// Khóa pinch-zoom trên Safari/iOS; cuộn nội dung bên trong modal vẫn do CSS quản lý.
for (const eventName of ["gesturestart", "gesturechange", "gestureend"]) {
  document.addEventListener(eventName, (event) => event.preventDefault(), {
    passive: false,
  });
}

document.addEventListener(
  "touchmove",
  (event) => {
    if (event.touches.length > 1) event.preventDefault();
  },
  { passive: false },
);

window.onload = () => {
  createMainMenu();
};

document
  .getElementById("btn-game-settings")
  ?.addEventListener("click", () => showSettingsPanel(true));
document
  .getElementById("btn-game-collection")
  ?.addEventListener("click", () => showCollectionModal({ fromGame: true }));
document.getElementById("btn-shop")?.addEventListener("click", openShopOverlay);
document
  .getElementById("btn-game-help")
  ?.addEventListener("click", () =>
    showGameInfoModal(
      "Cách chơi",
      `<ul class="app-feature-list">
        <li>Lật hai thẻ để tìm cặp hình giống nhau.</li>
        <li>Ghép hết các cặp trước khi thời gian kết thúc.</li>
        <li>Ghép đúng liên tiếp để tạo Combo và nhận thêm thời gian.</li>
        <li>Dùng gợi ý hoặc vật phẩm trong cửa hàng khi cần.</li>
      </ul>`,
      "book",
    ),
  );
document
  .getElementById("btn-game-info")
  ?.addEventListener("click", () =>
    showGameInfoModal(
      "Giới thiệu",
      "<p><strong>Memory Match</strong> là trò chơi ghép cặp giúp rèn luyện trí nhớ.</p><p>Chúc bạn có những phút giây thư giãn vui vẻ!</p>",
    ),
  );
document
  .getElementById("btn-restart")
  ?.addEventListener("click", () => showDifficultyOverlay(true));
document
  .getElementById("btn-menu")
  ?.addEventListener("click", () =>
    showReturnToMenuOverlay({ onConfirm: returnToMainMenu }),
  );
document
  .getElementById("btn-full-reset")
  ?.addEventListener("click", showResetConfirmationOverlay);
document.getElementById("btn-hint")?.addEventListener("click", handleHintClick);
document
  .getElementById("btn-buy-time")
  ?.addEventListener("click", () => openQuickAssistOverlay("time"));
document
  .getElementById("btn-preview-cards")
  ?.addEventListener("click", () => openQuickAssistOverlay("preview"));
