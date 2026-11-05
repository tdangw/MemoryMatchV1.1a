import { test,expect } from '@playwright/test';
test.skip(process.env.VITE_FIREBASE_USE_EMULATORS!=='1','Isolated Auth/Firestore emulators required');
async function ready(page){
 await page.goto('/');await expect.poll(()=>page.evaluate(async()=>(await import('/js/accountService.js')).getAccountService()?.getState().bound),{timeout:45000}).toBe(true);
 await page.evaluate(async()=>{
  const p=await import('/js/persistence.js'),service=await import('/js/liveops/service.js');await service.requestLiveops();
  const data=await p.loadPersistentGameData();await p.saveAppearance({...data.appearance,spark:{...data.appearance.spark,ticketEarned:data.appearance.spark.ticketEarned+8}});await service.requestLiveops();
  const account=(await import('/js/accountService.js')).getAccountService().getIdentity();window.wheelPendingKey=`sparkPending:${account.environment}:${account.uid}:${account.profileId}`;
 });
}
test('service creates weighted V2 entropy and acknowledges a recovered result once without a second grant',async({page})=>{
 test.setTimeout(90000);await ready(page);
 const result=await page.evaluate(async()=>{
  const p=await import('/js/persistence.js'),service=await import('/js/liveops/service.js'),before=await p.loadPersistentGameData(),native=crypto.getRandomValues.bind(crypto);
  crypto.getRandomValues=target=>target instanceof Uint32Array&&target.length===1?(target[0]=Math.floor(.2*4294967296),target):native(target);
  let fresh;try{fresh=await service.requestLiveops({type:'spin',source:'free'});}finally{crypto.getRandomValues=native;}
  const after=await p.loadPersistentGameData(),s=fresh.spin;
  await p.saveSyncMetadata(wheelPendingKey,{type:'spin',source:s.source,day:s.day,operation:s.operation,sector:s.sector,wheelVersion:2,wheelRolls:[.2,.2,.2,.2,.2,.2],wheelCandidate:s.wheel});
  const recovered=await service.requestLiveops(),ack=await p.loadSyncMetadata(wheelPendingKey),again=await service.requestLiveops(),end=await p.loadPersistentGameData();
  return {fresh:{sector:s.sector,version:s.wheel.version,applied:fresh.wheelApplied,rewards:fresh.committedWheelRewards},coins:after.coins-before.coins,recovered:{applied:recovered.wheelApplied,rewards:recovered.committedWheelRewards},ack,again:again.committedWheelRewards,endCoins:end.coins,afterCoins:after.coins};
 });
 expect(result.fresh).toEqual({sector:0,version:2,applied:true,rewards:[{kind:'coins',amount:5}]});expect(result.coins).toBe(5);
 expect(result.recovered).toEqual({applied:false,rewards:[{kind:'coins',amount:5}]});expect(result.ack).toBeNull();expect(result.again).toEqual([]);expect(result.endCoins).toBe(result.afterCoins);
});
test('claiming a full-inventory gift preserves a queued spin and uses its original entropy after the claim',async({page})=>{
 test.setTimeout(90000);await ready(page);
 const result=await page.evaluate(async()=>{
  const p=await import('/js/persistence.js'),service=await import('/js/liveops/service.js'),{GAMEPLAY_LIMITS}=await import('/js/gameplayTuning.js');
  const fill=async count=>{const d=await p.loadPersistentGameData();await p.saveProgress({...d.progress,memoryMatch:{...(d.progress.memoryMatch||{}),items:{...(d.progress.memoryMatch?.items||{}),hint:count}}});};
  await fill(GAMEPLAY_LIMITS.itemCount);let view=await service.requestLiveops();
  const heldOp={type:'spin',source:'ticket',day:view.state.day,sequence:view.state.ticketSpent+1,operation:'held-wheel-support',wheelVersion:2,wheelRolls:[.95,0,0,0,0,0]};await p.saveSyncMetadata(wheelPendingKey,heldOp);
  const held=await service.requestLiveops();const queued={type:'spin',source:'ticket',day:held.state.day,sequence:held.state.ticketSpent+1,operation:'queued-wheel-ten',wheelVersion:2,wheelRolls:[.5,.5,.5,.5,.5,.5]};await p.saveSyncMetadata(wheelPendingKey,queued);
  const stillFull=await service.requestLiveops({type:'claimWheelReward',wheelOperation:heldOp.operation}),preserved1=await p.loadSyncMetadata(wheelPendingKey);
  await fill(GAMEPLAY_LIMITS.itemCount-1);const claim=await service.requestLiveops({type:'claimWheelReward',wheelOperation:heldOp.operation}),preserved2=await p.loadSyncMetadata(wheelPendingKey);
  const coinsBefore=(await p.loadPersistentGameData()).coins,processed=await service.requestLiveops(),data=await p.loadPersistentGameData();
  return {held:held.state.pendingWheel?.operation,heldRewards:held.committedWheelRewards,stillFull:stillFull.state.pendingWheel?.operation,preserved1:preserved1?.operation,preserved2:preserved2?.operation,claimRewards:claim.committedWheelRewards,claimPending:claim.state.pendingWheel,spentBefore:claim.state.ticketSpent,spentAfter:processed.state.ticketSpent,processed:processed.spin?.wheel,coins:data.coins-coinsBefore,count:data.progress.memoryMatch.items.hint,cap:GAMEPLAY_LIMITS.itemCount,pending:await p.loadSyncMetadata(wheelPendingKey)};
 });
 expect(result.held).toBe('held-wheel-support');expect(result.heldRewards).toEqual([]);expect(result.stillFull).toBe(result.held);
 expect(result.preserved1).toBe('queued-wheel-ten');expect(result.preserved2).toBe('queued-wheel-ten');expect(result.claimPending).toBeNull();expect(result.claimRewards).toEqual([{kind:'support',gameId:'memory-match',key:'hint',amount:1}]);
 expect(result.spentAfter).toBe(result.spentBefore+1);expect(result.processed).toMatchObject({version:2,sector:1,kind:'coins',coins:10});expect(result.coins).toBe(10);expect(result.count).toBe(result.cap);expect(result.pending).toBeNull();
});
