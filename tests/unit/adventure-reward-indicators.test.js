import test from 'node:test';
import assert from 'node:assert/strict';
import { adventureRewardReadiness, mountAdventureRewardIndicators } from '../../js/adventureRewardIndicators.js';
import { initialSparkState } from '../../js/liveops/sparkModel.js';
import { DAY_MS, DAILY, WEEKLY } from '../../js/liveops/model.js';
import { LETTER_SETS } from '../../js/liveops/config.js';
import { publishRewardPeriod, subscribeRewardPeriod } from '../../js/liveops/rewardPeriodViewState.js';

const now = Date.UTC(2026,9,31,12), uid = 'reward-owner';
const sample = () => {
  const state = initialSparkState(now); state.loginDay = state.day; state.spins.free = { source:'free' };
  return { spark:{ ownerUid:uid,state },uid,period:{ uid,day:state.day },online:true,enabled:true,festivalEnabled:true,block:1 };
};
const ready = input => adventureRewardReadiness(input);

test('missions advertise only current unclaimed login, daily reward, or whole weekly bonus', () => {
  const input = sample(), state = input.spark.state;
  assert.equal(ready(input).missions,false);
  state.loginDay--; assert.equal(ready(input).missions,true); state.loginDay++;
  state.daily.matches = 30; assert.equal(ready(input).missions,true);
  state.daily.claimed.push('match-thirty'); assert.equal(ready(input).missions,false);
  state.weekly.wins = 12; assert.equal(ready(input).missions,false);
  for (const mission of WEEKLY) state.weekly[mission.key] = mission.target;
  assert.equal(ready(input).missions,true); state.weekly.claimed.push('bonus'); assert.equal(ready(input).missions,false);
  // The separate daily chest is available after completing all missions.
  for (const mission of DAILY) { state.daily[mission.key] = mission.target; state.daily.claimed.push(mission.id); }
  assert.equal(ready(input).missions,true);state.daily.claimed.push('bonus');
  assert.equal(ready(input).missions,false);
});

test('events recognize free spin, tickets, complete letter recipes and each unclaimed festival threshold', () => {
  const input = sample(), state = input.spark.state;
  assert.equal(ready(input).events,false);
  state.spins.free = null; assert.equal(ready(input).events,true); state.spins.free = {};
  state.tickets = 1; assert.equal(ready(input).events,true); state.tickets = 0;
  state.pendingWheel = { operation:'held-support' }; input.period=null;
  assert.equal(ready(input).events,true,'a held wheel gift remains visible without a daily clock');
  state.pendingWheel = null; input.period={uid,day:state.day};
  assert.equal(ready(input).events,false);
  state.letters.counts = { M:99 }; assert.equal(ready(input).events,false, 'sale/fusion and advertisements are optional actions');
  for (const recipe of LETTER_SETS) {
    state.letters.counts = { ...recipe.required }; assert.equal(ready(input).events,true);
    const first = Object.keys(recipe.required)[0]; state.letters.counts[first]--; assert.equal(ready(input).events,false);
  }
  state.letters.counts = {};
  state.festival = { earnedTotal:24,completedCycles:0,mask:0 }; assert.equal(ready(input).events,false);
  for (const [points,mask] of [[25,0],[50,1],[75,3],[100,7]]) {
    state.festival = { earnedTotal:points,completedCycles:0,mask }; assert.equal(ready(input).events,true);
    state.festival.mask |= (1 << ([25,50,75,100].indexOf(points))); assert.equal(ready(input).events,false);
  }
  state.festival = { earnedTotal:124,completedCycles:1,mask:0 }; assert.equal(ready(input).events,false);
  state.festival.earnedTotal++; assert.equal(ready(input).events,true);
  input.festivalEnabled = false; assert.equal(ready(input).events,false);
});

test('remote dots fail closed for offline, owner mismatch, stale or untrusted day/week and disabled feature', () => {
  for (const alter of [input => { input.online=false; },input => { input.enabled=false; },input => { input.uid='other'; },input => { input.spark.ownerUid='other'; },input => { input.current=false; }]) {
    const input = sample(); input.spark.state.loginDay--; input.spark.state.tickets = 1; alter(input);
    assert.equal(ready(input).missions,false); assert.equal(ready(input).events,false);
  }
  const input = sample(); input.spark.state.day = Math.floor((now+DAY_MS)/DAY_MS); assert.equal(ready(input).events,false);
});

test('durable event rewards survive an unknown or expired clock while free/login/missions remain period guarded', () => {
  const input=sample(), state=input.spark.state;
  state.spins.free=null; state.loginDay--; state.daily.matches=30;
  input.period=null;
  assert.equal(ready(input).events,false); assert.equal(ready(input).missions,false);
  state.tickets=1; assert.equal(ready(input).events,true); state.tickets=0;
  state.letters.counts={...LETTER_SETS[0].required}; assert.equal(ready(input).events,true); state.letters.counts={};
  state.festival={earnedTotal:25,completedCycles:0,mask:0}; assert.equal(ready(input).events,true); state.festival.mask=1;
  assert.equal(ready(input).events,false);
  input.period={uid,day:state.day}; assert.equal(ready(input).events,true); assert.equal(ready(input).missions,true);
  input.period.day++; assert.equal(ready(input).events,false); assert.equal(ready(input).missions,false);
  state.tickets=1; assert.equal(ready(input).events,true);
  input.period={uid,day:state.day}; state.week--; assert.equal(ready(input).missions,false);
});

