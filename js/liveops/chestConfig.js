import { GROUP_LOOT_DROP_RATES } from './config.js';
import { ACHIEVEMENT_ITEMS, EXTRA_COSMETIC_ITEMS } from '../progression/achievementCatalog.generated.js';
import { LETTER_REWARD_ITEMS } from './letterCatalog.generated.js';
import { COSMETIC_ITEMS } from '../progression/cosmeticCatalog.js';
export const CHEST_VERSION = 2;
export const CHEST_TYPES = Object.freeze(['c', 'frame', 'avatar', 'badge']);
export const CHEST_NAMES = Object.freeze({ c: 'Rương C', frame: 'Rương Khung', avatar: 'Rương Avatar', badge: 'Rương Huy hiệu' });
// Sale v1: C = round((40%*50 + 60%*mean(three games' support prices))/2).
// Support means158.6667/158.5/158.5 at approval; freeze receipts to this policy.
export const CHEST_SALE_PRICES = Object.freeze({c:58,avatar:200,frame:200,badge:200});
export const COSMETIC_CHEST_PURCHASE_PRICE = 10000;
export const CHEST_POLICY = Object.freeze({ c: { coins: 50, coinChance: .4, supportChance: .6 },
  frame: { coins: 100, coinChance: .4, supportChance: .4, duplicate: 100 },
  avatar: { coins: 150, coinChance: .4, supportChance: .4, duplicate: 100 },
  badge: { coins: 100, coinChance: .4, supportChance: .4, duplicate: 100 } });
// Explicit catalog sources; image files and preview/effect covers cannot enter the pool.
export const LEGACY_CHEST_ITEMS = Object.freeze([...ACHIEVEMENT_ITEMS, ...LETTER_REWARD_ITEMS,
  ...EXTRA_COSMETIC_ITEMS.filter(item => item.sourceKind === 'event')].filter(item => ['avatar','frame','badge'].includes(item.type)));
export const CHEST_ITEMS = COSMETIC_ITEMS;
export const CHEST_POOLS = Object.freeze(Object.fromEntries(['avatar','frame','badge'].map(type =>
  [type, Object.freeze(CHEST_ITEMS.filter(item => item.type === type).map(item => item.id))])));
export const LEGACY_CHEST_POOLS = Object.freeze(Object.fromEntries(['avatar','frame','badge'].map(type =>
  [type, Object.freeze(LEGACY_CHEST_ITEMS.filter(item => item.type === type).map(item => item.id))])));
export const chestPools = version => version === 1 ? LEGACY_CHEST_POOLS : version === CHEST_VERSION ? CHEST_POOLS : null;
export const FESTIVAL_VERSION = 2;
export const LEGACY_FESTIVAL_MILESTONES = Object.freeze([{ points:25, coins:50 }, { points:50, coins:100, chest:'c' },
  { points:75, coins:0, chest:'frame' }, { points:100, coins:0, chest:'avatar' }]);
export const FESTIVAL_MILESTONES = Object.freeze([{ points:10, coins:50 }, { points:25, coins:100 }, { points:50, coins:0, chest:'c' },
  { points:75, coins:0, chest:'frame' }, { points:100, coins:0, chest:'avatar' }]);
export function festivalMilestones(version) {
  if(version===1)return LEGACY_FESTIVAL_MILESTONES;
  if(version===FESTIVAL_VERSION)return FESTIVAL_MILESTONES;
  throw new TypeError('Unknown badge reward version');
}
// Badge collection uses the legacy firefly save/rules keys to preserve existing progress.
export const FIREFLY_DROP_CHANCE = GROUP_LOOT_DROP_RATES.special.badge;
export const CHEST_SUPPORTS = Object.freeze({
  'memory-match': [{ key:'hint', label:'Gợi ý 1 lượt' }, { key:'preview4', label:'Xem trước 4 thẻ' }, { key:'time30', label:'+30 giây' }],
  'link-connect': [{ key:'hint', label:'Gợi ý' }, { key:'reshuffle', label:'Xáo trộn' }, { key:'thunder', label:'Sấm sét' }, { key:'freeze', label:'Đóng băng 30 giây' }],
  'triple-connect': [{ key:'hint', label:'Gợi ý' }, { key:'undo', label:'Hoàn tác' }, { key:'shuffle', label:'Xáo trộn' }, { key:'time', label:'+30 giây' }],
});
