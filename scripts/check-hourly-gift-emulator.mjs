import { HOURLY_GIFT_MS } from '../js/liveops/hourlyGift.js';
import { creditChestSupport } from '../js/liveops/supportInventory.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import { transitionSpark, normalizeSparkSave } from '../js/liveops/sparkModel.js';
import { encodeCloudSnapshot } from '../js/cloudSnapshot.js';
import { publishCloudSnapshot } from '../js/cloudStore.js';
import { confirmSparkClock, readSparkState } from '../js/liveops/store.js';
const [host,port] = (process.env.FIRESTORE_EMULATOR_HOST || '').split(':');
if (!port) throw new Error('Isolated emulator required');
const env = await initializeTestEnvironment({projectId:'demo-hourly-gift',firestore:{host,port:Number(port),rules:fs.readFileSync('firestore.rules','utf8')}});
const uid='hourly-test',space='test',db=env.authenticatedContext(uid).firestore();
let snapshot={snapshotVersion:1,profile:{formatVersion:2,revision:1,data:{coins:0,appearance:{},progress:{},settings:{}}},chapters:[]};
let state=null,revision=0,now;
async function commit(command={type:'status'},database=db){
  const current=await readSparkState(database,space,uid);
  const result=transitionSpark(current.state,command,{uid,now,ticketEarned:current.state?.ticketEarned||0});
  result.state.revision=(current.state?.revision||0)+1;
  const copy=structuredClone(snapshot);copy.profile.data.coins+=result.receipts.reduce((n,r)=>n+r.coins,0);
  for(const receipt of result.receipts)if(receipt.support)creditChestSupport(copy.profile.data.progress,receipt.support);
  copy.profile.data.appearance.spark={...normalizeSparkSave(copy.profile.data.appearance.spark),state:result.state,ownerUid:uid,ticketEarned:result.state.ticketEarned};
  const encoded=await encodeCloudSnapshot(copy);
  const published=await publishCloudSnapshot({database,environment:space,uid,encoded,expectedRevision:revision,playerName:'Quà tặng',rewardRevision:current.state?.revision||0,
    reward:{state:result.state,expectedRevision:current.state?.revision||0,hourlyGiftClaim:result.hourlyGiftApplied}});
  return {state:result.state,snapshot:copy,revision:published.root.revision};
}
function accept(result){({state,snapshot,revision}=result);}
const candidate={kind:'ticket',coins:0,gameId:null,key:null};
const command=(sequence=1)=>({type:'claimHourlyGift',operation:`gift-${sequence}`,sequence,candidate});
try {
  now=(await confirmSparkClock(db,space,uid,()=>true)).timestamp;accept(await commit());
  const second=env.authenticatedContext(uid).firestore();
  const claims=await Promise.allSettled([commit(command()),commit(command(),second)]);
  assert.equal(claims.filter(r=>r.status==='fulfilled').length,1);accept(claims.find(r=>r.status==='fulfilled').value);
  assert.equal(state.tickets,1);
  const remote=await readSparkState(db,space,uid);assert.equal(typeof remote.state.hourlyGift.claimedAt,'number');
  assert(Math.abs(remote.state.hourlyGift.claimedAt-Date.now())<5000);
  assert.throws(()=>transitionSpark(remote.state,command(2),{uid,now:remote.state.hourlyGift.claimedAt+HOURLY_GIFT_MS-1}));
  const ref=doc(db,'gamespaces',space,'liveops',uid),root=doc(db,'gamespaces',space,'players',uid);
  const old=(await getDoc(ref)).data(),oldRoot=(await getDoc(root)).data();
  async function forged(gift){const batch=writeBatch(db);batch.set(root,{...oldRoot,revision:oldRoot.revision+1,rewardRevision:old.revision+1,updatedAt:serverTimestamp()});batch.set(ref,{...old,revision:old.revision+1,rootRevision:oldRoot.revision+1,updatedAt:serverTimestamp(),tickets:old.tickets+1,hourlyGift:gift});return batch.commit();}
  await assertFails(forged({...old.hourlyGift,sequence:2,claimedAt:serverTimestamp(),last:{...candidate,operation:'early',sequence:2}}));
  await assertFails(forged({...old.hourlyGift,sequence:2,claimedAt:Timestamp.fromMillis(0),last:{...candidate,operation:'backdated',sequence:2}}));
  await env.withSecurityRulesDisabled(async context=>{const batch=writeBatch(context.firestore());batch.update(doc(context.firestore(),'gamespaces',space,'liveops',uid),{hourlyGift:{...old.hourlyGift,claimedAt:Timestamp.fromMillis(Date.now()-HOURLY_GIFT_MS-1000)}});await batch.commit();});
  now=Date.now();accept(await commit(command(2)));assert.equal(state.tickets,2);
  accept(await commit({type:'login'}));assert.equal(state.hourlyGift.sequence,2);
  const beforeCoins=snapshot.profile.data.coins;
  for(const candidate of [{kind:'coins',coins:100,gameId:null,key:null},...['memory-match','link-connect','triple-connect'].map(gameId=>({kind:'support',coins:0,gameId,key:'hint'}))]){
    await env.withSecurityRulesDisabled(async context=>{const adminRef=doc(context.firestore(),'gamespaces',space,'liveops',uid);const oldGift=(await getDoc(adminRef)).data().hourlyGift;const batch=writeBatch(context.firestore());batch.update(adminRef,{hourlyGift:{...oldGift,claimedAt:Timestamp.fromMillis(Date.now()-HOURLY_GIFT_MS-1000)}});await batch.commit();});
    now=Date.now();accept(await commit({type:'claimHourlyGift',operation:`branch-${state.hourlyGift.sequence+1}`,sequence:state.hourlyGift.sequence+1,candidate}));
  }
  assert.equal(snapshot.profile.data.coins,beforeCoins+100);
  for(const game of ['memoryMatch','linkConnect','tripleConnect'])assert.equal(snapshot.profile.data.progress[game].items.hint,1);

  const stranger=env.authenticatedContext('stranger').firestore();await assertFails(getDoc(doc(stranger,'gamespaces',space,'liveops',uid)));
  console.log('Hourly gift emulator passed: atomic double claim, server time, early/backdated denial, next interval, existing actions and ownership.');
} finally {await env.cleanup();}
