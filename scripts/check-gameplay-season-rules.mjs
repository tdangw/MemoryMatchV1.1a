import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc } from 'firebase/firestore';
import { encodeCloudSnapshot } from '../js/cloudSnapshot.js';
import { publishCloudSnapshot, readCloudRoot, readCloudSnapshot } from '../js/cloudStore.js';
import { createProgressResult } from '../js/progressRankingModel.js';
import { submitRankingResult, readLeaderboard, clearLeaderboardCache } from '../js/leaderboardStore.js';

const env = await initializeTestEnvironment({projectId:'demo-memory-match',firestore:{host:'127.0.0.1',port:8180,rules:readFileSync('firestore.rules','utf8')}});
try {
  await env.clearFirestore();
  const database=env.authenticatedContext('season-owner').firestore();
  const stranger=env.authenticatedContext('stranger').firestore();
  for(const base of ['local','test','beta','production']) {
    const space=base+'-waves1';
    const snapshot={snapshotVersion:1,profile:{formatVersion:2,revision:1,data:{coins:30,progress:{gameplaySeason:1},settings:{},appearance:{}}},chapters:[]};
    const encoded=await encodeCloudSnapshot(snapshot);
    await assertSucceeds(publishCloudSnapshot({database,environment:space,uid:'season-owner',encoded,expectedRevision:0,playerName:'Người chơi'}));
    const root=await readCloudRoot(database,space,'season-owner');
    assert.equal((await readCloudSnapshot(database,space,'season-owner',root)).profile.data.progress.gameplaySeason,1);
    assert.equal(await readCloudRoot(database,base,'season-owner'),null);
    await assertFails(getDoc(doc(stranger,`gamespaces/${space}/players/season-owner`)));
    assert.equal((await assertSucceeds(getDoc(doc(database,`gamespaces/${space}/profileStats/season-owner`)))).exists(),false);
    for(const gameId of ['memory-match','link-connect','triple-connect']) for(const family of ['adventure','challenge','endless']) {
      const owner={profileId:'profile-season',uid:'season-owner'};
      const submit=(environment,level)=>submitRankingResult({database,environment,uid:owner.uid,playerName:'Người chơi',result:createProgressResult(gameId,family,level,owner)});
      await assertSucceeds(submit(base,100000));
      await assertSucceeds(submit(space,1));
      clearLeaderboardCache();
      const board=createProgressResult(gameId,family,1,owner);
      const ranking=await readLeaderboard({database,environment:space,board,uid:owner.uid});
      assert.equal(ranking.own.levelReached,1,'Old one-board results cannot enter the new multi-wave ranking.');
    }
  }
  console.log('Four season spaces isolate cloud saves, nine rankings each and private stats from old clients.');
} finally {await env.cleanup();}
