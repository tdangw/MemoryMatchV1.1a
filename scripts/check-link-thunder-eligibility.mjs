import assert from 'node:assert/strict';
import { hasLinkThunderPair, removeRandomLinkPair, isLinkThunderPairEligible } from '../js/linkConnect/linkBoard.js';

const tile=(instanceId,changes={})=>({id:'a',instanceId,frozen:false,special:false,luckyReward:null,...changes});
const boardFor=changes=>({rows:1,columns:2,grid:[[null,null,null,null],[null,tile('one',changes),tile('two',changes),null],[null,null,null,null]]});
const original=Math.random;
try {
  Math.random=()=>{throw Error('Eligibility must not consume RNG');};
  for(const change of [{frozen:true},{special:true},{luckyReward:{type:'coins',value:10}}]) {
    const board=boardFor(change),before=structuredClone(board);
    assert.equal(hasLinkThunderPair(board),false); assert.deepEqual(board,before);
  }
  const board=boardFor({}),before=structuredClone(board);
  assert.equal(hasLinkThunderPair(board),true); assert.deepEqual(board,before);
  board.grid[1][2]=null; assert.equal(hasLinkThunderPair(board),false);
  let calls=0; Math.random=()=>{calls++;return .5;};
  const eligible=boardFor({});
  assert.equal(hasLinkThunderPair(eligible),true); assert.equal(calls,0);
  const pair=removeRandomLinkPair(eligible,{remove:false,eligiblePair:isLinkThunderPairEligible});
  assert.ok(pair); assert.equal(calls,1); assert.deepEqual(eligible,boardFor({}));
} finally {Math.random=original;}
console.log('Thunder approved preflight: frozen/special/lucky/singletons reject without RNG/mutation; successful selection retains one RNG call.');
