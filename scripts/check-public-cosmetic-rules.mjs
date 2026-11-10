import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection, query, limit, serverTimestamp } from 'firebase/firestore';
import { ACHIEVEMENT_ITEMS, PROFILE_COSMETIC_ITEMS } from '../js/progression/achievementModel.js';
import { publishPublicCosmetics, readPublicCosmetics, getPublicCosmeticCacheSize } from '../js/progression/publicCosmeticStore.js';
const env = await initializeTestEnvironment({ projectId: 'demo-memory-match', firestore: { host: '127.0.0.1', port: 8180, rules: readFileSync('firestore.rules', 'utf8') } });
await env.clearFirestore();
try {
  const a = env.authenticatedContext('cosmetic-a').firestore(), b = env.authenticatedContext('cosmetic-b').firestore(), guest = env.unauthenticatedContext().firestore();
  const selection = { version: 1, ...Object.fromEntries(['avatar', 'frame', 'badge'].map(slot => [slot, ACHIEVEMENT_ITEMS.find(item => item.type === slot).id])) };
  const ref = doc(a, 'gamespaces/test/publicCosmetics/cosmetic-a');
  await assertSucceeds(publishPublicCosmetics({ database: a, environment: 'test', uid: 'cosmetic-a', selection }));
  let observed = await readPublicCosmetics({ database: b, environment: 'test', uids: ['cosmetic-a'], refresh: true });
  assert.equal(observed.available, true); assert.deepEqual(observed.selections.get('cosmetic-a'), { avatar: selection.avatar, frame: selection.frame, badge: selection.badge });
  await assertSucceeds(getDoc(doc(guest, ref.path)));
  const originalTimestamp = (await getDoc(ref)).data().updatedAt;
  await publishPublicCosmetics({ database: a, environment: 'test', uid: 'cosmetic-a', selection });
  assert.deepEqual((await getDoc(ref)).data().updatedAt, originalTimestamp, 'Identical selection makes no public write.');
  await assertFails(setDoc(doc(b, ref.path), { ...selection, updatedAt: serverTimestamp() }));
  await assertFails(setDoc(ref, { ...selection, avatar: selection.frame, updatedAt: serverTimestamp() }));
  await assertFails(setDoc(ref, { ...selection, badge: 'unknown', updatedAt: serverTimestamp() }));
  await assertFails(setDoc(ref, { ...selection, version: 2, updatedAt: serverTimestamp() }));
  await assertFails(setDoc(ref, { ...selection, email: 'private@example.test', updatedAt: serverTimestamp() }));
  await assertFails(setDoc(ref, { ...selection }));
  await assertFails(getDocs(collection(b, 'gamespaces/test/publicCosmetics')));
  await assertFails(getDocs(query(collection(b, 'gamespaces/test/publicCosmetics'), limit(21))));
  await assertFails(getDoc(doc(b, 'gamespaces/test/players/cosmetic-a')));
  await assertFails(getDoc(doc(b, 'gamespaces/unknown/publicCosmetics/cosmetic-a')));
  await assert.rejects(publishPublicCosmetics({ database: a, environment: 'test', uid: 'cosmetic-a', selection: { version: 1 }, isCurrent: () => false }), { name: 'AbortError' });
  assert.equal((await getDoc(ref)).data().avatar, selection.avatar);
  const leveled={...selection,version:2,levels:{avatar:7,frame:21,badge:1}};
  await assertSucceeds(publishPublicCosmetics({database:a,environment:'test',uid:'cosmetic-a',selection:leveled,expanded:true}));
  observed=await readPublicCosmetics({database:b,environment:'test',uids:['cosmetic-a'],refresh:true});
  assert.deepEqual(observed.selections.get('cosmetic-a').levels,leveled.levels);
  for(const levels of [{avatar:22,frame:21,badge:1},{avatar:7,frame:0,badge:1},{avatar:7,frame:21,badge:1,coins:10}])
    await assertFails(setDoc(ref,{...leveled,levels,updatedAt:serverTimestamp()}));
  await assertFails(setDoc(ref,{...leveled,badge:null,updatedAt:serverTimestamp()}));
  await assertSucceeds(setDoc(ref,{...leveled,badge:null,levels:{...leveled.levels,badge:0},updatedAt:serverTimestamp()}));
  const boardPath = 'gamespaces/test/leaderboards/v3_memory-match_adventure/entries/cosmetic-a';
  await env.withSecurityRulesDisabled(async context => { await setDoc(doc(context.firestore(), boardPath), { levelReached: 17, playerName: 'A', reachedAt: 123 }); });
  const before = (await getDoc(doc(b, boardPath))).data();
  const changed = { ...selection, avatar: ACHIEVEMENT_ITEMS.filter(item => item.type === 'avatar')[1].id, badge: null };
  await assertSucceeds(publishPublicCosmetics({ database: a, environment: 'test', uid: 'cosmetic-a', selection: changed }));
  observed = await readPublicCosmetics({ database: b, environment: 'test', uids: ['cosmetic-a'], refresh: true });
  assert.equal(observed.selections.get('cosmetic-a').avatar, changed.avatar); assert.equal(observed.selections.get('cosmetic-a').badge, null);
  assert.deepEqual((await getDoc(doc(b, boardPath))).data(), before, 'Cosmetic-only publish leaves rank untouched.');
  // Check every new/starter/event ID through actual deployed-rule evaluation,
  // then read the equipped choice from the other account. No inventory fields.
  for (const item of PROFILE_COSMETIC_ITEMS) {
    const expanded = { version: 1, avatar: null, frame: null, badge: null, [item.type]: item.id };
    await assertSucceeds(publishPublicCosmetics({ database: a, environment: 'test', uid: 'cosmetic-a', selection: expanded, expanded: true }));
    assert.equal((await getDoc(doc(b, ref.path))).data()[item.type], item.id);
  }
  assert.deepEqual((await getDoc(doc(b, boardPath))).data(), before, 'All expanded choices preserve rank.');
  for (let index = 0; index < 7; index++) await readPublicCosmetics({ database: b, environment: 'test', uids: Array.from({ length: 20 }, (_, offset) => `missing-${index}-${offset}`) });
  assert.ok(getPublicCosmeticCacheSize() <= 100);
  assert.equal((await readPublicCosmetics({ database: b, environment: 'test', uids: ['missing-6-1'], offline: true })).selections.get('missing-6-1').avatar, null);
  assert.equal((await getDoc(doc(b, 'gamespaces/production/publicCosmetics/cosmetic-a'))).exists(), false);
  console.log('Public cosmetic rules: two-account update/read, owner isolation, exact whitelist, private data denial, rank immutability, environment isolation, stale cancellation and bounded cache PASS.');
} finally { await env.cleanup(); }
