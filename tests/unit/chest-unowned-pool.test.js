import test from 'node:test';
import assert from 'node:assert/strict';
import { chestCandidate, earnChest, openChest } from '../../js/liveops/chests.js';
import { CHEST_POOLS, CHEST_SUPPORTS } from '../../js/liveops/chestConfig.js';

const failRandom = () => { throw new Error('Unexpected reroll'); };
const pick = (type, owned, category, item = 0) => {
  const draws = [category, item];
  return chestCandidate(type, 'memory-match', owned, () => {
    assert.ok(draws.length, 'only category and selected subpool draw');
    return draws.shift();
  });
};

test('new cosmetic candidates choose uniformly only from missing whitelist IDs', () => {
  for (const [type, pool] of Object.entries(CHEST_POOLS)) {
    for (let index = 0; index < pool.length; index++) {
      assert.equal(pick(type, [], .8, (index + .5) / pool.length).itemId, pool[index]);
    }
    const missing = [pool[1], pool[pool.length - 1]];
    const owned = [...pool.filter(id => !missing.includes(id)), 'foreign-id', ...Object.entries(CHEST_POOLS).filter(([other]) => other !== type).flatMap(([, ids]) => ids)];
    assert.equal(pick(type, owned, .8, 0).itemId, missing[0]);
    assert.equal(pick(type, owned, .999999, .499999).itemId, missing[0]);
    assert.equal(pick(type, owned, .8, .5).itemId, missing[1]);
    assert.equal(pick(type, owned, .999999, .999999).itemId, missing[1]);
    const oneMissing = pool.filter(id => id !== pool[1]);
    for (const draw of [0, .5, .999999]) assert.equal(pick(type, oneMissing, .8, draw).itemId, pool[1]);
  }
});

test('ownership filtering does not increase the 20% cosmetic branch or alter coin/support branches', () => {
  for (const [type, pool] of Object.entries(CHEST_POOLS)) {
    const owned = pool.slice(1);
    assert.equal(pick(type, owned, 0).kind, 'coins');
    assert.equal(pick(type, owned, .399999).kind, 'coins');
    assert.equal(pick(type, owned, .4).kind, 'support');
    assert.equal(pick(type, owned, .799999).kind, 'support');
    assert.equal(pick(type, owned, .8).itemId, pool[0]);
    assert.equal(chestCandidate(type, 'memory-match', pool, failRandom).coins, 100);
    assert.equal(chestCandidate(type, 'memory-match', pool, failRandom).reason, 'full');
    // A catalog addition needs no saved full-pool flag: an ownership list missing
    // the latest pool entry resumes the ordinary category roll immediately.
    assert.equal(pick(type, pool.slice(0, -1), .8).itemId, pool.at(-1));
  }
  assert.equal(pick('c', Object.values(CHEST_POOLS).flat(), .399999).coins, 50);
  assert.equal(pick('c', Object.values(CHEST_POOLS).flat(), .4).kind, 'support');
  assert.equal(pick('c', [], .999999, .999999).key, CHEST_SUPPORTS['memory-match'].at(-1).key);
});

test('canonical ownership race converts the saved candidate and replay never rerolls or spends twice', () => {
  for (const [type, pool] of Object.entries(CHEST_POOLS)) {
    const candidate = pick(type, pool.slice(1), .8);
    const command = { chestType:type, gameId:'memory-match', sequence:1, operation:`race-${type}`, candidate };
    const source = earnChest(undefined, type);
    const opened = openChest(source, command, pool, 0);
    assert.equal(opened.result.kind, 'coins');
    assert.equal(opened.result.reason, 'duplicate');
    assert.equal(opened.result.coins, 100);
    assert.equal(source.spent[type], 0);
    const replay = openChest(opened.chests, command, [], 0);
    assert.equal(replay.applied, false);
    assert.deepEqual(replay.result, opened.result);
    assert.equal(replay.chests.spent[type], 1);
    assert.equal(candidate.kind, 'item', 'durable candidate remains unchanged');
  }
});

test('queued legacy item and conversion candidates preserve compatibility', () => {
  const type = 'avatar', itemId = CHEST_POOLS.avatar[0];
  const base = { chestType:type, gameId:'memory-match', poolVersion:1 };
  const command = { chestType:type, gameId:'memory-match', sequence:1, operation:'legacy', candidate:{ ...base, kind:'item', coins:0, itemId } };
  assert.equal(openChest(earnChest(undefined, type), command, [], 0).result.itemId, itemId);
  assert.equal(openChest(earnChest(undefined, type), command, [itemId], 0).result.coins, 100);
  const oldConversion = { ...command, candidate:{ ...base, kind:'coins', coins:300, reason:'full' } };
  const opened = openChest(earnChest(undefined, type), oldConversion, [], 0);
  assert.equal(opened.result.coins, 100);
  opened.chests.last.coins = 300;
  assert.equal(openChest(opened.chests, oldConversion, [], 0).result.coins, 300);
  const invalid = { ...command, candidate:{ ...command.candidate, itemId:CHEST_POOLS.frame[0] } };
  assert.throws(() => openChest(earnChest(undefined, type), invalid, [], 0));
});
