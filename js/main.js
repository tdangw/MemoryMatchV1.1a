import { getRecentGameId } from "./recentGame.js";
import { configureAdventureMap } from "./adventureMap.js";
import "./memoryMatch/memoryShellDom.js";
import { configureAppNavigation, openLocalRankings, refreshAppWallet, refreshAppAccount } from "./appNavigation.js";
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
  createActiveGameMenu,
  openGameMenu,
  showGameSelector,
} from "./gameSelector.js";
import {
  configureLinkController,
  openLinkPanel,
  continueLinkSession,
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
import { gameState, hydrateGameState, resetGame } from "./gameState.js";
import {
  loadPersistentGameData,
  subscribeToExternalSave,
  subscribeToPersistenceFailure,
  getPersistenceStatus,
  loadProfileOwner,
} from "./persistence.js";
import { setRankingOwner } from './rankingOwner.js';
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
  openTripleModal,
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
let accountRuntime = null;
let accountReady = null;
hydrateGameState(await loadPersistentGameData());
setRankingOwner(await loadProfileOwner());
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
  continueGame: continueMemorySession,
});
configureSettings({ onCloseMenu: createActiveGameMenu });
configureAppNavigation({
  account: async () => {
    if (import.meta.env.VITE_FIREBASE_DISABLED === '1') return openAppModal({ id: 'account-modal', title: 'Tài khoản', content: '<p>Bản lưu trên thiết bị đang hoạt động. Cloud được tắt trong môi trường kiểm tra.</p>' });
    await accountReady;
    if (!accountRuntime) return openAppModal({ id: 'account-modal', title: 'Chưa kết nối được cloud', content: '<p>Bản máy vẫn được lưu. Hãy tải lại ứng dụng để thử kết nối cloud.</p>', actions: [{ label: 'Tải lại', onClick: () => window.location.reload() }] });
    return accountRuntime.showAccountPanel();
  },
  action: async (action, { gameId, playing, root, scope }) => {
    if (action === 'ranking') {
      if (document.getElementById('rankings-modal')) return;
      const rankings = import.meta.env.VITE_FIREBASE_DISABLED === '1' ? null : await import('./leaderboardPanel.js');
      if (!scope.active) return;
      const open = onClose => rankings ? rankings.openLeaderboards(gameId, onClose) : openLocalRankings(gameId, onClose);
      if (!playing) return open();
      if (gameId === 'link-connect') return openLinkPanel(open);
      if (gameId === 'triple-connect') return openTripleModal(open);
      const paused = gameState.isPaused;
      gameState.isPaused = true;
      return open(() => { if (scope.active) gameState.isPaused = paused; });
    }
    if (playing) {
      const selectors = {
        'memory-match': { shop: '#btn-shop', collection: '#btn-game-collection', settings: '#btn-game-settings' },
        'link-connect': { shop: '[data-action="shop"]', collection: '[data-action="collection"]', settings: '[data-action="settings"]' },
        'triple-connect': { shop: '[data-triple-action="shop"]', collection: '[data-triple-action="collection"]', settings: '[data-triple-action="settings"]' },
      };
      return root.querySelector(selectors[gameId][action]).click();
    }
    if (action === 'settings') return showSettingsPanel();
    const open = id => action === 'shop' ? openShopOverlay({ gameId: id, fromMenu: true, onClose: refreshAppWallet }) : showCollectionModal({ gameId: id, onClose: refreshAppWallet });
    if (gameId) return open(gameId);
    return open(getRecentGameId());
  },
});
configureAdventureMap({
  onHome: showGameSelector,
  adapters: {
    'memory-match': {
      description: 'Ghi nhớ vị trí và ghép hết các cặp thẻ trước khi hết giờ.',
      launch: ({ mode, level }) => { resetGame(); gameState.settings.mode = mode; return startNewMemoryRun(level); },
      resume: continueMemorySession,
      collection: onClose => showCollectionModal({ gameId: 'memory-match', onClose }),
    },
    'link-connect': {
      description: 'Quan sát và nối hết các cặp hình bằng đường nối hợp lệ trước khi hết giờ.',
      launch: options => startLinkLevel(options), resume: continueLinkSession,
      collection: onClose => showCollectionModal({ gameId: 'link-connect', onClose }),
    },
    'triple-connect': {
      description: 'Tìm bộ ba thẻ giống nhau và tính toán chỗ trống trong khay.',
      launch: options => startTripleConnectRound(options), resume: continueTripleConnectSession,
      validateSession: isValidTripleConnectSession,
      collection: onClose => showCollectionModal({ gameId: 'triple-connect', onClose }),
    },
  },
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
if (import.meta.env.VITE_FIREBASE_DISABLED !== '1') {
  accountReady = Promise.all([import('./accountService.js'), import('./accountPanel.js')]).then(([account, panels]) => {
    accountRuntime = panels;
    account.initializeAccountService({
      onState: refreshAppAccount,
      onConflict: panels.showCloudConflictDialog,
      onConflictCleared: panels.closeCloudConflictDialog,
      onProfileReplaced: async () => {
        hydrateGameState(await loadPersistentGameData());
        updateMemoryAssistInventoryDisplay();
        applyEffectsSettings(gameState.settings);
        initializeMeteorEffects(gameState.settings.meteorEffects);
        showGameSelector();
        await (await import('./leaderboardService.js')).getLeaderboardService()?.recover();
      },
    });
    return import('./leaderboardService.js').then(module => module.initializeLeaderboardService().ready);
  }).catch(error => {
    console.warn('Cloud startup unavailable', error.code || error.name);
    showAppToast('Cloud chưa kết nối được. Bản máy vẫn hoạt động.');
  });
  void accountReady.then(() => import('./analyticsService.js')).then(module => module.initializeAnalytics()).catch(error => console.warn('Analytics unavailable', error.code || error.name));
}

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
