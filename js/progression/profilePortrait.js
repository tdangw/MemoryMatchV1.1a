import { PROFILE_COSMETIC_ITEMS, achievementAssetUrl } from './achievementModel.js';
import { createCosmeticPortrait } from '../storybook/presentation.js';

export function cosmeticPortrait(selection, { label = 'Ảnh đại diện', size = 128 } = {}) {
  const url = slot => {
    const item=PROFILE_COSMETIC_ITEMS.find(item=>item.id===selection?.[slot]&&item.type===slot);
    return item ? achievementAssetUrl(item,size) : null;
  };
  return createCosmeticPortrait({avatar:url('avatar'),frame:url('frame'),badge:url('badge'),label});
}
