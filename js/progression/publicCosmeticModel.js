import { achievementItem } from './achievementModel.js';
export function normalizePublicCosmetics(value) {
  return Object.fromEntries(['avatar', 'frame', 'badge'].map(slot => {
    const id = value?.version === 1 ? value[slot] : null, item = achievementItem(id);
    return [slot, item?.type === slot ? id : null];
  }));
}
export function publicCosmeticSelection(appearance) {
  return { version: 1, ...normalizePublicCosmetics({ version: 1, ...appearance.profileCosmetics }) };
}
export const publicCosmeticFingerprint = selection => JSON.stringify(normalizePublicCosmetics(selection));