test('a period confirmation with no save commit refreshes current owners and unsubscribes cleanly', () => {
  const input=sample(); input.spark.state.spins.free=null; input.period=null;
  const controls={missions:new Node(),events:new Node()},owner=ownerFixture();
  mountAdventureRewardIndicators({ controls,owner,read:()=>input,subscribePeriod:subscribeRewardPeriod,
    eventTarget:{},documentTarget:{ createElement:()=>new Node() } });
  assert.equal(controls.events.dataset.rewardReady,'false');
  input.period={uid,day:input.spark.state.day}; publishRewardPeriod(); assert.equal(controls.events.dataset.rewardReady,'true');
  input.period=null; publishRewardPeriod(); assert.equal(controls.events.dataset.rewardReady,'false');
  owner.dispose(); publishRewardPeriod(); assert.equal(controls.events.children.length,0);
});

test('treasure and collection use certified readiness for the exact viewed block, not unread cosmetics; collection also recognizes owned unopened inventory', () => {
  const input = sample(); input.online = false; input.spark.state.chests = { earned:{ avatar:20 },spent:{ avatar:0 } };
  assert.equal(ready(input).treasure,false); assert.equal(ready(input).collection,false);
  input.online=true; assert.equal(ready(input).collection,true); assert.equal(ready(input).treasure,false);
  input.spark.ownerUid='other'; assert.equal(ready(input).collection,false); input.spark.ownerUid=uid;
  input.spark.state.chests.spent.avatar=20; assert.equal(ready(input).collection,false);
  input.completed = {};
  for (let level=1; level<=10; level++) input.completed[`easy:${level}`] = { cleared:true,rulesVersion:1 };
  assert.equal(ready(input).treasure,true); assert.equal(ready(input).collection,false);
  input.claim = { rulesVersion:1,tiers:{ C:{} } }; assert.equal(ready(input).treasure,false);
  for (const mode of ['normal','hard','superHard']) for (let level=1; level<=10; level++) input.completed[`${mode}:${level}`] = { cleared:true,rulesVersion:1 };
  assert.equal(ready(input).collection,true); assert.equal(ready(input).treasure,true);
  input.claim = { rulesVersion:1,tiers:{ C:{},B:{},A:{},S:{} },collection:{} };
  assert.equal(ready(input).collection,false); assert.equal(ready(input).treasure,false);
  input.claim = {}; input.block=2; assert.equal(ready(input).treasure,false); assert.equal(ready(input).collection,false);
  input.block=1; input.completed['easy:1'].rulesVersion=0;
  assert.equal(ready(input).treasure,false); assert.equal(ready(input).collection,false);
});

class Node {
  constructor() { this.children=[]; this.dataset={}; this.attributes={}; this.parentNode=null; }
  setAttribute(key,value) { this.attributes[key]=value; }
  getAttribute(key) { return this.attributes[key]; }
  removeAttribute(key) { delete this.attributes[key]; }
  append(node) { node.remove(); this.children.push(node); node.parentNode=this; }
  remove() { if (this.parentNode) this.parentNode.children=this.parentNode.children.filter(node=>node!==this); this.parentNode=null; }
}
const ownerFixture = () => {
  const disposers=[], events=[]; let tick;
  return { active:true,own(fn) { disposers.push(fn); },listen(target,event,fn) { events.push([event,fn]); },interval(fn) { tick=fn; },
    tick:() => tick(),event:name => events.filter(([key])=>key===name).forEach(([,fn])=>fn()),
    dispose() { this.active=false; disposers.reverse().forEach(fn=>fn()); } };
};
test('mount refreshes after commit, account/visibility/period changes, reattaches treasure dot and cleans subscriptions', () => {
  for (let cycle=0; cycle<20; cycle++) {
    const controls=Object.fromEntries(['missions','events','treasure','collection'].map(key=>[key,new Node()]));
    for (const [name,node] of Object.entries(controls)) node.setAttribute('aria-label',name);
    const owner=ownerFixture(), input=sample(); let commit,account,unsubscribed=0;
    const refresh=mountAdventureRewardIndicators({ controls,owner,read:() => input,
      subscribeCommit:fn => { commit=fn; return () => unsubscribed++; },subscribeAccount:fn => { account=fn; return () => unsubscribed++; },
      eventTarget:{},documentTarget:{ createElement:() => new Node() } });
    assert.equal(controls.events.dataset.rewardReady,'false');
    input.spark.state.tickets=1; commit({ patch:{ appearance:{} } }); assert.equal(controls.events.dataset.rewardReady,'true');
    refresh(); assert.equal(controls.events.getAttribute('aria-label'),'events'); assert.equal(controls.events.getAttribute('aria-description'),'Có quà chưa nhận');
    controls.treasure.children[0].remove(); refresh(); assert.equal(controls.treasure.children.length,1);
    input.period=null; owner.tick(); assert.equal(controls.events.dataset.rewardReady,'true');
    input.period={ uid,day:input.spark.state.day }; account(); assert.equal(controls.events.dataset.rewardReady,'true');
    input.online=false; owner.event('offline'); assert.equal(controls.events.dataset.rewardReady,'false');
    input.online=true; owner.event('visibilitychange');owner.event('appvisibilitychange'); assert.equal(controls.events.dataset.rewardReady,'true');
    commit({ patch:{ restored:true } }); assert.equal(controls.events.dataset.rewardReady,'false');
    input.spark.state.tickets=2; refresh(); assert.equal(controls.events.dataset.rewardReady,'false');
    owner.dispose(); refresh(); assert.equal(unsubscribed,2); assert.equal(controls.events.children.length,0);
  }
});


test('achievement shortcut ignores unopened inventory while collection retains its chest indicator', () => {
  const input=sample();
  input.spark.state.chests={earned:{c:1,avatar:0,frame:0,badge:0},spent:{c:0,avatar:0,frame:0,badge:0}};
  assert.equal(ready(input).collection,true);
  assert.equal(ready({...input,collectionIncludesChests:false}).collection,false);
});
