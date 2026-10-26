import {test, expect} from '@playwright/test';

for (const reducedMotion of ['reduce', 'no-preference']) for (const size of [{width:320,height:568},{width:412,height:915},{width:844,height:390},{width:1024,height:900}]) {
  test(`startup first paint ${size.width}px ${reducedMotion} and navigation does not remount it`, async ({page}, info) => {
    await page.setViewportSize(size); await page.emulateMedia({reducedMotion});
    let release;
    const gate = new Promise(resolve => {release = resolve;});
    await page.route('**/js/main.js', async route => {await gate; await route.continue();});
    try {
      await page.goto('/', {waitUntil:'commit'});
      const loading = page.locator('#app-loading');
      await expect(loading).toBeVisible();
      await expect(loading.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
      await expect(loading.locator('[data-loading-percent]')).toHaveText('0%');
      await expect(loading.getByRole('progressbar')).toHaveAttribute('aria-valuemax','100');
      const content = await loading.locator('.startup-loading__content').boundingBox();
      expect(content.x).toBeGreaterThanOrEqual(0); expect(content.y).toBeGreaterThanOrEqual(0);
      expect(content.x+content.width).toBeLessThanOrEqual(size.width); expect(content.y+content.height).toBeLessThanOrEqual(size.height);
      await page.screenshot({path:info.outputPath('loading.png')});
      release();
      await expect(loading).toHaveCount(0, {timeout:20000});
      await expect(page.locator('.game-selector__choice')).toHaveCount(3);
      for (const id of ['memory-match','link-connect','triple-connect']) {
        await page.evaluate(async id => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id), id);
        await expect(loading).toHaveCount(0);
        await page.evaluate(async () => (await import('/js/gameSelector.js')).showGameSelector());
      }
      await expect(loading).toHaveCount(0);
    } finally {release();}
  });
}

test('pending code keeps real zero percent and exposes a technical slow-load code', async ({page}, info) => {
  await page.setViewportSize({width:412,height:915});
  await page.clock.install();
  let release;
  const gate = new Promise(resolve => {release = resolve;});
  await page.route('**/js/main.js', async route => {await gate; await route.continue();});
  try {
    await page.goto('/', {waitUntil:'commit'});
    const loading = page.locator('#app-loading'), progress = loading.getByRole('progressbar');
    await expect(progress).toHaveAttribute('aria-valuenow','0');
    await expect(loading.locator('[data-loading-percent]')).toHaveText('0%');
    await expect(loading).toHaveAttribute('data-controlled','true');
    await page.keyboard.press('Enter');
    await expect(page.locator('.adventure-map-page')).toHaveCount(0);
    await page.screenshot({path:info.outputPath('loading-activity.png')});
    await page.clock.fastForward(16000);
    await expect(loading.getByRole('button',{name:'Tải lại'})).toBeVisible();
    await expect(loading.locator('[data-loading-message]')).toHaveText('Mã lỗi: ST-LOAD-002');
    await expect(progress).toHaveAttribute('aria-valuenow','0');
    release();
    await expect(loading).toHaveCount(0);
    await expect(page.locator('.game-selector')).not.toHaveAttribute('inert','');
    await page.locator('.game-selector__choice').first().click();
    await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
  } finally {release();}
});

test('Home is available without waiting for its secondary illustrations', async ({page}) => {
  let release;
  const gate = new Promise(resolve => {release=resolve;});
  await page.route('**/assets/images/home/*.webp', async route => {await gate; await route.continue();});
  try {
    await page.goto('/', {waitUntil:'commit'});
    await expect(page.locator('#app-loading')).toHaveCount(0, {timeout:20000});
    await expect(page.locator('.game-selector__choice')).toHaveCount(3);
    await page.locator('.game-selector__choice').first().click();
    await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
  } finally {release();}
});

test('failed network module retries automatically and retains local data', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('startup-sentinel','kept'));
  let requests = 0;
  await page.route('**/js/main.js', route => ++requests === 1 ? route.abort('failed') : route.continue());
  await page.goto('/');
  await expect(page.locator('#app-loading [data-loading-message]')).toHaveText('Mã lỗi: ST-NET-001');
  await expect(page.locator('#app-loading [role="progressbar"]')).toBeHidden();
  await expect(page.locator('#app-loading')).toHaveCount(0, {timeout:20000});
  expect(await page.evaluate(() => localStorage.getItem('startup-sentinel'))).toBe('kept');
  expect(requests).toBe(2);
  expect(await page.evaluate(()=>sessionStorage.getItem('memoryMatchStartupRetry'))).toBeNull();
  await expect(page.locator('.game-selector__choice')).toHaveCount(3);
});

