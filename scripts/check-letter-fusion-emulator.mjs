import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { encodeCloudSnapshot } from '../js/cloudSnapshot.js';
import { publishCloudSnapshot, readCloudRoot, readCloudSnapshot } from '../js/cloudStore.js';
import { confirmSparkClock, readSparkState } from '../js/liveops/store.js';
import { transitionSpark, normalizeSparkSave } from '../js/liveops/sparkModel.js';
import { LETTER_ALPHABET, LETTER_SYNC_KEYS_PER_COMMIT } from '../js/liveops/config.js';
import { MISSING_FIRST_FUSION_POLICY, PAID_LETTER_FUSION_POLICY, prepareFusionCandidate } from '../js/liveops/letters.js';
const [host,port]=(process.env.FIRESTORE_EMULATOR_HOST||'').split(':');
if(!port)throw Error('Isolated emulator required');
const env=await initializeTestEnvironment({projectId:'demo-letter-fusion',firestore:{host,port:Number(port),rules:fs.readFileSync('firestore.rules','utf8')}});
const uid='fusion-test',space='test',db=env.authenticatedContext(uid).firestore(),second=env.authenticatedContext(uid).firestore();
let saved={snapshotVersion:1,profile:{formatVersion:2,revision:1,data:{coins:100,appearance:{},progress:{},settings:{}}},chapters:[]};
let state=null,revision=0,now;
let operation=0;
const next=(ingredients)=>({type:'fuseLetter',ingredients,sequence:state.letters.sequence+1,operation:`fusion-${++operation}`});
async function commit(command={type:'status'},options={}){
  const before=options.state||state,copy=structuredClone(saved),result=transitionSpark(before,command,{uid,now,coinsBalance:copy.profile.data.coins,randomLetter:options.received||command.randomLetter||'A',letterEarned:options.earned||before?.letters.earned||{}});
  result.state.revision=(before?.revision||0)+1;
  copy.profile.data.coins+=result.receipts.reduce((sum,r)=>sum+r.coins,0);
  copy.profile.data.appearance.spark={...normalizeSparkSave(copy.profile.data.appearance.spark),ownerUid:uid,state:result.state,letterEarned:result.state.letters.earned};
  const encoded=await encodeCloudSnapshot(copy);
  // Forge only the requested reward document after normal snapshot validation,
  // so malformed receipts reach the emulator rather than stopping at the client boundary.
  options.forge?.(result.state,before);
  const out=await publishCloudSnapshot({database:options.database||db,environment:space,uid,encoded,expectedRevision:revision,playerName:'Fusion',rewardRevision:before?.revision||0,reward:{state:result.state,expectedRevision:before?.revision||0}});
  return {state:result.state,saved:copy,revision:out.root.revision};
}
function accept(result){({state,saved,revision}=result);}
async function rejectForge(forge){await assert.rejects(commit(next(['A','C','M']),{received:'D',forge}),/permission|PERMISSION|Missing|denied/);}
try{
  await env.clearFirestore();now=(await confirmSparkClock(db,space,uid,()=>true)).timestamp;accept(await commit());
  // Exactly the existing four-key credit protocol, no special schema or seeding bypass.
  for(let offset=0;offset<LETTER_ALPHABET.length;offset+=LETTER_SYNC_KEYS_PER_COMMIT){
    const earned={...state.letters.earned};for(const key of LETTER_ALPHABET.slice(offset,offset+LETTER_SYNC_KEYS_PER_COMMIT))earned[key]=key==='Y'?2:40;
    accept(await commit({type:'status'},{earned}));
  }
  for(const [ingredients,received]of [[['A','C','M'],'D'],[['A','A','M'],'A'],[['M','M','M'],'M']]){
    const before=structuredClone(state.letters.counts),cmd=next(ingredients);accept(await commit(cmd,{received}));
    for(const key of LETTER_ALPHABET)assert.equal(state.letters.counts[key],(before[key]||0)-ingredients.filter(v=>v===key).length+Number(received===key));
    assert.deepEqual(state.letters.last.ingredients,ingredients);assert.equal(state.letters.last.letter,ingredients[0]);
    const replay=transitionSpark(state,cmd,{uid,now,randomLetter:'Y',letterEarned:state.letters.earned});assert.deepEqual(replay.state,state);assert.equal(replay.receipts.length,0);
  }
  const legacy={type:'fuseLetter',letter:'M',sequence:state.letters.sequence+1,operation:'legacy-pending'};
  const beforeLegacy=state.letters.counts.M;accept(await commit(legacy,{received:'A'}));assert.equal(state.letters.counts.M,beforeLegacy-3);assert.equal(state.letters.last.letter,'M');
  const root=await readCloudRoot(db,space,uid),recovered=await readCloudSnapshot(db,space,uid,root);assert.deepEqual(recovered.profile.data.appearance.spark.state.letters,state.letters);
  const race=next(['A','C','M']);
  const results=await Promise.allSettled([commit(race,{received:'A'}),commit({...race,operation:'other-device'},{database:second,received:'C'})]);
  assert.equal(results.filter(v=>v.status==='fulfilled').length,1);accept(results.find(v=>v.status==='fulfilled').value);
  await rejectForge((n,o)=>{for(const key of ['A','C','M'])n.letters.counts[key]=o.letters.counts[key];}); // Missing source spending.
  await rejectForge(n=>{n.letters.counts.E++;}); // Unrelated item grant.
  await rejectForge(n=>{n.letters.counts.Z=1;}); // Unknown added key must also be denied by the delta whitelist.
  await rejectForge(n=>{n.letters.earned.E++;n.letters.counts.E++;}); // Forged earned credit in a fusion.
  await rejectForge(n=>{n.letters.last.ingredients=['A','C'];});
  await rejectForge(n=>{n.letters.last.ingredients=['A','C','M','Y'];});
  await rejectForge(n=>{n.letters.last.ingredients=['A','C','Z'];});
  await rejectForge(n=>{n.letters.last.letter='M';});
  await rejectForge(n=>{delete n.letters.last.letter;});
  await rejectForge(n=>{n.letters.last.coins=10;});
  await rejectForge(n=>{n.letters.last.received='Z';n.letters.counts.Z=1;});
  await rejectForge((n,o)=>{n.letters.counts={...o.letters.counts,Y:0};n.letters.last.ingredients=['Y','Y','Y'];n.letters.last.letter='Y';n.letters.last.received='Y';}); // Net -2 would look valid without checking three actual inputs.
  await rejectForge((n,o)=>{n.letters.counts={...o.letters.counts,A:o.letters.counts.A-2};n.letters.last.ingredients=['A','A','M'];n.letters.last.received='A';});
  const final=await readSparkState(db,space,uid);assert.deepEqual(final.state.letters,state.letters);
  assert.equal(saved.profile.data.coins,100);
  const policy=(ingredients,roll)=>prepareFusionCandidate(state.letters,{...next(ingredients),fusionPolicy:MISSING_FIRST_FUSION_POLICY,fusionRoll:roll});
  console.log('Fusion policy scenarios: all-owned, rebase, missing, replay, CAS and forged policies');
  // All letters are owned BEFORE spending Y twice; Y becomes zero only afterwards.
  const full=policy(['Y','Y','M'],0);assert.equal(full.randomLetter,'A');accept(await commit(full));assert.equal(state.letters.counts.Y,0);
  const pending=JSON.parse(JSON.stringify(policy(['A','C','M'],.6)));assert.equal(pending.randomLetter,'Y');
  // A canonical earned credit changes the pool while leaving the operation sequence intact.
  accept(await commit({type:'status'},{earned:{...state.letters.earned,Y:state.letters.earned.Y+1}}));
  const rebased=prepareFusionCandidate(state.letters,pending);assert.equal(rebased.fusionRoll,pending.fusionRoll);assert.notEqual(rebased.randomLetter,pending.randomLetter);
  accept(await commit(rebased));
  for(const letter of ['C','N'])accept(await commit({type:'sellLetter',letter,quantity:state.letters.counts[letter],sequence:state.letters.sequence+1,operation:`zero-${letter}`}));
  const beforePolicyCoins=saved.profile.data.coins;
  const missing=policy(['A','M','M'],.75);assert.equal(missing.randomLetter,'N');accept(await commit(missing));
  assert.equal(state.letters.last.fusionPolicy,MISSING_FIRST_FUSION_POLICY);
  const recoveredPolicy=await readCloudSnapshot(db,space,uid,await readCloudRoot(db,space,uid));
  const replay=prepareFusionCandidate(recoveredPolicy.profile.data.appearance.spark.state.letters,{...missing,fusionRoll:NaN});assert.equal(replay.randomLetter,'N');
  assert.deepEqual(transitionSpark(state,replay,{uid,now,randomLetter:replay.randomLetter,letterEarned:state.letters.earned}).state,state);
  const policyRace=policy(['A','M','M'],0),policyRaces=await Promise.allSettled([commit(policyRace),commit({...policyRace,operation:'other-policy-device'},{database:second})]);
  assert.equal(policyRaces.filter(value=>value.status==='fulfilled').length,1);accept(policyRaces.find(value=>value.status==='fulfilled').value);
  // Make C missing again, then forge an otherwise-exact owned output.
  accept(await commit({type:'sellLetter',letter:'C',quantity:state.letters.counts.C,sequence:state.letters.sequence+1,operation:'zero-C-again'}));
  const coinsAfterSales=saved.profile.data.coins;
  await assert.rejects(commit(policy(['A','M','M'],0),{forge:(n,o)=>{
    n.letters.counts={...o.letters.counts,A:o.letters.counts.A,M:o.letters.counts.M-2};n.letters.last.received='A';
  }}),/permission|PERMISSION|Missing|denied/);
  await assert.rejects(commit(policy(['A','M','M'],0),{forge:n=>{n.letters.last.fusionPolicy='future-policy';}}),/permission|PERMISSION|Missing|denied/);
  await assert.rejects(commit(policy(['A','M','M'],0),{forge:(n,o)=>{
    n.letters.counts={...o.letters.counts,A:o.letters.counts.A-3,C:1};delete n.letters.last.ingredients;
  }}),/permission|PERMISSION|Missing|denied/);
  assert.equal(saved.profile.data.coins,coinsAfterSales);assert.ok(coinsAfterSales>beforePolicyCoins,'only approved sales change coins');
  accept(await commit({type:'status'},{earned:{...state.letters.earned,C:state.letters.earned.C+1}}));
  assert.ok(LETTER_ALPHABET.every(letter=>state.letters.counts[letter]>0));
  const paid=prepareFusionCandidate(state.letters,{...next(['A','M','M']),fusionPolicy:PAID_LETTER_FUSION_POLICY,fusionRoll:.25});
  const beforePaid=saved.profile.data.coins;
  await assert.rejects(commit(paid,{forge:n=>{n.letters.last.coins=0;}}),/permission|PERMISSION|Missing|denied/);
  accept(await commit(paid));assert.equal(saved.profile.data.coins,beforePaid-10);
  assert.equal(transitionSpark(state,paid,{uid,now,coinsBalance:0,letterEarned:state.letters.earned}).receipts.length,0);
  console.log(JSON.stringify({pass:true,valid:['three distinct','two same','three same','output matches inputs','legacy pending','legacy reader hint','lost-response recovery','sameUID race','missing-first','all-owned pre-consumption','stable entropy rebase','policy receipt replay','policy CAS race','paid all-owned -10 once'],denied:17,legacyFusionCoinsUnchanged:true}));
}finally{await env.cleanup();}
