import test from 'node:test';
import assert from 'node:assert/strict';
import { WHEEL_SLOTS,WHEEL_ROLL_COUNT,createWheelRolls,wheelSector,createWheelCandidate as createCurrentWheelCandidate,normalizeWheelCandidate,resolveWheelCandidate } from '../../js/liveops/wheelRewards.js';
import { WHEEL_ITEMS,WHEEL_POOLS as CURRENT_WHEEL_POOLS } from '../../js/liveops/wheelCatalog.js';
import { LEGACY_CHEST_POOLS as CHEST_POOLS,CHEST_SUPPORTS,CHEST_POLICY } from '../../js/liveops/chestConfig.js';
import { WHEEL,DAY_MS } from '../../js/liveops/model.js';
import { transitionSpark,normalizeSparkState,resolveSparkOperation } from '../../js/liveops/sparkModel.js';
import { GAMEPLAY_LIMITS } from '../../js/gameplayTuning.js';
// Preserve the exact v2 pending/receipt policy; v3 copies are covered by cosmetic-rewards.test.js.
const WHEEL_POOLS={...CURRENT_WHEEL_POOLS,cosmetic:CURRENT_WHEEL_POOLS.cosmetic.filter(id=>!id.startsWith('starter-'))};
const createWheelCandidate=(rolls,owned)=>createCurrentWheelCandidate(rolls,owned,2);
const uid='wheel-test',now=Date.UTC(2026,10,5,12),day=Math.floor(now/DAY_MS);
const midpoint=sector=>(WHEEL_SLOTS.slice(0,sector).reduce((sum,item)=>sum+item.weight,0)+WHEEL_SLOTS[sector].weight/2)/100;
const rolls=(sector,...values)=>[midpoint(sector),...Array.from({length:5},(_,i)=>values[i]??.5)];
const candidate=(sector,owned=[],...values)=>createWheelCandidate(rolls(sector,...values),owned);
const initial=()=>transitionSpark(null,{type:'status'},{uid,now,ticketEarned:2}).state;
const spin=(source='free',operation='spin')=>({type:'spin',source,day,operation,...(source==='ticket'?{sequence:1}:{})});

test('late-ad reservation survives restart without granting and settles only the same candidate once',()=>{
 const before=initial(),wheel=candidate(4),command={type:'spin',source:'ad',operation:'reserved',day:day-1,ordinal:1,earned:true,earnedAt:now-DAY_MS,wheelVersion:2,wheelCandidate:wheel};
 const context={uid,now,ticketEarned:2};
 const reserved=transitionSpark(before,{...command,type:'reserveAd'},context);
 assert.equal(reserved.receipts.length,0);assert.equal(reserved.state.spins.pastAds.length,0);
 const restarted=normalizeSparkState(JSON.parse(JSON.stringify(reserved.state)));
 assert.throws(()=>transitionSpark(restarted,{type:'claimWheelReward',wheelOperation:command.operation},context));
 assert.throws(()=>transitionSpark(restarted,{...command,wheelCandidate:candidate(0)},context));
 assert.throws(()=>transitionSpark(restarted,{...command,operation:'different'},context));
 const settled=transitionSpark(restarted,command,context);
 assert.equal(settled.spinApplied,true);assert.equal(settled.receipts.length,1);assert.equal(settled.state.pendingWheel,null);
 assert.equal(transitionSpark(settled.state,command,context).receipts.length,0);
 const canceled=transitionSpark(restarted,{type:'cancelReservedAd',operation:command.operation},context);
 assert.equal(canceled.state.pendingWheel,null);assert.equal(canceled.receipts.length,0);
});

