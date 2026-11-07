import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const fixture=readFileSync('tests/ui/events-festival.spec.js','utf8').match(/const fixture = `([\s\S]*?)`;/)[1];
async function ready(page){await page.route('**/js/liveops/service.js*',r=>r.fulfill({contentType:'text/javascript',body:fixture}));await page.goto('/');await expect(page.locator('.game-selector__choice').first()).toBeVisible();await page.evaluate(async()=>{await(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('memory-match');(await import('/js/gameState.js')).gameState.settings.sound=false;});await page.getByRole('button',{name:'Sự kiện',exact:true}).click();await expect(page.locator('.liveops__spin-primary')).toBeEnabled();}
test('wheel and letters have no redundant links; inventory and recipes use the gameplay letter atlas',async({page},info)=>{
 test.setTimeout(90000);await ready(page);
 for(const viewport of [{width:320,height:640},{width:412,height:915},{width:844,height:390}]){await page.setViewportSize(viewport);
  for(const skin of ['default','woodland','papercut','starship','storybook']){
   await page.evaluate(async skin=>(await import('/js/uiSkin.js')).selectUiSkin(skin),skin);
   for(const tab of ['Vòng quay','Sưu tập chữ']){
    await page.getByRole('tab',{name:tab,exact:true}).click();await expect(page.getByRole('button',{name:'Tải lại tiến độ',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Xem Kho rương',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Thử lại',exact:true})).toBeHidden();
   }
   const sprites=await page.locator('.liveops__letter-grid .liveops__letter-art').evaluateAll(async ns=>{
    const {LETTER_ALPHABET}=await import('/js/liveops/config.js');return ns.map((n,i)=>({background:getComputedStyle(n).backgroundImage,position:n.style.backgroundPosition,expected:`${i%5*25}% ${Math.floor(i/5)*100/3}%`,name:n.parentElement.getAttribute('aria-label'),letter:LETTER_ALPHABET[i],width:n.getBoundingClientRect().width,parent:n.parentElement.getBoundingClientRect().width}));
   });expect(sprites).toHaveLength(17);for(const sprite of sprites){expect(sprite.background).toContain('/assets/rewards/letters/letters-v2-128.webp');sprite.position.split(' ').forEach((n,i)=>expect(parseFloat(n)).toBeCloseTo(parseFloat(sprite.expected.split(' ')[i]),3));expect(sprite.name).toContain(`Chữ ${sprite.letter},`);expect(sprite.width).toBeLessThan(sprite.parent);}
   for(const label of ['MEMORY MATCH','LINK CONNECT','TRIPLE CONNECT','ADVENTURE']){await page.getByRole('tab',{name:label,exact:true}).click();await expect(page.locator('.liveops__recipe-word .liveops__letter-art')).toHaveCount(label.replaceAll(' ','').length);await expect(page.locator('.liveops__recipe-reward .liveops__chest-art')).toHaveCount(1);
    const row=await page.locator('.liveops__recipe-word .liveops__letter-art').evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {top:r.top,left:r.left,right:r.right};}));expect(new Set(row.map(r=>Math.round(r.top))).size).toBe(1);expect(row[0].left).toBeGreaterThanOrEqual(0);expect(row.at(-1).right).toBeLessThanOrEqual(viewport.width);await expect(page.locator('.liveops__recipe progress')).toHaveCount(0);
   }
   const grid=await page.locator('.liveops__letter-grid').evaluate(n=>({columns:getComputedStyle(n).gridTemplateColumns.split(' ').length,height:n.getBoundingClientRect().height,widths:[...n.children].map(c=>c.getBoundingClientRect().width)}));expect(grid.columns).toBe(6);expect(grid.height).toBeLessThan(160);expect(Math.min(...grid.widths)).toBeGreaterThanOrEqual(28);expect(Math.max(...grid.widths)).toBeLessThanOrEqual(46);
   const choices=await page.locator('.liveops__set-choices').evaluate(node=>({wrap:getComputedStyle(node).flexWrap,rows:new Set([...node.children].map(child=>Math.round(child.getBoundingClientRect().top))).size}));expect(choices).toEqual({wrap:'nowrap',rows:1});
   if(viewport.width===412&&skin==='default'){await page.locator('.liveops__inventory').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('letter-atlas-inventory.png')});}
  }
 }
});
test('coin feedback matches gameplay particle counts and bounded cap for small and large rewards',async({page})=>{
 await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});
 expect(await page.evaluate(async()=>{
  const {createGameShellLifecycle,activateGameScope}=await import('/js/gameShell/gameShellLifecycle.js');const {createRewardFeedback}=await import('/js/liveops/rewardFeedback.js');const {playCoinRewardFlight}=await import('/js/coinRewards.js');const {COIN_PARTICLE_LIMIT}=await import('/js/gameplayTuning.js');
  const host=document.createElement('section');host.innerHTML='<header class="app-modal__header">Thưởng</header>';document.body.append(host);
  try{for(const amount of [1,5,25,32,100,1000]){
   const scope=createGameShellLifecycle();activateGameScope(scope);const expected=Math.min(amount,COIN_PARTICLE_LIMIT);
   const coins=playCoinRewardFlight(host,host,amount,{owner:scope,sound:false});if(coins.length!==expected)throw Error('Gameplay count changed');scope.dispose();
   const owner=createGameShellLifecycle(),fx=createRewardFeedback({owner,host});fx.present([{kind:'coins',amount}],{x:160,y:200});if(document.querySelectorAll('.liveops-reward-feedback__particle').length!==expected)throw Error(`Menu count mismatch: ${amount}`);owner.dispose();
  }}finally{host.remove();}return true;
 })).toBe(true);
});
test('a contextual retry remains available after a failed event request',async({page})=>{
 await ready(page);await page.evaluate(()=>eventsFixture.fail=true);await page.getByRole('button',{name:'Quay miễn phí',exact:true}).click();await expect(page.getByRole('button',{name:'Thử lại',exact:true})).toBeVisible();await page.evaluate(()=>eventsFixture.fail=false);await page.getByRole('button',{name:'Thử lại',exact:true}).click();await expect(page.getByRole('button',{name:'Thử lại',exact:true})).toBeHidden();await expect(page.getByRole('button',{name:'Quay miễn phí',exact:true})).toBeEnabled();
});

