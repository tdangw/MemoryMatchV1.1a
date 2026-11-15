import { CHEST_NAMES,CHEST_POLICY,CHEST_POOLS } from './chestConfig.js';
import { WHEEL_SLOTS } from './wheelRewards.js';
import { WHEEL_POOLS } from './wheelCatalog.js';

export function chestContents(type){
  const policy=CHEST_POLICY[type],pool=CHEST_POOLS[type]||[];
  if(!policy)throw new RangeError('Unknown chest information');
  return `${CHEST_NAMES[type]} · 40%: ${policy.coins} Xu · ${type==='c'?'60':'40'}%: 1 hỗ trợ${pool.length?` · 20%: 1 ngoại hình. Cả ${pool.length} món được chọn đều, gồm món đã có. Bản trùng tăng 1 level; sau Level Max nhận 1 mảnh đúng loại.`:'.'}`;
}
export function wheelChestContents(box){
  const slot=WHEEL_SLOTS.find(slot=>box==='coins'?slot.kind==='randomCoins':slot.box===box);
  if(!slot)throw new RangeError('Unknown wheel chest information');
  const content={
    coins:'5–50 Xu, các mức Xu có cơ hội như nhau.',
    support:'1 hỗ trợ ngẫu nhiên. Ba trò có cơ hội như nhau; các hỗ trợ trong mỗi trò được chọn đều.',
    mystery:'Chọn đều một rương C, Avatar, Khung hoặc Huy hiệu (25% mỗi loại), rồi nhận quà trong rương đó.',
    cosmetic:`1 ngoại hình trong ${WHEEL_POOLS.cosmetic.length} món, gồm món đã có. Bản trùng tăng 1 level; sau Level Max nhận 1 mảnh.`,
    flip:'1 hiệu ứng lật thẻ chưa có. Đủ bộ hoặc nhận trùng: 100 Xu.',
    theme:'1 chủ đề chưa có. Đủ bộ hoặc nhận trùng: 100 Xu.',
    path:'1 hiệu ứng đường nối chưa có. Đủ bộ hoặc nhận trùng: 100 Xu.',
    exit:'1 hiệu ứng xóa thẻ chưa có. Đủ bộ hoặc nhận trùng: 100 Xu.',
  }[box];
  return `${slot.label} · ${slot.weight}%\n${content}`;
}
