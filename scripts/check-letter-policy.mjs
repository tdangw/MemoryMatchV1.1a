import assert from 'node:assert/strict';
import { LETTER_DROP_CHANCE, LETTER_SELL_COINS } from '../js/liveops/config.js';
import { creditLetters, mutateLetters, normalizeLetters } from '../js/liveops/letters.js';
import { applySpecialDrop } from '../js/liveops/sparkModel.js';

assert.equal(LETTER_DROP_CHANCE, .25);
assert.equal(LETTER_SELL_COINS, 10);
for (const gameId of ['memory-match', 'link-connect', 'triple-connect']) {
  for (const special of [false, true]) {
    const threshold = special ? .25 : .05;
    for (const roll of [0, threshold - .000001, threshold, threshold + .000001, .999999]) {
      const input = { gameId, mode:'easy', attempt:'letter-policy', wave:1, group:'a|b|c', special };
      const samples = [roll, 0];
      const result = applySpecialDrop(undefined, input, { ticketRandom:()=>.99, letterRandom:()=>samples.shift() });
      assert.equal(Boolean(result.letter), roll < threshold);
      assert.equal(Object.values(result.save.letterEarned).reduce((a,b)=>a+b,0), Number(roll < threshold));
      const fail = () => { throw new Error('Processed group must not reroll, including a miss.'); };
      const replay = applySpecialDrop(result.save, input, { ticketRandom:fail, letterRandom:fail });
      assert.equal(replay.letter, undefined);
      assert.deepEqual(replay.save.letterEarned, result.save.letterEarned);
    }
  }
}

const fresh = creditLetters(undefined, {M:5});
const sale = {type:'sellLetter',letter:'M',quantity:2,sequence:1,operation:'new-sale'};
const sold = mutateLetters(fresh, sale);
assert.equal(sold.coins, 20);
assert.equal(sold.state.counts.M, 3);
assert.equal(mutateLetters(sold.state, sale).coins, 0);

// A completed old sale remains a receipt, never a reason to pay or rewrite it.
const legacy = structuredClone(sold.state);
legacy.last = {...legacy.last,operation:'legacy-sale',coins:2000};
assert.equal(normalizeLetters(legacy).last.coins, 2000);
const replay = mutateLetters(legacy, {...sale,operation:'legacy-sale'});
assert.equal(replay.coins, 0);
assert.equal(replay.result.coins, 2000);
assert.equal(creditLetters(legacy, {M:6}).last.coins, 2000);
const next = mutateLetters(legacy, {...sale,quantity:1,sequence:2,operation:'after-legacy'});
assert.equal(next.coins, 10);
assert.equal(next.state.counts.M, 2);
assert.throws(()=>normalizeLetters({...legacy,last:{...legacy.last,coins:2001}}));
assert.throws(()=>normalizeLetters({...legacy,last:{...legacy.last,coins:Number.MAX_SAFE_INTEGER+1}}));
console.log('Letter policy passed: 5% normal/25% special drops, 10 coins, legacy receipts and replay preserved.');
