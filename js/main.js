import { applyEffectsSettings, enableButtonClickSounds, unlockSound } from './sound.js';
import './gameMenu.js';
import { decorateIcons } from './icons.js';
import { createMainMenu, showDifficultyOverlay, configureMainMenu } from './mainmenu.js';
import { configureSettings, showSettingsPanel } from './settings.js';
import { openShopOverlay } from './shop.js';
import { showResetConfirmationOverlay, showReturnToMenuOverlay, updateHighScoreDisplay } from './ui.js';
import { gameState, hydrateGameState } from './gameState.js';
import { loadPersistentGameData } from './persistence.js';
import { configureGameController, handleHintClick, initializeLevel, returnToMainMenu } from './gameController.js';

// Entry point: nạp dữ liệu đã lưu và nối các module qua callback.
hydrateGameState(loadPersistentGameData());
applyEffectsSettings(gameState.settings);
configureGameController({ showDifficulty: showDifficultyOverlay, createMenu: createMainMenu });
configureMainMenu({ startGame: initializeLevel });
configureSettings({ onCloseMenu: createMainMenu });
unlockSound();
enableButtonClickSounds(() => gameState.settings);
decorateIcons();

// Tránh mở menu ngữ cảnh khi người chơi thao tác nhanh trên bàn chơi.
document.addEventListener('contextmenu', (event) => event.preventDefault());

window.onload = () => {
  createMainMenu();
  updateHighScoreDisplay(gameState.highScore);
};

document.getElementById('btn-game-settings')?.addEventListener('click', () => showSettingsPanel(true));
document.getElementById('btn-shop')?.addEventListener('click', openShopOverlay);
document.getElementById('btn-restart')?.addEventListener('click', () => showDifficultyOverlay(true));
document.getElementById('btn-menu')?.addEventListener('click', () => showReturnToMenuOverlay({ onConfirm: returnToMainMenu }));
document.getElementById('btn-full-reset')?.addEventListener('click', showResetConfirmationOverlay);
document.getElementById('btn-hint')?.addEventListener('click', handleHintClick);
