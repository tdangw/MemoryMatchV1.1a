import { LETTER_REWARD_ITEMS } from '../../js/liveops/letterCatalog.generated.js';
import { normalizeAcquisitions } from '../../js/progression/acquisitionModel.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { LETTER_ALPHABET, LETTER_SETS, LETTER_DROP_CHANCE } from '../../js/liveops/config.js';
import { normalizeLetters, creditLetters, mutateLetters, letterProgressLabel, exchangeLetterSet } from '../../js/liveops/letters.js';
import { applySpecialDrop, normalizeSparkSave } from '../../js/liveops/sparkModel.js';
test('user example fills repeated M left to right without spending inventory',()=>{
  const recipe=LETTER_SETS.find(v=>v.id==='memory-match'),counts={M:2,A:1};
  assert.equal(recipe.required.M,3);assert.equal(letterProgressLabel(recipe,counts),'M-M--- -A---');assert.deepEqual(counts,{M:2,A:1});
  assert.equal(letterProgressLabel(recipe,{M:3,A:1}),'M-M--- MA---');
  for(const set of LETTER_SETS)assert.equal(letterProgressLabel(set,set.required),set.label);
});
test('25% special drop yields one uniform-alphabet character independently of ticket, once per group',()=>{
  assert.equal(LETTER_DROP_CHANCE,.25);
  for(let i=0;i<LETTER_ALPHABET.length;i++){
    const sample=(i+.5)/LETTER_ALPHABET.length,values=[0,sample];
    const input={gameId:'memory-match',mode:'easy',attempt:'letters-drop',wave:1,group:'a|b',special:true};
    const result=applySpecialDrop(undefined,input,{ticketRandom:()=>.99,letterRandom:()=>values.shift()});
    assert.equal(result.dropped,false);assert.equal(result.letter,LETTER_ALPHABET[i]);assert.equal(result.save.letterEarned[result.letter],1);
    assert.equal(applySpecialDrop(result.save,input,{ticketRandom:()=>{throw Error('duplicate');},letterRandom:()=>{throw Error('duplicate');}}).letter,undefined);
  }
  const values=[0,0],both=applySpecialDrop(undefined,{gameId:'triple-connect',mode:'challenge',attempt:'both',wave:1,group:'a|b|c',special:true},{ticketRandom:()=>0,letterRandom:()=>values.shift()});
  assert.equal(both.dropped,true);assert.equal(Object.values(both.save.letterEarned).reduce((a,b)=>a+b,0),1);
});
test('sell credits10 per letter, bounded sequence makes retry idempotent and stale requests fail',()=>{
  let state=creditLetters(undefined,{M:5,A:2});
  const cmd={type:'sellLetter',letter:'M',quantity:2,sequence:1,operation:'sell-one'};
  const r=mutateLetters(state,cmd);state=r.state;assert.equal(r.coins,20);assert.equal(state.counts.M,3);
  assert.equal(mutateLetters(state,cmd).coins,0);assert.throws(()=>mutateLetters(state,{...cmd,operation:'stale'}));
  assert.throws(()=>mutateLetters(state,{...cmd,sequence:2,quantity:4,operation:'too-many'}));
  assert.equal(creditLetters(state,{M:5,A:2}).counts.M,3);assert.throws(()=>creditLetters(state,{M:4,A:2}));
});
test('three same letters fuse into one; same letter result is valid; no reroll on retry',()=>{
  let state=creditLetters(undefined,{M:6,A:1});
  const cmd={type:'fuseLetter',letter:'M',sequence:1,operation:'fuse-one'};
  let r=mutateLetters(state,cmd,'M');state=r.state;assert.equal(state.counts.M,4);assert.equal(r.result.received,'M');
  assert.equal(mutateLetters(state,cmd,'A').state.counts.M,4);
  r=mutateLetters(state,{...cmd,sequence:2,operation:'fuse-two'},'A');state=r.state;assert.equal(state.counts.M,1);assert.equal(state.counts.A,2);
  assert.throws(()=>mutateLetters(state,{...cmd,sequence:3,operation:'not-enough'},'A'));
});
test('letter counts survive save/reload and remain separate from day/week quota',()=>{
  const save=normalizeSparkSave();save.letterEarned={M:20};assert.deepEqual(normalizeSparkSave(JSON.parse(JSON.stringify(save))).letterEarned,{M:20});
  assert.throws(()=>normalizeLetters({counts:{M:-1},earned:{},sequence:0,last:null}));
});

test('four recipes share12exclusive items, one reward per exchange, then100coin fallback',()=>{
  let letters=normalizeLetters(),owned=[];
  const counts={};for(const set of LETTER_SETS)for(const [letter,n]of Object.entries(set.required))counts[letter]=Math.max(counts[letter]||0,n*20);
  letters=creditLetters(letters,counts);
  for(let i=0;i<13;i++){
    const set=LETTER_SETS[i%4],cmd={type:'exchangeLetterSet',setId:set.id,sequence:i+1,operation:`exchange-${i}`};
    const before={...letters.counts},r=exchangeLetterSet(letters,cmd,owned);letters=r.state;
    for(const [letter,n]of Object.entries(set.required))assert.equal(letters.counts[letter],before[letter]-n);
    if(i<12){assert(r.item);assert(!owned.includes(r.item.id));owned.push(r.item.id);assert.equal(r.coins,0);}else{assert.equal(r.item,null);assert.equal(r.coins,100);}
    const retry=exchangeLetterSet(letters,cmd,owned);assert.equal(retry.coins,0);assert.equal(retry.item,null);assert.deepEqual(retry.state,letters);
  }
  assert.equal(new Set(owned).size,12);assert.deepEqual(owned,LETTER_REWARD_ITEMS.map(item=>item.id));
  assert.throws(()=>exchangeLetterSet(letters,{type:'exchangeLetterSet',setId:'memory-match',sequence:1,operation:'stale'},owned));
  assert.throws(()=>exchangeLetterSet(undefined,{type:'exchangeLetterSet',setId:'memory-match',sequence:1,operation:'empty'},[]));
});
test('letter grants use independent stable acquisitions, never achievement receipts',()=>{
  const id=LETTER_REWARD_ITEMS[0].id,receiptId=`owner:letters:${id}`,grant={receiptId,ownerUid:'owner',sourceKind:'letters',sourceId:'letters-collection-01',items:[id],grantedAt:1};
  assert.equal(normalizeAcquisitions({version:1,grants:{[receiptId]:grant}}).grants[receiptId].items[0],id);
  assert.throws(()=>normalizeAcquisitions({version:1,grants:{[receiptId]:{...grant,items:['memory-avatar-sapphire-owl']}}}));
});