test('connection text and retry are centered; missions have no manual reload and recover normally',async({page},info)=>{
 const unavailable=fixture.replace('calls++;',"calls++;if(!window.allowLiveops)throw Error('Chưa kết nối được.');");
 await page.route('**/js/liveops/service.js*',r=>r.fulfill({contentType:'text/javascript',body:unavailable}));
 await page.goto('/');await expect(page.locator('.game-selector__choice').first()).toBeVisible();
 for(const width of [320,1024])for(const kind of ['missions','events']){
  await page.setViewportSize({width,height:900});
  await page.evaluate(async kind=>{window.allowLiveops=false;window.connectionPage?.destroy();window.connectionPage=(await import('/js/liveops/presentation.js')).openLiveopsPage(kind);},kind);
  await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');
  if(kind==='events')await page.getByRole('tab',{name:'Sưu tập chữ',exact:true}).click();
  await expect(page.getByRole('button',{name:'Tải lại tiến độ',exact:true})).toHaveCount(0);
  const retry=page.getByRole('button',{name:'Thử lại',exact:true});await expect(retry).toBeVisible();
  const geometry=await page.locator('.liveops__connection').evaluate(root=>{
   const r=root.getBoundingClientRect(),s=root.querySelector('[role=status]').getBoundingClientRect(),b=root.querySelector('button').getBoundingClientRect();
   return {center:r.x+r.width/2,textCenter:s.x+s.width/2,buttonCenter:b.x+b.width/2,verticalCenter:r.y+r.height/2,groupCenter:(s.top+b.bottom)/2,height:r.height};
  });
  expect(Math.abs(geometry.center-geometry.textCenter)).toBeLessThan(2);expect(Math.abs(geometry.center-geometry.buttonCenter)).toBeLessThan(2);expect(Math.abs(geometry.verticalCenter-geometry.groupCenter)).toBeLessThan(6);expect(geometry.height).toBeGreaterThanOrEqual(180);
  if(width===320)await page.locator('.liveops__connection').screenshot({path:info.outputPath(`${kind}-connection.png`)});
  await page.evaluate(()=>window.allowLiveops=true);await retry.click();await expect(page.locator('.liveops__connection')).toHaveCount(0);await expect(retry).toBeHidden();
  if(kind==='missions')await expect(page.locator('.liveops__login')).toBeVisible();else await expect(page.locator('.liveops__letter-grid')).toBeVisible();
 }
});
