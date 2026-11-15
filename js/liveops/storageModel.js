import { CHEST_TYPES, CHEST_NAMES } from './chestConfig.js';
import { normalizeChests } from './chests.js';
import { normalizeCosmeticProgress } from '../progression/cosmeticProgression.js';
import {normalizeStorageUnlocks,STORAGE_FREE_SLOTS,STORAGE_MAX_SLOTS,STORAGE_PAGE_SIZE,STORAGE_PAGE_COUNT} from './storageCapacity.js';
export const FRAGMENT_NAMES=Object.freeze({avatar:'Mảnh Avatar',frame:'Mảnh Khung',badge:'Mảnh Huy hiệu'});
export const STORAGE_ACCESS_VERSION=1;
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
export function storageAvailableQuantity(state,id){
  let remaining=STORAGE_FREE_SLOTS+normalizeStorageUnlocks(state?.storageUnlocks).slots.length;
  for(const item of storageEntries(state)){
    const slots=item.kind==='chest'?item.count:1,used=Math.min(remaining,slots);
    if(item.id===id)return item.kind==='chest'?used:used?item.count:0;
    remaining-=used;
  }
  return 0;
}
/** New requests obey capacity; already stored legacy requests keep their contract. */
export function assertStorageAccess(state,command){
  if(!['openChest','sellChest','sellCosmeticFragments','fuseCosmeticFragments'].includes(command.type)||command.storageAccessVersion===undefined)return;
  if(command.storageAccessVersion!==STORAGE_ACCESS_VERSION)throw new Error('Phiên bản thao tác kho không hợp lệ.');
  const chest=['openChest','sellChest'].includes(command.type);
  if((chest?state.chests?.last:state.cosmeticProgress?.last)?.operation===command.operation)return;
  const required=chest?[[`chest-${command.chestType}`,command.type==='openChest'?1:command.quantity]]
    :command.type==='sellCosmeticFragments'?[[`fragment-${command.fragmentType}`,command.quantity]]
    :Object.entries(command.ingredients||{}).map(([type,count])=>[`fragment-${type}`,count]);
  for(const [id,count] of required)if(!Number.isSafeInteger(count)||count<0||storageAvailableQuantity(state,id)<count)throw new Error('Vật phẩm đang ở kho tạm. Hãy tạo ô trống trong kho chính.');
}
/** Materialize at most one page; aggregate balances remain the source of truth. */
export function storageLayout(state,page=0,overflowPage=0){
  const entries=storageEntries(state),unlocks=normalizeStorageUnlocks(state?.storageUnlocks);
  const open=Array.from({length:STORAGE_MAX_SLOTS},(_,i)=>i).filter(i=>i<STORAGE_FREE_SLOTS||unlocks.slots.includes(i));
  const total=entries.reduce((n,item)=>n+(item.kind==='chest'?item.count:1),0),overflow=Math.max(0,total-open.length);
  const pages=Math.max(1,Math.ceil(overflow/STORAGE_PAGE_SIZE)),extra=Math.max(0,Math.min(overflowPage,pages-1));
  function itemAt(index){
    let cursor=index;
    for(const entry of entries){const size=entry.kind==='chest'?entry.count:1;if(cursor<size)return {...entry,entryId:entry.id,id:entry.kind==='chest'?`${entry.id}-${cursor}`:entry.id,count:entry.kind==='chest'?1:entry.count};cursor-=size;}
    return null;
  }
  const index=Math.max(0,Math.min(STORAGE_PAGE_COUNT-1,page));
  const slots=Array.from({length:STORAGE_PAGE_SIZE},(_,n)=>{
    const slot=index*STORAGE_PAGE_SIZE+n,position=open.indexOf(slot);
    return {slot,locked:position<0,item:position<0?null:itemAt(position)};
  });
  return {index,slots,total,capacity:open.length,overflow,overflowPage:extra,overflowPages:pages,
    overflowItems:Array.from({length:Math.min(STORAGE_PAGE_SIZE,Math.max(0,overflow-extra*STORAGE_PAGE_SIZE))},(_,n)=>({...itemAt(open.length+extra*STORAGE_PAGE_SIZE+n),temporary:true}))};
}