test('failed bootstrap entry still has a native reload fallback', async ({page}) => {
  let requests = 0;
  await page.route('**/js/bootstrap.js', route => ++requests === 1 ? route.abort('failed') : route.continue());
  await page.goto('/');
  const fallback = page.locator('.startup-loading__fallback');
  await expect(fallback).toBeHidden();
  // Complete the finite CSS fallback delay, without altering application timing.
  await fallback.evaluate(node => node.getAnimations().forEach(animation => animation.finish()));
  await expect(fallback).toBeVisible();
  await fallback.click();
  await expect(page.locator('#app-loading')).toHaveCount(0, {timeout:20000});
  await expect(page.locator('.game-selector__choice')).toHaveCount(3);
});

test('failed decorative and Home art does not prevent startup', async ({page}) => {
  await page.route('**/assets/images/loading/*.webp', route => route.abort('failed'));
  await page.route('**/assets/images/home/*.webp', route => route.abort('failed'));
  await page.goto('/');
  await expect(page.locator('#app-loading')).toHaveCount(0);
  await expect(page.locator('.game-selector__choice')).toHaveCount(3);
  await page.locator('.game-selector__choice').first().click();
  await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
});

test('blocked old save shows recovery without a loading mask', async ({page}) => {
  const original = JSON.stringify({formatVersion:999, revision:1, data:{coins:4321}});
  await page.addInitScript(original => localStorage.setItem('memoryMatchSave',original), original);
  await page.goto('/');
  await expect(page.locator('#app-loading')).toHaveCount(0);
  await expect(page.locator('#persistence-recovery-modal')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('memoryMatchSave'))).toBe(original);
});

test('startup presentation cleanup is idempotent across 30 owned cycles', async ({page}) => {
  await page.goto('/'); await expect(page.locator('#app-loading')).toHaveCount(0);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.clock.install();
  const result = await page.evaluate(async () => {
    const {createStartupLoading} = await import('/js/startupLoading.js');
    const source = new DOMParser().parseFromString(await (await fetch('/')).text(), 'text/html').getElementById('app-loading');
    const snapshots = [];
    for (let i=0; i<30; i++) {
      const root = source.cloneNode(true); document.body.append(root);
      const loading = createStartupLoading();
      let rejected = false;
      try {loading.complete('home');} catch {rejected = true;}
      for (const phase of ['modules','save','interface','home']) loading.complete(phase);
      const exit = loading.finish();
      loading.destroy(); loading.destroy(); await exit;
      snapshots.push({rejected, connected:root.isConnected, retryHandler:root.querySelector('[data-loading-retry]').onclick});
    }
    return snapshots;
  });
  for (const snapshot of result) expect(snapshot).toEqual({rejected:true, connected:false, retryHandler:null});
  await page.clock.fastForward(16000);
  await expect(page.locator('#app-loading')).toHaveCount(0);
});

test('ready Home stays inert during fade and interrupted fade settles cleanly', async ({page}) => {
  await page.goto('/'); await expect(page.locator('#app-loading')).toHaveCount(0);
  await page.emulateMedia({reducedMotion:'no-preference'});
  const result = await page.evaluate(async () => {
    const {createStartupLoading} = await import('/js/startupLoading.js');
    const root = new DOMParser().parseFromString(await (await fetch('/')).text(),'text/html').getElementById('app-loading');
    document.body.append(root);
    const loading = createStartupLoading();
    for (const phase of ['modules','save','interface']) loading.complete(phase);
    loading.prepareHome(); loading.complete('home');
    const finished = loading.finish();
    const animation = root.getAnimations().find(animation => animation.effect.target === root);
    animation.pause(); animation.currentTime = 90;
    const during = {inert:document.querySelector('.game-selector').inert,opacity:Number(getComputedStyle(root).opacity)};
    loading.destroy(); await finished;
    return {...during,connected:root.isConnected,released:!document.querySelector('.game-selector').inert};
  });
  expect(result.inert).toBe(true); expect(result.opacity).toBeGreaterThan(0); expect(result.opacity).toBeLessThan(1);
  expect(result.connected).toBe(false); expect(result.released).toBe(true);
});


