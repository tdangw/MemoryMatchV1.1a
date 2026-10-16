import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAdService } from '../../js/ads/adService.js';
import { AD_CONFIG, validateAdConfig } from '../../js/ads/adConfig.js';
import { createBannerController } from '../../js/ads/bannerController.js';

const available = { status: 'NOT_REQUIRED', canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' };
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
function fixture(overrides = {}, supported = true) {
  const calls = [];
  const native = Object.fromEntries(['initialize', 'showPrivacyOptionsForm', 'removeBanner', 'showBanner'].map(name => [name, async value => { calls.push([name, value]); }]));
  native.requestConsentInfo = async value => { calls.push(['consent', value]); return available; };
  Object.assign(native, overrides);
  return { calls, native, service: createAdService({ native, supported, report: () => {} }) };
}

test('configuration rejects interchanged IDs and mismatched publishers, Android ID matches', () => {
  assert.throws(() => validateAdConfig({ appId: AD_CONFIG.bannerId, bannerId: AD_CONFIG.appId }));
  assert.throws(() => validateAdConfig({ ...AD_CONFIG, bannerId: 'ca-app-pub-1234567890123456/1234567890' }));
  assert.ok(readFileSync('android/app/src/main/res/values/strings.xml', 'utf8').includes(AD_CONFIG.appId));
});

test('web does not initialize, request consent, or offer a reward', async () => {
  const { service, calls } = fixture({}, false);
  assert.equal(await service.prepare(), false);
  assert.equal(await service.showPrivacyOptions(), false);
  assert.throws(() => service.show(), /not ready/);
  assert.deepEqual(calls, []);
  assert.equal(service.showRewardedAd, undefined);
});

test('concurrent initialization shares work, consent precedes SDK and child protection covers every request', async () => {
  const gate = deferred();
  const f = fixture({ requestConsentInfo: async options => { f.calls.push(['consent', options]); return gate.promise; } });
  const one = f.service.prepare(), two = f.service.prepare();
  assert.equal(one, two);
  gate.resolve(available);
  assert.equal(await one, true);
  await f.service.prepare(); await f.service.show();
  assert.deepEqual(f.calls.map(([name]) => name), ['consent', 'initialize', 'showBanner']);
  assert.deepEqual(f.calls[0][1], { tagForUnderAgeOfConsent: true });
  assert.deepEqual(f.calls[1][1], { tagForChildDirectedTreatment: true, maxAdContentRating: 'General' });
  assert.equal(f.calls[2][1].npa, true);
  assert.equal(f.calls[2][1].adId, AD_CONFIG.bannerId);
  assert.equal(f.calls[2][1].isTesting, undefined);
});

test('required form gates initialization; no permission never initializes', async () => {
  let forms = 0;
  const { service, calls } = fixture({
    requestConsentInfo: async () => ({ status: 'REQUIRED', canRequestAds: false, isConsentFormAvailable: true }),
    showConsentForm: async () => { forms++; return { ...available, canRequestAds: false }; },
  });
  assert.equal(await service.prepare(), false);
  assert.equal(forms, 1); assert.deepEqual(calls, []);
  assert.throws(() => service.show());
});

test('failed consent and SDK initialization can recover on a subsequent event', async () => {
  for (const method of ['requestConsentInfo', 'initialize']) {
    const f = fixture(); let first = true;
    const original = f.native[method];
    f.native[method] = async (...args) => { if (first) { first = false; throw new Error('offline'); } return original(...args); };
    assert.equal(await f.service.prepare(), false);
    assert.equal(await f.service.prepare(), true);
  }
});

test('privacy changes refresh authorization and publish a new snapshot', async () => {
  let revoked = false;
  const f = fixture({
    requestConsentInfo: async () => ({ ...available, canRequestAds: !revoked, privacyOptionsRequirementStatus: 'REQUIRED' }),
    showPrivacyOptionsForm: async () => { revoked = true; },
  });
  const snapshots = [], unsubscribe = f.service.subscribe(value => snapshots.push(value));
  await f.service.prepare();
  assert.equal(f.service.snapshot().privacyRequired, true);
  assert.equal(await f.service.showPrivacyOptions(), true);
  assert.equal(snapshots.at(-1).canRequestAds, false);
  assert.throws(() => f.service.show());
  unsubscribe();
});

test('a failed privacy form never leaves prior permission usable', async () => {
  const f = fixture({
    requestConsentInfo: async () => ({ ...available, privacyOptionsRequirementStatus: 'REQUIRED' }),
    showPrivacyOptionsForm: async () => { throw new Error('unavailable'); },
  });
  await f.service.prepare();
  assert.equal(await f.service.showPrivacyOptions(), false);
  assert.throws(() => f.service.show());
});

function bannerFixture(overrides = {}) {
  const callbacks = new Map(), history = [], renders = [], calls = [];
  let count = 0, max = 0;
  const service = {
    supported: true,
    prepare: async () => true,
    listen: async (name, callback) => {
      callbacks.set(callback, name); history.push(callback);
      return { remove: async () => { callbacks.delete(callback); } };
    },
    show: async () => { count++; max = Math.max(count, max); calls.push('show'); },
    remove: async () => { count = 0; calls.push('remove'); },
    ...overrides,
  };
  const controller = createBannerController({ service, render: (...args) => renders.push(args), report: () => {} });
  return { controller, service, calls, callbacks, history, renders,
    maximum: () => max,
    emit(name, value) { for (const [callback, event] of callbacks) if (event === name) callback(value); },
  };
}

test('leaving during preparation never shows an ad or retains listeners', async () => {
  const gate = deferred();
  const f = bannerFixture({ prepare: () => gate.promise });
  f.controller.setTarget('home'); f.controller.setTarget(null);
  gate.resolve(true); await f.controller.idle();
  assert.deepEqual(f.calls, []); assert.equal(f.callbacks.size, 0);
});

test('pending show completes before old teardown and new creation; stale events cannot alter a new page', async () => {
  const gate = deferred(), showing = deferred();
  const f = bannerFixture();
  const original = f.service.show;
  f.service.show = async () => { await original(); showing.resolve(); if (f.calls.length === 1) await gate.promise; };
  f.controller.setTarget('home');
  // Synchronize on the real transition, without a timeout hiding a race.
  await showing.promise;
  const stale = f.history[0];
  f.controller.setTarget('map');
  gate.resolve(); await f.controller.idle();
  assert.deepEqual(f.calls, ['show', 'remove', 'show']);
  assert.equal(f.maximum(), 1);
  const before = f.renders.length;
  stale({ height: 90 }); assert.equal(f.renders.length, before);
  f.emit('bannerAdSizeChanged', { height: 120 });
  assert.deepEqual(f.renders.at(-1), ['map', 120]);
  await f.controller.dispose(); assert.equal(f.callbacks.size, 0);
});

test('no-fill tears down once, does not loop, and retries on a later explicit event', async () => {
  const f = bannerFixture();
  await f.controller.setTarget('home');
  f.emit('bannerAdFailedToLoad', { code: 3 }); await f.controller.idle();
  assert.deepEqual(f.calls, ['show', 'remove']); assert.equal(f.callbacks.size, 0);
  await f.controller.setTarget('home');
  assert.deepEqual(f.calls, ['show', 'remove', 'show']);
  await f.controller.dispose();
});

test('30 menu/game cycles and repeated disposal return banner/listeners to baseline', async () => {
  const f = bannerFixture();
  for (let i = 0; i < 30; i++) {
    await f.controller.setTarget('home');
    await f.controller.setTarget('map');
    await f.controller.setTarget(null);
    assert.equal(f.callbacks.size, 0);
    assert.equal(f.controller.diagnostics().bannerCount, 0);
  }
  await f.controller.dispose(); await f.controller.dispose();
  assert.equal(f.maximum(), 1); assert.equal(f.callbacks.size, 0);
});

test('disposal during listener registration releases the late handle without showing', async () => {
  const gate = deferred(), registering = deferred(), f = bannerFixture();
  const original = f.service.listen;
  f.service.listen = async (...args) => { registering.resolve(); await gate.promise; return original(...args); };
  f.controller.setTarget('home');
  await registering.promise;
  const disposed = f.controller.dispose(); gate.resolve(); await disposed;
  assert.equal(f.callbacks.size, 0); assert.deepEqual(f.calls, []);
});

test('partial registration failure cleans earlier handles immediately', async () => {
  const f = bannerFixture(), original = f.service.listen;
  f.service.listen = async (...args) => { if (f.callbacks.size) throw new Error('listener unavailable'); return original(...args); };
  await f.controller.setTarget('home');
  assert.equal(f.callbacks.size, 0); assert.equal(f.controller.diagnostics().bannerCount, 0);
});

test('home → hidden → home during listener registration eventually shows exactly one banner', async () => {
  const gate = deferred(), registering = deferred(), f = bannerFixture();
  const original = f.service.listen;
  let first = true;
  f.service.listen = async (...args) => {
    if (first) { first = false; registering.resolve(); await gate.promise; }
    return original(...args);
  };
  f.controller.setTarget('home'); await registering.promise;
  f.controller.setTarget(null); f.controller.setTarget('home');
  gate.resolve(); await f.controller.idle();
  assert.equal(f.calls.filter(value => value === 'show').length, 1);
  assert.equal(f.callbacks.size, 2); assert.equal(f.maximum(), 1);
  await f.controller.dispose(); assert.equal(f.callbacks.size, 0);
});

test('failed remove never permits a second native banner; next event can retry cleanup', async () => {
  const f = bannerFixture(), original = f.service.remove;
  let failed = true;
  f.service.remove = async () => { if (failed) throw new Error('view unavailable'); return original(); };
  await f.controller.setTarget('home'); await f.controller.setTarget('map');
  assert.equal(f.calls.filter(name => name === 'show').length, 1);
  failed = false;
  await f.controller.setTarget('map');
  assert.equal(f.maximum(), 1); assert.equal(f.calls.filter(name => name === 'show').length, 2);
  await f.controller.dispose();
});
