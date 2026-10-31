import test from 'node:test';
import assert from 'node:assert/strict';
import { LETTER_ALPHABET, LETTER_SELL_COINS } from '../../js/liveops/config.js';
import { creditLetters, mutateLetters, normalizeLetters, normalizeLetterCounts } from '../../js/liveops/letters.js';
import { initialSparkState, transitionSpark, resolveSparkOperation } from '../../js/liveops/sparkModel.js';

const command=(ingredients,sequence=1,operation='fusion')=>({type:'fuseLetter',ingredients,sequence,operation});
const inventory=()=>creditLetters(undefined,{A:6,C:6,M:6,Y:1});

test('any three letters consume exact multiplicities; all17 outputs include input matches',()=>{
  for(const ingredients of [['A','C','M'],['A','A','M'],['M','M','M']])for(const received of LETTER_ALPHABET){
    const before=inventory(),result=mutateLetters(before,command(ingredients),received),expected={...before.counts};
    for(const letter of ingredients)expected[letter]--;
    expected[received]=(expected[received]||0)+1;
    assert.deepEqual(result.state.counts,expected);
    assert.deepEqual(result.result.ingredients,ingredients);assert.equal(result.result.received,received);assert.equal(result.coins,0);
    assert.equal(result.result.letter,ingredients[0]);
    assert.deepEqual(normalizeLetters(JSON.parse(JSON.stringify(result.state))),result.state);
    assert.deepEqual(before,inventory(),'original inventory remains untouched');
  }
});

test('malformed inputs and insufficient repeated stock fail before consuming anything',()=>{
  for(const ingredients of [undefined,null,'ACM',[],['A'],['A','C'],['A','C','M','Y'],['A','C','Z'],['a','C','M'],['A',null,'M'],Array(3)]){
    const before=inventory();assert.throws(()=>mutateLetters(before,command(ingredients),'A'));assert.deepEqual(before,inventory());
  }
  for(const counts of [{},{A:2},{A:1,M:1},{A:1,C:1,M:0}]){
    const before=creditLetters(undefined,counts),copy=structuredClone(before);
    assert.throws(()=>mutateLetters(before,command(['A','A','A']),'A'));assert.deepEqual(before,copy);
  }
  assert.throws(()=>mutateLetters(inventory(),{...command(['A','C','M']),letter:'A'},'A'));
  assert.throws(()=>mutateLetters(inventory(),command(['A','C','M']),'Z'));
  const max=creditLetters(undefined,{A:3,C:Number.MAX_SAFE_INTEGER});
  assert.throws(()=>mutateLetters(max,command(['A','A','A']),'C'));assert.equal(max.counts.A,3);
});

test('durable operation/sequence prevents replay reroll, stale races and mutated command retries',()=>{
  const before=inventory(),cmd=command(['A','C','M']),first=mutateLetters(before,cmd,'A');
  const retry=mutateLetters(first.state,{...cmd,ingredients:['Y','Y','Y']},'C');
  assert.deepEqual(retry.state,first.state);assert.deepEqual(retry.result,first.result);assert.equal(retry.coins,0);
  assert.throws(()=>mutateLetters(first.state,command(['A','C','M'],1,'other-device'),'A'));
  const second=mutateLetters(first.state,command(['A','C','M'],2,'next-fusion'),'C');
  assert.equal(second.state.sequence,2);
  const stale=resolveSparkOperation({...initialSparkState(Date.now()),letters:second.state},cmd,Date.now());assert.equal(stale.discarded,true);
});

test('legacy same-letter pending commands and saved receipts continue exactly as before',()=>{
  const before=inventory(),legacy={type:'fuseLetter',letter:'M',operation:'old-pending',sequence:1};
  const first=mutateLetters(before,legacy,'M');assert.equal(first.state.counts.M,4);
  assert.equal(first.result.letter,'M');assert.equal(Object.hasOwn(first.result,'ingredients'),false);
  const reloaded=normalizeLetters(JSON.parse(JSON.stringify(first.state)));
  assert.deepEqual(mutateLetters(reloaded,legacy,'A').state,reloaded);
  const next=mutateLetters(reloaded,command(['A','C','M'],2,'new-after-old'),'C');assert.deepEqual(next.result.ingredients,['A','C','M']);
  const oldAfterNew=mutateLetters(next.state,{...legacy,sequence:3,operation:'old-after-new'},'A');assert.equal(oldAfterNew.result.letter,'M');
  for(const receipt of [{...next.result,letter:'M'},{...next.result,letter:undefined},{...next.result,ingredients:['A','C']},{...next.result,ingredients:['A','C','Z']},{...next.result,received:'Z'},{...next.result,coins:10}])assert.throws(()=>normalizeLetters({...next.state,last:receipt}));
  assert.equal(LETTER_SELL_COINS,10);
  const sale=mutateLetters(before,{type:'sellLetter',letter:'A',quantity:1,sequence:1,operation:'sale'});assert.equal(sale.coins,10);
});

test('legacy reader keeps new ingredients and canonical counts through the required letter hint',()=>{
  // Pre-ingredients fusion receipt validation, preserved as a compatibility fixture.
  function legacyReader(value){
    assert.equal(value.last.kind,'fuse');
    assert.ok(LETTER_ALPHABET.includes(value.last.letter));
    assert.ok(LETTER_ALPHABET.includes(value.last.received));assert.equal(value.last.coins,0);
    return {...structuredClone(value),counts:normalizeLetterCounts(value.counts),earned:normalizeLetterCounts(value.earned)};
  }
  const next=mutateLetters(inventory(),command(['A','C','M']),'C');
  const oldRead=legacyReader(JSON.parse(JSON.stringify(next.state)));
  assert.deepEqual(oldRead,next.state);assert.deepEqual(oldRead.last.ingredients,['A','C','M']);
  const oldClientAction={type:'fuseLetter',letter:'M',sequence:2,operation:'old-client-after-new'};
  const oldCommand=mutateLetters(oldRead,oldClientAction,'A');
  assert.equal(oldCommand.state.counts.M,next.state.counts.M-3);
  assert.deepEqual(normalizeLetters(oldCommand.state),oldCommand.state);
});

test('Spark transition does not emit Xu/items or change earned counters for new fusion',()=>{
  const uid='fusion-owner',now=Date.UTC(2026,9,31,12);
  let state=transitionSpark(null,{type:'status'},{uid,now,letterEarned:{A:1,C:1,M:1}}).state;
  const before=structuredClone(state),cmd=command(['A','C','M']);
  const result=transitionSpark(state,cmd,{uid,now,randomLetter:'A',letterEarned:state.letters.earned});
  assert.equal(result.receipts.length,0);assert.deepEqual(result.state.letters.earned,before.letters.earned);assert.equal(result.state.tickets,before.tickets);
  assert.equal(result.letterResult.received,'A');assert.deepEqual(result.letterResult.ingredients,cmd.ingredients);
  const replay=transitionSpark(result.state,cmd,{uid,now,randomLetter:'M',letterEarned:state.letters.earned});assert.deepEqual(replay.state,result.state);assert.equal(replay.receipts.length,0);
});
