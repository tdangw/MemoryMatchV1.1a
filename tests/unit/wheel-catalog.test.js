import test from 'node:test';
import assert from 'node:assert/strict';
import { WHEEL_ITEMS, WHEEL_POOLS, wheelItem, ownedWheelItemIds, applyWheelAcquisitions } from '../../js/liveops/wheelCatalog.js';
import { FLIP_EFFECTS as PURE_FLIPS } from '../../js/flipEffectCatalog.js';
import { FLIP_EFFECTS, normalizeAppearance } from '../../js/appearance.js';
import { THEMES, isThemePlayable } from '../../js/themeCatalog.js';
import { LINK_PATH_EFFECTS, LINK_EXIT_EFFECTS } from '../../js/linkConnect/linkEffects.js';
import { CHEST_ITEMS } from '../../js/liveops/chestConfig.js';
import { LETTER_REWARD_ITEMS } from '../../js/liveops/letterCatalog.generated.js';
import { ACHIEVEMENT_ITEMS, EXTRA_COSMETIC_ITEMS } from '../../js/progression/achievementCatalog.generated.js';
import { normalizeAcquisitions, mergeAcquisitions, extraOwnedIds } from '../../js/progression/acquisitionModel.js';
import { ownedProfileCosmeticItems } from '../../js/progression/achievementModel.js';

const uid='catalog-owner';
function receipt(item,sourceKind='wheel'){
 const receiptId=`${uid}:wheel:item:${item.id}`;
 return {receiptId,ownerUid:uid,sourceKind,sourceId:'wheel-v2',items:[item.id],grantedAt:1};
}
const ledger=item=>{const grant=receipt(item);return {version:1,grants:{[grant.receiptId]:grant}};};

test('wheel catalog contains only usable nondefault rights and preserves the flip public API',()=>{
 assert.equal(FLIP_EFFECTS,PURE_FLIPS);
 assert.equal(new Set(WHEEL_ITEMS.map(item=>item.id)).size,WHEEL_ITEMS.length);
 assert.deepEqual(WHEEL_POOLS.cosmetic,[...CHEST_ITEMS].map(item=>item.id));
 for(const item of WHEEL_ITEMS){
  assert.equal(wheelItem(item.id),item);assert.ok(item.name);assert.ok(WHEEL_POOLS[item.category].includes(item.id));
  assert.notEqual(item.itemId,'default');assert.notEqual(item.itemId,'bounce');
  if(item.category==='cosmetic')assert.equal(item.ownedSlot,null);
  if(item.category==='theme')assert.ok(isThemePlayable(THEMES.find(theme=>theme.id===item.itemId)));
  if(item.category==='path'||item.category==='exit'){
   const source=(item.category==='path'?LINK_PATH_EFFECTS:LINK_EXIT_EFFECTS).find(effect=>effect.id===item.itemId);
   assert.ok(!source.gameId||source.gameId===item.gameId);
  }
 }
 for(const starter of EXTRA_COSMETIC_ITEMS.filter(item=>item.sourceKind==='starter'))assert.equal(wheelItem(starter.id),null);
 assert.equal(wheelItem('unknown'),null);
});

test('every wheel receipt survives reload, materializes its correct slot and never equips itself',()=>{
 const before=normalizeAppearance({ownedFlipEffects:['bounce','pop'],flipEffect:'pop',
  ownedThemes:['default','alphabet'],ownedTripleThemes:['default','numbers-2'],themes:{memoryMatch:'alphabet',linkConnect:'alphabet',tripleConnect:'numbers-2'},
  ownedLinkPathEffects:['default','electric'],linkPathEffect:'electric',ownedTriplePathEffects:['default','laser'],triplePathEffect:'laser',
  ownedLinkExitEffects:['default','dissolve'],linkExitEffect:'dissolve',ownedTripleExitEffects:['default','split4'],tripleExitEffect:'split4'});
 const baseline=structuredClone(before);
 for(const item of WHEEL_ITEMS){
  const acquisitions=normalizeAcquisitions(JSON.parse(JSON.stringify(ledger(item))));
  const normalized=normalizeAppearance({...before,acquisitions});
  assert.ok(ownedWheelItemIds(normalized).includes(item.id),item.id);
  if(item.ownedSlot)assert.ok(normalized[item.ownedSlot].includes(item.itemId),item.id);
  else assert.ok(ownedProfileCosmeticItems(normalized).some(owned=>owned.id===item.itemId));
  for(const slot of ['flipEffect','linkPathEffect','linkExitEffect','triplePathEffect','tripleExitEffect','themes','profileCosmetics'])assert.deepEqual(normalized[slot],before[slot],`${item.id}: ${slot}`);
  assert.deepEqual(normalized.achievements,before.achievements);
  assert.deepEqual(normalizeAppearance(JSON.parse(JSON.stringify(normalized))),normalized);
  assert.deepEqual(before,baseline,'normalization did not mutate its input');
 }
});

