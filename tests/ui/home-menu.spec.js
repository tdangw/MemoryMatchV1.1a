import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('docs/design/home-menu/qa',{recursive:true});
const games = ['memory-match','link-connect','triple-connect'];
for (const viewport of [{width:320,height:740},{width:412,height:915},{width:844,height:390},{width:1024,height:900}]) test(`illustrated home is bounded and selectable at ${viewport.width}`,async ({page})=>{
  await page.setViewportSize(viewport); await page.goto('/');
  const root=page.locator('.game-selector'), choices=root.locator('.game-selector__choice');
  await expect(choices).toHaveCount(3); await expect(root.locator('.menu-description')).toHaveCount(0);
  await expect.poll(()=>root.locator('.game-selector__art').evaluateAll(els=>els.every(im=>im.complete&&im.naturalWidth>0))).toBe(true);
  const footer=await root.locator('.adventure-footer').boundingBox(); expect(footer.width).toBe(Math.min(viewport.width,640)); const rects=[];
  for(const choice of await choices.all()) {
    await expect(choice).toBeInViewport({ratio:1}); const b=await choice.boundingBox(); rects.push(b);
    expect(b.y+b.height).toBeLessThanOrEqual(footer.y); expect(b.x).toBeGreaterThanOrEqual(0); expect(b.x+b.width).toBeLessThanOrEqual(viewport.width); expect(b.height).toBeGreaterThanOrEqual(120);
    const label=await choice.locator('.game-selector__label').boundingBox(); expect(label.y+label.height).toBeLessThanOrEqual(b.y+b.height);
    expect(await choice.locator('strong').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  }
  if(viewport.width>viewport.height && viewport.height<=600) { expect(Math.abs(rects[0].y-rects[2].y)).toBeLessThan(1); }
  else { expect(rects[0].width).toBeGreaterThan(rects[1].width*1.9); expect(Math.abs(rects[1].y-rects[2].y)).toBeLessThan(1); }
  expect(await root.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await page.screenshot({path:`docs/design/home-menu/qa/home-${viewport.width}.png`,animations:'disabled'});
  for(const game of games) {
    await page.locator(`.game-selector__choice[data-game-id="${game}"]`).click();
    await expect(page.locator(`#menu-container.${game}-menu[data-map-ready="true"]`)).toBeVisible();
    await page.locator('.adventure-map-page .adventure-exit').click(); await expect(page.locator('.game-selector__choice')).toHaveCount(3);
  }
});
test('missing illustrations keep named buttons and keyboard navigation usable',async ({page})=>{
  await page.setViewportSize({width:412,height:915}); await page.route('**/assets/images/home/*.webp',route=>route.abort()); await page.goto('/');
  await expect.poll(()=>page.locator('.game-selector__art').evaluateAll(els=>els.every(im=>im.hidden))).toBe(true);
  for(const image of await page.locator('.game-selector__art').all()) await expect(image).toBeHidden();
  const first=page.getByRole('button',{name:'Memory Match',exact:true}); await expect(first).toBeVisible(); await first.focus();
  await expect(first).toBeFocused(); await page.keyboard.press('Tab'); await expect(page.getByRole('button',{name:'Link Connect',exact:true})).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.getByRole('button',{name:'Triple Connect',exact:true})).toBeFocused();
  await page.screenshot({path:'docs/design/home-menu/qa/home-fallback.png',animations:'disabled'});
  await page.keyboard.press('Enter'); await expect(page.locator('#menu-container.triple-connect-menu[data-map-ready="true"]')).toBeVisible();
});
test('a fourth catalog game uses an equal two-column grid without requiring art',async ({page})=>{
  await page.setViewportSize({width:412,height:915});
  await page.route('**/js/gameRegistry.js',async route=>{ const response=await route.fetch(); const body=(await response.text()).replace('.map(entry => entry.definition);','.map(entry => entry.definition).concat([{id:"future-game",title:"Fourth Game",description:"",icon:"puzzle"}]);'); await route.fulfill({response,body}); });
  await page.goto('/'); const choices=page.locator('.game-selector__choice'); await expect(choices).toHaveCount(4);
  await expect(page.locator('.game-selector__choices')).toHaveAttribute('data-layout','grid'); await expect(page.locator('.game-selector__choice--featured')).toHaveCount(0);
  const rects=await choices.evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
  expect(Math.abs(rects[0].width-rects[3].width)).toBeLessThan(1); expect(rects[2].y).toBeGreaterThan(rects[0].y); expect(Math.abs(rects[2].y-rects[3].y)).toBeLessThan(1);
  await expect(page.getByRole('button',{name:'Fourth Game',exact:true})).toBeInViewport({ratio:1});
});
test('thirty Home/game/tab cycles release old owners and preserve the durable profile',async ({page})=>{
  test.setTimeout(120000); await page.goto('/'); await expect(page.locator('.game-selector__choice')).toHaveCount(3);
  const result=await page.evaluate(async()=>{
    const {getAppPageScope}=await import('/js/appPageLifecycle.js'); const {loadPersistentGameData}=await import('/js/persistence.js');
    const before=await loadPersistentGameData();
    const baseline=getAppPageScope().diagnostics(); const disposed=[];
    for(let i=0;i<30;i++) {
      const previous=getAppPageScope(); const id=['memory-match','link-connect','triple-connect'][i%3];
      await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id); disposed.push(previous.diagnostics());
      document.querySelector('[data-dock-action="settings"]').click();
      document.querySelector('.adventure-screen > .adventure-exit').click();
      if(document.querySelectorAll('.game-selector__choice').length!==3||document.querySelectorAll('#menu-container').length!==1)throw new Error('Home nodes duplicated');
      const current=getAppPageScope().diagnostics(); if(JSON.stringify(current)!==JSON.stringify(baseline))throw new Error('Home resources grew');
    }
    return {baseline,disposed,after:getAppPageScope().diagnostics(),profileBefore:JSON.stringify(before.progress),profileAfter:JSON.stringify((await loadPersistentGameData()).progress)};
  });
  expect(result.after).toEqual(result.baseline); expect(result.profileAfter).toBe(result.profileBefore);
  for(const scope of result.disposed) for(const [key,value] of Object.entries(scope)) expect(value).toBe(key==='active'?false:0);
  writeFileSync('docs/design/home-menu/qa/home-30-cycles.json',JSON.stringify(result,null,2));
});
