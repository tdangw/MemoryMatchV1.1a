import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdventureRecord,validateAdventureRecord,keepAdventureRecord,compareAdventureRecords,normalizeAdventureBests,migrateAdventureBests,mergeAdventureBests} from '../../js/adventureRankingModel.js';
import {createWaveProgress,completeWave,activateNextWave} from '../../js/progression/waveProgress.js';
const owner={profileId:'profile-a',uid:'user-a'};
function make({gameId='memory-match',mode='easy',level=1,score=100,moves=20,misses=2}={}){
 let wave=createWaveProgress({attemptId:crypto.randomUUID(),gameId,mode,level,groupsPerWave:6});
 for(let i=1;i<=wave.count;i++){wave=completeWave(wave,{score:score*i,moves:moves*i,misses:misses*i,matchedGroups:6}).progress;if(wave.phase==='advance')wave=activateNextWave(wave);}
 return createAdventureRecord({gameId,mode,level,score:wave.completedScore+10,wave,owner});
}
test('all twelve boards capture one complete multi-wave tuple and reject partial wins',()=>{
 for(const gameId of ['memory-match','link-connect','triple-connect'])for(const mode of ['easy','normal','hard','superHard']){
  const r=make({gameId,mode});assert(validateAdventureRecord(r));assert.equal(r.score,210);assert.equal(r.moves,40);assert.equal(r.misses,4);
  const wave=createWaveProgress({attemptId:crypto.randomUUID(),gameId,mode,level:1,groupsPerWave:6});
  assert.throws(()=>createAdventureRecord({gameId,mode,level:1,score:999,wave,owner}));
 }
});
test('comparator prioritizes level, then score, fewer misses and fewer moves; ties retain identity',()=>{
 const r=make();const candidates=[{...r,levelReached:2,score:0},{...r,score:r.score+1,misses:50,moves:100},{...r,misses:1},{...r,moves:r.moves-1}];
 for(const n of candidates){assert(compareAdventureRecords(n,r)<0);assert.equal(keepAdventureRecord(r,n),n);assert.equal(keepAdventureRecord(n,r),n);}
 assert.equal(keepAdventureRecord(r,{...r,id:crypto.randomUUID(),recordedAt:r.recordedAt+1}),r);
 assert.throws(()=>keepAdventureRecord(r,make({mode:'hard'})));
 for(const bad of [{score:-1},{misses:-1},{moves:Infinity},{misses:99},{metricsComplete:false},{owner:null},{mode:'endless'},{levelReached:0}])assert.equal(validateAdventureRecord({...r,...bad}),false);
});
test('old certified levels migrate by difficulty without invented metrics or repeated identity changes',()=>{
 const record={cleared:true,rulesVersion:1,completedWaves:2,score:999,stars:3};
 const records={'easy:1':record,'hard:3':{...record,completedWaves:3},'normal:2':{...record,completedWaves:1},'superHard:1':{...record,rankingResult:{owner:{profileId:'other',uid:'other'}}}};
 const profile={id:owner.profileId,uid:owner.uid,firstUid:owner.uid};
 const bests=migrateAdventureBests({},records,'memory-match',owner,profile);assert.deepEqual(Object.keys(bests),['easy']);assert.equal(bests.easy.metricsComplete,false);assert.equal(bests.easy.score,-1);
 assert.deepEqual(migrateAdventureBests(bests,records,'memory-match',owner,profile),bests);
 const full=make({score:0,misses:0});assert.equal(keepAdventureRecord(bests.easy,full),full);assert.equal(keepAdventureRecord(full,bests.easy),full);
 assert.deepEqual(normalizeAdventureBests({easy:{...full,mode:'hard'}},'memory-match'),{});
});
test('durable best survives stale writes for same owner without mixing different accounts',()=>{
 const full=make(),worse=make({score:1});
 assert.equal(mergeAdventureBests({easy:worse},{easy:full},'memory-match').easy.score,full.score);
 assert.equal(mergeAdventureBests({easy:{...full,id:crypto.randomUUID()}},{easy:full},'memory-match').easy.id,full.id);
 const stranger={...worse,owner:{profileId:'other',uid:'other'}};
 assert.deepEqual(mergeAdventureBests({easy:stranger},{easy:full},'memory-match').easy,stranger);
 assert.deepEqual(mergeAdventureBests({}, {easy:full}, 'memory-match', stranger.owner), {});
});
