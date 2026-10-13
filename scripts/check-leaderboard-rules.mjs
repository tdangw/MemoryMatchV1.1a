import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDocs, collection, query, limit, serverTimestamp } from 'firebase/firestore';
import { submitRankingResult, readLeaderboard, clearLeaderboardCache, getLeaderboardCacheDiagnostics } from '../js/leaderboardStore.js';
const env = await initializeTestEnvironment({ projectId: 'demo-memory-match', firestore: { host: '127.0.0.1', port: 8180, rules: readFileSync('firestore.rules', 'utf8') } });
await env.clearFirestore();
const result = { rulesVersion: 1, id: crypto.randomUUID(), gameId: 'memory-match', mode: 'easy', level: 1, kind: 'time', durationMs: 1000, score: 100, stars: 3, outcome: 'won', recordedAt: Date.now(), owner: { profileId: 'fixture', uid: 'a' } };
try {
  const database = env.authenticatedContext('a').firestore();
  const stranger = env.authenticatedContext('b').firestore();
  const publicDatabase = env.unauthenticatedContext().firestore();
  const submit = (value, uid = 'a', db = database) => submitRankingResult({ database: db, environment: 'test', uid, playerName: '<img src=x onerror=alert(1)>', result: value });
  assert.equal((await assertSucceeds(submit(result))).writes, 1);
  assert.equal((await submit({ ...result, durationMs: 2000 })).writes, 0);
  assert.equal((await submit({ ...result, id: crypto.randomUUID() })).writes, 0);
  await Promise.all([submit({ ...result, durationMs: 800, id: crypto.randomUUID() }), submit({ ...result, durationMs: 900, id: crypto.randomUUID() })]);
  const own = await readLeaderboard({ database, environment: 'test', board: result, uid: 'a' });
  assert.equal(own.own.durationMs, 800);
  assert.equal((await readLeaderboard({ database, environment: 'test', board: result, uid: 'a' })).cached, true);
  assert.equal((await readLeaderboard({ database, environment: 'test', board: result, uid: 'a', refresh: true })).cached, true);
  await assertFails(submit({ ...result, durationMs: 700 }, 'a', stranger));
  const entry = { rulesVersion: 1, resultId: crypto.randomUUID(), gameId: 'memory-match', mode: 'easy', level: 1, kind: 'time', durationMs: 600, score: 1, stars: 1, playerName: 'A', updatedAt: serverTimestamp() };
  const ref = doc(database, 'gamespaces/test/leaderboards/v1_memory-match_easy_1/entries/a');
  await assertFails(setDoc(ref, { ...entry, email: 'private@example.test' }));
  await assertFails(setDoc(ref, { ...entry, durationMs: -1 }));
  await assertFails(setDoc(ref, { ...entry, durationMs: 900 }));
  await assertFails(setDoc(doc(database, 'gamespaces/test/leaderboards/v1_memory-match_hard_1/entries/a'), entry));
  await assertFails(getDocs(collection(publicDatabase, 'gamespaces/test/leaderboards/v1_memory-match_easy_1/entries')));
  await assertFails(getDocs(query(collection(publicDatabase, 'gamespaces/test/leaderboards/v1_memory-match_easy_1/entries'), limit(21))));
  for (let i = 0; i < 22; i++) { const uid = `fixture-${String(i).padStart(2, '0')}`; await submit({ ...result, id: crypto.randomUUID() }, uid, env.authenticatedContext(uid).firestore()); }
  clearLeaderboardCache();
  const top = await readLeaderboard({ database: publicDatabase, environment: 'test', board: result });
  assert.equal(top.top.length, 10);
  assert.deepEqual(top.top.slice(1).map(item => item.uid), top.top.slice(1).map(item => item.uid).sort());
  const run = { ...result, id: crypto.randomUUID(), gameId: 'triple-connect', mode: 'endless', kind: 'run', levelReached: 10, totalScore: 500, outcome: 'lost' };
  await assertSucceeds(submit(run));
  assert.equal((await submit({ ...run, id: crypto.randomUUID(), levelReached: 11, totalScore: 1 })).writes, 1);
  assert.equal((await submit({ ...run, id: crypto.randomUUID(), levelReached: 10, totalScore: 99999 })).writes, 0);
  assert.equal((await submit({ ...run, id: crypto.randomUUID(), levelReached: 11, totalScore: 2 })).writes, 1);
  assert.equal((await readLeaderboard({ database, environment: 'test', board: run, uid: 'a' })).own.totalScore, 2);
  assert.equal((await readLeaderboard({ database, environment: 'beta', board: run, uid: 'a' })).top.length, 0);
  for (const count of [0, 1, 10, 11, 20, 21]) {
    const board = { ...result, level: 100 + count };
    for (let i = 0; i < count; i++) {
      const uid = `page-${String(i).padStart(2, '0')}`;
      await submit({ ...board, id: crypto.randomUUID(), durationMs: 1000 }, uid, env.authenticatedContext(uid).firestore());
    }
    clearLeaderboardCache();
    const seen = []; let page = 1; let data;
    do {
      data = await readLeaderboard({ database: publicDatabase, environment: 'test', board, page });
      assert(data.top.length <= 10); assert(data.reads <= 11);
      seen.push(...data.top.map(item => item.uid)); page++;
    } while (data.hasNext);
    assert.equal(seen.length, count); assert.equal(new Set(seen).size, count);
    assert.deepEqual(seen, [...seen].sort());
  }
  for (const gameId of ['memory-match', 'link-connect', 'triple-connect']) for (const mode of ['challenge', 'endless']) {
    const checkpoint = { ...run, gameId, mode, rulesVersion: 2, outcome: 'won', id: crypto.randomUUID() };
    await assertSucceeds(submit(checkpoint));
    assert.equal((await submit({ ...checkpoint, levelReached: 9 })).writes, 0);
    assert.equal((await submit({ ...checkpoint, levelReached: 10, totalScore: 600 })).writes, 1);
    assert.equal((await submit({ ...checkpoint, levelReached: 11, totalScore: 1 })).writes, 1);
    await assertFails(setDoc(doc(database, `gamespaces/test/leaderboards/v2_${gameId}_${mode}/entries/a`), { rulesVersion: 2, resultId: crypto.randomUUID(), gameId, mode, kind: 'run', levelReached: 12, totalScore: 1, outcome: 'lost', playerName: 'A', updatedAt: serverTimestamp() }));
    const wrongBoard = doc(database, `gamespaces/test/leaderboards/v1_${gameId}_${mode}/entries/a`);
    await assertFails(setDoc(wrongBoard, { rulesVersion: 2, resultId: crypto.randomUUID(), gameId, mode, kind: 'run', levelReached: 50, totalScore: 1, outcome: 'won', playerName: 'A', updatedAt: serverTimestamp() }));
  }
  clearLeaderboardCache();
  for (let board = 200; board < 213; board++) await readLeaderboard({ database: publicDatabase, environment: 'test', board: { ...result, level: board } });
  assert.equal(getLeaderboardCacheDiagnostics().boards, 12);
  const savedNow = Date.now;
  try {
    const base = savedNow(); Date.now = () => base + 121000;
    await assert.rejects(readLeaderboard({ database: publicDatabase, environment: 'test', board: { ...result, level: 212 }, page: 2 }), { code: 'reset' });
    Date.now = () => base + 15000;
    const refreshed = await readLeaderboard({ database: publicDatabase, environment: 'test', board: { ...result, level: 211 }, refresh: true });
    assert.equal(refreshed.page, 1); assert.equal(refreshed.cached, false);
  } finally { Date.now = savedNow; }
  console.log('Leaderboard Rules: 0/1/10/11/20/21 cursor fixtures, UID ties, six v2 modes, history isolation, concurrent best and public limits passed.');
} finally { await env.cleanup(); }
