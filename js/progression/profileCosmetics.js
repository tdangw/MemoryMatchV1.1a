import { gameState } from '../gameState.js';
import { saveAppearance } from '../persistence.js';
import { PROFILE_COSMETIC_ITEMS, ownedProfileCosmeticItems, normalizeProfileCosmetics, achievementAssetUrl } from './achievementModel.js';
import { openCosmeticCustomization } from '../storybook/presentation.js';
import { getGameDefinition } from '../gameCatalog.js';
import { getRankingOwner } from '../rankingOwner.js';
import { sameRankingOwner } from '../progressRankingModel.js';
import { getAccountService } from '../accountService.js';
import { canLaunchGame } from '../profileOperations.js';

export { cosmeticPortrait } from './profilePortrait.js';
export function openProfileCustomization({ playerName, owner, onSaved = () => {} }) {
  const identity = getRankingOwner(), ledger = gameState.appearance.achievements;
  const accountIdentity = getAccountService()?.getIdentity();
  const owned = new Set(ownedProfileCosmeticItems(gameState.appearance).map(item => item.id));
  const current = () => (!owner || owner.active) && canLaunchGame() && !getAccountService()?.getState().conflict
    && (getAccountService()?.getIdentity()?.uid || null) === (accountIdentity?.uid || null)
    && (getAccountService()?.getIdentity()?.profileId || null) === (accountIdentity?.profileId || null)
    && (identity === null ? getRankingOwner() === null : sameRankingOwner(getRankingOwner(), identity));
  const items = PROFILE_COSMETIC_ITEMS.map(item => ({
    ...item, image: achievementAssetUrl(item, 128), previewImage: achievementAssetUrl(item, 256),
    gameName: item.gameId ? getGameDefinition(item.gameId).title : item.series, owned: owned.has(item.id),
  }));
  const modal = openCosmeticCustomization({ playerName, items, equipped: gameState.appearance.profileCosmetics, owner,
    onSave: async selection => {
      if (!current()) return false;
      const allowed = normalizeProfileCosmetics(selection, ledger, gameState.appearance.acquisitions);
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
