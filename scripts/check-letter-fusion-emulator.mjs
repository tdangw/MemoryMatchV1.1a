import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { encodeCloudSnapshot } from '../js/cloudSnapshot.js';
import { publishCloudSnapshot, readCloudRoot, readCloudSnapshot } from '../js/cloudStore.js';
import { confirmSparkClock, readSparkState } from '../js/liveops/store.js';
import { transitionSpark, normalizeSparkSave } from '../js/liveops/sparkModel.js';
import { LETTER_ALPHABET, LETTER_SYNC_KEYS_PER_COMMIT } from '../js/liveops/config.js';
const [host,port]=(process.env.FIRESTORE_EMULATOR_HOST||'').split(':');
if(!port)throw Error('Isolated emulator required');
const env=await initializeTestEnvironment({projectId:'demo-letter-fusion',firestore:{host,port:Number(port),rules:fs.readFileSync('firestore.rules','utf8')}});
const uid='fusion-test',space='test',db=env.authenticatedContext(uid).firestore(),second=env.authenticatedContext(uid).firestore();
let saved={snapshotVersion:1,profile:{formatVersion:2,revision:1,data:{coins:100,appearance:{},progress:{},settings:{}}},chapters:[]};
let state=null,revision=0,now;
let operation=0;
const next=(ingredients)=>({type:'fuseLetter',ingredients,sequence:state.letters.sequence+1,operation:`fusion-${++operation}`});
async function commit(command={type:'status'},options={}){
  const before=options.state||state,copy=structuredClone(saved),result=transitionSpark(before,command,{uid,now,randomLetter:options.received||'A',letterEarned:options.earned||before?.letters.earned||{}});
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
  console.log(JSON.stringify({pass:true,valid:['three distinct','two same','three same','output matches inputs','legacy pending','legacy reader hint','lost-response recovery','sameUID race'],denied:12,coinsUnchanged:true}));
}finally{await env.cleanup();}
