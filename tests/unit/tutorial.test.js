import test from 'node:test';
import assert from 'node:assert/strict';
import {createPractice} from '../../js/tutorial/practiceAdapters.js';
import {normalizeTutorialProgress,hasTutorialPlayEvidence} from '../../js/tutorial/tutorialModel.js';
test('progress accepts only current version and known true flags',()=>{for(const bad of [null,[],{version:2,completed:{'memory-match':true}}])assert.deepEqual(normalizeTutorialProgress(bad),{version:1,completed:{},skipped:{},seen:{}});assert.deepEqual(normalizeTutorialProgress({version:1,completed:{'memory-match':true,'future':true,'link-connect':1},seen:{exp:true,other:true}}),{version:1,completed:{'memory-match':true},skipped:{},seen:{exp:true}});});
test('Memory requires real mismatch, recall and both matching pairs',()=>{const p=createPractice('memory-match');p.next();assert.equal(p.view().step,0);p.select('3');assert.equal(p.view().step,0);p.select('0');p.select('1');assert.equal(p.view().step,2);assert.equal(p.view().done,false);p.select('2');assert.equal(p.view().step,2);p.next();for(const id of ['0','2','1','3'])p.select(id);assert.equal(p.view().done,true);});
test('Link shows one changing target, contextual success, two turns and a blocked attempt',()=>{
 const p=createPractice('link-connect');
 for(const [ids,turns] of [[['0:0','0:2'],0],[['0:0','1:1'],1],[['1:0','1:2'],2]]){
   assert.equal(p.view().targets.length,1);assert.equal(p.view().targets[0],ids[0]);p.select(ids[0]);assert.equal(p.view().targets[0],ids[1]);p.select(ids[1]);assert.equal(p.view().path.length-2,turns);assert.equal(p.view().tiles.filter(t=>t.type).length>=2,true);assert.equal(p.view().phase,'matched');p.next();
 }
 p.select('0:0');p.select('0:1');assert.match(p.view().feedback,/Hai hình khác nhau/);assert.equal(p.view().attempt,null);
 for(const id of ['0:0','2:2'])p.select(id);assert.equal(p.view().step,3);assert.equal(p.view().phase,'blocked');assert.deepEqual(p.view().attempt.blocker,{row:0,column:1});assert.equal(p.view().tiles.filter(t=>t.type).length,6);p.next();
 for(const ids of [['0:1','2:1'],['0:0','2:2']]){for(const id of ids)p.select(id);p.next();}
 assert.equal(p.view().targets.length,0);for(const id of ['1:0','1:2'])p.select(id);assert.equal(p.view().done,true);
});

test('Triple uses production exposure, capacity and removal',()=>{const p=createPractice('triple-connect');assert.equal(p.view().capacity,7);p.select('B0');assert.equal(p.view().tray.length,0);for(const id of ['A0','A1','A2'])p.select(id);assert.equal(p.view().tray.length,0);assert.equal(p.view().tiles.find(t=>t.id==='B0').covered,false);for(const id of ['B0','B1','B2','C0','C1','C2'])p.select(id);assert.equal(p.view().done,true);assert.equal(p.view().tiles.length,0);});
test('independent practice instances cannot advance or mutate each other',()=>{const a=createPractice('memory-match'),b=createPractice('memory-match');a.select('0');assert.equal(b.view().step,0);assert.equal(b.view().tiles[0].faceUp,false);assert.throws(()=>createPractice('unknown'),RangeError);});

test('optional skip preserves v1 completion and normalizes bad flags',()=>{assert.deepEqual(normalizeTutorialProgress({version:1,completed:{'memory-match':true},skipped:{'link-connect':true,'triple-connect':1,other:true}}),{version:1,completed:{'memory-match':true},skipped:{'link-connect':true},seen:{}});});
test('existing per-game play evidence excludes wallet and empty containers',()=>{for(const p of [{},{coins:100},{startedLevels:{'easy:1':false}},{sessionsByMode:{easy:null}}])assert.equal(hasTutorialPlayEvidence(p),false);for(const p of [{totalScore:200},{totalStars:1},{adventure:{unlockedThrough:201}},{startedLevels:{'easy:1':true}},{bestByLevel:{'easy:1':{stars:0}}},{sessionsByMode:{easy:{level:1}}},{runBests:{challenge:{levelReached:1}}}])assert.equal(hasTutorialPlayEvidence(p),true);});
