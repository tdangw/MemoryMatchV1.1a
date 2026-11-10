import { cosmeticItem } from './achievementModel.js';
export function normalizePublicCosmetics(value) {
  const selection = Object.fromEntries(['avatar', 'frame', 'badge'].map(slot => {
    const id = [1,2].includes(value?.version) ? value[slot] : null, item = cosmeticItem(id);
    return [slot, item?.type === slot ? id : null];
  }));
  if(value?.version===2)selection.levels=Object.fromEntries(['avatar','frame','badge'].map(slot=>{
    const level=value.levels?.[slot];
    return [slot,selection[slot] ? Number.isInteger(level)&&level>=1&&level<=21?level:1 : 0];
  }));
  return selection;
}
export function publicCosmeticSelection(appearance) {
  const selection=normalizePublicCosmetics({version:1,...appearance.profileCosmetics});
  const levels=appearance.spark?.state?.cosmeticProgress?.levels || {};
  return {version:2,...selection,levels:Object.fromEntries(['avatar','frame','badge'].map(slot=>[slot,selection[slot]?levels[selection[slot]]||1:0]))};
}
export const publicCosmeticFingerprint = selection => JSON.stringify(normalizePublicCosmetics(selection));
