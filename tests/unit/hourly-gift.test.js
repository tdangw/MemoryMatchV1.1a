import test from 'node:test';
import assert from 'node:assert/strict';
import { hourlyGiftCandidate, claimHourlyGift, normalizeHourlyGift, HOURLY_GIFT_MS, validGiftReward } from '../../js/liveops/hourlyGift.js';
import { transitionSpark, resolveSparkOperation, normalizeSparkState } from '../../js/liveops/sparkModel.js';
import { GAMEPLAY_LIMITS } from '../../js/gameplayTuning.js';
const now = 1800000000000;
const coins = {kind:'coins',coins:100,gameId:null,key:null};
const command = (operation='claim-1',sequence=1,candidate=coins) => ({type:'claimHourlyGift',operation,sequence,candidate});
test('chest odds are ninety percent total and twenty-two point five percent per type; save and replay grant once',()=>{
  const types=['c','frame','avatar','badge'],counts=Object.fromEntries(types.map(type=>[type,0]));
  for(let i=0;i<10000;i++){
    const samples=[(i+.5)/10000,((i%4)+.5)/4];
    const reward=hourlyGiftCandidate(()=>samples.shift()??0);
    if(reward.kind==='chest')counts[reward.chestType]++;
  }
  for(const type of types){
    assert.equal(counts[type],2250);
    const candidate={kind:'chest',chestType:type,coins:0,gameId:null,key:null},cmd=command(`chest-${type}`,1,candidate);
    const first=transitionSpark(null,cmd,{uid:'user',now});
    assert.equal(first.state.chests.earned[type],1);
    const saved=normalizeSparkState(first.state);
    assert.equal(saved.hourlyGift.last.chestType,type);
    assert.equal(transitionSpark(saved,cmd,{uid:'user',now}).state.chests.earned[type],1);
  }
  assert.equal(validGiftReward({kind:'chest',chestType:'unknown',coins:0,gameId:null,key:null}),false);
  assert.equal(validGiftReward({...coins,chestType:'c'}),false);
});
test('remaining ten percent preserves gift ratios and all supported items at boundaries',()=>{
  assert.deepEqual(hourlyGiftCandidate(()=>0),{kind:'ticket',tickets:10,coins:0,gameId:null,key:null});
  assert.equal(hourlyGiftCandidate(()=>.024999).tickets,10);assert.equal(hourlyGiftCandidate(()=>.025).coins,5);assert.equal(hourlyGiftCandidate(()=>.049999).coins,5);assert.equal(hourlyGiftCandidate(()=>.05).coins,10);assert.equal(hourlyGiftCandidate(()=>.074999).coins,10);
  for(const [game,n] of [['memory-match',3],['link-connect',4],['triple-connect',4]]) for(let i=0;i<n;i++){
    const samples=[.075,(['memory-match','link-connect','triple-connect'].indexOf(game)+.1)/3,(i+.1)/n];
    const result=hourlyGiftCandidate(()=>samples.shift());assert.equal(result.kind,'support');assert.equal(result.gameId,game);
  }
  assert.throws(()=>hourlyGiftCandidate(()=>1));
});
test('new ten-ticket bundle is granted once; invalid bundle amounts and mixed reward fields fail',()=>{
 const ticket=hourlyGiftCandidate(()=>0),first=transitionSpark(null,command('ten',1,ticket),{uid:'user',now});assert.equal(first.state.tickets,10);assert.equal(first.state.hourlyGift.last.tickets,10);
 assert.equal(transitionSpark(first.state,command('ten',1,ticket),{uid:'user',now}).state.tickets,10);
 for(const tickets of [0,1,9,11,NaN,'10'])assert.equal(validGiftReward({...ticket,tickets}),false);
 assert.equal(validGiftReward({...coins,tickets:10}),false);
 for(const amount of [5,10])assert.equal(transitionSpark(null,command(`coins-${amount}`,1,{...coins,coins:amount}),{uid:'user',now}).receipts[0].coins,amount);
});
test('first claim, exact rolling interval, no accumulation and replay',()=>{
  const first=claimHourlyGift(undefined,command(),now);assert.equal(first.applied,true);
  assert.equal(claimHourlyGift(first.state,command(),now).applied,false);
  assert.throws(()=>claimHourlyGift(first.state,command('second',2),now+HOURLY_GIFT_MS-1),/Chưa đến giờ/);
  const second=claimHourlyGift(first.state,command('second',2),now+HOURLY_GIFT_MS);assert.equal(second.state.sequence,2);
  const late=claimHourlyGift(second.state,command('late',3),now+10*HOURLY_GIFT_MS);assert.equal(late.state.sequence,3);
  assert.throws(()=>claimHourlyGift(late.state,command('extra',4),now+10*HOURLY_GIFT_MS));
});
test('bad saves and missing operations fail; server timestamps normalize',()=>{
  assert.equal(normalizeHourlyGift(undefined),null);assert.throws(()=>normalizeHourlyGift(null));
  assert.throws(()=>claimHourlyGift(undefined,{...command(),operation:undefined},now));
  const state=claimHourlyGift(undefined,command(),now).state;
  assert.equal(normalizeHourlyGift({...state,claimedAt:{toMillis:()=>now}}).claimedAt,now);
  assert.throws(()=>normalizeHourlyGift({...state,sequence:2}));
});
test('inventory overflow converts the same support to approved Xu without reroll',()=>{
  const support={kind:'support',coins:0,gameId:'link-connect',key:'freeze'};
  assert.equal(claimHourlyGift(undefined,command('a',1,support),now,0).result.kind,'support');
  const full=claimHourlyGift(undefined,command('a',1,support),now,GAMEPLAY_LIMITS.itemCount);
  assert.equal(full.result.kind,'coins');assert.equal(full.result.coins,GAMEPLAY_LIMITS.itemOverflowCoins);assert.equal(full.result.key,'freeze');
});
test('Spark preserves old saves, grants tickets once and discards stale operations',()=>{
  const before=transitionSpark(null,{type:'status'},{uid:'user',now});assert.equal(before.state.hourlyGift,undefined);
  const ticket={kind:'ticket',coins:0,gameId:null,key:null};
  const first=transitionSpark(before.state,command('one',1,ticket),{uid:'user',now});assert.equal(first.state.tickets,1);assert.equal(first.receipts.length,1);
  const replay=transitionSpark(first.state,command('one',1,ticket),{uid:'user',now});assert.equal(replay.state.tickets,1);assert.equal(replay.receipts.length,0);
  const second=transitionSpark(first.state,command('two',2),{uid:'user',now:now+HOURLY_GIFT_MS});assert.equal(second.receipts[0].coins,100);
  assert.equal(resolveSparkOperation(second.state,command('one'),now+HOURLY_GIFT_MS).discarded,true);
  assert.equal(normalizeSparkState(second.state).hourlyGift.last.operation,'two');
});
