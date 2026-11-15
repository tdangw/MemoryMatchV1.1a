import assert from 'node:assert/strict';
import { previewMemoryLevel, previewLinkLevel, previewTripleLevel } from '../js/adventurePreview.js';
import { getProgressionStarTargets } from '../js/progression/gameplayRules.js';
const profile = { items: { hint: 3 }, startedLevels: {}, trayExpansionSlots: 0 };
const before = structuredClone(profile);
assert.equal(previewLinkLevel('easy',1,profile).threeStarScore,198);
assert.equal(previewTripleLevel('easy',1,profile).threeStarScore,297);
assert.equal(previewMemoryLevel('easy',1,profile).threeStarScore,159);
assert.equal(previewMemoryLevel('endless',1,profile).threeStarScore,744);
assert.equal(previewTripleLevel('endless',1,profile).threeStarScore,1240);
for (const [preview, easyTime, hardTime, challengeTime] of [[previewMemoryLevel,75,150,75],[previewLinkLevel,60,120,60]]) {
  assert.equal(preview('easy', 1, profile).timeSeconds, easyTime);
  assert.equal(preview('hard', 7, profile).timeSeconds, hardTime);
  assert.equal(preview('superHard', 101, profile).tileCount, 60);
  assert.equal(preview('easy', 7, profile).hints, 4);
  assert.equal(preview('easy', 7, { ...profile, startedLevels: { 'easy:7': true } }).hints, 3);
  assert.equal(preview('challenge', 1, profile).timeSeconds, challengeTime);
  assert.equal(preview('challenge', 1, profile).tileCount, 12);
  assert.equal(preview('endless', 1, profile).timeSeconds, 0);
  assert.equal(preview('endless', 1, profile).tileCount, 60);
  assert.equal(preview('endless', 1, profile).hints, 3);
  assert.throws(() => preview('unknown', 1, profile), RangeError);
  assert.throws(() => preview('challenge', 0, profile), RangeError);
}
assert.deepEqual(['easy', 'normal', 'hard', 'superHard'].map(mode => previewTripleLevel(mode, 7, profile).tileCount), [27, 54, 78, 120]);
assert.equal(previewTripleLevel('easy', 7, profile).timeSeconds, 60);
assert.equal(previewTripleLevel('hard', 7, { ...profile, trayExpansionSlots: 3 }).assistNote, 'Khay 10 ô');
assert.equal(previewTripleLevel('challenge', 1, profile).tileCount, 18);
assert.equal(previewTripleLevel('challenge', 1, profile).timeSeconds, 60);
assert.equal(previewTripleLevel('endless', 1, profile).tileCount, 120);
assert.equal(previewTripleLevel('endless', 1, profile).timeSeconds, 0);
assert.equal(previewMemoryLevel('endless', 1, profile).assistNote, 'Xem trước 8 giây');
for (const [preview, groupSize, gameId] of [[previewMemoryLevel,2,'memory-match'], [previewLinkLevel,2,'link-connect'], [previewTripleLevel,3,'triple-connect']]) {
  for(const mode of ['easy','normal','hard','superHard','challenge','endless'])for(const level of [1,10,11,50,51,90,91,101]){
    const info=preview(mode,level,profile);
    assert.equal(info.threeStarScore,getProgressionStarTargets({gameId,totalGroups:info.tileCount/groupSize*info.waves,mode}).three);
  }
  for (const [level, count] of [[1,2],[10,2],[11,3],[50,3],[51,4],[90,4],[91,5]]) {
    assert.equal(preview('easy', level, profile).waves, count);
    assert.ok(preview('easy', level, profile).target.endsWith(`× ${count} đợt`));
  }
  assert.ok(!preview('endless', 1, profile).goal.includes('hết giờ'));
  assert.equal(preview('challenge', 1, profile).hints, 3);
}
assert.deepEqual(profile, before, 'Opening or changing a preview cannot grant assists or mutate progress.');
console.log('All-mode level previews, special first-level rules, first-start hints, tray bounds and read-only contract passed.');
