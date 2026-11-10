import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initializeTestEnvironment,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,serverTimestamp} from 'firebase/firestore';
import {publishCloudSnapshot,readCloudSnapshot} from '../js/cloudStore.js';
import {encodeCloudSnapshot,fingerprintCloudManifest} from '../js/cloudSnapshot.js';
import {normalizeSparkSave,initialSparkState} from '../js/liveops/sparkModel.js';
const [host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(':');
const env=await initializeTestEnvironment({projectId:'demo-local-first-backup',firestore:{host,port:Number(port),rules:fs.readFileSync('firestore.rules','utf8')}});
const uid='snapshot-owner',environment='local-waves1',db=env.authenticatedContext(uid).firestore();
try{
 await env.withSecurityRulesDisabled(async c=>{
  await setDoc(doc(c.firestore(),'gamespaces',environment,'liveops',uid),{version:1,revision:113});
  await setDoc(doc(c.firestore(),'gamespaces',environment,'players',uid),{snapshotVersion:1,formatVersion:2,revision:622,rewardRevision:113,economyRevision:530,manifest:{profile:['a'.repeat(64)]},fingerprint:await fingerprintCloudManifest({profile:['a'.repeat(64)]}),byteLength:1,playerName:'Người chơi',updatedAt:serverTimestamp()});
 });
 const saved={snapshotVersion:1,profile:{formatVersion:2,revision:1,data:{coins:777,appearance:{spark:{...normalizeSparkSave(),ownerUid:uid,syncPolicy:'snapshot-v1',economyRevision:530,state:{...initialSparkState(Date.now()),revision:700}}},progress:{memoryMatch:{specialProgress:7}},settings:{}}},chapters:[]};
 const encoded=await encodeCloudSnapshot(saved);
 const result=await publishCloudSnapshot({database:db,environment,uid,encoded,expectedRevision:622,playerName:'Người chơi',economyRevision:530,snapshotRewards:true,rewardRevision:113});
 assert.equal(result.root.rewardRevision,113);
 // Existing accounts retain their old online reward watermark; they do not replay local grants.
 await env.withSecurityRulesDisabled(async c=>{await setDoc(doc(c.firestore(),'gamespaces',environment,'players',uid),{...result.root,rewardRevision:113,updatedAt:serverTimestamp()});});
 saved.profile.data.coins=999;saved.profile.data.appearance.spark.state.revision=900;
 const updated=await publishCloudSnapshot({database:db,environment,uid,encoded:await encodeCloudSnapshot(saved),expectedRevision:result.root.revision,playerName:'Người chơi',economyRevision:531,snapshotRewards:true});
 assert.equal(updated.root.rewardRevision,113);
 const restored=await readCloudSnapshot(db,environment,uid,updated.root);
 assert.equal(restored.profile.data.coins,999);assert.equal(restored.profile.data.appearance.spark.state.revision,900);assert.equal(restored.profile.data.progress.memoryMatch.specialProgress,7);
 await assert.rejects(publishCloudSnapshot({database:db,environment,uid,encoded,expectedRevision:1,playerName:'Người chơi',economyRevision:531,snapshotRewards:true}));
 await assertFails(setDoc(doc(db,'gamespaces',environment,'players','another-owner'),updated.root));
 console.log('Snapshot reward backup/restore, old online watermark, stale CAS and private owner pass.');
}finally{await env.cleanup();}
