import {test,expect} from '@playwright/test';
test.skip(process.env.VITE_FIREBASE_USE_EMULATORS!=='1','Auth/Firestore emulators required');
async function ready(page){await page.goto('/');await expect.poll(()=>page.evaluate(async()=>(await import('/js/accountService.js')).getAccountService()?.getState().bound),{timeout:45000}).toBe(true);await page.evaluate(async()=>{await(await import('/js/liveops/service.js')).requestLiveops();const i=(await import('/js/accountService.js')).getAccountService().getIdentity();window.missionPendingKey=`sparkPending:${i.environment}:${i.uid}:${i.profileId}`;});}
test('service grants new login coins and support once; durable lost-response replay cannot grant twice',async({page})=>{
 test.setTimeout(90000);await ready(page);
 const result=await page.evaluate(async()=>{
  const p=await import('/js/persistence.js'),s=await import('/js/liveops/service.js'),inv=await import('/js/liveops/supportInventory.js');
  const before=await p.loadPersistentGameData(),fresh=await s.requestLiveops({type:'login',loginVersion:2}),after=await p.loadPersistentGameData();
  await p.saveSyncMetadata(missionPendingKey,{type:'login',loginVersion:2,operation:fresh.loginResult.operation,loginCandidate:((({day,operation,...candidate})=>candidate)(fresh.loginResult)),day:fresh.state.day});
  const replay=await s.requestLiveops(),end=await p.loadPersistentGameData();
  return {coins:after.coins-before.coins,support:inv.chestSupportCount(after.progress,'link-connect','hint')-inv.chestSupportCount(before.progress,'link-connect','hint'),fresh:fresh.loginApplied,replay:replay.loginApplied,endCoins:end.coins,afterCoins:after.coins,pending:await p.loadSyncMetadata(missionPendingKey),receipt:end.appearance.spark.state.loginReward};
 });
 expect(result.coins).toBe(10);expect(result.support).toBe(1);expect(result.fresh).toBe(true);expect(result.replay).toBe(false);expect(result.endCoins).toBe(result.afterCoins);expect(result.pending).toBeNull();expect(result.receipt).toMatchObject({version:1,index:0,coins:10,supports:[{gameId:'link-connect',key:'hint'}]});
});
test('full support inventory keeps the exact pending login and grants the whole reward after space is available',async({page})=>{
 test.setTimeout(90000);await ready(page);
 const result=await page.evaluate(async()=>{
  const p=await import('/js/persistence.js'),s=await import('/js/liveops/service.js'),{GAMEPLAY_LIMITS}=await import('/js/gameplayTuning.js'),{getGameProgressKey}=await import('/js/gameCatalog.js'),inv=await import('/js/liveops/supportInventory.js'),key=getGameProgressKey('link-connect');
  const fill=async count=>{const d=await p.loadPersistentGameData();await p.saveProgress({...d.progress,[key]:{...(d.progress[key]||{}),items:{...(d.progress[key]?.items||{}),hint:count}}});};
  await fill(GAMEPLAY_LIMITS.itemCount);const before=await p.loadPersistentGameData();let error;try{await s.requestLiveops({type:'login',loginVersion:2});}catch(e){error=e.code;}
  const pending=await p.loadSyncMetadata(missionPendingKey),held=await p.loadPersistentGameData();await fill(GAMEPLAY_LIMITS.itemCount-1);const claimed=await s.requestLiveops(),end=await p.loadPersistentGameData();
  return {error,heldCoins:held.coins-before.coins,heldNext:held.appearance.spark.state.loginNext,candidate:pending.loginCandidate,receipt:claimed.loginResult,pending:await p.loadSyncMetadata(missionPendingKey),coins:end.coins-before.coins,count:inv.chestSupportCount(end.progress,'link-connect','hint'),cap:GAMEPLAY_LIMITS.itemCount};
 });
 expect(result.error).toBe('rewards/inventory-full');expect(result.heldCoins).toBe(0);expect(result.heldNext).toBe(0);expect(result.receipt).toMatchObject(result.candidate);expect(result.pending).toBeNull();expect(result.coins).toBe(10);expect(result.count).toBe(result.cap);
});
