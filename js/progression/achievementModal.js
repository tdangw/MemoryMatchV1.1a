import { openAppModal } from '../modal.js';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { renderAchievementCollection } from './achievementCollection.js';
import { refreshAppWallet } from '../appNavigation.js';

/** A map-owned achievement view, independent of collection tabs and equipment. */
export function openAchievementsModal({ gameId, block, owner, surface = {} }) {
  const scope = createGameShellLifecycle();
  const release = owner.own(() => scope.dispose(), 'cleanup');
  scope.own(() => release.forget());
  const content = document.createElement('div');
  const modal = openAppModal({
    ...surface, id: 'achievements-modal', title: 'Thành tích', icon: 'achievements',
    content, owner: scope, size: 'large', keepBanner: true,
    onDestroy: () => scope.dispose(), onClose: refreshAppWallet,
  });
  renderAchievementCollection(content, gameId, { block, owner: scope });
  return modal;
}
