import test from 'node:test';
import assert from 'node:assert/strict';
import { initialSparkState, transitionSpark, normalizeSparkState, normalizeSparkSave, applyTicketDrop, applySpecialDrop, mergeSparkSave, resolveSparkOperation } from '../../js/liveops/sparkModel.js';
import { GROUP_LOOT_DROP_RATES, LETTER_ALPHABET } from '../../js/liveops/config.js';
import { DAY_MS, periods, WHEEL, DAILY } from '../../js/liveops/model.js';
const uid='spark-owner', now=Date.UTC(2026,9,26,8);
const run=(state,command={type:'status'},extra={})=>transitionSpark(state,command,{uid,now,...extra});
const fact=(i,day=periods(now).day)=>({gameId:'memory-match',mode:'superHard',roundId:`r-${i}`,day,matches:12,noHint:true});
const spin=(source='free',extra={})=>({type:'spin',source,day:periods(now).day,operation:'op-free',...extra});
test('normalizers reject corrupt/future state without truncating tickets',()=>{
  const state=initialSparkState(now); assert.deepEqual(normalizeSparkState(state),state);
  for(const patch of [{version:2},{tickets:-1},{ticketEarned:NaN},{loginNext:7},{spins:{...state.spins,ads:Array(11).fill({})}}]) assert.throws(()=>normalizeSparkState({...state,...patch}));
  assert.equal(normalizeSparkSave().ticketEarned,0); assert.throws(()=>normalizeSparkSave({version:2}));
});
test('free1/ad10/ticket independent; retry same sector; ninth/tenth/eleventh quota',()=>{
  let state=run(null,spin(),{sector:7}).state;
  assert.equal(run(state,spin(),{sector:0}).state.spins.free.sector,7);
  for(let i=1;i<=10;i++) {
    const cmd=spin('ad',{operation:`ad-${i}`,ordinal:i,earned:true});
    const result=run(state,cmd,{sector:i%8}); state=result.state;
    assert.equal(state.spins.ads.length,i); assert.equal(run(state,cmd).receipts.length,0);
  }
  assert.throws(()=>run(state,spin('ad',{operation:'ad-11',ordinal:11,earned:true})));
  assert.throws(()=>run(state,spin('ad',{operation:'fake',ordinal:1})));
  state=run(state,{type:'status'},{ticketEarned:15}).state;
  for(let i=1;i<=15;i++) { const cmd=spin('ticket',{operation:`ticket-${i}`,sequence:i}); const r=run(state,cmd,{ticketEarned:15}); state=r.state; assert.equal(run(state,cmd,{ticketEarned:15}).receipts.length,0); }
  assert.equal(state.tickets,0); assert.equal(state.ticketSpent,15); assert.equal(Object.keys(state.spins).length,4);
  assert.throws(()=>run(state,spin('ticket',{operation:'ticket-16',sequence:16}),{ticketEarned:15}));
  assert.throws(()=>run(state,spin('ticket',{operation:'stale',sequence:1}),{ticketEarned:15}));
});
test('equal eight sectors keep approved probabilities and amounts',()=>{
  assert.equal(WHEEL.reduce((a,b)=>a+b)/8,15);
  for(let sector=0;sector<8;sector++) assert.equal(run(null,spin(),{sector}).receipts[0].coins,WHEEL[sector]);
});
test('day/week bonuses add 1/2 tickets and coins exactly once including rollover',()=>{
  let state=initialSparkState(now); Object.assign(state.daily,{wins:3,matches:30,noHint:1}); Object.assign(state.weekly,{wins:12,matches:120,noHint:3,visits:3});
  let coins=0;
  for(const item of DAILY) {const r=run(state,{type:'daily',id:item.id}); state=r.state; coins+=r.receipts.reduce((a,b)=>a+b.coins,0);}
  assert.equal(coins,30); assert.equal(state.tickets,1);
  state=run(state,{type:'weekly'}).state; assert.equal(state.tickets,3); assert.equal(run(state,{type:'weekly'}).receipts.length,0);
  const reset=run(state,{type:'status'},{now:now+7*DAY_MS}); assert.equal(reset.state.tickets,3); assert.equal(reset.receipts.length,0);
  const pending=initialSparkState(now); Object.assign(pending.daily,{wins:3,matches:30,noHint:1}); Object.assign(pending.weekly,{wins:12,matches:120,noHint:3,visits:3});
  const all=run(pending,{type:'status'},{now:now+7*DAY_MS}); assert.equal(all.state.tickets,3); assert.equal(all.receipts.reduce((a,b)=>a+b.coins,0),80);
});
test('settlement preserves weekly coin milestones while retired cosmetic scoring never grants items',()=>{
  const state=initialSparkState(now);state.cosmetics.granted=['firefly-festival-01'];
  const r=run(state,{type:'status'},{facts:Array.from({length:30},(_,i)=>fact(i))});
  assert.equal(r.state.daily.wins,30);assert.equal(r.state.event.points,40);assert.equal(r.state.cosmetics.points,0);
  assert.equal(r.receipts.filter(v=>v.acquisition).length,0);
  const reset=run(r.state,{type:'status'},{now:now+7*DAY_MS});assert.deepEqual(reset.state.cosmetics.granted,['firefly-festival-01']);
});
test('partial cosmetic points reset; no synthetic rewards for absent weeks or expired facts',()=>{
  const state=run(null,{type:'status'},{facts:[fact(1)]}).state;
  const r=run(state,{type:'status'},{now:now+21*DAY_MS,facts:[fact('expired')]});assert.equal(r.state.cosmetics.points,0);assert.equal(r.receipts.length,1);assert.equal(r.receipts[0].coins,10);assert(r.receipts[0].receiptId.includes(`daily:${periods(now).day}:`));
});
test('late earned uses original day quota within48h, never consumes next day ad slot',()=>{
  let state=initialSparkState(now);
  const command=spin('ad',{operation:'late-ad',earned:true,earnedAt:now,ordinal:1});
  const r=run(state,command,{now:now+DAY_MS}); state=r.state;
  assert.equal(state.spins.ads.length,0);assert.equal(state.spins.pastAds.length,1);assert.equal(r.spin.day,periods(now).day);
  assert.equal(run(state,command,{now:now+DAY_MS}).receipts.length,0);
  assert.throws(()=>run(state,spin('ad',{operation:'expired-ad',earned:true,earnedAt:now,ordinal:2}),{now:now+3*DAY_MS}));
});
test('every game samples special10% and normal2% once, without day cap',()=>{
  for(const gameId of ['memory-match','link-connect','triple-connect']) {
    let save; const drop={gameId,mode:'easy',attempt:'attempt-one',wave:1,group:'group-1',special:true};
    save=applyTicketDrop(save,drop,()=>.09999).save; assert.equal(save.ticketEarned,1);
    assert.equal(applyTicketDrop(save,drop,()=>{throw Error('duplicate roll');}).save.ticketEarned,1);
    for(let i=2;i<=5;i++)save=applyTicketDrop(save,{...drop,group:`group-${i}`},()=>0).save;
    assert.equal(save.ticketEarned,5);
    assert.equal(applyTicketDrop(save,{...drop,group:'normal',special:false},()=>.02).save.ticketEarned,5);
    save=applyTicketDrop(save,{...drop,group:'miss'},()=>.10).save;assert.equal(save.ticketEarned,5);
    assert.equal(applyTicketDrop(save,{...drop,group:'miss'},()=>{throw Error('miss rerolled');}).dropped,false);
    const restored=JSON.parse(JSON.stringify(save));assert.equal(applyTicketDrop(restored,drop,()=>{throw Error('reload');}).save.ticketEarned,5);
    assert.equal(applyTicketDrop(restored,{...drop,wave:2},()=>0).save.ticketEarned,6);
    assert.equal(applyTicketDrop(restored,{...drop,attempt:'new-attempt'},()=>0).save.ticketEarned,6);
  }
});
test('stale appearance cannot erase published mirror or drop checkpoints',()=>{
  const a=normalizeSparkSave();a.state=initialSparkState(now);a.state.revision=2;
  const b=normalizeSparkSave();assert.deepEqual(mergeSparkSave(a,b),a);
});

