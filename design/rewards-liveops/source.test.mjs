import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { ACHIEVEMENT_ITEMS } from '../../js/progression/achievementCatalog.generated.js';
const read = async name => JSON.parse(await fs.readFile(new URL(name, import.meta.url), 'utf8'));
const original = await read('legacy-rewards.lock.json');
const proposed = await read('catalog.source.json');
const config = await read('liveops.source.json');
const approval = await read('approval.json');
const extras = await read('cosmetic-extras.source.json');

test('original thirty retain identity, mappings and effect IDs', () => {
  assert.equal(original.items.length, 30);
  assert.equal(original.items.filter(item => item.type === 'effect-cover').length, 6);
  for (const old of original.items) {
    const current = ACHIEVEMENT_ITEMS.find(item => item.id === old.id);
    assert.deepEqual(current, old, old.id);
  }
});
test('approved expansion covers exactly ninety unique game/level grants', () => {
  assert.equal(proposed.approvedForImplementation, true);
  assert.equal(proposed.items.length, 60);
  const items = [...original.items, ...proposed.items];
  assert.equal(new Set(items.map(item => item.id)).size, 90);
  assert.equal(new Set(items.map(item => `${item.gameId}:${item.level}`)).size, 90);
  for (const gameId of ['memory-match', 'link-connect', 'triple-connect']) {
    assert.deepEqual(items.filter(item => item.gameId === gameId).map(item => item.level).sort((a, b) => a - b),
      Array.from({ length: 30 }, (_, index) => index + 1));
  }
  for (const [type, count] of [['avatar', 24], ['frame', 24], ['badge', 12]])
    assert.equal(proposed.items.filter(item => item.type === type).length, count);
  for (const item of proposed.items) {
    assert.deepEqual(item.canvas, [512, 512]); assert.deepEqual(item.pivot, [256, 256]);
    assert(item.level >= 11 && item.level <= 30); assert(item.brief.length > 10);
  }
});
test('event and starter are independent sources, never fake level grants', () => {
  assert.equal(extras.items.length, 5);
  const ids = new Set([...original.items, ...proposed.items].map(item => item.id));
  for (const item of extras.items) {
    assert(!ids.has(item.id)); assert.equal(item.level, undefined); assert.equal(item.gameId, undefined);
    ids.add(item.id);
  }
  assert.deepEqual(extras.items.filter(item => item.sourceKind === 'event').map(item => item.id).sort(),
    config.event.milestones.at(-1).cosmetics.toSorted());
  assert.deepEqual(extras.items.filter(item => item.sourceKind === 'starter').map(item => item.type).sort(), ['avatar', 'badge', 'frame']);
  assert.equal(ids.size, 95);
});
test('approved economy has eight equal sectors and exact weekly totals', () => {
  assert.equal(config.approvedForImplementation, true);
  assert.deepEqual(config.wheel.sectorValuesClockwise, [5, 10, 10, 15, 15, 20, 20, 25]);
  assert.deepEqual(config.wheel.sectorWeights, Array(8).fill(1));
  assert.equal(config.confirmed.spinFreePerDay, 1); assert.equal(config.confirmed.spinOptionalAdPerDay, 1);
  const login = config.login.coins.reduce((sum, value) => sum + value, 0);
  const daily = config.missions.daily.reduce((sum, item) => sum + item.coins, config.missions.dailyCompletionBonus);
  const event = config.event.milestones.reduce((sum, item) => sum + (item.coins || 0), 0);
  const base = login + daily * 7 + config.missions.weeklyCompletionCoins + event;
  assert.equal(login, 105); assert.equal(daily, 30); assert.equal(event, 25);
  assert.equal(base + 15 * 7, 495); assert.equal(base + 15 * 14, 600);
  assert.equal(base + 25 * 7, 565); assert.equal(base + 25 * 14, 740);
});
test('approved clock/offline/backend boundaries keep release gated', () => {
  assert.equal(approval.periods.dailyResetUtc, '00:00');
  assert.equal(approval.periods.weeklyResetUtc, 'Monday 00:00');
  assert.equal(approval.periods.vietnamReset, '07:00');
  assert.equal(approval.pilot.startAt, null); assert.equal(approval.pilot.earnedRewardGraceHours, 48);
  assert.equal(approval.backend.implementation, true); assert.equal(approval.backend.emulator, true);
  assert.equal(approval.backend.deploy, false);
  assert(Object.values(approval.release).every(value => value === false));
});
