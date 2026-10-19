import test from 'node:test';
import assert from 'node:assert/strict';
import { projectJourneyTreasure, nextTreasureLevel } from '../../js/progression/treasureProjection.js';
const modes=['easy','normal','hard','superHard'];
const clear={cleared:true,rulesVersion:1,score:100,stars:1};
function records(count, first=1) {return Object.fromEntries(modes.flatMap(mode=>Array.from({length:count},(_,i)=>[`${mode}:${first+i}`,{...clear}])));}

test('all four chest projections retain actual EXP at every milestone and after claiming',()=>{
  for(const count of [0,1,7,9,10]) {
    const completed=records(count);const original=structuredClone(completed);
    const view=projectJourneyTreasure({completed,block:1});
    for(const [i,chest] of view.chests.entries()) {
      assert.equal(chest.exp,count*10);assert.equal(chest.completedLevels,count);
      assert.equal(chest.state,count<10?'progress':i===0?'ready':'waiting');
      assert.equal(chest.reward.coins,[30,60,100,160][i]);assert.equal(chest.reward.hints,i+1);
    }
    assert.deepEqual(completed,original);
  }
  const completed=records(10),tiers={};
  for(const tier of ['C','B','A','S']) {
    tiers[tier]={claimedAt:1};const view=projectJourneyTreasure({completed,block:1,claim:{rulesVersion:1,tiers}});
    assert.equal(view.chests.find(c=>c.tier===tier).state,'claimed');
    assert(view.chests.every(c=>c.exp===100));
  }
  const done=projectJourneyTreasure({completed,block:1,claim:{rulesVersion:1,tiers}});
  assert.equal(done.allClaimed,true);assert.equal(done.activeTier,null);
});
test('blocks, independent sources, special/legacy exclusions and next preview prerequisites',()=>{
  for(const level of [10,11,100,101]) {
    const block=Math.ceil(level/10);const completed=records(1,(block-1)*10+1);
    assert.equal(projectJourneyTreasure({completed,block}).chests[0].exp,10);
    assert.equal(projectJourneyTreasure({completed:{},block}).chests[0].exp,0);
  }
  const completed={'challenge:1':clear,'endless:1':clear,'easy:1':{cleared:true},'normal:1':{cleared:false,rulesVersion:1}};
  assert(projectJourneyTreasure({completed,block:1}).chests.every(c=>c.exp===0));
  assert.deepEqual(nextTreasureLevel({completed:{},block:1,tier:'S'}),{level:1,mode:'easy'});
  assert.deepEqual(nextTreasureLevel({completed:{'easy:1':clear},block:1,tier:'C'}),{level:2,mode:'easy'});
  assert.deepEqual(nextTreasureLevel({completed:records(10),block:1,tier:'C'}),null);
  const high=Object.fromEntries(modes.slice(1).flatMap(mode=>Array.from({length:10},(_,i)=>[`${mode}:${i+1}`,clear])));
  const view=projectJourneyTreasure({completed:high,block:1});
  assert.deepEqual(view.chests.map(c=>c.exp),[0,100,100,100]);
  assert(view.chests.slice(1).every(c=>c.state==='waiting'&&c.previousName==='Rương Mầm Non'));
});
