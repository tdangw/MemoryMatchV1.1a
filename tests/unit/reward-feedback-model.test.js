import test from 'node:test';
import assert from 'node:assert/strict';
import {transitionSpark} from '../../js/liveops/sparkModel.js';
import {DAILY,WEEKLY} from '../../js/liveops/model.js';
import {committedRewardsForTransition as collect,mergeCommittedRewards} from '../../js/liveops/rewardFeedbackModel.js';
const now=Date.UTC(2026,9,31,12),uid='feedback-owner';
const initial=()=>transitionSpark(null,{type:'status'},{uid,now,festivalEnabled:true}).state;
const step=(state,command)=>transitionSpark(state,command,{uid,now,festivalEnabled:true,ticketEarned:state.ticketEarned,fireflyEarned:state.festival.earnedTotal,letterEarned:state.letters.earned});
test('committed login, daily all-clear and weekly receipts include only new coins and mission tickets',()=>{
 let state=initial(),r=step(state,{type:'login'});assert(collect(state,r).some(v=>v.kind==='coins'));assert.deepEqual(collect(r.state,step(r.state,{type:'login'})),[]);
 state=initial();for(const d of DAILY)state.daily[d.key]=d.target;
 for(const d of DAILY){r=step(state,{type:'daily',id:d.id});const rewards=collect(state,r);assert(rewards.some(v=>v.kind==='coins'));if(r.state.daily.claimed.includes('bonus'))assert(rewards.some(v=>v.kind==='ticket'));state=r.state;}
 state=initial();for(const w of WEEKLY)state.weekly[w.key]=w.target;r=step(state,{type:'weekly'});assert.deepEqual(collect(state,r),[{kind:'coins',amount:50},{kind:'ticket',amount:2}]);
});
test('festival grants the exact new chest milestone once; mirroring gameplay tickets is not a second reward',()=>{
 let state=initial();state=transitionSpark(state,{type:'status'},{uid,now,festivalEnabled:true,fireflyEarned:100}).state;
 const command={type:'claimFestival',cycle:0,points:50};const r=step(state,command);
 assert.deepEqual(collect(state,r),[{kind:'chest',chestType:'c',amount:1}]);assert.deepEqual(collect(r.state,step(r.state,command)),[]);
 state=initial();const mirror=transitionSpark(state,{type:'status'},{uid,now,festivalEnabled:true,ticketEarned:3});assert.deepEqual(collect(state,mirror),[]);
});
test('support/acquisition/fused letter are presentation facts and empty replay has none',()=>{
 const before=initial(),state=structuredClone(before);state.letters.sequence=1;state.letters.last={kind:'fuse',sequence:1,received:'M'};
 const result={state,receipts:[{coins:0,support:{gameId:'memory-match',key:'hint'}},{coins:0,acquisition:{items:['avatar-id']}}]};
 assert.deepEqual(collect(before,result),[{kind:'support',gameId:'memory-match',key:'hint',amount:1},{kind:'item',itemId:'avatar-id',amount:1},{kind:'letter',letter:'M',amount:1}]);
 assert.deepEqual(collect(state,{state,receipts:[]}),[]);
});
test('aggregation is bounded and merges repeated facts without mutating inputs',()=>{
 const a=[{kind:'coins',amount:3}];assert.deepEqual(mergeCommittedRewards(a,[{kind:'coins',amount:4}]),[{kind:'coins',amount:7}]);assert.equal(a[0].amount,3);
 assert.equal(mergeCommittedRewards([],Array.from({length:30},(_,i)=>({kind:'item',itemId:`item-${i}`,amount:1}))).length,12);
});
