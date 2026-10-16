import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAdService } from '../../js/ads/adService.js';
import { AD_CONFIG, validateAdConfig } from '../../js/ads/adConfig.js';

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