test('earned crossing reset retains prepare-day quota; expired pending never blocks future actions',()=>{
  const beforeReset=Date.UTC(2026,9,26,23,59,59), afterReset=beforeReset+2000;
  const state=initialSparkState(beforeReset), command={type:'spin',source:'ad',day:periods(beforeReset).day,operation:'cross-reset',ordinal:1,earned:true,earnedAt:afterReset};
  const r=run(state,command,{now:afterReset});assert.equal(r.state.spins.ads.length,0);assert.equal(r.state.spins.pastAds.length,1);
  assert.equal(resolveSparkOperation(r.state,command,afterReset).discarded,false);
  const expired=resolveSparkOperation(r.state,{...command,operation:'other-old'},afterReset+3*DAY_MS);
  assert.equal(expired.command.type,'status');assert.equal(expired.discarded,true);
  assert.equal(resolveSparkOperation(r.state,{...spin(),day:periods(beforeReset).day},afterReset).discarded,true);
  assert.equal(resolveSparkOperation(r.state,{type:'login',day:periods(beforeReset).day},afterReset).discarded,true);
  const ticket={...spin('ticket'),sequence:1,day:periods(beforeReset).day};assert.equal(resolveSparkOperation(r.state,ticket,afterReset).command.day,periods(afterReset).day);
});
test('drop adapters include Lucky outside special flags, all premium flags, and ordinary fresh triples remain ordinary', async()=>{
  const {memoryTicketDrop,linkTicketDrop,tripleTicketDrop}=await import('../../js/liveops/dropAdapters.js');
  const {resolveMemoryPairRewards}=await import('../../js/memoryMatch/pairRewards.js');
  const wave={gameId:'memory-match',mode:'easy',attemptId:'adapter-test',index:1};
  const state={progress:{memoryMatch:{items:{hint:0}}},luckyRewards:new Map([['card',{type:'coins',value:5}]]),luckyAwards:[],coins:0};
  const rewards=resolveMemoryPairRewards(state,{imageId:'card',special:false});assert.equal(state.luckyRewards.size,0);
  assert.equal(memoryTicketDrop(wave,{id:'a'},{id:'b'},rewards).special,true);
  assert.equal(memoryTicketDrop(wave,{id:'a',special:true},{id:'b'},{lucky:null}).special,true);
  assert.equal(memoryTicketDrop(wave,{id:'a'},{id:'b'},{lucky:null}).special,false);
  for(const premiumType of ['cyan','red','blue']) assert.equal(linkTicketDrop({...wave,gameId:'link-connect'},{instanceId:'a',special:true,premiumType},{instanceId:'b'}).special,true);
  assert.equal(linkTicketDrop({...wave,gameId:'link-connect'},{instanceId:'a',luckyReward:{type:'time',value:5}},{instanceId:'b'}).special,true);
  const tiles={a:{},b:{},c:{lucky:{id:'lucky-c'}}},tw={...wave,gameId:'triple-connect'};
  assert.equal(tripleTicketDrop(tw,tiles,['a','b','c'],['a','b','c']).special,true);
  assert.equal(tripleTicketDrop(tw,tiles,['a','b','c'],[]),undefined);
  assert.equal(tripleTicketDrop(tw,{a:{},b:{},c:{}},['a','b','c'],['a','b','c']).special,false);
});

