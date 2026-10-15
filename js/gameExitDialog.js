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
  modal.panel.classList.add('pause-dialog');
  modal.panel.setAttribute('aria-label', 'Tạm dừng màn chơi');
  return modal;
}
