import {normalizeAcquisitions} from '../progression/acquisitionModel.js';
import {applyWheelAcquisitions} from './wheelCatalog.js';
import {creditChestSupport} from './supportInventory.js';

/** Shared local/cloud receipt projection; persistence owns the atomic write. */
export function projectSparkRewards(data,result,uid,ownedIds){
  const acquisitions=normalizeAcquisitions(data.appearance.acquisitions);let added=0;
  for(const receipt of result.receipts){
    added+=receipt.coins;
    if(receipt.support)creditChestSupport(data.progress,receipt.support);
    if(receipt.acquisition&&!acquisitions.grants[receipt.receiptId])acquisitions.grants[receipt.receiptId]={...receipt.acquisition,receiptId:receipt.receiptId,ownerUid:uid,grantedAt:receipt.grantedAt};
  }
  data.coins+=added;
  if(!Number.isSafeInteger(data.coins)||data.coins<0)throw new Error('Kho Xu đã đầy.');
  data.appearance=applyWheelAcquisitions({...data.appearance,acquisitions:normalizeAcquisitions(acquisitions)},acquisitions);
  result.ownedItemIds=[...new Set([...ownedIds,...Object.values(acquisitions.grants).flatMap(grant=>grant.items)])];
  return added;
}
export function sparkOutcome(result){
  return JSON.stringify({receipts:result.receipts.map(({grantedAt,receiptId,ownerUid,...receipt})=>receipt),
    chest:result.chestResult,letter:result.letterResult,cosmetic:result.cosmeticResult,fragment:result.fragmentResult,wheel:result.wheelReward,hourly:result.hourlyGiftResult});
}
