import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,setDoc,serverTimestamp,getDoc} from 'firebase/firestore';
import {submitRankingResult,readLeaderboard,clearLeaderboardCache,readCachedLeaderboard} from '../js/leaderboardStore.js';
const [host,port]=(process.env.FIRESTORE_EMULATOR_HOST||'127.0.0.1:8380').split(':');
const env=await initializeTestEnvironment({projectId:'demo-memory-match-ranking',firestore:{host,port:Number(port),rules:readFileSync('firestore.rules','utf8')}});
const r=(uid='a',extra={})=>({rulesVersion:4,kind:'adventure',family:'adventure',gameId:'memory-match',mode:'easy',levelReached:10,metricsComplete:true,score:100,moves:30,misses:1,id:crypto.randomUUID(),recordedAt:Date.now(),owner:{profileId:uid,uid},...extra});
const submit=(value,uid=value.owner.uid)=>submitRankingResult({database:env.authenticatedContext(uid).firestore(),environment:'test',uid,playerName:`Người chơi ${uid}`,result:value});
await env.clearFirestore();
try{
 for(const gameId of ['memory-match','link-connect','triple-connect'])for(const mode of ['easy','normal','hard','superHard']){
  const value=r('a',{gameId,mode});await assertSucceeds(submit(value));const db=env.authenticatedContext('a').firestore();
  const first=await readLeaderboard({database:db,environment:'test',board:value,uid:'a'});assert.equal(first.ownRank,1);assert.equal(first.own.score,100);
  assert.equal((await submit({...value,id:crypto.randomUUID()})).writes,0);assert.equal((await submit({...value,score:99})).writes,0);
  clearLeaderboardCache();assert.deepEqual((await readLeaderboard({database:db,environment:'test',board:value,uid:'a'})).own.reachedAt,first.own.reachedAt);
  await Promise.all([submit({...value,id:crypto.randomUUID(),score:120}),submit({...value,id:crypto.randomUUID(),score:110})]);clearLeaderboardCache();assert.equal((await readLeaderboard({database:db,environment:'test',board:value,uid:'a'})).own.score,120);
  assert.equal((await submit({...value,id:crypto.randomUUID(),score:120,misses:0})).writes,1);
  assert.equal((await submit({...value,id:crypto.randomUUID(),score:120,misses:0,moves:29})).writes,1);
 }
 const db=env.authenticatedContext('a').firestore(),board=r();const ref=doc(db,'gamespaces/test/leaderboards/v4_memory-match_adventure_easy/entries/a');
 const current=(await getDoc(ref)).data();
 for(const extra of [{score:-2},{moves:-1},{misses:31},{metricsComplete:false},{gameId:'fake'},{mode:'endless'},{levelReached:0},{secret:'x'},{reachedAt:current.reachedAt}])await assertFails(setDoc(ref,{...current,...extra,score:extra.score??999,reachedAt:extra.reachedAt??serverTimestamp()}));
 await assertFails(setDoc(doc(env.authenticatedContext('stranger').firestore(),ref.path),{...current,score:999,reachedAt:serverTimestamp()}));
 const partial=r('partial',{metricsComplete:false,score:-1,moves:0,misses:0});await submit(partial);await submit({...partial,id:crypto.randomUUID(),metricsComplete:true,score:0});assert.equal((await submit({...partial,id:crypto.randomUUID()})).writes,0);
 for(let i=0;i<23;i++)await submit(r(`p${String(i).padStart(2,'0')}`,{score:1000-i,misses:i%3}));
 clearLeaderboardCache();const seen=[];let exactRank;
 for(let page=1;page<=3;page++){const data=await readLeaderboard({database:env.authenticatedContext('p20').firestore(),environment:'test',board,uid:'p20',page});seen.push(...data.top.map(v=>v.uid));exactRank=data.ownRank;assert(data.reads<=12);}
 assert.equal(new Set(seen).size,25);assert.equal(exactRank,21);assert(readCachedLeaderboard({environment:'test',board,uid:'p20',page:2}));assert.equal(readCachedLeaderboard({environment:'test',board:{...board,mode:'hard'},uid:'p20',page:2}),null);
 console.log('Adventure v4 Rules: twelve boards, comparator tiers, same-level replay, stable ties, concurrency, owner/schema rejection, partial upgrade, pagination, personal rank and separated cache passed.');
}finally{await env.cleanup();}
