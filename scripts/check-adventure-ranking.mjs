import assert from 'node:assert/strict';
import {indexedDB,IDBKeyRange,IDBObjectStore} from 'fake-indexeddb';
import {gameState,hydrateGameState,recordMemoryMatchResult,recordLinkConnectResult,recordTripleConnectResult} from '../js/gameState.js';
import {setRankingOwner} from '../js/rankingOwner.js';
import {createWaveProgress,completeWave,activateNextWave} from '../js/progression/waveProgress.js';
import {createProgressResult} from '../js/progressRankingModel.js';
import {rankingBoardId,collectProgressRankingResults} from '../js/rankingResult.js';
import {normalizeLevelRankingQueue,adoptLevelRankingQueue} from '../js/leaderboardService.js';
import {openChapterDatabase,ensureChapterProfileOwner,writeChapterProfile,readChapterProfile,migrateChapterLevelRankings,exportChapterSnapshot,replaceChapterSnapshot,readChapter} from '../js/chapterStore.js';
globalThis.indexedDB=indexedDB;globalThis.IDBKeyRange=IDBKeyRange;
const owner={profileId:'fixture',uid:null};setRankingOwner({id:owner.profileId,uid:owner.uid});
function win(gameId,mode,score=100,misses=0){let wave=createWaveProgress({gameId,mode,level:1,groupsPerWave:6,attemptId:crypto.randomUUID()});for(let i=1;i<=wave.count;i++){wave=completeWave(wave,{score:score*i,moves:20*i,misses:misses*i,matchedGroups:6}).progress;if(wave.phase==='advance')wave=activateNextWave(wave);}return {mode,level:1,score:wave.completedScore+10,stars:3,wave};}
for(const [key,gameId,record] of [['memoryMatch','memory-match',recordMemoryMatchResult],['linkConnect','link-connect',recordLinkConnectResult],['tripleConnect','triple-connect',recordTripleConnectResult]])for(const mode of ['easy','normal','hard','superHard']){
 const result=win(gameId,mode);record(result);const best=gameState.progress[key].adventureBestsV4[mode];assert.equal(best.score,210);assert.equal(best.moves,40);assert.equal(best.misses,0);
 assert.throws(()=>record(result),/already settled/);record(win(gameId,mode,1));assert.equal(gameState.progress[key].adventureBestsV4[mode].id,best.id);
}
const payload={coins:99,progress:structuredClone(gameState.progress),appearance:{},settings:{}};
hydrateGameState(structuredClone(payload));assert.equal(collectProgressRankingResults(gameState.progress).filter(r=>r.kind==='adventure').length,12);
const db=await openChapterDatabase(),profile=await ensureChapterProfileOwner(db);
// This fixture owns the data before running the same durable chapter writer as gameplay.
const metadata=db.transaction('metadata','readwrite');metadata.objectStore('metadata').put({id:owner.profileId,uid:null},'profile-owner');await new Promise((r,j)=>{metadata.oncomplete=r;metadata.onerror=j;});
let envelope=await writeChapterProfile(db,{formatVersion:2,revision:1,data:payload},0);
const snapshot=await exportChapterSnapshot(db);
const stale=structuredClone(envelope);stale.revision=2;delete stale.data.progress.memoryMatch.adventureBestsV4;
envelope=await writeChapterProfile(db,stale,1);assert.equal(envelope.data.progress.memoryMatch.adventureBestsV4.easy.score,210);
const archived=await readChapter(db,'memoryMatch',1);assert.equal(archived.bestByLevel['easy:1'].adventureRecord.score,210);
let migration=await migrateChapterLevelRankings(db,owner,envelope.revision,()=>true,1);while(!migration.complete)migration=await migrateChapterLevelRankings(db,owner,migration.envelope.revision,()=>true,1);
assert.equal(migration.envelope.data.progress.memoryMatch.adventureBestsV4.easy.metricsComplete,true);
assert.equal((await migrateChapterLevelRankings(db,owner,migration.envelope.revision)).envelope.revision,migration.envelope.revision);
const before=await readChapterProfile(db),put=IDBObjectStore.prototype.put;
try{IDBObjectStore.prototype.put=function(...args){if(this.name==='profile')throw new DOMException('Quota','QuotaExceededError');return put.apply(this,args);};const changed=structuredClone(before);changed.revision++;await assert.rejects(writeChapterProfile(db,changed,before.revision));}finally{IDBObjectStore.prototype.put=put;}
assert.equal((await readChapterProfile(db)).revision,before.revision);
const queue={};for(const result of collectProgressRankingResults(payload.progress))queue[`${owner.profileId}:${rankingBoardId(result)}`]=result;
for(const gameId of ['memory-match','link-connect','triple-connect'])for(const family of ['challenge','endless']){const r=createProgressResult(gameId,family,1,owner);queue[`${owner.profileId}:${rankingBoardId(r)}`]=r;}
assert.equal(Object.keys(normalizeLevelRankingQueue({queue},owner).queue).length,21);
const adopted=adoptLevelRankingQueue({queue},{},{uid:'account-a',firstUid:'account-a',profileId:owner.profileId});assert.equal(Object.keys(adopted[1].queue).length,21);assert.equal(Object.keys(adopted[0].queue).length,0);
const foreign=adoptLevelRankingQueue({queue},{},{uid:'other',firstUid:'account-a',profileId:owner.profileId});assert.equal(Object.keys(foreign[1].queue).length,0);
// Same-account cloud replacement keeps the durable best summary; another account cannot inherit it.
const bound=structuredClone(before);for(const g of ['memoryMatch','linkConnect','tripleConnect'])for(const r of Object.values(bound.data.progress[g].adventureBestsV4))r.owner.uid='account-a';bound.revision=before.revision+1;envelope=await writeChapterProfile(db,bound,before.revision);
const lower=structuredClone(snapshot);lower.profile.revision=envelope.revision+1;for(const g of ['memoryMatch','linkConnect','tripleConnect'])delete lower.profile.data.progress[g].adventureBestsV4;
await replaceChapterSnapshot(db,lower,lower.profile,envelope.revision,'cloud:test',{uid:'account-a',profileId:owner.profileId});assert.equal((await readChapterProfile(db)).data.progress.memoryMatch.adventureBestsV4.easy.score,210);
db.close();console.log('Adventure v4: 12 settlement boards, coherent replay bests, reload, bounded migration, stale writes, atomic rollback, 21-board queue/adoption and same-account restore passed.');
