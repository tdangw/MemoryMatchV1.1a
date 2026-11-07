import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { createIcon } from './icons.js';
import { openAppModal, showAppToast } from './modal.js';
import { initializeAppVisibility } from './appVisibility.js';
import { pauseGameAudio } from './sound.js';
import { loadPersistentGameData, getPersistenceStatus } from './persistence.js';

const isAndroid = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
let starting = null;
export function showAppExitConfirmation() {
  if (!isAndroid() || document.getElementById('app-exit-modal')) return;
  openAppModal({ id: 'app-exit-modal', title: 'Thoát trò chơi?', icon: 'exit', keepBanner: false,
    content: '<p>Tiến trình đã lưu trên thiết bị. Bạn có muốn thoát trò chơi không?</p>',
    actions: [{ label: 'Ở lại', onClick: close => close() }, { label: 'Thoát game', onClick: async () => {
      try {
        await loadPersistentGameData();
        if (getPersistenceStatus().blocked) { showAppToast('Chưa lưu được dữ liệu. Hãy kiểm tra trước khi thoát.'); return false; }
        pauseGameAudio(); await App.exitApp();
      }
      catch { showAppToast('Chưa thoát được trò chơi. Hãy thử lại.'); }
      return false;
    } }],
  });
}
export function mountHomeExit(root, scope) {
  if (!isAndroid()) return;
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'home-app-exit';
  button.setAttribute('aria-label', 'Thoát game'); button.append(createIcon('exit'));
  root.append(button); scope.listen(button, 'click', showAppExitConfirmation);
  scope.own(() => button.remove(), 'node');
}
export function handleAndroidBack() {
  // Respect non-dismissible/busy dialogs: their existing Escape handler owns dismissal.
  if (document.querySelector('.app-modal-overlay')) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    return;
  }
  const visible = selector => [...document.querySelectorAll(selector)].reverse().find(node => node.getClientRects().length && !node.closest('[hidden]'));
  const gameMenu = visible('.game-shell-root .game-menu-toggle');
  if (gameMenu) { gameMenu.click(); return; }
  const exit = visible('.adventure-screen > .adventure-exit, .adventure-map-page .adventure-exit');
  if (exit) { exit.click(); return; }
  if (document.querySelector('.game-selector:not([hidden])')) showAppExitConfirmation();
}
export function initializeAndroidNavigation() {
  if (!isAndroid()) return Promise.resolve();
  if (starting) return starting;
  starting = (async () => {
    await initializeAppVisibility(App);
    return App.addListener('backButton', handleAndroidBack);
  })().catch(error => { starting = null; console.warn('Android navigation unavailable', error.code || error.name); });
  return starting;
}
