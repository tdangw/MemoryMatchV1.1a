import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const model = JSON.parse(execFileSync(process.execPath, ['scripts/analyze-game-economy.mjs'], { encoding:'utf8' }));

test('economy scenario uses independent normal and special loot configuration', () => {
  const mixed = model.scenarios.find(value => value.specialShare === .1);
  assert.equal(mixed.expectedLetters, 7);
  assert.equal(mixed.letterSaleCoins, 70);
  assert.equal(mixed.expectedTickets, 2.8);
  assert.equal(mixed.ticketCoinsLongRun, 42);
  assert.equal(mixed.expectedBadges, 8.4);
  assert.equal(mixed.expectedEnergy, 26, 'loot does not alter energy');
  assert.equal(model.letterPolicy.saleCoins, 10);
  assert.equal(model.expectedTicketCoinsPerSpecial, 1.5);
  for (const [group, any, all] of [['normal', .12486, .00006], ['special', .5275, .0075]]) {
    assert.ok(Math.abs(model.lootProbabilities[group].any - any) < 1e-12);
    assert.ok(Math.abs(model.lootProbabilities[group].all - all) < 1e-12);
  }
});

test('cosmetic completion distinguishes the old repeated pool from the current unowned pool', () => {
  for (const row of model.cosmeticCompletionFromEmpty) {
    assert.equal(row.expectedChests, row.items / .2);
    assert.ok(row.baselineRepeatPoolExpectedChests > row.expectedChests);
  }
  assert.deepEqual(model.cosmeticCompletionFromEmpty.map(row => row.expectedChests), [190,190,110]);
});
