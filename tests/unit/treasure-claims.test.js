import test from 'node:test';
import assert from 'node:assert/strict';
import { claimAdventureChest, claimJourneyTreasure } from '../../js/adventureRewards.js';
import { gameState, hydrateGameState } from '../../js/gameState.js';
import { loadPersistentGameData } from '../../js/persistence.js';
import { setRankingOwner } from '../../js/rankingOwner.js';

test('expected-tier, duplicate, canonical receipt, identity, inventory and atomic failure contracts',async()=>{
  const bestByLevel=Object.fromEntries(['easy','normal','hard','superHard'].flatMap(mode=>Array.from({length:30},(_,i)=>[`${mode}:${i+1}`,{cleared:true,rulesVersion:1,completedWaves:i<10?2:3,score:100,stars:1}])));
  let fail=false;
  const values=new Map([['memoryMatchSave',JSON.stringify({formatVersion:1,revision:1,updatedAt:1,data:{coins:0,settings:{},appearance:{},progress:{memoryMatch:{bestByLevel}}}})]]);
  globalThis.localStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>{if(fail)throw Error('Quota');values.set(key,value);}};
  hydrateGameState(await loadPersistentGameData());
  const profile=gameState.progress.memoryMatch,initial=profile.items.hint;
  const [first,duplicate]=await Promise.all([claimJourneyTreasure('memory-match',1,'C'),claimJourneyTreasure('memory-match',1,'C')]);
  assert.equal(first.ok,true);assert.equal(duplicate.reason,'busy');assert.equal(gameState.coins,30);
  assert.equal((await claimJourneyTreasure('memory-match',1,'C')).reason,'stale-tier');
  // Even a stale RAM receipt cannot make a canonical tier grant twice.
  delete profile.claimedChests[1];
  assert.equal((await claimJourneyTreasure('memory-match',1,'C')).reason,'stale-tier');
  const second=await claimAdventureChest('memory-match',1,{expectedTier:'B'});
  assert.equal(second.tier,'B');assert.equal(gameState.coins,90);assert.equal(profile.items.hint,initial+3);
  assert(profile.claimedChests[1].tiers.C);
  setRankingOwner({id:'profile',uid:'old'});
  const stale=claimJourneyTreasure('memory-match',2,'C');setRankingOwner({id:'profile',uid:'new'});
  assert.equal((await stale).reason,'stale');assert.equal(gameState.coins,90);
  const old=gameState.progress.memoryMatch;
  const replaced=claimJourneyTreasure('memory-match',2,'C');gameState.progress.memoryMatch={...old};
  assert.equal((await replaced).reason,'stale');gameState.progress.memoryMatch=old;
  profile.items.hint=9999;
  assert.equal((await claimJourneyTreasure('memory-match',2,'C')).reason,'inventory-full');assert.equal(gameState.coins,90);
  profile.items.hint=initial+3;fail=true;
  assert.equal((await claimJourneyTreasure('memory-match',2,'C')).reason,'save');
  assert.equal(gameState.coins,90);assert.equal(profile.items.hint,initial+3);assert.equal(profile.claimedChests[2],undefined);
  fail=false;hydrateGameState(await loadPersistentGameData());
  assert.equal((await claimJourneyTreasure('memory-match',2,'C')).ok,true);
  hydrateGameState(await loadPersistentGameData());
  assert.equal(gameState.coins,120);assert(gameState.progress.memoryMatch.claimedChests[2].tiers.C);
  // A different tab's revision wins. No partial rewards survive a failed CAS.
  const envelope=JSON.parse(values.get('memoryMatchSave'));envelope.revision+=10;values.set('memoryMatchSave',JSON.stringify(envelope));
  assert.equal((await claimJourneyTreasure('memory-match',3,'C')).reason,'save');
  assert.equal(gameState.coins,120);assert.equal(gameState.progress.memoryMatch.claimedChests[3],undefined);
});


