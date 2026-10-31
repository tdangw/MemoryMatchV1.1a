import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
test.skip(process.env.VITE_FIREBASE_USE_EMULATORS !== '1', 'Isolated emulators required');
test('Firestore login/spin survive interruption and reload; another account sees equipped starter only', async ({ browser, baseURL }) => {
  test.setTimeout(90000);
  const a = await browser.newContext({ baseURL }), b = await browser.newContext({ baseURL });
  try {
    const page = await a.newPage(), other = await b.newPage();
    const ready = async target => {
      await target.goto('/');
      await expect.poll(() => target.evaluate(async () => (await import('/js/accountService.js')).getAccountService()?.getState().bound), { timeout: 30000 }).toBe(true);
      await target.evaluate(async () => (await import('/js/liveops/service.js')).requestLiveops());
    };
    await ready(page); await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('[data-dock-action="missions"]:visible').click();
    await expect(page.getByRole('button', { name: 'Nhận 10 Xu', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Nhận 10 Xu', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Đã nhận hôm nay', exact: true })).toBeDisabled();
    await page.locator('[data-dock-action="events"]:visible').click();
    const spin = page.getByRole('button', { name: 'Quay miễn phí', exact: true });
    await page.evaluate(() => {
      const sample = window.spinSample = { frames: [], longTasks: [], running: true, previous: performance.now(), heapBefore: performance.memory?.usedJSHeapSize };
      sample.observer = new PerformanceObserver(list => { for (const item of list.getEntries()) sample.longTasks.push(item.duration); });
      sample.observer.observe({ entryTypes: ['longtask'] });
      const frame = time => { if (!sample.running) return; sample.frames.push(time - sample.previous); sample.previous = time; requestAnimationFrame(frame); };
      requestAnimationFrame(frame);
    });
    await expect(spin).toBeEnabled(); await spin.click();
    await page.waitForFunction(() => document.querySelector('.liveops__rotor')?.getAnimations().length > 0);
    await page.waitForFunction(() => window.spinSample.frames.length >= 20);
    const before = await page.evaluate(async () => {
      const data = await (await import('/js/persistence.js')).loadPersistentGameData();
      return { coins: data.coins, applied: data.appearance.spark.state };
    });
    await page.locator('[data-dock-action="missions"]:visible').click(); // Interrupt presentation after durable grant.
    const sample = await page.evaluate(() => {
      const data = window.spinSample; data.running = false; data.observer.disconnect();
      return { frames: data.frames, longTasks: data.longTasks, heapBefore: data.heapBefore, heapAfter: performance.memory?.usedJSHeapSize, platform: 'desktop Chromium emulator; not phone FPS' };
    });
    mkdirSync('runtime/qa', { recursive: true }); writeFileSync('runtime/qa/rewards-liveops-spin-measurement.json', JSON.stringify(sample, null, 2));
    await ready(page);
    const after = await page.evaluate(async () => {
      const data = await (await import('/js/persistence.js')).loadPersistentGameData();
      return { coins: data.coins, applied: data.appearance.spark.state };
    });
    expect(after).toEqual(before);
    await page.locator('[data-dock-action="events"]:visible').click();
    await expect(page.getByRole('button', { name: 'Quay miễn phí', exact:true })).toHaveCount(0);
    await expect(page.locator('.liveops__spin-primary')).toHaveAttribute('data-spin-source','ad');
    await expect(page.getByRole('button', { name: 'Xem quảng cáo · Thêm 1 lượt' })).toBeDisabled();
    const uid = await page.evaluate(async () => {
      const { gameState } = await import('/js/gameState.js');
      const cosmetics = { avatar: 'starter-avatar-little-sparrow', frame: 'starter-frame-plain-wood', badge: 'starter-badge-first-leaf' };
      await (await import('/js/persistence.js')).saveAppearance({ ...gameState.appearance, profileCosmetics: cosmetics }, { cloudEvent: true });
      await (await import('/js/progression/publicCosmeticSync.js')).getPublicCosmeticSync().syncNow();
      return (await import('/js/accountService.js')).getAccountService().getIdentity().uid;
    });
    await ready(other);
    await other.emulateMedia({ reducedMotion: 'reduce' });
    await other.locator('[data-dock-action="events"]:visible').click();
    await expect(other.getByRole('button', { name: 'Quay miễn phí', exact: true })).toBeEnabled();
    await other.getByRole('button', { name: 'Quay miễn phí', exact: true }).click();
    await expect(other.getByRole('button', { name: 'Quay miễn phí', exact:true })).toHaveCount(0);
    await expect(other.locator('.liveops__spin-primary')).toHaveAttribute('data-spin-source','ad');
    await other.getByRole('button', { name:'Xem vòng quay', exact:true }).click();
    await expect(other.locator('.liveops__rotor')).toBeVisible();
    expect(await other.locator('.liveops__rotor').evaluate(node => node.getAnimations().length)).toBe(0);
    await expect.poll(() => other.evaluate(async uid => {
      const backend = await (await import('/js/firebaseBackend.js')).getFirebaseBackend();
      const result = await (await import('/js/progression/publicCosmeticStore.js')).readPublicCosmetics({ database: backend.database,
        environment: backend.environment, uids: [uid], refresh: true });
      return result.selections.get(uid);
    }, uid)).toEqual({ avatar: 'starter-avatar-little-sparrow', frame: 'starter-frame-plain-wood', badge: 'starter-badge-first-leaf' });
  } finally { await a.close(); await b.close(); }
});