test('startup percentage reports only completed phases and has no early Home preload',async({page})=>{
  await page.goto('/');await expect(page.locator('#app-loading')).toHaveCount(0);
  expect(await page.locator('link[rel="preload"][href$="memory-match-v2.webp"]').count()).toBe(0);
  const progress=await page.evaluate(async()=>{
    const {createStartupLoading}=await import('/js/startupLoading.js');
    const root=new DOMParser().parseFromString(await(await fetch('/')).text(),'text/html').getElementById('app-loading');document.body.append(root);
    const loading=createStartupLoading(),values=[];
    for(const phase of ['modules','save','interface','home']){loading.complete(phase);values.push([root.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'),root.querySelector('[data-loading-percent]').textContent]);}
    loading.destroy();return values;
  });
  expect(progress).toEqual([['25','25%'],['50','50%'],['75','75%'],['100','100%']]);
});

test('network retry stops after two reloads and manual retry starts a fresh budget',async({page})=>{
  let requests=0,fail=true;
  await page.route('**/js/main.js',route=>{requests++;return fail?route.abort('failed'):route.continue();});
  await page.goto('/');
  await expect(page.locator('[data-loading-message]')).toHaveText('Mã lỗi: ST-NET-003',{timeout:20000});
  expect(requests).toBe(3);
  expect(await page.evaluate(()=>sessionStorage.getItem('memoryMatchStartupRetry'))).toBe('2');
  fail=false;await page.locator('#app-loading').getByRole('button',{name:'Tải lại'}).click();
  await expect(page.locator('#app-loading')).toHaveCount(0,{timeout:20000});
  expect(requests).toBe(4);
});

test('initialization failure has a technical code and never reinitializes automatically',async({page})=>{
  let requests=0;
  await page.route('**/js/main.js',route=>{requests++;return route.fulfill({contentType:'text/javascript',body:'export async function initializeApplication(){throw new Error("implementation detail must stay out of UI");}'});});
  await page.goto('/');
  await expect(page.locator('[data-loading-message]')).toHaveText('Mã lỗi: ST-INIT-001');
  await page.clock.install();await page.clock.fastForward(60000);expect(requests).toBe(1);
  await expect(page.locator('#app-loading')).not.toContainText('implementation detail');
});

test('recovery waits for reconnection and cancellation releases its pending retry',async({page})=>{
  await page.goto('/');await expect(page.locator('#app-loading')).toHaveCount(0);await page.clock.install();
  await page.evaluate(async()=>{
    const {createStartupRecovery}=await import('/js/startupRecovery.js');
    window.retryCount=0;Object.defineProperty(navigator,'onLine',{configurable:true,value:false});
    window.retryOwner=createStartupRecovery({isWaiting:()=>true,onExhausted:()=>{throw Error('unexpected exhaustion');},reload:()=>window.retryCount++});window.retryOwner.reset();window.retryOwner.schedule();
  });
  await page.clock.fastForward(10000);expect(await page.evaluate(()=>window.retryCount)).toBe(0);
  await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,value:true});window.dispatchEvent(new Event('online'));});
  await page.clock.fastForward(2000);expect(await page.evaluate(()=>window.retryCount)).toBe(1);
  await page.evaluate(()=>{window.retryOwner.reset();});
  const result=await page.evaluate(async()=>{
    const {createStartupRecovery}=await import('/js/startupRecovery.js');
    const owner=createStartupRecovery({isWaiting:()=>true,onExhausted:()=>{},reload:()=>window.retryCount++});owner.schedule();owner.destroy();owner.destroy();return sessionStorage.getItem('memoryMatchStartupRetry');
  });
  await page.clock.fastForward(10000);expect(await page.evaluate(()=>window.retryCount)).toBe(1);expect(result).toBeNull();
});


test('a stalled module load reconnects automatically before initialization',async({page})=>{
  await page.clock.install();let release,requests=0;
  const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/js/main.js',async route=>{requests++;if(requests===1)await gate;await route.continue();});
  try {
    await page.goto('/',{waitUntil:'commit'});
    await expect(page.locator('#app-loading')).toHaveAttribute('data-controlled','true');
    await expect.poll(()=>requests).toBe(1);
    await page.clock.fastForward(17000);
    await expect.poll(()=>requests).toBe(2);
    await expect(page.locator('#app-loading')).toHaveCount(0,{timeout:20000});
    await expect(page.locator('.game-selector__choice')).toHaveCount(3);
    expect(await page.evaluate(()=>sessionStorage.getItem('memoryMatchStartupRetry'))).toBeNull();
  } finally {release();}
});


test('retry classification covers production CSS fetch errors without retrying code errors',async({page})=>{
  await page.goto('/');await expect(page.locator('#app-loading')).toHaveCount(0);
  const values=await page.evaluate(async()=>{
    const {isStartupNetworkError}=await import('/js/startupRecovery.js');
    return [new TypeError('Failed to fetch dynamically imported module: /assets/main.js'),new Error('Unable to preload CSS for /assets/main.css'),new SyntaxError('Missing export'),new Error('initialization bug'),null].map(isStartupNetworkError);
  });
  expect(values).toEqual([true,true,false,false,false]);
});