test('ten weighted sectors cover exactly 100 intervals and every boundary',()=>{
 assert.equal(WHEEL_SLOTS.length,10);assert.equal(WHEEL_SLOTS.reduce((sum,s)=>sum+s.weight,0),100);
 const frequencies=Array(10).fill(0);for(let i=0;i<100;i++)frequencies[wheelSector((i+.5)/100)]++;
 assert.deepEqual(frequencies,[40,25,15,1,2,2,1,2,2,10]);
 let start=0;for(let sector=0;sector<10;sector++){assert.equal(wheelSector(start/100),sector);start+=WHEEL_SLOTS[sector].weight;assert.equal(wheelSector((start-.0001)/100),sector);}
 assert.equal(createWheelRolls(()=>.5).length,WHEEL_ROLL_COUNT);
 for(const bad of [-1,1,NaN,Infinity,'0']){assert.throws(()=>wheelSector(bad));assert.throws(()=>createWheelRolls(()=>bad));}
 for(const malformed of [[],Array(6),[.1],Array(7).fill(.1),[.1,.1,.1,null,.1,.1]])assert.throws(()=>createWheelCandidate(malformed));
});

test('coin prizes include both endpoints and uniform 46 integer random outcomes',()=>{
 assert.equal(candidate(0).coins,5);assert.equal(candidate(1).coins,10);
 for(let i=0;i<46;i++)assert.equal(candidate(2,[],(i+.5)/46).coins,i+5);
 assert.equal(candidate(2,[],0).coins,5);assert.equal(candidate(2,[],.999999).coins,50);
});

test('dedicated boxes choose each missing entitlement and convert full/duplicate exactly to100',()=>{
 for(const [sector,category]of [[4,'cosmetic'],[5,'flip'],[6,'theme'],[7,'path'],[8,'exit']]){
  const pool=WHEEL_POOLS[category];assert.ok(pool.length);
  for(let index=0;index<pool.length;index++){
   const chosen=candidate(sector,[],(index+.5)/pool.length);assert.equal(chosen.itemId,pool[index]);assert.equal(chosen.coins,0);assert.equal(chosen.box,category);
   assert.deepEqual(normalizeWheelCandidate(JSON.parse(JSON.stringify(chosen))),chosen);
  }
  const missing=pool.at(-1),chosen=candidate(sector,pool.slice(0,-1),0);assert.equal(chosen.itemId,missing);
  const duplicate=resolveWheelCandidate(chosen,pool);assert.equal(duplicate.kind,'coins');assert.equal(duplicate.coins,100);assert.equal(duplicate.itemId,missing);assert.equal(duplicate.sector,sector);assert.equal(duplicate.reason,'duplicate');
  const full=candidate(sector,pool);assert.equal(full.coins,100);assert.equal(full.reason,'full');assert.deepEqual(resolveWheelCandidate(full,pool),full);
  assert.throws(()=>resolveWheelCandidate(full,[]));
 }
});

test('mystery box retains four existing chest policies while support box divides games then items equally',()=>{
 for(const [index,type]of ['c','avatar','frame','badge'].entries()){
  const coin=createWheelCandidate(rolls(3,(index+.5)/4,0));assert.equal(coin.chestType,type);assert.equal(coin.coins,CHEST_POLICY[type].coins);
  const support=createWheelCandidate(rolls(3,(index+.5)/4,.5,0,0));assert.equal(support.kind,'support');assert.equal(support.gameId,'memory-match');assert.equal(support.key,'hint');
  if(type!=='c'){
   const item=createWheelCandidate(rolls(3,(index+.5)/4,.99,0,0));assert.equal(item.kind,'item');assert.ok(CHEST_POOLS[type].includes(item.itemId));
   const full=createWheelCandidate(rolls(3,(index+.5)/4,0),CHEST_POOLS[type]);assert.equal(full.coins,100);assert.equal(full.reason,'full');
  }
 }
 for(const [gameIndex,[gameId,items]]of Object.entries(CHEST_SUPPORTS).entries())for(let index=0;index<items.length;index++){
  const item=candidate(9,[],(gameIndex+.5)/3,(index+.5)/items.length);assert.equal(item.gameId,gameId);assert.equal(item.key,items[index].key);assert.deepEqual(normalizeWheelCandidate(item),item);
 }
});

