import "./memoryMatch/memoryShellDom.js";
import {
  applyEffectsSettings,
  enableButtonClickSounds,
  unlockSound,
} from "./sound.js";
import "./gameMenu.js";
import "./tooltips.js";
import { decorateIcons } from "./icons.js";
import {
  createMainMenu,
  showDifficultyOverlay,
  configureMainMenu,
  showGameInfoModal,
  showCollectionModal,
} from "./mainmenu.js";
import {
  configureGameSelector,
  createActiveGameMenu,
  openGameMenu,
  showGameSelector,
} from "./gameSelector.js";
import {
  configureLinkController,
  continueLinkSession,
  showLinkDifficultyOverlay,
} from "./linkConnect/linkController.js";
import { configureSettings, showSettingsPanel } from "./settings.js";
import { openQuickAssistOverlay, openShopOverlay } from "./shop.js";
import { showResetConfirmationOverlay, showReturnToMenuOverlay, updateMemoryAssistInventoryDisplay } from "./ui.js";
import { showAppToast } from "./modal.js";
import { gameState, hydrateGameState } from "./gameState.js";
import { loadPersistentGameData, subscribeToExternalSave } from "./persistence.js";
import {
  configureGameController,
  handleHintClick,
  continueMemorySession,
  restartMemoryLevel,
  returnToMainMenu,
  startNewMemoryRun,
} from "./gameController.js";
import { registerProgressiveWebApp } from "./pwa.js";
import { initializeMeteorEffects } from "./backgroundEffects.js";

document.documentElement.dataset.buildTarget =
  import.meta.env.MODE === "android" ? "android" : "web";

// Entry point: nạp dữ liệu đã lưu và nối các module qua callback.
registerProgressiveWebApp();
hydrateGameState(loadPersistentGameData());
updateMemoryAssistInventoryDisplay();
initializeMeteorEffects(gameState.settings.meteorEffects);
applyEffectsSettings(gameState.settings);
configureGameController({
  showDifficulty: showDifficultyOverlay,
  createMenu: createMainMenu,
});
configureMainMenu({
  startGame: startNewMemoryRun,
  changeGame: showGameSelector,
  continueGame: continueMemorySession,
});
configureSettings({ onCloseMenu: createActiveGameMenu });
configureGameSelector({
  startLinkConnect: showLinkDifficultyOverlay,
  continueLinkConnect: (session) => continueLinkSession(session),
  openLinkCollection: (onClose) => showCollectionModal({ gameId: "link-connect", onClose }),
  openLinkShop: () => openShopOverlay({ fromMenu: true, gameId: "link-connect" }),
});
configureLinkController({
  showMenu: () => openGameMenu("link-connect"),
  showCollection: (onClose) => {
    showCollectionModal({
      fromGame: true,
      gameId: "link-connect",
      onClose,
    });
  },
  showShop: (onClose) => openShopOverlay({
    fromMenu: false,
    gameId: "link-connect",
    linkConnect: true,
    onClose,
  }),
  showSettings: (onClose) => showSettingsPanel(true, onClose),
  showReset: (onClose) => showResetConfirmationOverlay({ onClose }),
});
unlockSound();
enableButtonClickSounds(() => gameState.settings);
decorateIcons();

subscribeToExternalSave(({ data, accept }) => {
  const memoryGameVisible = document.getElementById("game-container")?.style.display === "flex";
  const linkGameVisible = document.getElementById("link-connect-container")?.hasAttribute("hidden") === false;
  if (memoryGameVisible || linkGameVisible) {
    showAppToast("Dữ liệu vừa thay đổi ở tab khác. Hãy tải lại trước khi tiếp tục chơi.", {
      tone: "warning",
      duration: 5000,
    });
    return;
  }
  accept();
  hydrateGameState(data);
  updateMemoryAssistInventoryDisplay();
  applyEffectsSettings(gameState.settings);
  initializeMeteorEffects(gameState.settings.meteorEffects);
  showAppToast("Đã đồng bộ dữ liệu mới từ tab khác.");
});

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
  showGameSelector();
  if (import.meta.env.DEV) installTripleDevelopmentLauncher();
};

async function installTripleDevelopmentLauncher() {
  const { startTripleConnectDevelopmentRound } = await import("./tripleConnect/tripleController.js");
  const launcher = document.createElement("div");
  launcher.id = "triple-development-launcher";
  launcher.innerHTML = `<label>Triple dev <select><option value="easy">Easy</option><option value="normal">Normal</option><option value="hard">Hard</option><option value="superHard">SuperHard</option><option value="endless">Endless</option></select></label><button type="button">Mở Triple test</button>`;
  launcher.querySelector("button").onclick = () => startTripleConnectDevelopmentRound({ mode: launcher.querySelector("select").value, seed: `manual-${Date.now()}` });
  document.body.append(launcher);
}

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
        <li>Ghép thẻ đặc biệt để thu thập năng lượng và nhận hỗ trợ.</li>
        <li>Vật phẩm Thời gian và Xem trước mua ở cửa hàng sẽ được cất vào kho trên HUD.</li>
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
  ?.addEventListener("click", restartMemoryLevel);
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
