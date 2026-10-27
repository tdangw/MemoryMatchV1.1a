import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDocFromServer, updateDoc } from 'firebase/firestore';
import { encodeCloudSnapshot } from '../js/cloudSnapshot.js';
import { publishCloudSnapshot, readCloudRoot, readCloudSnapshot } from '../js/cloudStore.js';
import { confirmSparkClock, sparkRef } from '../js/liveops/store.js';
import { transitionSpark, normalizeSparkSave } from '../js/liveops/sparkModel.js';
import { chestCandidate } from '../js/liveops/chests.js';
import { CHEST_TYPES, CHEST_POOLS } from '../js/liveops/chestConfig.js';
import { LETTER_SETS, LETTER_ALPHABET } from '../js/liveops/config.js';
if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Isolated emulator required');
const env = await initializeTestEnvironment({ projectId:'demo-memory-match', firestore:{ host:'127.0.0.1',port:8180,rules:fs.readFileSync('firestore.rules','utf8') } });
const uid='festival-integration',space='local-waves1',db=env.authenticatedContext(uid).firestore(),other=env.authenticatedContext('festival-other').firestore();
let state=null, revision=0, now, saved={ snapshotVersion:1, profile:{formatVersion:2,revision:1,data:{coins:100,appearance:{},progress:{},settings:{}}},chapters:[] };
let totals={reads:0,writes:0,bytes:0,publications:0};
async function commit(command={type:'status'}, options={}) {
  console.log('Festival scenario:',command.type,command.points||command.setId||command.chestType||'', 'revision', state?.revision||0);
  const old=options.state??state,copy=structuredClone(options.snapshot||saved),expected=options.revision??revision;
  const owned=Object.values(copy.profile.data.appearance.acquisitions?.grants||{}).flatMap(grant=>grant.items);
  const result=transitionSpark(old,command,{uid,now,festivalEnabled:options.enabled??true,fireflyEarned:options.earned??old?.festival?.earnedTotal??0,
    ticketEarned:old?.ticketEarned||0,letterEarned:options.letters||old?.letters.earned||{},ownedItemIds:owned});
  result.state.revision=(old?.revision||0)+1;
  const grants=copy.profile.data.appearance.acquisitions||{version:1,grants:{}};
  for(const receipt of result.receipts){copy.profile.data.coins+=receipt.coins;if(receipt.acquisition)grants.grants[receipt.receiptId]={...receipt.acquisition,receiptId:receipt.receiptId,ownerUid:uid,grantedAt:now};}
  copy.profile.data.appearance.acquisitions=grants;
  copy.profile.data.appearance.spark={...normalizeSparkSave(copy.profile.data.appearance.spark),ownerUid:uid,state:result.state,fireflyEarned:result.state.festival?.earnedTotal||0,
    economyRevision:(copy.profile.data.appearance.spark?.economyRevision||0)+1,letterEarned:result.state.letters.earned};
  const encoded=await encodeCloudSnapshot(copy),out=await publishCloudSnapshot({database:db,environment:space,uid,encoded,expectedRevision:expected,playerName:'Người chơi',
    economyRevision:copy.profile.data.appearance.spark.economyRevision,rewardRevision:old?.revision||0,reward:{state:result.state,expectedRevision:old?.revision||0}});
  totals.reads+=out.reads;totals.writes+=out.writes;totals.bytes+=encoded.byteLength;totals.publications++;
  return {state:result.state,snapshot:copy,revision:out.root.revision,result};
}
const accept=result=>{state=result.state;saved=result.snapshot;revision=result.revision;};
try {
  now=(await confirmSparkClock(db,space,uid,()=>true)).timestamp;
  // Existing account first migrates without changing legacy reward rights.
  accept(await commit({type:'status'},{enabled:false}));accept(await commit());
  accept(await commit({type:'status'},{earned:130}));
  for(const points of [100,75,50,25])accept(await commit({type:'claimFestival',cycle:0,points}));
  assert.equal(state.festival.completedCycles,1);assert.equal(state.festival.earnedTotal,130);assert.equal(saved.profile.data.coins,250);
  assert.equal(transitionSpark(state,{type:'claimFestival',cycle:0,points:25},{uid,now,festivalEnabled:true,fireflyEarned:130}).receipts.length,0);
  // Bounded four-letter flushes then fixed chest recipe exchange.
  for(let offset=0;offset<LETTER_ALPHABET.length;offset+=4){const letters={...state.letters.earned};for(const key of LETTER_ALPHABET.slice(offset,offset+4))letters[key]=12;accept(await commit({type:'status'},{letters}));}
  for(const set of LETTER_SETS)accept(await commit({type:'exchangeLetterSet',setId:set.id,sequence:state.letters.sequence+1,operation:`exchange-${set.id}`}));
  for(const type of CHEST_TYPES){
    const candidate=chestCandidate(type,'memory-match',[],()=>.1);
    accept(await commit({type:'openChest',chestType:type,gameId:'memory-match',sequence:state.chests.sequence+1,operation:`open-${type}`,candidate}));
  }
  const frozen={state:structuredClone(state),snapshot:structuredClone(saved),revision};
  const candidate=chestCandidate('avatar','memory-match',[],()=>.9),command={type:'openChest',chestType:'avatar',gameId:'memory-match',sequence:state.chests.sequence+1,operation:'last-avatar',candidate};
  const race=await Promise.allSettled([commit(command,frozen),commit({...command,operation:'other-last-avatar'},frozen)]);
  assert.equal(race.filter(item=>item.status==='fulfilled').length,1);accept(race.find(item=>item.status==='fulfilled').value);
  const root=await readCloudRoot(db,space,uid),recovered=await readCloudSnapshot(db,space,uid,root);
  assert.deepEqual(recovered.profile.data.appearance.spark.state.chests,state.chests);
  const readOnly=await getDocFromServer(sparkRef(db,space,uid));
  await assertFails(getDocFromServer(sparkRef(other,space,uid)));
  await assertFails(updateDoc(sparkRef(db,space,uid),{'chests.spent.c':-1}));
  await assertFails(updateDoc(sparkRef(db,space,uid),{'festival.completedCycles':999999}));
  await assertFails(updateDoc(sparkRef(db,space,uid),{'chests.earned.avatar':999999}));
  assert.equal(readOnly.data().chests.last.kind,'item');
  assert.ok(CHEST_POOLS.avatar.includes(readOnly.data().chests.last.itemId));
  console.log(JSON.stringify({pass:true,scenarios:['legacy migration','overflow 130','claim any order','four fixed recipes','four chest types','last chest race','canonical crash recovery','private owner','deny negative/extra chest/cycle'],totals},null,2));
} finally { await env.cleanup(); }