test('candidate normalization rejects cross-pool prizes, wrong amounts and unknown fields',()=>{
 const item=candidate(5),support=candidate(9),coin=candidate(0),full=candidate(5,WHEEL_POOLS.flip);
 for(const bad of [{...coin,version:4},{...coin,coins:100},{...coin,sector:10},{...coin,box:'flip'},{...item,itemId:WHEEL_POOLS.theme[0]},{...item,box:'theme'},{...item,coins:100},{...support,key:'unknown'},{...support,coins:100},{...support,gameId:'other'},{...full,reason:'coins'},{...full,coins:99},{...item,debug:true}])assert.throws(()=>normalizeWheelCandidate(bad));
});

test('fresh spin emits actual prize once; a concurrent unlock gives100 instead of reroll',()=>{
 const before=initial(),chosen=candidate(5),command=spin();
 const first=transitionSpark(before,command,{uid,now,ticketEarned:2,wheelCandidate:chosen});
 assert.equal(first.spinApplied,true);assert.equal(first.wheelApplied,true);assert.equal(first.wheelReward.itemId,chosen.itemId);assert.equal(first.receipts[0].acquisition.sourceKind,'wheel');assert.deepEqual(first.receipts[0].acquisition.items,[chosen.itemId]);
 const replay=transitionSpark(first.state,command,{uid,now,ticketEarned:2,wheelCandidate:candidate(4)});assert.equal(replay.spinApplied,false);assert.equal(replay.wheelApplied,false);assert.equal(replay.receipts.length,0);assert.deepEqual(replay.state,first.state);
 const raced=transitionSpark(before,command,{uid,now,ticketEarned:2,wheelCandidate:chosen,ownedWheelItemIds:[chosen.itemId]});
 assert.equal(raced.spin.wheel.reason,'duplicate');assert.equal(raced.receipts[0].coins,100);assert.equal(raced.spin.sector,chosen.sector);assert.equal(raced.receipts[0].acquisition,undefined);
 assert.equal(Object.hasOwn(before,'pendingWheel'),false);
});

test('full support inventory keeps one durable gift across rollover; claiming does not consume another spin',()=>{
 const command=spin('ticket'),chosen=candidate(9),before=initial();
 const held=transitionSpark(before,command,{uid,now,ticketEarned:2,wheelCandidate:chosen,supportCount:GAMEPLAY_LIMITS.itemCount});
 assert.equal(held.spinApplied,true);assert.equal(held.wheelApplied,false);assert.equal(held.receipts.length,0);assert.equal(held.state.tickets,1);assert.equal(held.state.pendingWheel.operation,command.operation);
 const replay=transitionSpark(held.state,command,{uid,now,ticketEarned:2,wheelCandidate:chosen});assert.deepEqual(replay.state,held.state);assert.equal(replay.receipts.length,0);
 assert.throws(()=>transitionSpark(held.state,spin('free','other'),{uid,now,ticketEarned:2,wheelCandidate:candidate(0)}));
 const later=now+5*DAY_MS,moved=transitionSpark(held.state,{type:'status'},{uid,now:later,ticketEarned:2}).state;
 assert.deepEqual(moved.pendingWheel,held.state.pendingWheel);assert.deepEqual(normalizeSparkState(JSON.parse(JSON.stringify(moved))),moved);
 const waiting=transitionSpark(moved,{type:'claimWheelReward',wheelOperation:command.operation},{uid,now:later,ticketEarned:2,supportCount:GAMEPLAY_LIMITS.itemCount});assert.equal(waiting.wheelApplied,false);assert.deepEqual(waiting.state,moved);
 const received=transitionSpark(moved,{type:'claimWheelReward',wheelOperation:command.operation},{uid,now:later,ticketEarned:2,supportCount:GAMEPLAY_LIMITS.itemCount-1});assert.equal(received.wheelApplied,true);assert.equal(received.state.pendingWheel,null);assert.equal(received.state.tickets,1);assert.equal(received.state.ticketSpent,1);assert.deepEqual(received.receipts[0].support,{gameId:chosen.gameId,key:chosen.key});
 const again=transitionSpark(received.state,{type:'claimWheelReward',wheelOperation:command.operation},{uid,now:later,ticketEarned:2});assert.equal(again.receipts.length,0);assert.equal(again.wheelApplied,false);
 const nextHeld=transitionSpark(received.state,{...spin('free','future-gift'),day:Math.floor(later/DAY_MS)},{uid,now:later,ticketEarned:2,wheelCandidate:chosen,supportCount:GAMEPLAY_LIMITS.itemCount});
 const staleClaim=transitionSpark(nextHeld.state,{type:'claimWheelReward',wheelOperation:command.operation},{uid,now:later,ticketEarned:2,supportCount:0});assert.deepEqual(staleClaim.state,nextHeld.state);assert.equal(staleClaim.receipts.length,0);assert.equal(staleClaim.wheelApplied,false);
 assert.throws(()=>transitionSpark(nextHeld.state,{type:'claimWheelReward'},{uid,now:later,ticketEarned:2}));
 assert.equal(resolveSparkOperation(moved,{type:'claimWheelReward',operation:'claim',wheelOperation:command.operation},later).discarded,false);
});

