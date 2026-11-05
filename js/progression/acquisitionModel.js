import { CHEST_ITEMS } from '../liveops/chestConfig.js';
import { LETTER_REWARD_ITEMS } from '../liveops/letterCatalog.generated.js';
import { eventCollection } from '../liveops/config.js';
import { EXTRA_COSMETIC_ITEMS } from './achievementCatalog.generated.js';
import { wheelItem } from '../liveops/wheelCatalog.js';

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const invalid = () => new Error('Bản lưu quà Sự kiện chưa toàn vẹn. Dữ liệu được giữ nguyên.');

/** Acquisition receipts are separate from certified level grants. */
export function normalizeAcquisitions(value) {
  if (value === undefined) return { version: 1, grants: {} };
  if (!record(value) || value.version !== 1 || !record(value.grants)) throw invalid();
  const grants = {};
  for (const [id, grant] of Object.entries(value.grants)) {
    if(grant?.sourceKind==='wheel'){
      const item=Array.isArray(grant.items)&&grant.items.length===1?wheelItem(grant.items[0]):null;
      if(!item||grant.receiptId!==id||typeof grant.ownerUid!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(grant.ownerUid)
        ||id!==`${grant.ownerUid}:wheel:item:${item.id}`||grant.sourceId!=='wheel-v2'||!Number.isSafeInteger(grant.grantedAt)||grant.grantedAt<0)throw invalid();
      grants[id]={receiptId:id,ownerUid:grant.ownerUid,sourceKind:'wheel',sourceId:'wheel-v2',items:[item.id],grantedAt:grant.grantedAt};continue;
    }
    if(grant?.sourceKind==='chest'){
      const item=Array.isArray(grant.items)&&grant.items.length===1?CHEST_ITEMS.find(item=>item.id===grant.items[0]):null;
      if(!item||grant.receiptId!==id||typeof grant.ownerUid!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(grant.ownerUid)
        ||id!==`${grant.ownerUid}:chest:item:${item.id}`||grant.sourceId!=='shared-chests-v1'||!Number.isSafeInteger(grant.grantedAt)||grant.grantedAt<0)throw invalid();
      grants[id]={receiptId:id,ownerUid:grant.ownerUid,sourceKind:'chest',sourceId:grant.sourceId,items:[item.id],grantedAt:grant.grantedAt};continue;
    }
    if (grant?.sourceKind === 'letters') {
      const item = Array.isArray(grant.items) && grant.items.length === 1 ? LETTER_REWARD_ITEMS.find(item=>item.id===grant.items[0]) : null;
      if(!item || grant.receiptId!==id || typeof grant.ownerUid!=='string' || !/^[A-Za-z0-9_-]{1,128}$/.test(grant.ownerUid)
        || id!==`${grant.ownerUid}:letters:${item.id}` || grant.sourceId!=='letters-collection-01'
        || !Number.isSafeInteger(grant.grantedAt) || grant.grantedAt<0) throw invalid();
      grants[id]={receiptId:id,ownerUid:grant.ownerUid,sourceKind:'letters',sourceId:'letters-collection-01',items:[item.id],grantedAt:grant.grantedAt};
      continue;
    }
    const collection = eventCollection(grant?.sourceId), eventItems = collection ? [...collection.items].sort() : [];
    if (!record(grant) || grant.receiptId !== id || typeof grant.ownerUid !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(grant.ownerUid)
      || grant.sourceKind !== 'event' || !collection || grant.milestone !== 100
      || id !== `${grant.ownerUid}:event:${grant.sourceId}:100`
      || !Number.isSafeInteger(grant.grantedAt) || grant.grantedAt < 0
      || !Array.isArray(grant.items) || JSON.stringify([...grant.items].sort()) !== JSON.stringify(eventItems)) throw invalid();
    grants[id] = { receiptId: id, ownerUid: grant.ownerUid, sourceKind: 'event', sourceId: grant.sourceId,
      milestone: 100, grantedAt: grant.grantedAt, items: [...eventItems] };
  }
  return { version: 1, grants };
}

export function mergeAcquisitions(previous, incoming) {
  const before = normalizeAcquisitions(previous), next = normalizeAcquisitions(incoming);
  for (const [id, grant] of Object.entries(before.grants)) {
    if (next.grants[id] && JSON.stringify(next.grants[id]) !== JSON.stringify(grant)) throw invalid();
  }
  return { version: 1, grants: { ...before.grants, ...next.grants } };
}

export function extraOwnedIds(acquisitions) {
  return new Set([...EXTRA_COSMETIC_ITEMS.filter(item => item.sourceKind === 'starter').map(item => item.id),
    ...Object.values(normalizeAcquisitions(acquisitions).grants).flatMap(grant => grant.items)]);
}
