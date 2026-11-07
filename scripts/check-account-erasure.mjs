import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDocFromServer, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ACCOUNT_SPACES, startAccountOperation, eraseAccountData, readAccountOperation } from '../js/accountDataOperations.js';
const env = await initializeTestEnvironment({ projectId: 'demo-memory-match', firestore: { host: '127.0.0.1', port: 8180, rules: readFileSync('firestore.rules','utf8') } });
await env.clearFirestore();
try {
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    for (const space of ACCOUNT_SPACES) {
      for (const uid of ['erase-owner','other']) {
        for (const name of ['players','profileStats','publicCosmetics','liveops']) await setDoc(doc(db,'gamespaces',space,name,uid), { sample: true });
        await setDoc(doc(db,'gamespaces',space,'players',uid,'objects','orphan'), { sample: true });
        await setDoc(doc(db,'gamespaces',space,'leaderboards','legacy-board','entries',uid), { playerName: uid });
      }
    }
    for (let index=0;index<105;index++) {
      await setDoc(doc(db,'gamespaces','test','players','erase-owner','objects',`staged-${index}`),{sample:true});
      await setDoc(doc(db,'gamespaces','test','leaderboards',`public-${index}`,'entries','other'),{playerName:'Other'});
    }
  });
  const db = env.authenticatedContext('erase-owner').firestore();
  const other = env.authenticatedContext('other').firestore();
  await assertFails(setDoc(doc(other,'accountOperations','erase-owner'), {kind:'delete',space:'test',phase:'erasing',cursor:'',createdAt:serverTimestamp()}));
  await assertSucceeds(startAccountOperation(db,{uid:'erase-owner',kind:'reset',space:'test'}));
  await assertFails(setDoc(doc(db,'gamespaces','test','publicCosmetics','erase-owner'), {version:1,avatar:null,frame:null,badge:null,updatedAt:serverTimestamp()}));
  let checks=0;
  await assert.rejects(eraseAccountData(db,'erase-owner',{kind:'reset',space:'test'},()=>++checks<2),/Tài khoản đã thay đổi/);
  assert.equal((await readAccountOperation(db,'erase-owner')).phase,'erasing');
  await assertSucceeds(eraseAccountData(db,'erase-owner',{kind:'reset',space:'test'},()=>true));
  await env.withSecurityRulesDisabled(async c => {
    assert.equal((await getDocFromServer(doc(c.firestore(),'gamespaces','test','players','erase-owner'))).exists(),false);
    assert.equal((await getDocFromServer(doc(c.firestore(),'gamespaces','beta','players','erase-owner'))).exists(),true);
    assert.equal((await getDocFromServer(doc(c.firestore(),'gamespaces','test','players','other'))).exists(),true);
  });
  await updateDoc(doc(db,'accountOperations','erase-owner'),{phase:'reset-complete'});
  await startAccountOperation(db,{uid:'erase-owner',kind:'delete',space:'test'});
  const operation = await readAccountOperation(db,'erase-owner');
  await eraseAccountData(db,'erase-owner',operation,()=>true);
  await eraseAccountData(db,'erase-owner', await readAccountOperation(db,'erase-owner'),()=>true);
  await updateDoc(doc(db,'accountOperations','erase-owner'),{phase:'deleted'});
  await assertFails(startAccountOperation(db,{uid:'erase-owner',kind:'reset',space:'test'}));
  await env.withSecurityRulesDisabled(async c => {
    const data = c.firestore();
    for (const space of ACCOUNT_SPACES) {
      for (const path of [['players','erase-owner'],['players','erase-owner','objects','orphan'],['leaderboards','legacy-board','entries','erase-owner'],['profileStats','erase-owner'],['publicCosmetics','erase-owner'],['liveops','erase-owner']]) assert.equal((await getDocFromServer(doc(data,'gamespaces',space,...path))).exists(),false);
      assert.equal((await getDocFromServer(doc(data,'gamespaces',space,'players','other'))).exists(),true);
    }
  });
  console.log('Account reset/deletion rules, namespace scope, orphan cleanup, retry and ownership passed.');
} finally { await env.cleanup(); }