test('switching UID in one storage keeps a recovery backup and never transfers reward mirror',async({page})=>{
  test.setTimeout(60000);await page.goto('/');
  await expect.poll(()=>page.evaluate(async()=>(await import('/js/accountService.js')).getAccountService()?.getState().bound),{timeout:30000}).toBe(true);
  const old=await page.evaluate(async()=>{
    const service=await import('/js/liveops/service.js');await service.requestLiveops();await service.requestLiveops({type:'login'});
    const p=await import('/js/persistence.js');const data=await p.loadPersistentGameData();return {uid:data.appearance.spark.ownerUid,coins:data.coins};
  });
  await page.evaluate(async()=>{
    const sdk=performance.getEntriesByType('resource').find(entry=>entry.name.includes('/deps/firebase_auth.js')).name;
    const auth=await import(sdk);const email=`spark-new-${crypto.randomUUID()}@example.test`;
    const credential=auth.GoogleAuthProvider.credential(JSON.stringify({sub:email,email,email_verified:true}));
    await (await import('/js/accountService.js')).getAccountService().acceptGoogleCredential(credential);
  });
  await expect.poll(()=>page.evaluate(async()=>(await import('/js/accountService.js')).getAccountService()?.getState().phase),{timeout:30000}).toBe('synced');
  await page.evaluate(async()=>{await(await import('/js/liveops/service.js')).requestLiveops();});
  const next=await page.evaluate(async()=>{
    const p=await import('/js/persistence.js'),data=await p.loadPersistentGameData();return {uid:data.appearance.spark.ownerUid,coins:data.coins,backups:(await p.getLocalRestoreBackups()).map(v=>({coins:v.profile.data.coins,uid:v.profile.data.appearance.spark?.ownerUid}))};
  });
  expect(next.uid).not.toBe(old.uid);expect(next.coins).toBe(0);expect(next.backups.some(v=>v.uid===old.uid&&v.coins===old.coins)).toBe(true);
  const claim=await page.evaluate(async()=>(await import('/js/liveops/service.js')).requestLiveops({type:'login'}));expect(claim.appliedCoins).toBe(10);
});