test('shared and Triple theme/path/exit rights stay separate before and after normalization',()=>{
 for(const [category,itemId]of [['theme','alphabet'],['path','electric'],['exit','dissolve']]){
  const pair=WHEEL_ITEMS.filter(item=>item.category===category&&item.itemId===itemId);
  assert.equal(pair.length,2);
  for(const selected of pair){
   const other=pair.find(item=>item!==selected),appearance=normalizeAppearance({acquisitions:ledger(selected)});
   assert.ok(appearance[selected.ownedSlot].includes(itemId));assert.ok(!appearance[other.ownedSlot].includes(itemId));
   assert.ok(ownedWheelItemIds(appearance).includes(selected.id));assert.ok(!ownedWheelItemIds(appearance).includes(other.id));
   assert.ok(ownedWheelItemIds({acquisitions:ledger(selected)}).includes(selected.id),'receipt alone records ownership');
  }
 }
});

test('achievement effects granted by wheel are retained without forging certified achievements',()=>{
 for(const source of ACHIEVEMENT_ITEMS.filter(item=>['flipEffect','linkPathEffect','linkExitEffect','triplePathEffect','tripleExitEffect'].includes(item.equipSlot))){
  const item=WHEEL_ITEMS.find(entry=>entry.itemId===source.id);assert.ok(item);
  const appearance=normalizeAppearance({acquisitions:ledger(item)});
  assert.ok(appearance[item.ownedSlot].includes(source.id));assert.deepEqual(appearance.achievements.grants,{});
  assert.ok(ownedWheelItemIds({achievements:{grants:{certified:{itemId:source.id}}}}).includes(item.id),'certified legacy grants need no pre-materialized slot array');
 }
 const item=WHEEL_ITEMS.find(entry=>entry.category==='flip'&&entry.itemId.startsWith('memory-effect'));
 assert.ok(!normalizeAppearance({ownedFlipEffects:[item.itemId]}).ownedFlipEffects.includes(item.itemId),'unreceipted achievement ID still gets rejected');
});

test('wheel grant normalization rejects mismatched IDs, owners, timestamps, source versions and multiple items',()=>{
 const item=WHEEL_ITEMS.find(entry=>entry.category==='theme'),grant=receipt(item);
 const invalid=[{...grant,ownerUid:'other'},{...grant,sourceId:'wheel-v3'},{...grant,items:[]},{...grant,items:[item.id,item.id]},
  {...grant,items:['unknown']},{...grant,receiptId:'other'},{...grant,grantedAt:-1},{...grant,grantedAt:NaN},{...grant,ownerUid:''}];
 for(const value of invalid)assert.throws(()=>normalizeAcquisitions({version:1,grants:{[grant.receiptId]:value}}));
 const original=ledger(item);assert.deepEqual(mergeAcquisitions(original,original),original);
 assert.throws(()=>mergeAcquisitions(original,{version:1,grants:{[grant.receiptId]:{...grant,grantedAt:2}}}));
});

test('legacy chest and letter receipts merge with wheel rights without changing keys or equipped profile cosmetics',()=>{
 const chest=CHEST_ITEMS.find(item=>item.type==='avatar'),letter=LETTER_REWARD_ITEMS[0];
 const chestId=`${uid}:chest:item:${chest.id}`,letterId=`${uid}:letters:${letter.id}`;
 const legacy={version:1,grants:{
  [chestId]:{receiptId:chestId,ownerUid:uid,sourceKind:'chest',sourceId:'shared-chests-v1',items:[chest.id],grantedAt:1},
  [letterId]:{receiptId:letterId,ownerUid:uid,sourceKind:'letters',sourceId:'letters-collection-01',items:[letter.id],grantedAt:1},
 }};
 assert.deepEqual(normalizeAcquisitions(legacy),legacy);
 const item=WHEEL_ITEMS.find(entry=>entry.category==='cosmetic'&&entry.itemId!==chest.id),merged=mergeAcquisitions(legacy,ledger(item));
 assert.equal(Object.keys(merged.grants).length,3);assert.ok(extraOwnedIds(merged).has(item.itemId));
 const base=normalizeAppearance({acquisitions:legacy,profileCosmetics:{avatar:chest.id}});
 const appearance=normalizeAppearance({...base,acquisitions:merged});assert.deepEqual(appearance.profileCosmetics,base.profileCosmetics);
 assert.ok(ownedWheelItemIds(appearance).includes(chest.id));assert.ok(ownedWheelItemIds(appearance).includes(item.id));
});

test('applying wheel receipts is pure, idempotent and tolerates legacy missing or corrupt ownership arrays',()=>{
 const item=WHEEL_ITEMS.find(entry=>entry.category==='flip'),acquisitions=normalizeAcquisitions(ledger(item));
 const before={ownedFlipEffects:{},flipEffect:'bounce'},copy=structuredClone(before);
 const once=applyWheelAcquisitions(before,acquisitions);assert.deepEqual(once.ownedFlipEffects,[item.itemId]);
 assert.deepEqual(before,copy);assert.deepEqual(applyWheelAcquisitions(once,acquisitions),once);
 assert.throws(()=>applyWheelAcquisitions({}, {grants:{bad:{sourceKind:'wheel',items:['unknown']}}}));
});
