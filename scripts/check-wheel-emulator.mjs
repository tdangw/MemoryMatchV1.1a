import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc,getDoc,setDoc } from 'firebase/firestore';
import { encodeCloudSnapshot } from '../js/cloudSnapshot.js';
import { publishCloudSnapshot,readCloudRoot,readCloudSnapshot } from '../js/cloudStore.js';
import { confirmSparkClock,readSparkState } from '../js/liveops/store.js';
import { transitionSpark,normalizeSparkSave } from '../js/liveops/sparkModel.js';
import { createWheelCandidate } from '../js/liveops/wheelRewards.js';
import { ownedWheelItemIds,applyWheelAcquisitions } from '../js/liveops/wheelCatalog.js';
import { normalizeAcquisitions } from '../js/progression/acquisitionModel.js';
import { chestSupportCount,creditChestSupport } from '../js/liveops/supportInventory.js';
import { GAMEPLAY_LIMITS } from '../js/gameplayTuning.js';
import { getGameProgressKey } from '../js/gameCatalog.js';
import { periods,DAY_MS } from '../js/liveops/model.js';
const [host,port]=(process.env.FIRESTORE_EMULATOR_HOST||'').split(':');
if(!port)throw Error('Isolated emulator required');
const env=await initializeTestEnvironment({projectId:'demo-wheel-rewards',firestore:{host,port:Number(port),rules:fs.readFileSync('firestore.rules','utf8')}});
const uid='wheel-integration',space='test',db=env.authenticatedContext(uid).firestore(),second=env.authenticatedContext(uid).firestore();
let saved={snapshotVersion:1,profile:{formatVersion:2,revision:1,data:{coins:100,appearance:{},progress:{},settings:{}}},chapters:[]},state=null,revision=0,now,ordinal=0,denied=0;
const rolls=(sectorRoll,itemRoll=.5)=>[sectorRoll,itemRoll,.5,.5,.5,.5];
const spin=(samples,source='ticket',candidate=null)=>({type:'spin',source,day:periods(now).day,sequence:(state?.ticketSpent||0)+1,operation:`wheel-${++ordinal}`,wheelVersion:2,wheelCandidate:candidate||createWheelCandidate(samples,ownedWheelItemIds(saved.profile.data.appearance)),...(source==='ad'?{earned:true,earnedAt:now,ordinal:state.spins.ads.length+1}:{})});
async function commit(command={type:'status'},options={}){
 const before=state,copy=structuredClone(saved),data=copy.profile.data;
 if(options.inventory){const {gameId,key,count}=options.inventory,game=getGameProgressKey(gameId);data.progress[game]={...(data.progress[game]||{}),items:{...(data.progress[game]?.items||{}),[key]:count}};}
 const prize=command.type==='claimWheelReward'?before?.pendingWheel?.wheel:command.wheelCandidate;
 const result=transitionSpark(before,command,{uid,now,sector:options.legacySector??0,festivalEnabled:true,ticketEarned:options.tickets??before?.ticketEarned??0,wheelCandidate:command.wheelCandidate,ownedWheelItemIds:ownedWheelItemIds(data.appearance),supportCount:prize?.kind==='support'?chestSupportCount(data.progress,prize.gameId,prize.key):0});
 result.state.revision=(before?.revision||0)+1;
 const acquisitions=normalizeAcquisitions(data.appearance.acquisitions);
 for(const receipt of result.receipts){data.coins+=receipt.coins;if(receipt.support)creditChestSupport(data.progress,receipt.support);if(receipt.acquisition)acquisitions.grants[receipt.receiptId]={...receipt.acquisition,receiptId:receipt.receiptId,ownerUid:uid,grantedAt:receipt.grantedAt};}
 data.appearance=applyWheelAcquisitions({...data.appearance,acquisitions:normalizeAcquisitions(acquisitions),spark:{...normalizeSparkSave(data.appearance.spark),ownerUid:uid,state:result.state,ticketEarned:result.state.ticketEarned}},acquisitions);
 const encoded=await encodeCloudSnapshot(copy);
 // Deliberately forge after encoding so rejection proves server rules, not only client normalization.
 options.forge?.(result.state,before);
 const published=await publishCloudSnapshot({database:options.database||db,environment:space,uid,encoded,expectedRevision:revision,playerName:'Wheel',rewardRevision:before?.revision||0,reward:{state:result.state,expectedRevision:before?.revision||0}});
 return {state:result.state,saved:copy,revision:published.root.revision,result};
}
const accept=value=>{({state,saved,revision}=value);return value.result;};
async function reject(command,forge){await assert.rejects(commit(command,{forge}),/permission|PERMISSION|Missing|denied/);denied++;}
try{
 await env.clearFirestore();now=(await confirmSparkClock(db,space,uid,()=>true)).timestamp;accept(await commit());accept(await commit({type:'status'},{tickets:60}));
 const sectorSamples=[.2,.5,.7,.805,.82,.84,.855,.87,.89,.95];
 for(const [sector,sample]of sectorSamples.entries()){
  const command=spin(rolls(sample),sector===0?'free':'ticket'),before=structuredClone(saved),result=accept(await commit(command));
  assert.equal(result.spin.sector,sector);assert.equal(result.spin.wheel.version,2);assert.equal(result.spinApplied,true);assert.equal(result.wheelApplied,true);
  const repeat=transitionSpark(state,command,{uid,now,ticketEarned:state.ticketEarned,wheelCandidate:command.wheelCandidate,ownedWheelItemIds:ownedWheelItemIds(saved.profile.data.appearance)});assert.equal(repeat.wheelApplied,false);assert.equal(repeat.receipts.length,0);
  assert.equal(saved.profile.data.coins-before.profile.data.coins,result.spin.coins);
 }
 for(const [sample,amount]of [[0,5],[.999999,50]]){const result=accept(await commit(spin(rolls(.7,sample))));assert.equal(result.spin.coins,amount);}
 const stale=createWheelCandidate(rolls(.82),[]),beforeRaceCoins=saved.profile.data.coins;
 assert.ok(ownedWheelItemIds(saved.profile.data.appearance).includes(stale.itemId));const duplicate=accept(await commit(spin(rolls(.82),'ticket',stale)));assert.equal(duplicate.spin.coins,100);assert.equal(saved.profile.data.coins,beforeRaceCoins+100);
 const support=createWheelCandidate(rolls(.95,0),[]),held=spin(rolls(.95,0),'ticket',support),inventory={gameId:support.gameId,key:support.key,count:GAMEPLAY_LIMITS.itemCount};
 const full=accept(await commit(held,{inventory}));assert.equal(full.wheelApplied,false);assert.equal(state.pendingWheel.operation,held.operation);
 await assert.rejects(commit(spin(rolls(.2))),error=>error.code==='rewards/wheel-pending');
 const claim={type:'claimWheelReward',wheelOperation:held.operation};const stillFull=transitionSpark(state,claim,{uid,now,ticketEarned:state.ticketEarned,supportCount:GAMEPLAY_LIMITS.itemCount});assert.equal(stillFull.wheelApplied,false);assert.deepEqual(stillFull.state,state);
 await reject({type:'status'},n=>{n.pendingWheel.wheel.key='unknown';});
 await reject({type:'status'},n=>{n.pendingWheel.operation='forged-held';});
 // Keep the held reward when the day changes. Admin seeding only simulates yesterday's clock.
 const yesterday=structuredClone(state);yesterday.day=periods(now-DAY_MS).day;yesterday.week=periods(now-DAY_MS).week;yesterday.event.day=yesterday.day;yesterday.pendingWheel.day=yesterday.day;
 for(const receipt of [yesterday.spins.free,yesterday.spins.ticket].filter(Boolean))receipt.day=yesterday.day;
 await env.withSecurityRulesDisabled(async admin=>{const ref=doc(admin.firestore(),'gamespaces',space,'liveops',uid),old=await getDoc(ref);await setDoc(ref,{...old.data(),...yesterday});});
 state=yesterday;saved.profile.data.appearance.spark.state=yesterday;
 accept(await commit());assert.equal(state.pendingWheel.operation,held.operation);
 const claimed=accept(await commit(claim,{inventory:{...inventory,count:GAMEPLAY_LIMITS.itemCount-1}}));assert.equal(claimed.wheelApplied,true);assert.equal(state.pendingWheel,null);
 assert.equal(chestSupportCount(saved.profile.data.progress,support.gameId,support.key),GAMEPLAY_LIMITS.itemCount);
 const replay=transitionSpark(state,claim,{uid,now,ticketEarned:state.ticketEarned});assert.equal(replay.wheelApplied,false);assert.equal(replay.receipts.length,0);
 for(let i=0;i<10;i++)accept(await commit(spin(rolls(.2),'ad')));
 // The largest retained history must leave enough Rules expressions for a cosmetic prize.
 // Admin seeding simulates three prior days; all 29 records have valid per-day ordinals.
 const history=structuredClone(state);
 history.spins.pastAds=Array.from({length:29},(_,i)=>({source:'ad',day:state.day-3+Math.floor(i/10),sector:0,coins:5,operation:`history-${i}`,ordinal:i%10+1,wheel:{version:2,sector:0,kind:'coins',coins:5}}));
 await env.withSecurityRulesDisabled(async admin=>{const ref=doc(admin.firestore(),'gamespaces',space,'liveops',uid),old=await getDoc(ref);await setDoc(ref,{...old.data(),...history});});
 state=history;saved.profile.data.appearance.spark.state=history;
 const late=spin(rolls(.82),'ad');late.day=state.day-1;late.ordinal=10;late.earnedAt=now-DAY_MS+1000;
 // All forged histories still have room for one receipt; only the ordinal is invalid.
 for(const forgedOrdinal of [9,8,11])await reject(late,n=>{n.spins.pastAds.at(-1).ordinal=forgedOrdinal;});
 accept(await commit(late));assert.equal(state.spins.pastAds.at(-1).operation,late.operation);assert.equal(state.spins.pastAds.length,30);
 const legacy={type:'spin',source:'ticket',day:state.day,sequence:state.ticketSpent+1,operation:'old-queued-eight-sector'};const old=accept(await commit(legacy,{legacySector:7}));assert.equal(old.spin.coins,25);assert.equal(old.spin.wheel,undefined);
 const forgedAd=spin(rolls(.2),'ad');await assert.rejects(commit(forgedAd));
 await reject({type:'status'},(n,o)=>{const r={...o.spins.ads.at(-1),operation:'ad-eleven',ordinal:11};n.spins.ads.push(r);});
 const raceCommand=spin(rolls(.5)),outcomes=await Promise.allSettled([commit(raceCommand),commit({...raceCommand,operation:'same-uid-other-device'},{database:second})]);assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);accept(outcomes.find(r=>r.status==='fulfilled').value);
 for(const forge of [
  n=>{n.spins.ticket.coins=51;n.spins.ticket.wheel.coins=51;},
  n=>{n.spins.ticket.wheel.itemId='invented-item';},
  n=>{n.spins.ticket.wheel.version=99;},
  n=>{n.spins.ticket.wheel.sector=0;},
  n=>{n.pendingWheel={operation:'forged',day:state.day,wheel:support};},
  n=>{n.spins.free={...n.spins.ticket,source:'free'};},
  n=>{n.spins.ticket.extra='unexpected';},
 ])await reject(spin(rolls(.7)),forge);
 const recovered=await readCloudSnapshot(db,space,uid,await readCloudRoot(db,space,uid));assert.deepEqual(recovered.profile.data.appearance.spark.state,state);
 const remote=await readSparkState(db,space,uid);assert.equal(remote.state.spins.ticket.operation,state.spins.ticket.operation);
 console.log(JSON.stringify({pass:true,scenarios:['10 slots','5..50 bounds','actual entitlements','duplicate100','held support','rollover','claim/replay','ad quota','29-history late ad','duplicate/backward/11th late-ad denial','legacy8 pending','sameUID CAS','snapshot recovery'],forgeriesDenied:denied}));
}finally{await env.cleanup();}
