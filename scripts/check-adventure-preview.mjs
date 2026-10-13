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
  assert.throws(() => preview('challenge', 1, profile), RangeError);
}
assert.deepEqual(['easy', 'normal', 'hard', 'superHard'].map(mode => previewTripleLevel(mode, 7, profile).tileCount), [27, 54, 78, 120]);
assert.equal(previewTripleLevel('easy', 7, profile).timeSeconds, 93);
assert.equal(previewTripleLevel('hard', 7, { ...profile, trayExpansionSlots: 3 }).assistNote, 'Khay 10 ô');
assert.deepEqual(profile, before, 'Opening or changing a preview cannot grant assists or mutate progress.');
console.log('Normal level preview configuration, first-start hints, tray bounds and read-only contract passed.');
