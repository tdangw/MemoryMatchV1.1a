import { openAppModal } from './modal.js';

export function openGameExitDialog({ owner, trigger, onExit, onRestart, onSettings, onClose }) {
  if (!owner.active || document.getElementById('game-exit-modal')) return null;
  trigger.setAttribute('aria-expanded', 'true');
  let nextAction = null;
  const modal = openAppModal({
    id: 'game-exit-modal', title: 'Tạm dừng', icon: 'menu', owner,
    content: '<p>Bạn muốn thoát màn chơi hay bắt đầu lại?</p>',
    actions: [
      { label: 'Thoát game', icon: 'exit', onClick: async () => { await onExit(); return false; } },
      { label: 'Chơi lại', icon: 'restart', variant: 'primary', onClick: async () => { await onRestart(); return false; } },
      { label: 'Cài đặt', icon: 'settings', onClick: () => { nextAction = onSettings; } },
    ],
    onClose: () => { onClose(); nextAction?.(); },
    onDestroy: () => trigger.setAttribute('aria-expanded', 'false'),
  });
  modal.panel.setAttribute('aria-label', 'Tạm dừng màn chơi');
  return modal;
}