test('earned crossing reset retains original quota history through48h after earned',()=>{
  const before=Date.UTC(2026,9,26,23,59,59),earnedAt=before+2000,later=earnedAt+2*DAY_MS-1;
  let state=initialSparkState(before);
  state=transitionSpark(state,{type:'spin',source:'ad',day:periods(before).day,ordinal:1,earned:true,operation:'old-first'},{uid,now:before}).state;
  const r=transitionSpark(state,{type:'spin',source:'ad',day:periods(before).day,ordinal:2,earned:true,earnedAt,operation:'cross-late'},{uid,now:later});
  assert.equal(r.state.spins.ads.length,0);assert.equal(r.state.spins.pastAds.length,2);assert.equal(r.spin.day,periods(before).day);
});


test('independent group loot boundaries and all hit combinations across games and modes',()=>{
  const games=['memory-match','link-connect','triple-connect'];
  const modes=['easy','normal','hard','superHard','challenge','endless'];
  const noRoll=()=>{throw Error('Processed or disabled source sampled');};
  for(const gameId of games)for(const mode of modes)for(const special of [false,true]){
    const input={gameId,mode,attempt:'group-policy',wave:1,group:'a|b|c',special};
    const rates=GROUP_LOOT_DROP_RATES[special?'special':'normal'];
    for(const source of ['ticket','letter','badge'])for(const roll of [rates[source]-Number.EPSILON,rates[source],rates[source]+Number.EPSILON]){
      let letterCalls=0;
      const result=applySpecialDrop(undefined,input,{dropFireflies:true,
        ticketRandom:()=>source==='ticket'?roll:.99,
        letterRandom:()=>{letterCalls++;return source==='letter'?(letterCalls===1?roll:0):.99;},
        fireflyRandom:()=>source==='badge'?roll:.99});
      assert.equal(result.dropped,source==='ticket'&&roll<rates.ticket);
      assert.equal(Boolean(result.letter),source==='letter'&&roll<rates.letter);
      assert.equal(result.firefly,source==='badge'&&roll<rates.badge);
      assert.equal(letterCalls,source==='letter'&&roll<rates.letter?2:1);
      const replay=applySpecialDrop(JSON.parse(JSON.stringify(result.save)),input,{ticketRandom:noRoll,letterRandom:noRoll,fireflyRandom:noRoll,dropFireflies:true});
      assert.deepEqual(replay.save,result.save);
    }
    for(let hits=0;hits<8;hits++){
      const result=applySpecialDrop(undefined,input,{dropFireflies:true,ticketRandom:()=>hits&1?0:.99,letterRandom:()=>hits&2?0:.99,fireflyRandom:()=>hits&4?0:.99});
      assert.equal(result.save.ticketEarned,Number(Boolean(hits&1)));
      assert.equal(Object.values(result.save.letterEarned).reduce((a,b)=>a+b,0),Number(Boolean(hits&2)));
      assert.equal(result.save.fireflyEarned,Number(Boolean(hits&4)));
      assert.deepEqual(result.save.drops[`${gameId}:${mode}`].groups,['a|b|c']);
      assert.equal(input.special,special);
    }
    for(let i=0;i<LETTER_ALPHABET.length;i++){
      const samples=[0,(i+.5)/LETTER_ALPHABET.length];
      assert.equal(applySpecialDrop(undefined,input,{ticketRandom:()=>.99,letterRandom:()=>samples.shift()}).letter,LETTER_ALPHABET[i]);
    }
    const disabled=applySpecialDrop(undefined,input,{ticketRandom:()=>.99,dropLetters:false,dropFireflies:false,letterRandom:noRoll,fireflyRandom:noRoll});
    assert.deepEqual(disabled.save.letterEarned,{});assert.equal(disabled.save.fireflyEarned,0);
  }
});

test('miss markers remain bounded to the current wave and reject overflow without altering prior save',()=>{
  const input={gameId:'triple-connect',mode:'endless',attempt:'bounded-policy',wave:1,special:false};
  const options={ticketRandom:()=>.99,letterRandom:()=>.99,fireflyRandom:()=>.99,dropFireflies:true};
  let save;
  for(let i=0;i<1000;i++)save=applySpecialDrop(save,{...input,group:`group-${i}`},options).save;
  assert.equal(save.drops['triple-connect:endless'].groups.length,1000);
  assert.throws(()=>applySpecialDrop(save,{...input,group:'overflow'},options));
  assert.equal(save.drops['triple-connect:endless'].groups.length,1000);
  const next=applySpecialDrop(save,{...input,wave:2,group:'next-wave'},options).save;
  assert.deepEqual(next.drops['triple-connect:endless'].groups,['next-wave']);
  assert.equal(Object.keys(next.drops).length,1);
});
