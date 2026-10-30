import { GROUP_LOOT_DROP_RATES } from './config.js';
import { ACHIEVEMENT_ITEMS, EXTRA_COSMETIC_ITEMS } from '../progression/achievementCatalog.generated.js';
import { LETTER_REWARD_ITEMS } from './letterCatalog.generated.js';
export const CHEST_VERSION = 1;
export const CHEST_TYPES = Object.freeze(['c', 'frame', 'avatar', 'badge']);
export const CHEST_NAMES = Object.freeze({ c: 'Rương C', frame: 'Rương Khung', avatar: 'Rương Avatar', badge: 'Rương Huy hiệu' });
export const CHEST_POLICY = Object.freeze({ c: { coins: 50, coinChance: .4, supportChance: .6 },
  frame: { coins: 100, coinChance: .4, supportChance: .4, duplicate: 100 },
  avatar: { coins: 150, coinChance: .4, supportChance: .4, duplicate: 100 },
  badge: { coins: 100, coinChance: .4, supportChance: .4, duplicate: 100 } });
// Explicit catalog sources; image files and preview/effect covers cannot enter the pool.
export const CHEST_ITEMS = Object.freeze([...ACHIEVEMENT_ITEMS, ...LETTER_REWARD_ITEMS,
  ...EXTRA_COSMETIC_ITEMS.filter(item => item.sourceKind === 'event')].filter(item => ['avatar','frame','badge'].includes(item.type)));
export const CHEST_POOLS = Object.freeze(Object.fromEntries(['avatar','frame','badge'].map(type =>
  [type, Object.freeze(CHEST_ITEMS.filter(item => item.type === type).map(item => item.id))])));
export const FESTIVAL_MILESTONES = Object.freeze([{ points:25, coins:50 }, { points:50, coins:100, chest:'c' },
  { points:75, coins:0, chest:'frame' }, { points:100, coins:0, chest:'avatar' }]);
// Badge collection uses the legacy firefly save/rules keys to preserve existing progress.
export const FIREFLY_DROP_CHANCE = GROUP_LOOT_DROP_RATES.special.badge;
export const CHEST_SUPPORTS = Object.freeze({
  'memory-match': [{ key:'hint', label:'Gợi ý 1 lượt' }, { key:'preview4', label:'Xem trước 4 thẻ' }, { key:'time30', label:'+30 giây' }],
  'link-connect': [{ key:'hint', label:'Gợi ý' }, { key:'reshuffle', label:'Xáo trộn' }, { key:'thunder', label:'Sấm sét' }, { key:'freeze', label:'Đóng băng 30 giây' }],
  'triple-connect': [{ key:'hint', label:'Gợi ý' }, { key:'undo', label:'Hoàn tác' }, { key:'shuffle', label:'Xáo trộn' }, { key:'time', label:'+30 giây' }],
});
