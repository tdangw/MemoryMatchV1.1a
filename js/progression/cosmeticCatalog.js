import { ACHIEVEMENT_ITEMS, EXTRA_COSMETIC_ITEMS } from './achievementCatalog.generated.js';
import { LETTER_REWARD_ITEMS } from '../liveops/letterCatalog.generated.js';

export const COSMETIC_TYPES = Object.freeze(['avatar', 'frame', 'badge']);
export const COSMETIC_ITEMS = Object.freeze([
  ...EXTRA_COSMETIC_ITEMS.filter(item => item.sourceKind === 'starter'),
  ...ACHIEVEMENT_ITEMS.filter(item => COSMETIC_TYPES.includes(item.type)),
  ...EXTRA_COSMETIC_ITEMS.filter(item => item.sourceKind !== 'starter'),
  ...LETTER_REWARD_ITEMS,
]);
const items = new Map(COSMETIC_ITEMS.map(item => [item.id, item]));
if (items.size !== COSMETIC_ITEMS.length) throw new Error('Duplicate cosmetic catalog ID');
export const cosmeticDefinition = id => items.get(id) || null;
