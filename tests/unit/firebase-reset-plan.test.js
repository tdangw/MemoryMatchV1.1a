import test from 'node:test';
import assert from 'node:assert/strict';
import { RESET_PROJECT, validateResetBackup, resetDeletePlan } from '../../scripts/reset-firebase-gameplay.mjs';
const doc = name => ({name:`projects/${RESET_PROJECT}/databases/(default)/documents/gamespaces/local/${name}`,fields:{},updateTime:'2026-10-19T10:00:00Z'});
const backup = documents => ({version:1,project:RESET_PROJECT,scope:'gamespaces',documents});
test('Firebase reset is restricted to a verified same-project gameplay backup',()=>{
  const docs=[doc('players/a'),doc('players/a/objects/hash')];
  assert.equal(validateResetBackup(backup(docs)).documents.length,2);
  assert.deepEqual(resetDeletePlan(backup(docs),docs),[docs[1],docs[0]]);
  assert.deepEqual(resetDeletePlan(backup(docs),[docs[1]]),[docs[1]],'Interrupted deletes can resume without losing the original backup.');
  for(const invalid of [{...backup(docs),project:'other'},backup([{...docs[0],name:'projects/other/databases/(default)/documents/gamespaces/local/players/a'}]),backup([{...docs[0],name:docs[0].name.replace('/gamespaces/','/configuration/')}]),backup([docs[0],docs[0]])]) assert.throws(()=>validateResetBackup(invalid));
  assert.throws(()=>resetDeletePlan(backup(docs),[{...docs[0],updateTime:'changed'}]));
  assert.throws(()=>resetDeletePlan(backup(docs),[doc('players/new')]));
});
