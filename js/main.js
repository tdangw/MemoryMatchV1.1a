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
  startLinkLevel,
} from "./linkConnect/linkController.js";
import {
  clearConnectionV2,
  renderConnectionV2,
} from "./effects/connectionEngine.js";
import {
  clearCanvasExit,
  playCanvasExit,
} from "./effects/exitEngine.js";
import { configureSettings, showSettingsPanel } from "./settings.js";
import { openQuickAssistOverlay, openShopOverlay } from "./shop.js";
import {
  showResetConfirmationOverlay,
  showReturnToMenuOverlay,
  updateMemoryAssistInventoryDisplay,
} from "./ui.js";
import { showAppToast, openAppModal } from "./modal.js";
import { gameState, hydrateGameState } from "./gameState.js";
import {
  loadPersistentGameData,
  subscribeToExternalSave,
  subscribeToPersistenceFailure,
  getPersistenceStatus,
} from "./persistence.js";
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
import {
  configureTripleConnectController,
  continueTripleConnectSession,
  isValidTripleConnectSession,
  startTripleConnectRound,
} from "./tripleConnect/tripleController.js";
import {
  TRIPLE_CONNECT_HELP_CONTENT,
} from "./tripleConnect/tripleCopy.js";

document.documentElement.dataset.buildTarget =
  import.meta.env.MODE === "android" ? "android" : "web";

// Entry point: nạp dữ liệu đã lưu và nối các module qua callback.
registerProgressiveWebApp();
async function initializeApplication() {
hydrateGameState(await loadPersistentGameData());
subscribeToPersistenceFailure(() => {
  openAppModal({
    id: "persistence-recovery-modal",
    title: "Chưa thể lưu dữ liệu",
    content: "<p>Để bảo vệ bản lưu, các thay đổi tiếp theo đã dừng. Hãy tải lại trang để sử dụng dữ liệu được lưu thành công gần nhất.</p>",
    dismissible: false, closeOnBackdrop: false, closeOnEscape: false,
    owner: null,
    actions: [{ label: "Tải lại", variant: "primary", onClick: () => window.location.reload() }],
  });
});
if (getPersistenceStatus().blocked) return;
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
  openLinkCollection: async (onClose) =>
    (await showCollectionModal({ gameId: "link-connect", onClose })),
  openLinkShop: async () =>
    (await openShopOverlay({ fromMenu: true, gameId: "link-connect" })),
  startTripleConnect: (mode) => {
    void startTripleConnectRound({ mode });
  },
  continueTripleConnect: (session) => continueTripleConnectSession(session),
  validateTripleSession: isValidTripleConnectSession,
  openTripleCollection: async (onClose) =>
    (await showCollectionModal({ gameId: "triple-connect", onClose })),
  openTripleShop: async () =>
    (await openShopOverlay({ fromMenu: true, gameId: "triple-connect" })),
});
configureTripleConnectController({
  showMenu: () => openGameMenu("triple-connect"),
  showCollection: async (onClose) =>
    (await showCollectionModal({ fromGame: true, gameId: "triple-connect", onClose })),
  showShop: async (onClose) =>
    (await openShopOverlay({ fromMenu: false, gameId: "triple-connect", onClose })),
  showSettings: (onClose) => showSettingsPanel(true, onClose),
  showHelp: (onClose) =>
    showGameInfoModal(
      "Cách chơi Triple Connect",
      TRIPLE_CONNECT_HELP_CONTENT,
      "book",
      onClose,
    ),
  showReset: () => showResetConfirmationOverlay({}),
});
configureLinkController({
  showMenu: () => openGameMenu("link-connect"),
  showCollection: async (onClose) => {
    (await showCollectionModal({
      fromGame: true,
      gameId: "link-connect",
      onClose,
    }));
  },
  showShop: async (onClose) =>
    (await openShopOverlay({
      fromMenu: false,
      gameId: "link-connect",
      linkConnect: true,
      onClose,
    })),
  showSettings: (onClose) => showSettingsPanel(true, onClose),
  showReset: (onClose) => showResetConfirmationOverlay({ onClose }),
});
unlockSound();
enableButtonClickSounds(() => gameState.settings);
decorateIcons();

subscribeToExternalSave(({ data, accept }) => {
  const memoryGameVisible =
    document.getElementById("game-container")?.style.display === "flex";
  const linkGameVisible =
    document
      .getElementById("link-connect-container")
      ?.hasAttribute("hidden") === false;
  const tripleGameVisible = document.getElementById("triple-connect-container")?.hasAttribute("hidden") === false;
  if (memoryGameVisible || linkGameVisible || tripleGameVisible) {
    showAppToast(
      "Dữ liệu vừa thay đổi ở tab khác. Hãy tải lại trước khi tiếp tục chơi.",
      {
        tone: "warning",
        duration: 5000,
      },
    );
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

showGameSelector();

if (new URLSearchParams(window.location.search).has("effect-performance")) {
  Object.defineProperty(window, "__effectV2Performance", {
    configurable: true,
    value: Object.freeze({
      openGameMenu,
      startLinkLevel,
      renderConnectionV2,
      clearConnectionV2,
      playCanvasExit,
      clearCanvasExit,
    }),
  });
}

document
  .getElementById("btn-game-settings")
  ?.addEventListener("click", () => showSettingsPanel(true));
document
  .getElementById("btn-game-collection")
  ?.addEventListener("click", async () => (await showCollectionModal({ fromGame: true })));
document.getElementById("btn-shop")?.addEventListener("click", openShopOverlay);
document.getElementById("btn-game-help")?.addEventListener("click", () =>
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
}
initializeApplication().catch(error => {
  console.error("[Startup]", error);
  showAppToast("Không tải được dữ liệu. Hãy tải lại trang; bản lưu được giữ nguyên.", { tone: "warning", duration: 5000 });
});
