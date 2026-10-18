import { createIcon } from './icons.js';
import { openAppModal } from './modal.js';

export function openGameExitDialog({ owner, trigger, onExit, onRestart, onSettings, onClose, mode = 'easy' }) {
  if (!owner.active || document.getElementById('game-exit-modal')) return null;
  trigger.setAttribute('aria-expanded', 'true');
  let nextAction = null;
  const modal = openAppModal({
    id: 'game-exit-modal', title: 'Tạm dừng', icon: 'menu', owner,
    content: '',
    size: 'small',
    actions: [
      { label: 'Tiếp tục', icon: 'play', variant: 'primary' },
      { label: ['challenge', 'endless'].includes(mode) ? 'Lượt mới' : 'Chơi lại', icon: 'restart', onClick: async () => { await onRestart(); return false; } },
      { label: 'Cài đặt', icon: 'settings', onClick: () => { nextAction = onSettings; } },
      { label: 'Thoát game', icon: 'exit', variant: 'danger', onClick: async () => { await onExit(); return false; } },
    ],
    onClose: () => { onClose(); nextAction?.(); },
    onDestroy: () => trigger.setAttribute('aria-expanded', 'false'),
  });
  // Keep the three main actions centered; settings stays available in the header.
  const settingsButton = modal.panel.querySelector('.app-modal__footer').children[2];
  settingsButton.className = 'pause-settings';
  settingsButton.setAttribute('aria-label', 'Cài đặt');
  settingsButton.replaceChildren(createIcon('settings'));
  modal.panel.querySelector('.app-modal__header').insertBefore(settingsButton, modal.panel.querySelector('.app-modal__close'));
  modal.panel.classList.add('pause-dialog');
  modal.panel.setAttribute('aria-label', 'Tạm dừng màn chơi');
  return modal;
}
