import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { gameplaySeasonReset, gameplaySpace } from '../../js/progression/gameplaySeason.js';
import { getFirebaseEnvironment } from '../../js/firebaseEnvironment.js';
import { highestOwnedAdventureLevel } from '../../js/progressRankingModel.js';
import { CHAPTER_DATABASE, openChapterDatabase, writeChapterProfile, readChapterProfile, resetChapterProfile, readChapter, readChapterMetadata, writeChapterMetadata } from '../../js/chapterStore.js';

test('season reset is explicit, idempotent, preserves preferences and refuses unknown versions', () => {
  const old = { coins:999, appearance:{ownedThemes:['a']}, progress:{memoryMatch:{totalScore:100}}, settings:{sound:false} };
  const next = gameplaySeasonReset(old);
  assert.deepEqual(next,{coins:0,appearance:{},progress:{gameplaySeason:1},settings:{sound:false}});
  assert.equal(old.coins,999);
  assert.equal(gameplaySeasonReset(next),null);
  for (const version of [0,2,'1',null]) assert.throws(() => gameplaySeasonReset({progress:{gameplaySeason:version}}));
  for(const base of ['local','test','beta','production']) assert.equal(gameplaySpace(base),base+'-waves1');
  assert.equal(getFirebaseEnvironment('localhost',{}),'local-waves1');
  assert.equal(getFirebaseEnvironment('memorymatchv1-1b.web.app',{}),'beta-waves1');
  assert.equal(getFirebaseEnvironment('memorymatch-test.web.app',{}),'test-waves1');
  assert.equal(getFirebaseEnvironment('anything.test',{MODE:'android'}),'production-waves1');
  const owner={profileId:'p',uid:'a'}, profileOwner={id:'p',uid:'a',firstUid:'a'};
  const records={'easy:100000':{score:100,stars:3,cleared:true},'easy:2':{score:100,stars:1,cleared:true,rulesVersion:1,completedWaves:2}};
  assert.equal(highestOwnedAdventureLevel(records,owner,profileOwner,{certifiedOnly:true}),2);
  assert.equal(highestOwnedAdventureLevel(records,owner,profileOwner),100000,'Legacy API remains explicit and isolated.');
});

test('reset clears chapters and sync metadata atomically, and old clients cannot reopen the upgraded database', async () => {
  globalThis.indexedDB = new IDBFactory();
  const old = await new Promise((resolve,reject) => {
    const request=indexedDB.open(CHAPTER_DATABASE,2);
    request.onupgradeneeded=()=>{ for(const store of ['profile','chapters','metadata','backups']) request.result.createObjectStore(store); };
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
  old.close();
  const db=await openChapterDatabase();
  try {
    await writeChapterProfile(db,{formatVersion:2,revision:1,data:{coins:100,appearance:{},settings:{},progress:{memoryMatch:{bestByLevel:{'easy:1':{score:100,stars:2}}}}}},0);
    await writeChapterMetadata(db,'cloud:old',{queue:['old']});
    const envelope={formatVersion:2,revision:2,data:gameplaySeasonReset((await readChapterProfile(db)).data)};
    await assert.rejects(resetChapterProfile(db,envelope,0,{clearAuxiliary:true}));
    assert.equal((await readChapterProfile(db)).data.coins,100);
    await resetChapterProfile(db,envelope,1,{clearAuxiliary:true});
    assert.equal((await readChapterProfile(db)).data.progress.gameplaySeason,1);
    assert.deepEqual((await readChapter(db,'memoryMatch',1)).bestByLevel,{});
    assert.equal(await readChapterMetadata(db,'cloud:old'),undefined);
    await assert.rejects(new Promise((resolve,reject)=>{const request=indexedDB.open(CHAPTER_DATABASE,2);request.onerror=()=>reject(request.error);request.onsuccess=()=>{request.result.close();resolve();};}),{name:'VersionError'});
  } finally {db.close();}
});

test('startup resets once before hydration, then rejects importing a previous-season backup', async () => {
  globalThis.indexedDB = new IDBFactory();
  const values = new Map([['memoryMatchSave', JSON.stringify({formatVersion:1,revision:1,data:{coins:999,appearance:{},settings:{sound:false},progress:{memoryMatch:{bestByLevel:{'easy:1':{score:10,stars:1}}}}}})]]);
  globalThis.localStorage = {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  const persistence = await import('../../js/persistence.js');
  assert.equal((await persistence.loadPersistentGameData()).coins,999);
  assert.equal(await persistence.ensureGameplaySeason(),true);
  const reset = await persistence.loadPersistentGameData();
  assert.equal(reset.coins,0);assert.equal(reset.progress.gameplaySeason,1);assert.equal(reset.settings.sound,false);
  assert.equal(await persistence.savePersistentGameData({coins:75}),true);
  const revision = persistence.getPersistenceStatus().revision;
  assert.equal(await persistence.ensureGameplaySeason(),true);
  assert.equal(persistence.getPersistenceStatus().revision,revision);
  assert.equal((await persistence.loadPersistentGameData()).coins,75);
  await assert.rejects(persistence.importPersistentSnapshot({snapshotVersion:1,profile:{formatVersion:2,data:{coins:999,appearance:{},settings:{},progress:{}}},chapters:[]},'local-waves1',{}));
  assert.equal((await persistence.loadPersistentGameData()).coins,75);
  assert.equal(await persistence.clearPersistentGameData(),true);
  assert.equal((await persistence.loadPersistentGameData()).progress.gameplaySeason,1);
  const resetRevision = persistence.getPersistenceStatus().revision;
  assert.equal(await persistence.ensureGameplaySeason(),true);
  assert.equal(persistence.getPersistenceStatus().revision,resetRevision);
});
