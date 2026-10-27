import { LEGACY_PUBLIC_COSMETIC_IDS } from '../progression/achievementCatalog.generated.js';
const legacy = new Set(LEGACY_PUBLIC_COSMETIC_IDS);
// Enabled only after the matching structured-state rules are available.
export const festivalChestsEnabled = (env = import.meta.env || {}) => env.VITE_FESTIVAL_CHESTS_ENABLED === '1';
export const liveopsEnabled = (env = import.meta.env || {}) => env.VITE_FIREBASE_USE_EMULATORS === '1' || env.VITE_LIVEOPS_ENABLED === '1';
export function canPublishCosmetics(selection, expanded = false) {
  return expanded || ['avatar', 'frame', 'badge'].every(slot => selection[slot] == null || legacy.has(selection[slot]));
}
export const expandedPublicCosmeticsEnabled = (env = import.meta.env || {}) => env.VITE_FIREBASE_USE_EMULATORS === '1' || env.VITE_REWARDS_PUBLIC_EXPANSION_ENABLED === '1';
