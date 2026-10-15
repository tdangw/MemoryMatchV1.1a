import assert from 'node:assert/strict';
import { previewMemoryLevel, previewLinkLevel, previewTripleLevel } from '../js/adventurePreview.js';
const profile = { items: { hint: 3 }, startedLevels: {}, trayExpansionSlots: 0 };
const before = structuredClone(profile);
for (const preview of [previewMemoryLevel, previewLinkLevel]) {
  assert.equal(preview('easy', 1, profile).timeSeconds, 60);
  assert.equal(preview('hard', 7, profile).timeSeconds, 130);
  assert.equal(preview('superHard', 101, profile).tileCount, 60);
  assert.equal(preview('easy', 7, profile).hints, 4);
  assert.equal(preview('easy', 7, { ...profile, startedLevels: { 'easy:7': true } }).hints, 3);
  assert.equal(preview('challenge', 1, profile).timeSeconds, 60);
  assert.equal(preview('challenge', 1, profile).tileCount, 12);
  assert.equal(preview('endless', 1, profile).timeSeconds, 0);
  assert.equal(preview('endless', 1, profile).tileCount, 60);
  assert.equal(preview('endless', 1, profile).hints, 3);
  assert.throws(() => preview('unknown', 1, profile), RangeError);
  assert.throws(() => preview('challenge', 0, profile), RangeError);
}
assert.deepEqual(['easy', 'normal', 'hard', 'superHard'].map(mode => previewTripleLevel(mode, 7, profile).tileCount), [27, 54, 78, 120]);
assert.equal(previewTripleLevel('easy', 7, profile).timeSeconds, 93);
assert.equal(previewTripleLevel('hard', 7, { ...profile, trayExpansionSlots: 3 }).assistNote, 'Khay 10 ô');
assert.equal(previewTripleLevel('challenge', 1, profile).tileCount, 18);
assert.equal(previewTripleLevel('challenge', 1, profile).timeSeconds, 75);
assert.equal(previewTripleLevel('endless', 1, profile).tileCount, 120);
assert.equal(previewTripleLevel('endless', 1, profile).timeSeconds, 0);
assert.equal(previewMemoryLevel('endless', 1, profile).assistNote, 'Xem trước 8 giây');
for (const preview of [previewMemoryLevel, previewLinkLevel, previewTripleLevel]) {
  assert.ok(!preview('endless', 1, profile).goal.includes('hết giờ'));
  assert.equal(preview('challenge', 1, profile).hints, 3);
}
assert.deepEqual(profile, before, 'Opening or changing a preview cannot grant assists or mutate progress.');
console.log('All-mode level previews, special first-level rules, first-start hints, tray bounds and read-only contract passed.');
