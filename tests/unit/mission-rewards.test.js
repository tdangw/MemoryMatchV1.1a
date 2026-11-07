import test from 'node:test';
import assert from 'node:assert/strict';
import {createLoginCandidate,normalizeLoginReward,LOGIN_REWARDS} from '../../js/liveops/missionRewards.js';
import {initialSparkState,transitionSpark,normalizeSparkState,resolveSparkOperation} from '../../js/liveops/sparkModel.js';
import {DAY_MS,DAILY,WEEKLY} from '../../js/liveops/model.js';
import {GAMEPLAY_LIMITS} from '../../js/gameplayTuning.js';
const now=Date.UTC(2026,10,7,12),uid='mission-owner';
const login=(index,operation=`login-${index}`)=>({type:'login',loginVersion:2,operation,loginCandidate:createLoginCandidate(index,[0,.5,.999999])});
test('new no-hint claims require three wins while previously received rewards stay received',()=>{
 for(const noHint of [0,1,2,3]){
  const state=initialSparkState(now);Object.assign(state.daily,{wins:3,matches:30,noHint});
  assert.equal(transitionSpark(state,{type:'daily',id:'win-without-hint'},{uid,now}).receipts.length,noHint===3?1:0);
  assert.equal(transitionSpark(state,{type:'dailyBonus'},{uid,now}).receipts.length,noHint===3?1:0);
 }
 const old=initialSparkState(now);Object.assign(old.daily,{wins:3,matches:30,noHint:1,claimed:['win-without-hint','bonus']});
 const other=transitionSpark(old,{type:'daily',id:'win-three'},{uid,now});assert.equal(other.receipts[0].coins,5);assert.ok(other.state.daily.claimed.includes('bonus'));assert.equal(transitionSpark(other.state,{type:'daily',id:'win-without-hint'},{uid,now}).receipts.length,0);
});
test('seven days grant exact coins and hint game, day7 one random support per game',()=>{
 for(let index=0;index<7;index++){
  const state=initialSparkState(now);state.loginNext=index;const command=login(index);
  const r=transitionSpark(state,command,{uid,now,loginSupportCounts:command.loginCandidate.supports.map(()=>0)});
  assert.equal(r.receipts.reduce((n,v)=>n+v.coins,0),[10,10,15,15,20,25,50][index]);
  assert.deepEqual(r.receipts.filter(v=>v.support).map(v=>v.support),command.loginCandidate.supports);
  assert.equal(r.state.loginNext,(index+1)%7);assert.equal(r.state.weekly.visits,1);
  if(index<6)assert.deepEqual(command.loginCandidate.supports,[{gameId:LOGIN_REWARDS[index].gameId,key:'hint'}]);
  else assert.deepEqual(command.loginCandidate.supports.map(v=>v.gameId),['memory-match','link-connect','triple-connect']);
 }
});
test('full inventory rejects all of day7; durable candidate survives rollover unchanged',()=>{
 const s=initialSparkState(now);s.loginNext=6;const before=structuredClone(s),command=login(6);
 assert.throws(()=>transitionSpark(s,command,{uid,now,loginSupportCounts:[0,GAMEPLAY_LIMITS.itemCount,0]}),e=>e.code==='rewards/inventory-full');assert.deepEqual(s,before);
 const resolved=resolveSparkOperation(s,{...command,day:s.day},now+DAY_MS);assert.equal(resolved.discarded,false);assert.deepEqual(resolved.command.loginCandidate,command.loginCandidate);
 const r=transitionSpark(s,resolved.command,{uid,now:now+DAY_MS,loginSupportCounts:[0,0,0]});assert.equal(r.loginApplied,true);assert.equal(r.state.loginNext,0);
});
test('receipt replay across a day boundary and another click today never grant twice',()=>{
 const command=login(0),r=transitionSpark(null,command,{uid,now,loginSupportCounts:[0]});
 for(const later of [now,now+DAY_MS])assert.equal(transitionSpark(r.state,command,{uid,now:later,loginSupportCounts:[0]}).loginApplied,false);
 assert.equal(transitionSpark(r.state,login(1,'another'),{uid,now,loginSupportCounts:[0]}).receipts.length,0);
});
test('new receipt strictness rejects wrong keys, index, day and amount; old saves remain readable',()=>{
 const r=transitionSpark(null,login(0),{uid,now,loginSupportCounts:[0]});
 assert.doesNotThrow(()=>normalizeSparkState(initialSparkState(now)));
 for(const change of [v=>v.coins++,v=>v.index=7,v=>v.supports[0].key='freeze',v=>v.supports.push(v.supports[0]),v=>v.extra=1,v=>v.day=-1]){const v=structuredClone(r.state.loginReward);change(v);assert.throws(()=>normalizeLoginReward(v));}
 assert.throws(()=>transitionSpark(null,login(1),{uid,now,loginSupportCounts:[0]}));
});
test('daily bonus is manually opened after completion before claiming individual rewards',()=>{
 const s=initialSparkState(now);for(const m of DAILY)s.daily[m.key]=m.target;
 const bonus=transitionSpark(s,{type:'dailyBonus'},{uid,now});assert.equal(bonus.bonusApplied,true);assert.equal(bonus.state.tickets,1);assert.deepEqual(bonus.state.daily.claimed,['bonus']);
 const replay=transitionSpark(bonus.state,{type:'dailyBonus'},{uid,now});assert.equal(replay.receipts.length,0);
 let state=bonus.state;for(const m of DAILY)state=transitionSpark(state,{type:'daily',id:m.id},{uid,now}).state;
 assert.equal(state.tickets,1);assert.equal(state.daily.claimed.length,4);
});
test('claiming last individual mission no longer auto-claims the chest; incomplete bonus is inert',()=>{
 const s=initialSparkState(now);assert.equal(transitionSpark(s,{type:'dailyBonus'},{uid,now}).receipts.length,0);
 for(const m of DAILY)s.daily[m.key]=m.target;
 let state=s;for(const m of DAILY)state=transitionSpark(state,{type:'daily',id:m.id},{uid,now}).state;
 assert.equal(state.tickets,0);assert.equal(state.daily.claimed.includes('bonus'),false);
});
test('rollover protects completed unclaimed daily and weekly bonuses exactly once',()=>{
 const s=initialSparkState(now);for(const m of DAILY)s.daily[m.key]=m.target;for(const m of WEEKLY)s.weekly[m.key]=m.target;
 const r=transitionSpark(s,{type:'status'},{uid,now:now+7*DAY_MS});assert.equal(r.state.tickets,3);assert.equal(r.receipts.reduce((n,v)=>n+v.coins,0),80);
 assert.equal(transitionSpark(r.state,{type:'status'},{uid,now:now+7*DAY_MS}).receipts.length,0);
});
