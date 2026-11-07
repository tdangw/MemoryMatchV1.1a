import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc,getDoc,setDoc } from 'firebase/firestore';
import { encodeCloudSnapshot } from '../js/cloudSnapshot.js';
import { publishCloudSnapshot,readCloudRoot,readCloudSnapshot } from '../js/cloudStore.js';
import { confirmSparkClock,readSparkState } from '../js/liveops/store.js';
import { transitionSpark,normalizeSparkSave } from '../js/liveops/sparkModel.js';
import { createLoginCandidate,LOGIN_REWARDS } from '../js/liveops/missionRewards.js';
import { ownedWheelItemIds,applyWheelAcquisitions } from '../js/liveops/wheelCatalog.js';
import { normalizeAcquisitions } from '../js/progression/acquisitionModel.js';
import { chestSupportCount,creditChestSupport } from '../js/liveops/supportInventory.js';
import { GAMEPLAY_LIMITS } from '../js/gameplayTuning.js';
import { getGameProgressKey } from '../js/gameCatalog.js';
import { periods,DAY_MS } from '../js/liveops/model.js';
const [host,port]=(process.env.FIRESTORE_EMULATOR_HOST||'').split(':');
if(!port)throw Error('Isolated emulator required');
const env=await initializeTestEnvironment({projectId:'demo-mission-rewards',firestore:{host,port:Number(port),rules:fs.readFileSync(process.env.MISSION_RULES_FILE||'firestore.rules','utf8')}});
const uid='mission-integration',space='test',db=env.authenticatedContext(uid).firestore(),second=env.authenticatedContext(uid).firestore();
let saved={snapshotVersion:1,profile:{formatVersion:2,revision:1,data:{coins:100,appearance:{},progress:{},settings:{}}},chapters:[]},state=null,revision=0,now,ordinal=0,denied=0;
const login=()=>({type:'login',loginVersion:2,loginCandidate:createLoginCandidate(state.loginNext,[.1,.5,.9]),operation:`mission-${++ordinal}`});
async function commit(command={type:'status'},options={}){
 const before=state,copy=structuredClone(saved),data=copy.profile.data;
 if(options.inventory){const {gameId,key,count}=options.inventory,game=getGameProgressKey(gameId);data.progress[game]={...(data.progress[game]||{}),items:{...(data.progress[game]?.items||{}),[key]:count}};}
 const prize=command.type==='claimWheelReward'?before?.pendingWheel?.wheel:command.wheelCandidate;
 const result=transitionSpark(before,command,{uid,now,sector:options.legacySector??0,festivalEnabled:true,ticketEarned:options.tickets??before?.ticketEarned??0,wheelCandidate:command.wheelCandidate,ownedWheelItemIds:ownedWheelItemIds(data.appearance),supportCount:prize?.kind==='support'?chestSupportCount(data.progress,prize.gameId,prize.key):0,loginSupportCounts:command.loginCandidate?.supports.map(item=>chestSupportCount(data.progress,item.gameId,item.key))||[]});
 result.state.revision=(before?.revision||0)+1;
 const acquisitions=normalizeAcquisitions(data.appearance.acquisitions);
 for(const receipt of result.receipts){data.coins+=receipt.coins;if(receipt.support)creditChestSupport(data.progress,receipt.support);if(receipt.acquisition)acquisitions.grants[receipt.receiptId]={...receipt.acquisition,receiptId:receipt.receiptId,ownerUid:uid,grantedAt:receipt.grantedAt};}
 data.appearance=applyWheelAcquisitions({...data.appearance,acquisitions:normalizeAcquisitions(acquisitions),spark:{...normalizeSparkSave(data.appearance.spark),ownerUid:uid,state:result.state,ticketEarned:result.state.ticketEarned}},acquisitions);
 const encoded=await encodeCloudSnapshot(copy);
 // Deliberately forge after encoding so rejection proves server rules, not only client normalization.
 options.forge?.(result.state,before);
 const published=await publishCloudSnapshot({database:options.database||db,environment:space,uid,encoded,expectedRevision:revision,playerName:'Mission',rewardRevision:before?.revision||0,reward:{state:result.state,expectedRevision:before?.revision||0}});
 return {state:result.state,saved:copy,revision:published.root.revision,result};
}
const accept=value=>{({state,saved,revision}=value);return value.result;};
async function reject(command,forge){await assert.rejects(commit(command,{forge}),/permission|PERMISSION|Missing|denied/);denied++;}
async function seed(mutator){
 const next=structuredClone(state);mutator(next);
 await env.withSecurityRulesDisabled(async admin=>{const ref=doc(admin.firestore(),'gamespaces',space,'liveops',uid),old=await getDoc(ref);await setDoc(ref,{...old.data(),...next});});
 state=next;saved.profile.data.appearance.spark.state=next;
}
try{
 await env.clearFirestore();now=(await confirmSparkClock(db,space,uid,()=>true)).timestamp;accept(await commit());
 for(let index=0;index<7;index++){
  if(index)await seed(n=>{n.loginDay=n.day-1;n.loginReward.day=n.day-1;});
  console.log(`Mission scenario: day ${index+1}`);
  const command=login(),before=structuredClone(saved),candidate=command.loginCandidate;
  assert.equal(candidate.index,index);
  for(const support of candidate.supports){
   const inventory={...support,count:GAMEPLAY_LIMITS.itemCount};
   await assert.rejects(commit(command,{inventory}),error=>error.code==='rewards/inventory-full');
  }
  for(const forge of [
   n=>{n.loginReward.coins++;},n=>{n.loginReward.version=2;},n=>{n.loginReward.index=(index+1)%7;},
   n=>{n.loginReward.extra=true;},n=>{n.loginReward.operation='bad operation';},n=>{n.loginReward.day--;},
   n=>{n.loginReward.supports[0].key='unknown';},n=>{n.loginReward.supports[0].amount=2;},
   n=>{n.loginReward.supports.push({...n.loginReward.supports[0]});},
   n=>{n.loginReward.supports[0].gameId='unknown';},n=>{n.loginNext=(n.loginNext+1)%7;},
   n=>{n.loginDay--;},n=>{n.weekly.wins++;},n=>{n.weekly.visits=n.weekly.visits===3?2:3;},n=>{n.tickets++;},
  ])await reject(command,forge);
  if(index===6)await reject(command,n=>{[n.loginReward.supports[0],n.loginReward.supports[1]]=[n.loginReward.supports[1],n.loginReward.supports[0]];});
  else await reject(command,n=>{n.loginReward.supports[0].key='time30';});
  const result=accept(await commit(command));assert.equal(result.loginApplied,true);
  assert.equal(saved.profile.data.coins-before.profile.data.coins,LOGIN_REWARDS[index].coins);
  assert.deepEqual(state.loginReward,{...candidate,day:state.day,operation:command.operation});
  for(const support of candidate.supports)assert.equal(chestSupportCount(saved.profile.data.progress,support.gameId,support.key),chestSupportCount(before.profile.data.progress,support.gameId,support.key)+1);
  const replay=accept(await commit(command));assert.equal(replay.loginApplied,false);assert.equal(replay.receipts.length,0);
  await reject({type:'status'},n=>{n.loginReward.coins++;});
  await reject({type:'status'},n=>{n.loginReward=null;});
  await reject({type:'status'},n=>{n.loginReward={...candidate,day:n.day,operation:'second-login'};n.loginNext=(n.loginNext+1)%7;});
 }
 await seed(n=>{n.daily={wins:3,matches:30,noHint:1,visits:0,claimed:[]};});
 console.log('Mission scenario: daily bonus');
 const bonusBefore=saved.profile.data.coins,ticketBefore=state.tickets;
 const bonus=accept(await commit({type:'dailyBonus'}));assert.equal(bonus.bonusApplied,true);assert.deepEqual(state.daily.claimed,['bonus']);
 assert.equal(saved.profile.data.coins,bonusBefore+10);assert.equal(state.tickets,ticketBefore+1);
 const bonusReplay=accept(await commit({type:'dailyBonus'}));assert.equal(bonusReplay.bonusApplied,false);assert.equal(bonusReplay.receipts.length,0);
 for(const [key,target]of [['wins',3],['matches',30],['noHint',1]]){
  await seed(n=>{n.daily={wins:3,matches:30,noHint:1,visits:0,claimed:[]};n.daily[key]=target-1;});
  await reject({type:'dailyBonus'},n=>{n.daily.claimed=['bonus'];n.tickets++;});
 }
 for(const [key,target]of [['wins',12],['matches',120],['noHint',3],['visits',3]]){
  await seed(n=>{n.weekly={wins:12,matches:120,noHint:3,visits:3,claimed:[]};n.weekly[key]=target-1;});
  await reject({type:'weekly'},n=>{n.weekly.claimed=['bonus'];n.tickets+=2;});
 }
 await seed(n=>{n.weekly.visits=3;});
 console.log('Mission scenario: weekly bonus');
 const weeklyBefore=saved.profile.data.coins,weeklyTickets=state.tickets;
 const weekly=accept(await commit({type:'weekly'}));assert.equal(weekly.bonusApplied,true);assert.equal(saved.profile.data.coins,weeklyBefore+50);assert.equal(state.tickets,weeklyTickets+2);
 const weeklyReplay=accept(await commit({type:'weekly'}));assert.equal(weeklyReplay.bonusApplied,false);
 await seed(n=>{n.day--;n.week=periods(now-DAY_MS).week;n.event.day=n.day;n.event.week=n.week;n.cosmetics.week=n.week;n.loginDay=n.day;n.loginReward.day=n.day;n.daily={wins:3,matches:30,noHint:1,visits:0,claimed:[]};});
 console.log('Mission scenario: rollover');
 const receiptBefore=structuredClone(state.loginReward),rolloverBefore=saved.profile.data.coins;
 const rollover=accept(await commit());assert.deepEqual(state.loginReward,receiptBefore);assert.equal(state.daily.wins,0);assert.equal(saved.profile.data.coins,rolloverBefore+30);
 assert.ok(rollover.receipts.some(receipt=>receipt.receiptId.endsWith(':bonus')));
 console.log('Mission scenario: legacy login');
 const legacy=accept(await commit({type:'login'}));assert.equal(legacy.loginApplied,true);assert.deepEqual(state.loginReward,receiptBefore);
 const recovered=await readCloudSnapshot(db,space,uid,await readCloudRoot(db,space,uid));assert.deepEqual(recovered.profile.data.appearance.spark.state,state);
 const remote=await readSparkState(db,space,uid);assert.deepEqual(remote.state.loginReward,state.loginReward);
 console.log(JSON.stringify({pass:true,scenarios:['7 login days','strict receipt keys/values','full inventory atomic','supports exact inventory','daily once/replay','manual daily bonus before individual claims','incomplete daily denied','weekly four targets/once','rollover preserves unclaimed rewards','legacy login','snapshot recovery'],forgeriesDenied:denied}));
}finally{await env.cleanup();}