test('shared letter inventory renders M-M--- -A--- and sell/fuse survive reload',async({page})=>{
  test.setTimeout(60000);await page.goto('/');
  await expect.poll(()=>page.evaluate(async()=>(await import('/js/accountService.js')).getAccountService()?.getState().bound),{timeout:30000}).toBe(true);
  await page.evaluate(async()=>{
    const service=await import('/js/liveops/service.js');await service.requestLiveops();
    const p=await import('/js/persistence.js'),data=await p.loadPersistentGameData();
    const spark={...data.appearance.spark,letterEarned:{M:2,A:1}};
    await p.saveAppearance({...data.appearance,spark});await service.requestLiveops();
    (await import('/js/liveops/presentation.js')).openLiveopsPage('events');
  });
  await expect(page.locator('.liveops__letter-slots').first()).toHaveText('M-M--- -A---');
  await page.evaluate(async()=>{
    const p=await import('/js/persistence.js'),data=await p.loadPersistentGameData();
    await p.saveAppearance({...data.appearance,spark:{...data.appearance.spark,letterEarned:{M:5,A:1}}});
  });
  await page.getByRole('button',{name:'Tải lại tiến độ',exact:true}).click();
  await page.getByRole('combobox',{name:'Chọn chữ'}).selectOption('M');
  await page.evaluate(async()=>{
    const service=await import('/js/liveops/service.js');
    try{await service.requestLiveops({type:'sellLetter',letter:'M',quantity:999});throw Error('Expected rejection');}
    catch(error){if(error.code!=='rewards/invalid-operation')throw error;}
    await service.requestLiveops();
  });
  const before=await page.evaluate(async()=>(await(await import('/js/persistence.js')).loadPersistentGameData()).coins);
  await page.getByRole('button',{name:'Ghép 3 chữ M',exact:true}).click();
  await expect(page.locator('.liveops__status')).toContainText('Đã nhận chữ');
  const fused=await page.evaluate(async()=>(await(await import('/js/persistence.js')).loadPersistentGameData()).appearance.spark.state.letters);
  expect(Object.values(fused.counts).reduce((a,b)=>a+b,0)).toBe(4);expect(fused.sequence).toBe(1);
  await page.getByRole('button',{name:'Bán · 1.000 Xu mỗi chữ',exact:true}).click();
  await expect(page.locator('.liveops__status')).toContainText('1000 Xu');
  const snapshot=await page.evaluate(async()=>{const d=await(await import('/js/persistence.js')).loadPersistentGameData();return {coins:d.coins,letters:d.appearance.spark.state.letters};});
  expect(snapshot.coins).toBe(before+1000);expect(snapshot.letters.sequence).toBe(2);
  await page.reload();await expect.poll(()=>page.evaluate(async()=>(await import('/js/accountService.js')).getAccountService()?.getState().bound),{timeout:30000}).toBe(true);
  await page.evaluate(async()=>{await(await import('/js/liveops/service.js')).requestLiveops();});
  const restored=await page.evaluate(async()=>{const d=await(await import('/js/persistence.js')).loadPersistentGameData();return {coins:d.coins,letters:d.appearance.spark.state.letters};});
  expect(restored).toEqual(snapshot);
  const exchanged=await page.evaluate(async()=>{
    const p=await import('/js/persistence.js'),d=await p.loadPersistentGameData(),{LETTER_SETS}=await import('/js/liveops/config.js');
    const target={...d.appearance.spark.letterEarned};for(const[letter,n]of Object.entries(LETTER_SETS[0].required))target[letter]=(target[letter]||0)+n;
    await p.saveAppearance({...d.appearance,spark:{...d.appearance.spark,letterEarned:target}});
    await(await import('/js/liveops/service.js')).requestLiveops();
    return {achievements:d.appearance.achievements};
  });
  await page.evaluate(async()=>{(await import('/js/liveops/presentation.js')).openLiveopsPage('events');});
  await page.getByRole('button',{name:'Đổi MEMORY MATCH',exact:true}).click();
  await expect(page.locator('.liveops__status')).toContainText('Đã nhận Gấu Trúc Ký Ức');
  const granted=await page.evaluate(async()=>{
    const p=await import('/js/persistence.js'),d=await p.loadPersistentGameData(),model=await import('/js/progression/achievementModel.js');
    const id='letters-memory-avatar-moss-redpanda';
    return {achievements:d.appearance.achievements,owned:model.ownedProfileCosmeticItems(d.appearance).some(item=>item.id===id),
      equipped:model.normalizeProfileCosmetics({avatar:id},d.appearance.achievements,d.appearance.acquisitions).avatar,
      grants:Object.values(d.appearance.acquisitions.grants).filter(grant=>grant.sourceKind==='letters').length};
  });
  expect(granted.owned).toBe(true);expect(granted.equipped).toBe('letters-memory-avatar-moss-redpanda');expect(granted.grants).toBe(1);expect(granted.achievements).toEqual(exchanged.achievements);
  await page.screenshot({path:'design/rewards-letters/review/events-earned-runtime.png',fullPage:true});
});

