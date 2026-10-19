import test from 'node:test';
import assert from 'node:assert/strict';
import { getMasteryRewards, COLLECTION_REWARD_COINS } from '../../js/progression/masteryRewards.js';

test('ten distinct wins at each difficulty unlock a sequential, separately claimable chest', () => {
  const completed = {};
  const claim = { rulesVersion: 1, tiers: {} };
  for (const [mode, tier, coins, hints] of [['easy','C',30,1],['normal','B',60,2],['hard','A',100,3],['superHard','S',160,4]]) {
    for (let level = 1; level <= 10; level++) completed[`${mode}:${level}`] = { rulesVersion: 1, cleared: true };
    const status = getMasteryRewards({ completed, level: 1, claim });
    assert.equal(status.activeTier, tier);
    assert.equal(status.exp, 100);
    assert.equal(status.chestEligible, true);
    assert.equal(status.reward.coins, coins);
    assert.equal(status.reward.hints, hints);
    claim.tiers[tier] = { claimedAt: 1 };
    assert.notEqual(getMasteryRewards({ completed, level: 1, claim }).activeTier, tier);
  }
  const status = getMasteryRewards({ completed, level: 1, claim });
  assert.equal(status.activeTier, null);
  assert.equal(status.collectionEligible, true);
  assert.equal(COLLECTION_REWARD_COINS, 300);
  claim.collection = { claimedAt: 1 };
  assert.equal(getMasteryRewards({ completed, level: 1, claim }).collectionEligible, false);
});

test('early higher-difficulty wins are retained without replacing missing easy wins', () => {
  const completed = {};
  for (let level = 1; level <= 10; level++) completed[`normal:${level}`] = { rulesVersion: 1, cleared: true };
  let status = getMasteryRewards({ completed, level: 1 });
  assert.equal(status.activeTier, 'C');
  assert.equal(status.chestEligible, false);
  assert.equal(status.exp, 0);
  for (let level = 1; level <= 10; level++) completed[`easy:${level}`] = { rulesVersion: 1, cleared: true };
  status = getMasteryRewards({ completed, level: 1, claim: { rulesVersion: 1, tiers: { C: { claimedAt: 1 } } } });
  assert.equal(status.activeTier, 'B');
  assert.equal(status.chestEligible, true);
  assert.equal(status.exp, 100);
  assert.equal(status.fragmentLevels.length, 0);
});
