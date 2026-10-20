import test from 'node:test';
import assert from 'node:assert/strict';
import { createUiSkinController, normalizeUiSkin } from '../../js/uiSkinController.js';
import { gameState, hydrateGameState } from '../../js/gameState.js';

const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
test('unknown and legacy skin settings retain the default', () => {
  for (const value of [undefined, null, '', 'jade', {}, [], 1]) assert.equal(normalizeUiSkin(value), 'default');
  assert.equal(normalizeUiSkin('woodland'), 'woodland');
});
test('save hydration normalizes the new enum without changing other preferences', () => {
  hydrateGameState({ settings: { uiSkin: 'woodland', sound: false, musicVolume: .6 } });
  assert.equal(gameState.settings.uiSkin, 'woodland'); assert.equal(gameState.settings.sound, false); assert.equal(gameState.settings.musicVolume, .6);
  for (const uiSkin of [undefined, null, 'future-skin', {}]) {
    hydrateGameState({ settings: { uiSkin } }); assert.equal(gameState.settings.uiSkin, 'default');
  }
});
test('loading or persistence failure keeps the applied skin and allows retry', async () => {
  const applied = []; let fail = 'load';
  const controller = createUiSkinController({ captureOwner: () => 1,
    load: async () => { if (fail === 'load') throw new Error('missing'); },
    save: async () => fail !== 'save', apply: value => applied.push(value) });
  assert.equal((await controller.select('woodland')).status, 'error');
  fail = 'save'; assert.equal((await controller.select('woodland')).status, 'error');
  assert.deepEqual(applied, []);
  fail = ''; assert.equal((await controller.select('woodland')).status, 'applied');
  assert.deepEqual(applied, ['woodland']);
});
test('twenty rapid choices abort stale loads and commit only the final choice', async () => {
  const pending = [], saved = [], applied = [];
  const controller = createUiSkinController({ captureOwner: () => 1,
    load: (_, signal) => { const task = deferred(); pending.push({ task, signal }); return task.promise; },
    save: async value => { saved.push(value); return true; }, apply: value => applied.push(value) });
  const choices = Array.from({ length: 20 }, (_, index) => controller.select(index % 2 ? 'default' : 'woodland'));
  for (const item of pending) item.task.resolve();
  await Promise.all(choices);
  assert(pending.slice(0, -1).every(item => item.signal.aborted));
  assert.deepEqual(saved, ['default']); assert.deepEqual(applied, ['default']);
});
test('account replacement and dispose prevent stale visual or RAM commits', async () => {
  let owner = {}, commits = 0; const gate = deferred();
  const controller = createUiSkinController({ captureOwner: () => owner, load: () => gate.promise,
    save: async () => true, committed: () => commits++, apply: () => commits++ });
  const pending = controller.select('woodland'); owner = {}; gate.resolve();
  assert.equal((await pending).status, 'stale'); assert.equal(commits, 0);
  controller.dispose(); assert.equal((await controller.select('woodland')).status, 'stale');
});
test('durable writes serialize and restore never writes persistence', async () => {
  const gate = deferred(), saved = [], applied = [];
  const controller = createUiSkinController({ captureOwner: () => 1, load: async () => {},
    save: async value => { saved.push(value); if (saved.length === 1) await gate.promise; return true; },
    apply: value => applied.push(value) });
  const first = controller.select('woodland');
  await new Promise(resolve => setImmediate(resolve));
  const last = controller.select('default'); gate.resolve();
  await Promise.all([first, last]);
  assert.deepEqual(saved, ['woodland', 'default']); assert.deepEqual(applied, ['default']);
  await controller.select('woodland', { persist: false }); assert.equal(saved.length, 2);
});
