import { CHEST_ITEMS } from './chestConfig.js';
import { FLIP_EFFECTS } from '../flipEffectCatalog.js';
import { LINK_PATH_EFFECTS, LINK_EXIT_EFFECTS } from '../linkConnect/linkEffects.js';
import { THEMES, isThemePlayable } from '../themeCatalog.js';

// Every entry represents one existing ownership right, never a new equipment slot.
const cosmetic = CHEST_ITEMS.map(item => Object.freeze({
  ...item, itemId:item.id, category:'cosmetic', ownedSlot:null,
  icon:item.type === 'avatar' ? 'profile' : 'achievements',
}));
const flip = FLIP_EFFECTS.filter(item => item.id !== 'bounce').map(item => Object.freeze({
  id:`wheel-flip-${item.id}`, itemId:item.id, category:'flip', name:item.title,
  ownedSlot:'ownedFlipEffects', gameId:item.gameId, icon:item.icon || 'cards',
}));
const themes = THEMES.filter(item => item.id !== 'default' && isThemePlayable(item)).flatMap(item => [
  Object.freeze({id:`wheel-theme-shared-${item.id}`,itemId:item.id,category:'theme',name:item.title,ownedSlot:'ownedThemes',icon:item.icon || 'images'}),
  Object.freeze({id:`wheel-theme-triple-${item.id}`,itemId:item.id,category:'theme',name:item.title,ownedSlot:'ownedTripleThemes',gameId:'triple-connect',icon:item.icon || 'images'}),
]);
const effects = (catalog,category,suffix) => catalog.filter(item => item.id !== 'default').flatMap(item =>
  ['link-connect','triple-connect'].filter(gameId => !item.gameId || item.gameId === gameId).map(gameId => Object.freeze({
    id:`wheel-${category}-${gameId === 'link-connect' ? 'link' : 'triple'}-${item.id}`,
    itemId:item.id,category,name:item.title,gameId,icon:item.icon || 'wand',
    ownedSlot:`owned${gameId === 'link-connect' ? 'Link' : 'Triple'}${suffix}Effects`,
  })));

export const WHEEL_ITEMS = Object.freeze([...cosmetic,...flip,...themes,
  ...effects(LINK_PATH_EFFECTS,'path','Path'),...effects(LINK_EXIT_EFFECTS,'exit','Exit')]);
const byId = new Map(WHEEL_ITEMS.map(item => [item.id,item]));
if (byId.size !== WHEEL_ITEMS.length) throw new Error('Wheel entitlement IDs must be unique.');
export const WHEEL_POOLS = Object.freeze(Object.fromEntries(['cosmetic','flip','theme','path','exit'].map(category =>
  [category,Object.freeze(WHEEL_ITEMS.filter(item => item.category === category).map(item => item.id))])));
export const wheelItem = id => byId.get(id) || null;

/** Input is the canonical appearance, already validated at its persistence boundary. */
export function ownedWheelItemIds(appearance = {}) {
  const acquired = new Set(Object.values(appearance.acquisitions?.grants || {}).flatMap(grant => grant.items));
  const certified = new Set(Object.values(appearance.achievements?.grants || {}).filter(grant => !grant.chestType).map(grant => grant.itemId));
  return WHEEL_ITEMS.filter(item => acquired.has(item.id)
    || certified.has(item.itemId)
    || item.ownedSlot && Array.isArray(appearance[item.ownedSlot]) && appearance[item.ownedSlot].includes(item.itemId)).map(item => item.id);
}

/** Materialize validated receipt rights without touching the equipped selection. */
export function applyWheelAcquisitions(appearance, acquisitions) {
  const result = {...appearance},slots=new Map();
  for (const grant of Object.values(acquisitions?.grants || {})) if (grant.sourceKind === 'wheel') {
    for (const id of grant.items) {
      const item=wheelItem(id);
      if (!item) throw new Error('Quà Vòng quay chưa được hỗ trợ. Hãy cập nhật ứng dụng.');
      if (item.ownedSlot) {
        if(!slots.has(item.ownedSlot))slots.set(item.ownedSlot,new Set(Array.isArray(result[item.ownedSlot])?result[item.ownedSlot]:[]));
        slots.get(item.ownedSlot).add(item.itemId);
      }
    }
  }
  for(const [slot,ids]of slots)result[slot]=[...ids];
  return result;
}
