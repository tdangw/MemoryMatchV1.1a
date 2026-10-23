import { gameState } from '../gameState.js';
import { saveAppearance } from '../persistence.js';
import { ACHIEVEMENT_ITEMS, ownedAchievementItems, normalizeProfileCosmetics, achievementAssetUrl } from './achievementModel.js';
import { openCosmeticCustomization, createCosmeticPortrait } from '../storybook/presentation.js';
import { getGameDefinition } from '../gameCatalog.js';
import { getRankingOwner } from '../rankingOwner.js';
import { sameRankingOwner } from '../progressRankingModel.js';
import { getAccountService } from '../accountService.js';
import { canLaunchGame } from '../profileOperations.js';

export function cosmeticPortrait(selection, { label = 'Ảnh đại diện', size = 128 } = {}) {
  const url = slot => { const item = ACHIEVEMENT_ITEMS.find(item => item.id === selection?.[slot] && item.type === slot); return item ? achievementAssetUrl(item, size) : null; };
  return createCosmeticPortrait({ avatar: url('avatar'), frame: url('frame'), badge: url('badge'), label });
}
export function openProfileCustomization({ playerName, owner, onSaved = () => {} }) {
  const identity = getRankingOwner(), ledger = gameState.appearance.achievements;
  const accountIdentity = getAccountService()?.getIdentity();
  const owned = new Set(ownedAchievementItems(gameState.appearance).map(item => item.id));
  const current = () => (!owner || owner.active) && canLaunchGame() && !getAccountService()?.getState().conflict
    && (getAccountService()?.getIdentity()?.uid || null) === (accountIdentity?.uid || null)
    && (getAccountService()?.getIdentity()?.profileId || null) === (accountIdentity?.profileId || null)
    && (identity === null ? getRankingOwner() === null : sameRankingOwner(getRankingOwner(), identity));
  const items = ACHIEVEMENT_ITEMS.filter(item => item.type !== 'effect-cover').map(item => ({
    ...item, image: achievementAssetUrl(item, 256), gameName: getGameDefinition(item.gameId).title, owned: owned.has(item.id),
  }));
  const modal = openCosmeticCustomization({ playerName, items, equipped: gameState.appearance.profileCosmetics, owner,
    onSave: async selection => {
      if (!current()) return false;
      const allowed = normalizeProfileCosmetics(selection, ledger);
      if (Object.keys(allowed).some(slot => allowed[slot] !== selection[slot])) return false;
      if (Object.keys(allowed).every(slot => allowed[slot] === gameState.appearance.profileCosmetics[slot])) return true;
      const appearance = { ...gameState.appearance, profileCosmetics: allowed };
      const isCurrent = () => current() && modal.panel.isConnected;
      if (!await saveAppearance(appearance, { isCurrent, cloudEvent: true }) || !isCurrent()) return false;
      onSaved(); return true;
    },
  });
  return modal;
}
