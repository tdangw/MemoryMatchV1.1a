import { getRecentGameId } from "./recentGame.js";
import { initializeProfileStatsService } from './profileStatsService.js';
import { configureAdventureMap } from "./adventureMap.js";
import { previewMemoryLevel, previewLinkLevel, previewTripleLevel } from './adventurePreview.js';
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
  startLinkLevel,
  runLinkGameAction,
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
  startNewMemoryRun,
} from "./gameController.js";
import { registerProgressiveWebApp } from "./pwa.js";
import { initializeMeteorEffects } from "./backgroundEffects.js";
import {
  configureTripleConnectController,
  startTripleConnectRound,
  runTripleGameAction,
} from "./tripleConnect/tripleController.js";
import {
  TRIPLE_CONNECT_HELP_CONTENT,
} from "./tripleConnect/tripleCopy.js";

document.documentElement.dataset.buildTarget =
  import.meta.env.MODE === "android" ? "android" : "web";

// Entry point: nạp dữ liệu đã lưu và nối các module qua callback.
registerProgressiveWebApp();
function showMemoryHelp() {
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
  );
}

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
  showSettings: () => showSettingsPanel(true, () => {}, { onHelp: showMemoryHelp, onReset: () => showResetConfirmationOverlay({}) }),
  showDifficulty: showDifficultyOverlay,
  createMenu: createMainMenu,
});
configureMainMenu({
  startGame: startNewMemoryRun,
  continueGame: continueMemorySession,
});
configureSettings({ onCloseMenu: createActiveGameMenu, onHelp: () => showGameInfoModal('Hướng dẫn', '<p>Chọn một trò và màn chơi, chọn độ khó rồi bấm Chơi. Memory Match rèn trí nhớ bằng ghép cặp; Link Connect nối cặp hình; Triple Connect ghép bộ ba và quản lý khay.</p>', 'book'), onReset: () => showResetConfirmationOverlay({}) });
configureAppNavigation({
  home: showGameSelector,
  account: async (surface = {}) => {
    if (import.meta.env.VITE_FIREBASE_DISABLED === '1') {
      const panels = await import('./accountPanel.js');
      if (surface.owner && !surface.owner.active) return;
      return panels.showAccountPanel(surface);
    }
    await accountReady;
    if (surface.owner && !surface.owner.active) return;
    if (!accountRuntime) return openAppModal({ ...surface, id: 'account-modal', title: 'Tài khoản', content: '<p>Tiến trình đã lưu trên thiết bị. Hãy tải lại ứng dụng để kết nối tài khoản.</p>', actions: [{ label: 'Tải lại', onClick: () => window.location.reload() }] });
    return accountRuntime.showAccountPanel(surface);
  },
  action: async (action, { gameId, scope, surface = {} }) => {
    if (action === 'missions' || action === 'friends') return openAppModal({ ...surface, id: `${action}-screen`, title: action === 'missions' ? 'Nhiệm vụ' : 'Bạn bè', icon: action, content: '<p class="navigation-coming-soon">Sắp ra mắt</p>' });
    if (action === 'ranking') {
      if (document.getElementById('rankings-modal')) return;
      const rankings = import.meta.env.VITE_FIREBASE_DISABLED === '1' ? null : await import('./leaderboardPanel.js');
      if (!scope.active) return;
      const open = onClose => rankings ? rankings.openLeaderboards(gameId, onClose, surface) : openLocalRankings(gameId, onClose, surface);
      return open();
    }
    if (action === 'settings') return showSettingsPanel(false, () => {}, gameId === 'memory-match' ? { onHelp: showMemoryHelp, onReset: () => showResetConfirmationOverlay({}) } : undefined, surface);
    const open = id => action === 'shop' ? openShopOverlay({ gameId: id, fromMenu: true, onClose: refreshAppWallet, surface }) : showCollectionModal({ gameId: id, onClose: refreshAppWallet, surface });
    if (gameId) return open(gameId);
    return open(getRecentGameId());
  },
});
configureAdventureMap({
  adapters: {
    'memory-match': { goal: 'Ghi nhớ vị trí và ghép hết các cặp thẻ trước khi hết giờ.', preview: ({ mode, level, startedLevels }) => previewMemoryLevel(mode, level, { ...gameState.progress.memoryMatch, startedLevels }), launch: ({ mode, level, skipIntro }) => { resetGame(); gameState.settings.mode = mode; return startNewMemoryRun(level, { skipIntro }); } },
    'link-connect': { goal: 'Tìm đường nối và ghép hết các cặp thẻ trước khi hết giờ.', preview: ({ mode, level, startedLevels }) => previewLinkLevel(mode, level, { ...gameState.progress.linkConnect, startedLevels }), launch: options => startLinkLevel(options) },
    'triple-connect': { goal: 'Ghép hết các bộ ba trước khi hết giờ. Đừng để khay đầy!', preview: ({ mode, level }) => previewTripleLevel(mode, level, gameState.progress.tripleConnect), launch: options => startTripleConnectRound(options) },
  },
});
configureTripleConnectController({
  showMenu: () => openGameMenu("triple-connect"),
  showCollection: async (onClose) =>
    (await showCollectionModal({ fromGame: true, gameId: "triple-connect", onClose })),
  showShop: async (onClose) =>
    (await openShopOverlay({ fromMenu: false, gameId: "triple-connect", onClose })),
  showSettings: (onClose) => showSettingsPanel(true, onClose, { onHelp: () => runTripleGameAction("help"), onReset: () => runTripleGameAction("reset") }),
  showHelp: (onClose) =>
    showGameInfoModal(
      "Cách chơi Triple Connect",
      TRIPLE_CONNECT_HELP_CONTENT,
      "book",
      onClose,
    ),
  showReset: (onClose) => showResetConfirmationOverlay({ onClose }),
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
  showSettings: (onClose) => showSettingsPanel(true, onClose, { onHelp: () => runLinkGameAction("help"), onReset: () => runLinkGameAction("reset") }),
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

const profileStats = await initializeProfileStatsService();
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
    void profileStats?.bindAccount(account.getAccountService()).catch(error => console.warn('Profile statistics startup unavailable', error.code || error.name));
    return import('./leaderboardService.js').then(module => module.initializeLeaderboardService().ready);
  }).catch(error => {
    console.warn('Cloud startup unavailable', error.code || error.name);
    showAppToast('Chưa kết nối được tài khoản. Tiến trình vẫn được lưu.');
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