test('V2 free/ad/ticket sources retain independent quotas and stable receipt replay',()=>{
 let state=initial();const outcome=candidate(2,[],.999999);
 const free=transitionSpark(state,spin('free','free-new'),{uid,now,ticketEarned:2,wheelCandidate:outcome});assert.equal(free.spin.coins,50);state=free.state;
 for(let ordinal=1;ordinal<=10;ordinal++){
  const command={...spin('ad',`ad-${ordinal}`),earned:true,ordinal,earnedAt:now};
  const result=transitionSpark(state,command,{uid,now,ticketEarned:2,wheelCandidate:outcome});assert.equal(result.spinApplied,true);assert.equal(result.wheelApplied,true);state=result.state;
  const replay=transitionSpark(state,command,{uid,now,ticketEarned:2,wheelCandidate:candidate(0)});assert.equal(replay.receipts.length,0);assert.equal(replay.spin.coins,50);assert.equal(replay.wheelApplied,false);
 }
 assert.throws(()=>transitionSpark(state,{...spin('ad','ad-eleven'),earned:true,ordinal:11,earnedAt:now},{uid,now,ticketEarned:2,wheelCandidate:outcome}));
 const ticket=transitionSpark(state,spin('ticket','ticket-new'),{uid,now,ticketEarned:2,wheelCandidate:outcome});assert.equal(ticket.state.tickets,1);assert.equal(ticket.state.spins.ads.length,10);assert.equal(ticket.state.spins.free.operation,'free-new');assert.equal(ticket.state.spins.ticket.coins,50);
});

test('legacy eight-sector saves and pending spins retain their exact amounts and sources',()=>{
 for(let sector=0;sector<WHEEL.length;sector++){
  const command=spin('free',`legacy-${sector}`),result=transitionSpark(null,command,{uid,now,sector});
  assert.equal(result.spin.coins,WHEEL[sector]);assert.equal(result.spinApplied,true);assert.equal(result.wheelApplied,true);assert.equal(result.wheelReward,null);assert.equal(Object.hasOwn(result.state,'pendingWheel'),false);
  const loaded=normalizeSparkState(JSON.parse(JSON.stringify(result.state)));assert.equal(loaded.spins.free.wheel,undefined);
  assert.deepEqual(transitionSpark(loaded,command,{uid,now,sector:0}).state,loaded);
 }
 const before=initial();assert.throws(()=>transitionSpark(before,{...spin(),wheelVersion:3},{uid,now,ticketEarned:2}));
 const invalid=structuredClone(before);invalid.pendingWheel={operation:'forged',day,wheel:candidate(0)};assert.throws(()=>normalizeSparkState(invalid));
 assert.ok(WHEEL_ITEMS.length>0);
});
