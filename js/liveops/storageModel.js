import { CHEST_TYPES, CHEST_NAMES } from './chestConfig.js';
import { normalizeChests } from './chests.js';
import { normalizeCosmeticProgress } from '../progression/cosmeticProgression.js';
export const FRAGMENT_NAMES=Object.freeze({avatar:'Mảnh Avatar',frame:'Mảnh Khung',badge:'Mảnh Huy hiệu'});
export function storageEntries(state){
  const chests=normalizeChests(state?.chests),cosmetics=normalizeCosmeticProgress(state?.cosmeticProgress);
  return [...CHEST_TYPES.map(type=>({id:`chest-${type}`,kind:'chest',type,name:CHEST_NAMES[type],count:chests.earned[type]-chests.spent[type]})),
    ...Object.entries(FRAGMENT_NAMES).map(([type,name])=>({id:`fragment-${type}`,kind:'fragment',type,name,count:cosmetics.fragments[type]}))].filter(item=>item.count>0);
}
export function storagePage(entries,page,columns){
  if(![4,6].includes(columns))throw new RangeError('Invalid storage columns');
  const size=columns*6,pages=Math.max(1,Math.ceil(entries.length/size)),index=Math.min(Math.max(0,page),pages-1);
  return {index,pages,items:entries.slice(index*size,(index+1)*size)};
}
