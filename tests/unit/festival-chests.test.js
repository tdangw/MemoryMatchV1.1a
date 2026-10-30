import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeChests,normalizeFestival,earnChest,claimFestival,chestCandidate,openChest } from '../../js/liveops/chests.js';
import { transitionSpark,applySpecialDrop,normalizeSparkState,normalizeSparkSave } from '../../js/liveops/sparkModel.js';
import { CHEST_POOLS,CHEST_SUPPORTS } from '../../js/liveops/chestConfig.js';
import { LETTER_SETS } from '../../js/liveops/config.js';
import { normalizeAcquisitions } from '../../js/progression/acquisitionModel.js';
const now=Date.UTC(2026,9,27,9),uid='festival-owner';
const run=(state,command,extra={})=>transitionSpark(state,command,{uid,now,festivalEnabled:true,fireflyEarned:state?.festival?.earnedTotal||0,...extra});
test('claim milestones in any order; preserve overflow; completed cycles do not require opening',()=>{
  for(const earned of [24,25,49,50,74,75,99,100,130,1000]){
    let state=run(null,{type:'status'},{fireflyEarned:earned}).state;
    for(const points of [100,25,75,50]){
      if(earned<points){assert.throws(()=>run(state,{type:'claimFestival',points,cycle:0}));continue;}
      const cmd={type:'claimFestival',points,cycle:0},claimed=run(state,cmd);state=claimed.state;
      assert.equal(run(state,cmd).receipts.length,0);
    }
    assert.equal(state.festival.completedCycles,earned>=100?1:0);
    if(earned>=100){assert.equal(state.chests.earned.c,1);assert.equal(state.chests.earned.avatar,1);assert.equal(state.chests.spent.c,0);}
  }
});
test('ten thousand cycles retain bounded state and never subtract milestone sums',()=>{
  let festival={version:1,earnedTotal:1000130,completedCycles:0,mask:0},chests=normalizeChests();
  for(let cycle=0;cycle<10000;cycle++)for(const points of [25,50,75,100])({festival,chests}=claimFestival(festival,chests,{cycle,points}));
  assert.equal(festival.earnedTotal-festival.completedCycles*100,130);assert.equal(chests.earned.avatar,10000);
  assert.ok(JSON.stringify({festival,chests}).length<350);
});
test('category boundaries, uniform subpools, duplicate and full by type; no implicit pity',()=>{
  const pick=(type,n,owned=[],second=0)=>{let i=0;return chestCandidate(type,'memory-match',owned,()=>i++?second:n);};
  assert.equal(pick('c',.399999).coins,50);assert.equal(pick('c',.4).kind,'support');
  assert.equal(pick('avatar',.799999).kind,'support');assert.equal(pick('avatar',.8).kind,'item');
  const item=CHEST_POOLS.avatar[0],candidate=pick('avatar',.8);
  const value=earnChest(undefined,'avatar');
  const opened=openChest(value,{chestType:'avatar',gameId:'memory-match',sequence:1,operation:'dup',candidate},[item],0);
  assert.equal(opened.result.coins,100);assert.equal(opened.result.reason,'duplicate');
  assert.equal(pick('frame',0,CHEST_POOLS.frame).reason,'full');assert.equal(pick('avatar',0,CHEST_POOLS.frame).reason,'coins');
  for(const [gameId,pool]of Object.entries(CHEST_SUPPORTS))for(let index=0;index<pool.length;index++){
    let count=0;const result=chestCandidate('c',gameId,[],()=>count++?.01+index/pool.length:.5);assert.equal(result.key,pool[index].key);
  }
});
test('full support inventory retains exact candidate; retry and last-chest race spend once',()=>{
  let n=0;const candidate=chestCandidate('c','memory-match',[],()=>n++?0:.5),state=earnChest(undefined,'c');
  const command={chestType:'c',gameId:'memory-match',sequence:1,operation:'one',candidate};
  assert.equal(openChest(state,command,[],9999).result.coins,10);
  assert.equal(state.spent.c,0);
  const once=openChest(state,command,[],9998);assert.equal(once.result.key,candidate.key);
  assert.equal(openChest(once.chests,command,[],9999).applied,false);
  assert.throws(()=>openChest(once.chests,{...command,operation:'other'},[],0));
});
test('four recipes grant their fixed chest without ownership or twelve-slot cursor',()=>{
  for(const set of LETTER_SETS){
    let state=run(null,{type:'status'},{letterEarned:set.required}).state;
    const cmd={type:'exchangeLetterSet',setId:set.id,sequence:1,operation:`set-${set.id}`};
    state=run(state,cmd,{letterEarned:set.required}).state;
    assert.equal(state.chests.earned[set.chestType],1);assert.equal(state.letters.last.coins,0);
    assert.deepEqual(run(state,cmd,{letterEarned:set.required}).state.chests,state.chests);
  }
});
test('special drop persists once, separately from tickets/letters; future data fails intact',()=>{
  const input={gameId:'memory-match',mode:'easy',attempt:'attempt',wave:1,group:'1|2',special:true};
  let calls=0;const first=applySpecialDrop(undefined,input,{dropFireflies:true,ticketRandom:()=>.99,letterRandom:()=>.99,fireflyRandom:()=>{calls++;return .29999;}});
  assert.equal(first.save.fireflyEarned,1);assert.equal(applySpecialDrop(first.save,input,{dropFireflies:true}).save.fireflyEarned,1);assert.equal(calls,1);
  assert.equal(applySpecialDrop(first.save,{...input,group:'3|4',special:false},{dropFireflies:true,ticketRandom:()=>.99,letterRandom:()=>.99,fireflyRandom:()=>.06}).save.fireflyEarned,1);
  assert.throws(()=>normalizeFestival({version:2}));assert.throws(()=>normalizeChests({...normalizeChests(),version:2}));
  const legacy=transitionSpark(null,{type:'status'},{uid,now}).state;assert.equal(normalizeSparkState(legacy).chests,undefined);
  assert.throws(()=>normalizeSparkSave({...first.save,fireflyEarned:-1}));
});
test('stable chest item ownership receipt remains distinct from certified achievement',()=>{
  const item=CHEST_POOLS.avatar[0],receiptId=`${uid}:chest:item:${item}`;
  const value={version:1,grants:{[receiptId]:{receiptId,ownerUid:uid,sourceKind:'chest',sourceId:'shared-chests-v1',items:[item],grantedAt:now}}};
  assert.deepEqual(normalizeAcquisitions(value),value);assert.throws(()=>normalizeAcquisitions({version:1,grants:{bad:value.grants[receiptId]}}));
});

test('pending old full-pool price settles at100 without reroll; committed old receipt replays intact',()=>{
 const candidate={chestType:'frame',gameId:'memory-match',poolVersion:1,kind:'coins',coins:200,reason:'full'};
 const command={chestType:'frame',gameId:'memory-match',sequence:1,operation:'legacy-full',candidate};
 const opened=openChest(earnChest(undefined,'frame'),command,[],0);assert.equal(opened.result.coins,100);
 const old=structuredClone(opened.chests);old.last.coins=200;const replay=openChest(old,command,[],0);assert.equal(replay.applied,false);assert.equal(replay.result.coins,200);
});
