import { LETTER_SETS, LETTER_ALPHABET, LETTER_SYNC_KEYS_PER_COMMIT, LETTER_SELL_COINS } from '../js/liveops/config.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDocFromServer, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { encodeCloudSnapshot } from '../js/cloudSnapshot.js';
import { publishCloudSnapshot, readCloudRoot, readCloudSnapshot } from '../js/cloudStore.js';
import { confirmSparkClock, readSparkState, sparkRef } from '../js/liveops/store.js';
import { initialSparkState, transitionSpark, normalizeSparkSave } from '../js/liveops/sparkModel.js';
import { DAILY } from '../js/liveops/model.js';
if (!process.env.FIRESTORE_EMULATOR_HOST) throw Error('Isolated emulator required');
const [emulatorHost,emulatorPort]=process.env.FIRESTORE_EMULATOR_HOST.split(':');
const env=await initializeTestEnvironment({projectId:'demo-memory-match',firestore:{host:emulatorHost,port:Number(emulatorPort),rules:fs.readFileSync('firestore.rules','utf8')}});
const uid='spark-integration', space='local-waves1', db=env.authenticatedContext(uid).firestore(), second=env.authenticatedContext(uid).firestore(), other=env.authenticatedContext('other-account').firestore();
const snapshot=()=>({snapshotVersion:1,profile:{formatVersion:2,revision:1,data:{coins:100,appearance:{},progress:{},settings:{}}},chapters:[]});
let saved=snapshot(), revision=0, state=null, now;
const measurements=[];let counted={reads:0,writes:0,bytes:0,publications:0};
async function commit(command={type:'status'}, options={}) {
  console.log('Transaction scenario:',command.type,command.source||'',command.ordinal||'');
  const database=options.database||db, before=options.state??state, expected=options.revision??revision, copy=structuredClone(options.snapshot||saved);
  const result=transitionSpark(before,command,{uid,now,sector:7,ticketEarned:options.ticketEarned??before?.ticketEarned??0,ownedItemIds:Object.values(copy.profile.data.appearance.acquisitions?.grants||{}).flatMap(grant=>grant.items),facts:options.facts||[],letterEarned:options.letterEarned??before?.letters.earned??{},randomLetter:'A'});
  result.state.revision=(before?.revision||0)+1;
  if (options.salePriceOverride !== undefined) {
    assert.equal(command.type,'sellLetter');
    result.state.letters.last.coins=command.quantity*options.salePriceOverride;
    for (const receipt of result.receipts) receipt.coins=command.quantity*options.salePriceOverride;
  }
  const acquisitions=copy.profile.data.appearance.acquisitions||{version:1,grants:{}};
  for(const receipt of result.receipts)if(receipt.acquisition)acquisitions.grants[receipt.receiptId]={...receipt.acquisition,receiptId:receipt.receiptId,ownerUid:uid,grantedAt:receipt.grantedAt};
  copy.profile.data.appearance.acquisitions=acquisitions;
  const coins=result.receipts.reduce((a,b)=>a+b.coins,0);copy.profile.data.coins+=coins;
  copy.profile.data.appearance.spark={...normalizeSparkSave(copy.profile.data.appearance.spark),state:result.state,ownerUid:uid,economyRevision:(copy.profile.data.appearance.spark?.economyRevision||0)+1,letterEarned:options.letterEarned??before?.letters.earned??{},ticketEarned:options.ticketEarned??before?.ticketEarned??0};
  const encoded=await encodeCloudSnapshot(copy);
  const out=await publishCloudSnapshot({database,environment:space,uid,encoded,expectedRevision:expected,playerName:'Người chơi',economyRevision:copy.profile.data.appearance.spark.economyRevision,rewardRevision:before?.revision||0,reward:{state:result.state,expectedRevision:before?.revision||0}});
  counted.reads+=out.reads;counted.writes+=out.writes;counted.bytes+=encoded.byteLength;counted.publications++;
  return {snapshot:copy,state:result.state,revision:out.root.revision,out,coins};
}
function accept(r){saved=r.snapshot;state=r.state;revision=r.revision;}
try {
  await env.clearFirestore();
  const clock=await confirmSparkClock(db,space,uid,()=>true);counted.reads+=clock.operations.reads;counted.writes+=clock.operations.writes;now=clock.timestamp;assert(now>0);
  accept(await commit());
  const old={snapshot:structuredClone(saved),state:structuredClone(state),revision};
  const claims=await Promise.allSettled([commit({type:'login'}),commit({type:'login'},{database:second})]);
  assert.equal(claims.filter(r=>r.status==='fulfilled').length,1,JSON.stringify(claims.map(r=>r.reason?.message)));accept(claims.find(r=>r.status==='fulfilled').value);assert.equal(state.loginNext,1);assert.equal(saved.profile.data.coins,110);
  await assert.rejects(commit({type:'login'},old));
  // Crash after publish/before local apply: canonical snapshot contains both wallet and marker.
  const result=await commit({type:'spin',source:'free',day:state.day,operation:'integration-free'});
  const root=await readCloudRoot(db,space,uid), recovered=await readCloudSnapshot(db,space,uid,root);
  assert.equal(recovered.profile.data.coins,135);assert.equal(recovered.profile.data.appearance.spark.state.spins.free.operation,'integration-free');accept(result);
  const duplicate=transitionSpark(state,{type:'spin',source:'free',day:state.day,operation:'integration-free'},{uid,now,sector:0,ticketEarned:0});assert.equal(duplicate.receipts.length,0);
  accept(await commit({type:'status'},{ticketEarned:1}));
  const ticket={type:'spin',source:'ticket',day:state.day,operation:'last-ticket',sequence:1};
  const contenders=await Promise.allSettled([commit(ticket),commit({...ticket,operation:'last-ticket-other'},{database:second})]);
  assert.equal(contenders.filter(r=>r.status==='fulfilled').length,1,JSON.stringify(contenders.map(r=>r.reason?.message)));accept(contenders.find(r=>r.status==='fulfilled').value);assert.equal(state.tickets,0);
  // Product policy accepts client-confirmed earned receipts on Spark, within quota.
  const adCommand={type:'spin',source:'ad',day:state.day,operation:'earned-ad',ordinal:1,earned:true};
  const beforeAdCoins=saved.profile.data.coins;
  accept(await commit(adCommand));
  assert.equal(saved.profile.data.coins,beforeAdCoins+25);
  assert.equal(transitionSpark(state,adCommand,{uid,now,sector:7,ticketEarned:1}).receipts.length,0);
  await assert.rejects(commit({...adCommand,operation:'duplicate-ordinal'}));
  assert.throws(()=>transitionSpark(state,{type:'spin',source:'ad',day:state.day,operation:'ad-11',ordinal:11,earned:true},{uid,now,ticketEarned:1}));
  const fact={gameId:'memory-match',mode:'superHard',roundId:'mission-round',day:state.day,matches:30,noHint:true};
  accept(await commit({type:'status'},{facts:[fact,{...fact,roundId:'mission-round2'},{...fact,roundId:'mission-round3'}]}));
  for(const id of ['win-three','match-thirty','win-without-hint'])accept(await commit({type:'daily',id}));
  assert.equal(state.tickets,0);
  accept(await commit({type:'dailyBonus'}));
  assert.equal(state.tickets,1);assert.equal(state.event.points,36);
  accept(await commit({type:'status'},{letterEarned:{M:6}}));
  assert.equal(state.letters.counts.M,6);
  const beforeSaleCoins=saved.profile.data.coins;
  await assert.rejects(commit({type:'sellLetter',letter:'M',quantity:1,sequence:1,operation:'rejected-old-price'},{salePriceOverride:1000}));
  accept(await commit({type:'sellLetter',letter:'M',quantity:1,sequence:1,operation:'sell-M'}));
  assert.equal(saved.profile.data.coins,beforeSaleCoins+LETTER_SELL_COINS);
  assert.equal(state.letters.last.coins,10);
  assert.equal(state.letters.counts.M,5);
  accept(await commit({type:'fuseLetter',letter:'M',sequence:2,operation:'fuse-M'}));
  assert.equal(state.letters.counts.M,2);assert.equal(state.letters.counts.A,1);
  const allLetters=Object.fromEntries(LETTER_ALPHABET.map(letter=>[letter,(state.letters.earned[letter]||0)+2]));
  // Same bounded reconciliation protocol as service: facts/tickets, then at most4letter keys per publication.
  accept(await commit({type:'status'},{ticketEarned:2,facts:[{...fact,roundId:'mixed-fact'}]}));
  for(let offset=0;offset<LETTER_ALPHABET.length;offset+=LETTER_SYNC_KEYS_PER_COMMIT){
    const target={...state.letters.earned};for(const letter of LETTER_ALPHABET.slice(offset,offset+LETTER_SYNC_KEYS_PER_COMMIT))target[letter]=allLetters[letter];
    accept(await commit({type:'status'},{letterEarned:target}));
  }
  assert.equal(state.ticketEarned,2);for(const letter of LETTER_ALPHABET)assert.equal(state.letters.earned[letter],allLetters[letter]);
  for(let offset=0;offset<LETTER_ALPHABET.length;offset+=LETTER_SYNC_KEYS_PER_COMMIT){
    const target={...state.letters.earned};for(const letter of LETTER_ALPHABET.slice(offset,offset+LETTER_SYNC_KEYS_PER_COMMIT))target[letter]=200;
    accept(await commit({type:'status'},{letterEarned:target}));
  }
  for(let index=0;index<12;index++){
    const cmd={type:'exchangeLetterSet',setId:LETTER_SETS[index%4].id,sequence:state.letters.sequence+1,operation:`exchange-${index}`};
    accept(await commit(cmd));assert.equal(Object.keys(saved.profile.data.appearance.acquisitions.grants).length,index+1);
  }
  const beforeChest=saved.profile.data.coins;
  accept(await commit({type:'exchangeLetterSet',setId:'adventure',sequence:state.letters.sequence+1,operation:'fallback-chest'}));
  assert.equal(saved.profile.data.coins,beforeChest+100);assert.equal(state.letters.last.itemId,null);
  await assertFails(getDocFromServer(sparkRef(other,space,uid)));
  await assertFails(setDoc(sparkRef(db,space,uid),{version:2}));
  const stored=(await getDocFromServer(sparkRef(db,space,uid))).data();
  await assertFails(updateDoc(sparkRef(db,space,uid),{tickets:999,updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(sparkRef(db,space,uid),{spins:{...stored.spins,ads:[{source:'ad',day:stored.day,sector:7,coins:25,ordinal:1,operation:'forged-direct'}]},updatedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(db,'gamespaces',space,'players',uid),{revision:revision+1,rewardRevision:0,updatedAt:serverTimestamp()}));
  // A stale restore cannot publish a wallet predating rewards.
  await assert.rejects(publishCloudSnapshot({database:db,environment:space,uid,encoded:await encodeCloudSnapshot(old.snapshot),expectedRevision:revision,playerName:'Người chơi',rewardRevision:0}));
  await setDoc(doc(db,'gamespaces',space,'publicCosmetics',uid),{version:1,avatar:'letters-memory-avatar-moss-redpanda',frame:'letters-royal-frame-journey-crown',badge:'letters-triple-badge-prism-heart',updatedAt:serverTimestamp()});
  const publishedCosmetics=await getDocFromServer(doc(other,'gamespaces',space,'publicCosmetics',uid));assert.equal(publishedCosmetics.data().avatar,'letters-memory-avatar-moss-redpanda');
  // Spending ordinary shop coins keeps reward revision but advances the economic checkpoint.
  const sameRewardBackup=structuredClone(saved),purchase=structuredClone(saved);
  purchase.profile.data.coins-=58;purchase.profile.data.appearance.spark.economyRevision++;
  const purchaseResult=await publishCloudSnapshot({database:db,environment:space,uid,encoded:await encodeCloudSnapshot(purchase),expectedRevision:revision,playerName:'Người chơi',rewardRevision:state.revision,economyRevision:purchase.profile.data.appearance.spark.economyRevision});
  saved=purchase;revision=purchaseResult.root.revision;
  await assert.rejects(publishCloudSnapshot({database:db,environment:space,uid,encoded:await encodeCloudSnapshot(sameRewardBackup),expectedRevision:revision,playerName:'Người chơi',rewardRevision:state.revision,economyRevision:sameRewardBackup.profile.data.appearance.spark.economyRevision}));
  await assertFails(updateDoc(doc(db,'gamespaces',space,'players',uid),{revision:revision+1,economyRevision:sameRewardBackup.profile.data.appearance.spark.economyRevision,updatedAt:serverTimestamp()}));
  for(const rounds of [10,50]){
    const before={...counted};accept(await commit({type:'status'},{facts:Array.from({length:rounds},(_,i)=>({...fact,roundId:`batch-${rounds}-${i}`}))}));
    measurements.push({rounds,...Object.fromEntries(Object.entries(counted).map(([key,value])=>[key,value-before[key]]))});
  }
  // Seed an old accepted period through the isolated test-admin context, then exercise real rollover rules.
  const actualNow=now,oldNow=now-7*86400000,seed=initialSparkState(oldNow);seed.revision=state.revision;
  Object.assign(seed.daily,{wins:3,matches:30,noHint:DAILY.find(item=>item.key==='noHint').target});Object.assign(seed.weekly,{wins:12,matches:120,noHint:3,visits:3});
  seed.tickets=state.tickets;seed.ticketEarned=state.ticketEarned;seed.ticketSpent=state.ticketSpent;seed.letters=state.letters;
  now=oldNow;let seeded;await env.withSecurityRulesDisabled(async context=>{seeded=await commit({type:'status'},{database:context.firestore(),state:seed});});accept(seeded);
  now=actualNow;const oldCoins=saved.profile.data.coins,oldLetters=structuredClone(state.letters);accept(await commit({type:'status'}));
  assert.equal(saved.profile.data.coins,oldCoins+80);assert.deepEqual(state.letters,oldLetters);assert.equal(state.daily.wins,0);assert.equal(state.weekly.wins,0);
  // Opening unchanged state is read-only after session clock confirmation.
  const before=await readSparkState(db,space,uid);for(let i=0;i<10;i++)await readSparkState(db,space,uid);
  const after=await readSparkState(db,space,uid);assert.deepEqual(after,before);
  fs.writeFileSync('runtime/qa/rewards-spark-operation-counts.json',JSON.stringify({counted,measurements,meaning:'Explicit application SDK operations on bounded fixture; excludes rule-dependent billed reads, transport overhead, auth and other services'},null,2));
  console.log(JSON.stringify({pass:true,scenarios:['same-UID login race','free spin crash recovery','last-ticket race','bounded client-confirmed ad reward and duplicate denial','private UID','malformed','wallet linkage','stale restore','read-only page'],operations:result.out,limit:'Spark accepts client confirmation; emulator, no live provider/phone verification'},null,2));
} finally {await env.cleanup();}
