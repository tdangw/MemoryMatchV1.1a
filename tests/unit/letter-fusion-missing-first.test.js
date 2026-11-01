import test from 'node:test';
import assert from 'node:assert/strict';
import { LETTER_ALPHABET } from '../../js/liveops/config.js';
import { MISSING_FIRST_FUSION_POLICY, creditLetters, fusionRewardPool, selectFusionLetter, prepareFusionCandidate, mutateLetters, normalizeLetters } from '../../js/liveops/letters.js';
const operation=(roll=.5)=>({type:'fuseLetter',ingredients:['A','C','M'],fusionPolicy:MISSING_FIRST_FUSION_POLICY,fusionRoll:roll,operation:'missing-policy',sequence:1});
const stock=()=>creditLetters(undefined,{A:4,C:4,M:4});

test('new policy maps uniform entropy intervals only to pre-consumption zero-stock letters',()=>{
  const before=stock(),missing=LETTER_ALPHABET.filter(key=>!before.counts[key]);
  assert.deepEqual(fusionRewardPool(before.counts),missing);
  for(let index=0;index<missing.length;index++){
    for(const roll of [index/missing.length,(index+.5)/missing.length])assert.equal(selectFusionLetter(before.counts,roll),missing[index]);
    const command=prepareFusionCandidate(before,operation((index+.5)/missing.length));
    const result=mutateLetters(before,command,command.randomLetter);
    assert.equal(result.result.received,missing[index]);assert.equal(result.result.fusionPolicy,MISSING_FIRST_FUSION_POLICY);
    assert.equal(result.state.counts[missing[index]],1);assert.equal(result.state.counts.A,3);
  }
  const oneMissing=Object.fromEntries(LETTER_ALPHABET.filter(key=>key!=='Y').map(key=>[key,3]));
  for(const roll of [0,.2,.5,.999999])assert.equal(selectFusionLetter(oneMissing,roll),'Y');
  for(const roll of [-.1,1,NaN,Infinity,'0'])assert.throws(()=>selectFusionLetter(before.counts,roll));
});

test('all17 owned falls back to uniform17, defined before ingredients are consumed',()=>{
  const before=creditLetters(undefined,Object.fromEntries(LETTER_ALPHABET.map(key=>[key,1])));
  assert.deepEqual(fusionRewardPool(before.counts),LETTER_ALPHABET);
  for(let index=0;index<LETTER_ALPHABET.length;index++)assert.equal(selectFusionLetter(before.counts,(index+.5)/LETTER_ALPHABET.length),LETTER_ALPHABET[index]);
  const command=prepareFusionCandidate(before,operation(0));assert.equal(command.randomLetter,'A');
  const result=mutateLetters(before,command,command.randomLetter);
  assert.equal(result.state.counts.A,1);assert.equal(result.state.counts.C,0);assert.equal(result.state.counts.M,0);
  // A source reduced to zero must not enter the missing pool for this same operation.
  const partial=stock();partial.counts.A=1;
  const chosen=prepareFusionCandidate(partial,operation(0));assert.notEqual(chosen.randomLetter,'A');
  assert.equal(mutateLetters(partial,chosen,chosen.randomLetter).state.counts.A,0);
});

test('persisted entropy/candidate replay and canonical rebase never reroll or overwrite a committed result',()=>{
  const before=stock(),pending=prepareFusionCandidate(before,operation(.6));
  const durable=JSON.parse(JSON.stringify(pending));
  assert.deepEqual(prepareFusionCandidate(before,durable),pending);
  // A credit reconciled before the operation changes the pool, never its entropy.
  const credited=creditLetters(before,{...before.earned,[pending.randomLetter]:1});
  const rebased=prepareFusionCandidate(credited,durable);
  assert.equal(rebased.fusionRoll,pending.fusionRoll);
  assert.equal(rebased.randomLetter,selectFusionLetter(credited.counts,pending.fusionRoll));
  assert.notEqual(rebased.randomLetter,pending.randomLetter);
  const committed=mutateLetters(credited,rebased,rebased.randomLetter);
  const recovered=normalizeLetters(JSON.parse(JSON.stringify(committed.state)));
  const retry=prepareFusionCandidate(recovered,{...durable,fusionRoll:NaN,randomLetter:'A'});
  assert.equal(retry.randomLetter,committed.result.received,'receipt wins before entropy validation or pool inspection');
  assert.deepEqual(mutateLetters(recovered,retry,retry.randomLetter).state,recovered);
});

test('policy validates the selected candidate, rejects unsupported tags and preserves legacy pending outcomes',()=>{
  const before=stock(),command=prepareFusionCandidate(before,operation());
  assert.throws(()=>mutateLetters(before,command,'A'));
  assert.throws(()=>mutateLetters(before,{...command,fusionPolicy:'future'},command.randomLetter));
  assert.throws(()=>prepareFusionCandidate(before,{...command,fusionPolicy:'future'}));
  assert.throws(()=>mutateLetters(before,{type:'fuseLetter',letter:'M',fusionPolicy:MISSING_FIRST_FUSION_POLICY,fusionRoll:0,operation:'bad-legacy-policy',sequence:1},'A'));
  const legacy={type:'fuseLetter',letter:'M',randomLetter:'A',operation:'old-pending',sequence:1};
  assert.equal(prepareFusionCandidate(before,legacy),legacy);
  const result=mutateLetters(before,legacy,legacy.randomLetter);assert.equal(result.result.received,'A');assert.equal(result.result.fusionPolicy,undefined);
  const oldIngredients={type:'fuseLetter',ingredients:['A','C','M'],randomLetter:'C',operation:'old-ingredients',sequence:1};
  assert.equal(mutateLetters(before,oldIngredients,'C').result.received,'C');
  const changed=mutateLetters(before,command,command.randomLetter);
  assert.equal(changed.result.letter,'A');assert.deepEqual(changed.result.ingredients,['A','C','M']);
  assert.throws(()=>normalizeLetters({...changed.state,last:{...changed.result,fusionPolicy:'future'}}));
});
