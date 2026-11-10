import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initializeTestEnvironment,assertFails} from '@firebase/rules-unit-testing';
import {updateDoc} from 'firebase/firestore';
import {encodeCloudSnapshot} from '../js/cloudSnapshot.js';
import {publishCloudSnapshot,readCloudRoot,readCloudSnapshot} from '../js/cloudStore.js';
import {confirmSparkClock,sparkRef} from '../js/liveops/store.js';
import {transitionSpark,normalizeSparkSave} from '../js/liveops/sparkModel.js';
import {COSMETIC_ITEMS} from '../js/progression/cosmeticCatalog.js';
import {PAID_LETTER_FUSION_POLICY,selectFusionLetter} from '../js/liveops/letters.js';
import {createWheelCandidate} from '../js/liveops/wheelRewards.js';
import {DAY_MS} from '../js/liveops/model.js';
if(!process.env.FIRESTORE_EMULATOR_HOST)throw new Error('Isolated emulator required');
const env=await initializeTestEnvironment({projectId:'demo-memory-match',firestore:{host:'127.0.0.1',port:8180,rules:fs.readFileSync('firestore.rules','utf8')}});
const uid='cosmetic-integration',space='local-waves1',db=env.authenticatedContext(uid).firestore();
let now,state=null,revision=0,saved={snapshotVersion:1,profile:{formatVersion:2,revision:1,data:{coins:20,appearance:{},progress:{},settings:{}}},chapters:[]};
async function commit(command={type:'status'},options={}){
 const old=options.state??state,copy=structuredClone(options.snapshot||saved);
 const result=transitionSpark(old,command,{uid,now,festivalEnabled:true,fireflyEarned:old?.festival?.earnedTotal||0,
  ticketEarned:old?.ticketEarned||0,letterEarned:old?.letters.earned||{},ownedItemIds:COSMETIC_ITEMS.map(item=>item.id),
  cosmeticEnabled:options.cosmetic??Boolean(old?.cosmeticProgress),coinsBalance:copy.profile.data.coins,randomLetter:options.randomLetter});
 result.state.revision=(old?.revision||0)+1;
 for(const receipt of result.receipts)copy.profile.data.coins+=receipt.coins;
 copy.profile.data.appearance.spark={...normalizeSparkSave(copy.profile.data.appearance.spark),ownerUid:uid,state:result.state,economyRevision:(copy.profile.data.appearance.spark?.economyRevision||0)+1};
 const encoded=await encodeCloudSnapshot(copy);
 // Forge the wire state after client validation, so denials exercise Rules.
 if(options.mutate)options.mutate(result.state);
 const out=await publishCloudSnapshot({database:db,environment:space,uid,encoded,expectedRevision:options.revision??revision,playerName:'Người chơi',economyRevision:copy.profile.data.appearance.spark.economyRevision,
  rewardRevision:old?.revision||0,reward:{state:result.state,expectedRevision:old?.revision||0}});
 return {state:result.state,snapshot:copy,revision:out.root.revision,result};
}
const accept=result=>{state=result.state;saved=result.snapshot;revision=result.revision;};
async function fixture(change){change(state);saved.profile.data.appearance.spark.state=structuredClone(state);saved.profile.data.appearance.spark.ticketEarned=Math.max(saved.profile.data.appearance.spark.ticketEarned,state.ticketEarned);await env.withSecurityRulesDisabled(ctx=>updateDoc(sparkRef(ctx.firestore(),space,uid),state));}
try{
 now=(await confirmSparkClock(db,space,uid,()=>true)).timestamp;
 accept(await commit());
 console.log('Cosmetic: migrate101 owned items');accept(await commit({type:'status'},{cosmetic:true}));
 assert.equal(Object.keys(state.cosmeticProgress.levels).length,101);
 await assertFails(commit({type:'status'},{mutate:s=>{s.cosmeticProgress.levels[COSMETIC_ITEMS[0].id]=21;}}));
 await assertFails(commit({type:'status'},{mutate:s=>{delete s.cosmeticProgress;}}));
 await fixture(s=>{s.cosmeticProgress.levels[COSMETIC_ITEMS[0].id]=20;s.chests.earned.avatar=2;});
 const candidate={chestType:'avatar',gameId:'memory-match',poolVersion:2,kind:'item',itemId:COSMETIC_ITEMS[0].id,coins:0};
 const open={type:'openChest',chestType:'avatar',gameId:'memory-match',operation:'max',sequence:1,candidate};
 console.log('Cosmetic: reject counter tampering and legacy starter');
 await assertFails(commit(open,{mutate:s=>{s.chests.spent.frame=1;}}));
 await assertFails(commit(open,{mutate:s=>{s.chests.earned.avatar++;}}));
 await assertFails(commit(open,{mutate:s=>{s.chests.spent.avatar=3;}}));
 await assertFails(commit(open,{mutate:s=>{s.chests.last.poolVersion=1;}}));
 console.log('Cosmetic: level20 toMax');accept(await commit(open));assert.equal(state.cosmeticProgress.levels[candidate.itemId],21);
 console.log('Cosmetic: reject forged overflow');await assertFails(commit({...open,operation:'free-fragments',sequence:2},{mutate:s=>{s.cosmeticProgress.fragments.avatar=2;}}));
 console.log('Cosmetic: valid overflow');accept(await commit({...open,operation:'overflow',sequence:2}));assert.equal(state.cosmeticProgress.fragments.avatar,1);
 await fixture(s=>{s.cosmeticProgress.fragments={avatar:1,frame:1,badge:1};});
 const fuse={type:'fuseCosmeticFragments',operation:'fusion',sequence:1,ingredients:{avatar:1,frame:1,badge:1},fusionRoll:.5};
 await assertFails(commit(fuse,{mutate:s=>{s.cosmeticProgress.last.fee=0;}}));
 await assertFails(commit(fuse,{mutate:s=>{s.chests.earned.frame++;}}));
 console.log('Cosmetic: last-balance CAS race');const frozen={state:structuredClone(state),snapshot:structuredClone(saved),revision};
 const race=await Promise.allSettled([commit(fuse,frozen),commit({...fuse,operation:'other'},frozen)]);assert.equal(race.filter(r=>r.status==='fulfilled').length,1);accept(race.find(r=>r.status==='fulfilled').value);
 assert.equal(saved.profile.data.coins,0);assert.equal(state.chests.earned.frame,1);assert.equal(state.chests.spent.frame,0);
 const replay=transitionSpark(state,{...fuse,operation:state.cosmeticProgress.last.operation},{uid,now,festivalEnabled:true,cosmeticEnabled:true,coinsBalance:0});assert.equal(replay.receipts.length,0);
 await fixture(s=>{s.cosmeticProgress.fragments.badge=1;});
 accept(await commit({type:'sellCosmeticFragments',operation:'sell',sequence:2,fragmentType:'badge',quantity:1}));assert.equal(saved.profile.data.coins,100);
 await fixture(s=>{s.letters.counts={A:3};});
 const letter={type:'fuseLetter',operation:'paid-letter',sequence:1,ingredients:['A','A','A'],fusionPolicy:PAID_LETTER_FUSION_POLICY,fusionRoll:.5};
 await assertFails(commit(letter,{randomLetter:selectFusionLetter(state.letters.counts,.5),mutate:s=>{s.letters.last.coins=0;}}));
 accept(await commit(letter,{randomLetter:selectFusionLetter(state.letters.counts,.5)}));assert.equal(saved.profile.data.coins,90);
 console.log('Cosmetic: chest sale quantity and price');
 await fixture(s=>{s.chests.earned.c=4;});
 const sale={type:'sellChest',chestType:'c',quantity:3,operation:'sell-three',sequence:state.chests.sequence+1};
 await assertFails(commit(sale,{mutate:s=>{s.chests.last.coins=600;s.chests.last.unitPrice=200;}}));
 accept(await commit(sale));assert.equal(saved.profile.data.coins,264);
 assert.equal(state.chests.spent.c,3);
 console.log('Cosmetic: wheel v3 all three cosmetic types');
 for(const type of ['avatar','frame','badge']){
   const item=COSMETIC_ITEMS.filter(item=>item.type===type).at(-1);
   await fixture(s=>{s.tickets=1;s.ticketEarned=1;s.ticketSpent=0;s.spins.ticket=null;});
   const spin={type:'spin',source:'ticket',day:state.day,sequence:1,operation:`wheel-${type}`,wheelVersion:3,
     wheelCandidate:{version:3,sector:4,box:'cosmetic',kind:'item',coins:0,itemId:item.id}};
   await assertFails(commit(spin,{mutate:s=>{s.cosmeticProgress.levels[item.id]+=1;}}));
   await assertFails(commit(spin,{mutate:s=>{s.cosmeticProgress.fragments[type]+=1;}}));
   console.log('Cosmetic: valid wheel copy',type);
   accept(await commit(spin));assert.equal(state.cosmeticProgress.levels[item.id],2);
   const count=state.cosmeticProgress.fragments[type];
   await fixture(s=>{s.cosmeticProgress.levels[item.id]=21;s.tickets=1;s.ticketSpent=0;s.spins.ticket=null;});
   const max={...spin,operation:`wheel-max-${type}`};
   await assertFails(commit(max,{mutate:s=>{s.cosmeticProgress.fragments[type]+=1;}}));
   console.log('Cosmetic: valid wheel overflow',type);
   accept(await commit(max));assert.equal(state.cosmeticProgress.fragments[type],count+1);
 }
 console.log('Cosmetic: v3 late ad at full retained history');
 await fixture(s=>{
   const receipt=(day,ordinal)=>({source:'ad',day,ordinal,operation:`history-${day}-${ordinal}`,sector:0,coins:5,wheel:{version:2,sector:0,kind:'coins',coins:5}});
   s.spins.ads=Array.from({length:10},(_,i)=>receipt(s.day,i+1));
   s.spins.pastAds=Array.from({length:29},(_,i)=>receipt(s.day-3+Math.floor(i/10),i%10+1));
 });
 const late={type:'spin',source:'ad',day:state.day-1,ordinal:10,earned:true,earnedAt:now-DAY_MS+1000,operation:'late-v3-max',wheelVersion:3,
   wheelCandidate:{version:3,sector:4,box:'cosmetic',kind:'item',coins:0,itemId:COSMETIC_ITEMS.filter(item=>item.type==='badge').at(-1).id}};
 await assertFails(commit(late,{mutate:s=>{s.spins.pastAds.at(-1).ordinal=9;}}));
 accept(await commit({...late,type:'reserveAd'}));
 accept(await commit(late));assert.equal(state.spins.pastAds.length,30);
 console.log('Cosmetic: noncosmetic prize cannot alter levels');
 await fixture(s=>{s.tickets=1;s.ticketSpent=0;s.spins.ticket=null;});
 const flip={type:'spin',source:'ticket',day:state.day,sequence:1,operation:'noncosmetic',wheelVersion:3,wheelCandidate:createWheelCandidate([.84,0,0,0,0,0],[],3)};
 await assertFails(commit(flip,{mutate:s=>{s.cosmeticProgress.levels[COSMETIC_ITEMS[0].id]=1;}}));
 accept(await commit(flip));
 const root=await readCloudRoot(db,space,uid),restored=await readCloudSnapshot(db,space,uid,root);
 assert.deepEqual(restored.profile.data.appearance.spark.state.cosmeticProgress,state.cosmeticProgress);
 console.log('Cosmetic emulator passed:101migration,level boundary,overflow,CAS,fees,denials,unopened chest,canonical recovery.');
}catch(error){
 const coverage=await fetch('http://127.0.0.1:8180/emulator/v1/projects/demo-memory-match:ruleCoverage');
 fs.writeFileSync('runtime/cosmetic-rule-coverage.json',await coverage.text());
 throw error;
}finally{await env.cleanup();}
