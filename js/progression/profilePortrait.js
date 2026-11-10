import { PROFILE_COSMETIC_ITEMS } from './achievementModel.js';
import { createCosmeticPortrait } from '../storybook/presentation.js';
import { cosmeticArtUrl } from './cosmeticArt.js';

export function cosmeticPortrait(selection, { label = 'Ảnh đại diện', size = 128, levels = {} } = {}) {
  const fallbacks={};
  const url = slot => {
    const item=PROFILE_COSMETIC_ITEMS.find(item=>item.id===selection?.[slot]&&item.type===slot);
    if(!item)return null;
    fallbacks[slot]=cosmeticArtUrl(item,size,1);
    return cosmeticArtUrl(item,size,selection?.levels?.[slot] || levels[item.id] || 1);
  };
  return createCosmeticPortrait({avatar:url('avatar'),frame:url('frame'),badge:url('badge'),fallbacks,label});
}