test('stale backup cannot refund spent coins before a later gameplay write',async({page})=>{
  test.setTimeout(90000);await page.goto('/');
  await expect.poll(()=>page.evaluate(async()=>(await import('/js/accountService.js')).getAccountService()?.getState().bound),{timeout:30000}).toBe(true);
  const original=await page.evaluate(async()=>{
    const service=await import('/js/liveops/service.js'),p=await import('/js/persistence.js');await service.requestLiveops();await p.saveCoins(1000);
    await service.requestLiveops({type:'spin',source:'free'});
    const account=(await import('/js/accountService.js')).getAccountService(),env=account.getIdentity().environment;
    const backup=await p.exportPersistentSnapshot(),metadata=await p.loadSyncMetadata(env);
    await p.importPersistentSnapshot(backup,env,metadata);
    const coins=(await p.loadPersistentGameData()).coins;await p.saveCoins(coins-58);await account.syncNow({manual:true});return coins;
  });
  await expect.poll(()=>page.evaluate(async()=>(await import('/js/accountService.js')).getAccountService().getState().phase),{timeout:35000}).toBe('synced');
  const restore=await page.evaluate(async()=>{
    const account=(await import('/js/accountService.js')).getAccountService();try{await account.restoreLocalBackup();return 'unexpected';}catch(error){return error.code;}
  });
  expect(restore).toBe('rewards/stale-backup');
  const after=await page.evaluate(async()=>{
    const p=await import('/js/persistence.js'),d=await p.loadPersistentGameData();await p.saveCoins(d.coins+2);
    return {coins:(await p.loadPersistentGameData()).coins,backups:(await p.getLocalRestoreBackups()).length};
  });
  expect(after.coins).toBe(original-56);expect(after.backups).toBeGreaterThan(0);
});
test('twenty enabled page cycles coalesce status and keep root revision and owners stable',async({page})=>{
  test.setTimeout(60000);await page.goto('/');
  await expect.poll(()=>page.evaluate(async()=>(await import('/js/accountService.js')).getAccountService()?.getState().bound),{timeout:30000}).toBe(true);
  await page.evaluate(async()=>{await(await import('/js/liveops/service.js')).requestLiveops();});
  for(const reducedMotion of ['reduce','no-preference']){
    await page.emulateMedia({reducedMotion});
    const sample=await page.evaluate(async()=>{
      const service=await import('/js/liveops/service.js'),{openLiveopsPage}=await import('/js/liveops/presentation.js');
      const backend=await(await import('/js/firebaseBackend.js')).getFirebaseBackend(),account=(await import('/js/accountService.js')).getAccountService(),uid=account.getIdentity().uid;
      const cloud=await import('/js/cloudStore.js'),beforeRoot=await cloud.readCloudRoot(backend.database,backend.environment,uid);
      const owner=(await import('/js/appPageLifecycle.js')).getAppPageScope(),before=owner.diagnostics();
      for(let cycle=0;cycle<20;cycle++){const modal=openLiveopsPage(cycle%2?'missions':'events');modal.destroy();}
      await service.requestLiveops();
      const afterRoot=await cloud.readCloudRoot(backend.database,backend.environment,uid);
      return {before,after:owner.diagnostics(),nodes:document.querySelectorAll('.liveops').length,revisionBefore:beforeRoot.revision,revisionAfter:afterRoot.revision};
    });
    expect(sample.nodes).toBe(0);expect(sample.after).toEqual(sample.before);expect(sample.revisionAfter).toBe(sample.revisionBefore);
  }
});
