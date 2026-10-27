import { gameState } from '../gameState.js';
import { saveAppearance } from '../persistence.js';
import { openAppModal } from '../modal.js';
import { createAchievementNoticeContent } from '../storybook/presentation.js';
import { pendingAchievements, achievementAssetUrl } from './achievementModel.js';
import { getRankingOwner } from '../rankingOwner.js';
import { sameRankingOwner } from '../progressRankingModel.js';
import { getAppPageScope } from '../appPageLifecycle.js';
import { CHEST_NAMES } from '../liveops/chestConfig.js';
const names = { 'memory-match': 'Memory Match', 'link-connect': 'Link Connect', 'triple-connect': 'Triple Connect' };
const types = { avatar: 'Ảnh đại diện', frame: 'Khung viền', badge: 'Huy hiệu', 'effect-cover': 'Hiệu ứng' };

/** Receipts are durable before entering this queue. Presentation can only acknowledge. */
export async function presentAchievementAnnouncements({ owner = getAppPageScope(), gameId = null, level = null } = {}) {
  const identity = getRankingOwner();
  const current = () => (!owner || owner.active) && (identity === null ? getRankingOwner() === null : sameRankingOwner(getRankingOwner(), identity));
  const pending = pendingAchievements(gameState.appearance, gameId, level);
  for (const item of pending) {
    if (!current()) return false;
    const profile = item.type !== 'effect-cover', gameName = names[item.gameId];
    const seen = gameState.appearance.achievements.hintsSeen[item.type];
    const firstHint = item.grant.chestType ? 'Mở Bộ sưu tập → Kho rương để xem quà và mở khi bạn muốn.' : seen ? '' : profile ? 'Chạm ảnh đại diện trong Hồ sơ để thay đổi.' : `Bạn có thể chọn hiệu ứng trong Bộ sưu tập ${gameName}.`;
    const content = createAchievementNoticeContent({ gameName, level: item.level, name: item.grant.chestType ? CHEST_NAMES[item.grant.chestType] : item.name,
      category: item.grant.chestType ? 'Mở rương để khám phá quà bên trong' : types[item.type],
      type: item.type, image: item.grant.chestType ? null : achievementAssetUrl(item), firstHint,
      storedIn: item.grant.chestType ? 'Đã thêm vào Kho rương trong Bộ sưu tập' : profile ? 'Đã thêm vào Hồ sơ' : `Đã thêm vào Bộ sưu tập ${gameName}` });
    const error = document.createElement('p'); error.setAttribute('role', 'alert'); content.append(error);
    let continued = false;
    const modal = openAppModal({ id: 'achievement-notice-modal', title: 'Thành tích hoàn tất', content, owner,
      alignment: 'center', dismissible: false, closeOnBackdrop: false, closeOnEscape: false,
      actions: [{ label: 'Tiếp tục', variant: 'primary', onClick: async () => {
        if (!current()) return false;
        const appearance = structuredClone(gameState.appearance);
        appearance.achievements.grants[item.key].announced = true;
        appearance.achievements.hintsSeen[item.type] = true;
        if (!await saveAppearance(appearance, { isCurrent: current, cloudEvent: true })) {
          if (current()) error.textContent = 'Chưa lưu được thay đổi. Hãy thử lại.';
          return false;
        }
        if (!current()) return false;
        continued = true;
        return undefined;
      } }],
    });
    const result = await modal.whenClosed;
    if (!continued || result.reason !== 'closed' || !current()) return false;
  }
  return current();
}

export function resumeAchievementAnnouncements() {
  if (document.querySelector('.app-modal-overlay') || [...document.querySelectorAll('.game-shell-root')].some(node => node.getClientRects().length)) return Promise.resolve(false);
  return presentAchievementAnnouncements();
}
