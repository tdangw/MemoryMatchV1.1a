import { test,expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
let fixture=readFileSync('tests/ui/events-festival.spec.js','utf8').match(/const fixture = `([\s\S]*?)`;/)[1];
fixture="import {committedRewardsForTransition} from '/js/liveops/rewardFeedbackModel.js';\n"+fixture
 .replace('export const bindLiveopsAccount', "window.fusionFixture={delay:false,fail:false,lastCommand:null,seed(counts){state.letters={counts:{...counts},earned:{...counts},sequence:0,last:null};},get letters(){return structuredClone(state.letters)}};\nexport const bindLiveopsAccount")
 .replace('calls++;', "calls++;if(command.type==='fuseLetter'){fusionFixture.lastCommand=structuredClone(command);if(fusionFixture.delay)await new Promise(resolve=>fusionFixture.resolve=resolve);if(fusionFixture.fail)throw Error('Chưa kết nối được.');}")
 .replace('const result=transitionSpark(state,cmd', 'const previous=structuredClone(state);const result=transitionSpark(state,cmd')
 .replace('state=result.state;', 'state=result.state;result.committedRewards=committedRewardsForTransition(previous,result);if(cmd.type===\'fuseLetter\'&&fusionFixture.loseResponse){fusionFixture.loseResponse=false;throw Error(\'Mất phản hồi\');}');
async function ready(page,counts={A:2,M:3,E:1}){
 await page.route('**/js/liveops/service.js*',route=>route.fulfill({contentType:'text/javascript',body:fixture}));
 await page.goto('/');await expect(page.locator('.game-selector__choice').first()).toBeVisible();
 await page.evaluate(async()=>{(await import('/js/gameState.js')).gameState.settings.sound=false;});
 await page.evaluate(counts=>fusionFixture.seed(counts),counts);await openLetters(page);
}
async function openLetters(page){
 await page.evaluate(async()=>{window.fusionPage?.destroy();window.fusionPage=(await import('/js/liveops/presentation.js')).openLiveopsPage('events');});
 await expect(page.locator('.liveops')).toHaveAttribute('aria-busy','false');await page.getByRole('tab',{name:'Sưu tập chữ',exact:true}).click();
}
async function start(page,letter='A'){
 await page.getByRole('button',{name:new RegExp(`^Chữ ${letter}, \\d+ chữ$`)}).click();
 await expect(page.locator('#letter-action-modal')).toBeVisible();await page.locator('#letter-action-modal').getByRole('button',{name:'Ghép',exact:true}).click();
 await expect(page.locator('#letter-fusion-modal')).toBeVisible();await expect(page.locator('.letter-forge__slot[data-filled="true"]')).toHaveCount(1);
}
const palette=(page,letter)=>page.locator('#letter-fusion-modal').getByRole('button',{name:new RegExp(`^Chọn chữ ${letter}, còn \\d+$`)});
const submit=page=>page.locator('#letter-fusion-modal').getByRole('button',{name:'Ghép',exact:true});
const close=page=>page.locator('#letter-fusion-modal .app-modal__close').click();

test('mixed and repeated ingredients select locally, commit exactly three once and support another fusion',async({page})=>{
 await ready(page,{A:1,M:2,E:3});await start(page);await expect(submit(page)).toBeDisabled();
 await expect(palette(page,'A')).toBeDisabled();await palette(page,'M').click();await palette(page,'M').click();
 await expect(submit(page)).toBeEnabled();await expect(palette(page,'M')).toBeDisabled();
 expect(await page.evaluate(()=>fusionFixture.letters)).toEqual(expect.objectContaining({counts:{A:1,M:2,E:3},sequence:0}));
 await page.getByRole('button',{name:'Bỏ chữ M ở ô 2',exact:true}).click();await expect(submit(page)).toBeDisabled();await palette(page,'M').click();
 await submit(page).evaluate(node=>{node.click();node.click();});
 await expect(page.locator('#letter-fusion-modal')).toContainText('Đã ghép được chữ M');
 expect(await page.evaluate(()=>fusionFixture.lastCommand)).toEqual({type:'fuseLetter',ingredients:['A','M','M']});
 expect(await page.evaluate(()=>fusionFixture.letters)).toEqual(expect.objectContaining({counts:{A:0,M:1,E:3},sequence:1,last:expect.objectContaining({ingredients:['A','M','M'],received:'M'})}));
 await expect(page.getByRole('button',{name:'Ghép tiếp',exact:true})).toHaveCount(0);await expect(page.locator('.letter-forge__slot[data-filled="true"]')).toHaveCount(0);
 for(let i=0;i<3;i++)await palette(page,'E').click();await submit(page).click();await expect(page.locator('#letter-fusion-modal')).toContainText('Đã ghép được chữ M');
 expect(await page.evaluate(()=>fusionFixture.letters.counts)).toEqual({A:0,M:2,E:0});expect(await page.evaluate(()=>fusionFixture.letters.sequence)).toBe(2);
});

test('cancel costs nothing; close during request keeps committed inventory without a stale result',async({page})=>{
 await ready(page,{A:1,M:2});const before=await page.evaluate(()=>fusionFixture.letters);await start(page);await palette(page,'M').click();await close(page);
 expect(await page.evaluate(()=>fusionFixture.letters)).toEqual(before);
 await start(page);await palette(page,'M').click();await palette(page,'M').click();await page.evaluate(()=>fusionFixture.delay=true);await submit(page).click();await expect(page.getByRole('button',{name:'Đang ghép…',exact:true})).toBeDisabled();
 await close(page);await page.evaluate(()=>{fusionFixture.delay=false;fusionFixture.resolve();});await expect.poll(()=>page.evaluate(()=>fusionFixture.letters.sequence)).toBe(1);
 await expect(page.locator('#letter-fusion-modal,.letter-forge__result,.liveops-reward-feedback')).toHaveCount(0);expect(await page.evaluate(()=>fusionFixture.letters.counts)).toEqual({A:0,M:1});
});

test('failed fusion keeps ingredients; recovery refresh does not consume and the next submit commits once',async({page})=>{
 await ready(page,{A:1,M:2});await start(page);await palette(page,'M').click();await palette(page,'M').click();await page.evaluate(()=>fusionFixture.fail=true);await submit(page).click();
 await expect(page.locator('#letter-fusion-modal').getByRole('button',{name:'Thử lại',exact:true})).toBeEnabled();expect(await page.evaluate(()=>fusionFixture.letters.sequence)).toBe(0);
 await page.evaluate(()=>fusionFixture.fail=false);await page.locator('#letter-fusion-modal').getByRole('button',{name:'Thử lại',exact:true}).click();await expect(submit(page)).toBeEnabled();expect(await page.evaluate(()=>fusionFixture.letters.sequence)).toBe(0);
 await submit(page).click();await expect(page.locator('#letter-fusion-modal')).toContainText('Đã ghép được chữ M');expect(await page.evaluate(()=>fusionFixture.letters.sequence)).toBe(1);
});

for(const [width,height]of [[320,740],[412,915],[844,390],[1024,900]])test(`fusion is bounded in five skins and both motion settings at ${width}`,async({page},info)=>{
 test.setTimeout(150000);await page.setViewportSize({width,height});await ready(page);
 for(const skin of ['default','woodland','papercut','starship','storybook'])for(const motion of ['reduce','no-preference']){
  await page.emulateMedia({reducedMotion:motion});await page.evaluate(async skin=>(await import('/js/uiSkin.js')).selectUiSkin(skin),skin);await openLetters(page);
  const recipes=await page.locator('.liveops__set-choices').evaluate(node=>({wrap:getComputedStyle(node).flexWrap,rows:new Set([...node.children].map(child=>Math.round(child.getBoundingClientRect().top))).size,scrollbar:getComputedStyle(node).scrollbarWidth}));
  expect(recipes.wrap).toBe('nowrap');expect(recipes.rows).toBe(1);expect(recipes.scrollbar).toBe('none');await expect(page.locator('.liveops__letter-grid button')).toHaveCount(17);
  await start(page);const modal=page.locator('#letter-fusion-modal');await expect(modal.locator('.letter-forge__slot')).toHaveCount(3);await expect(modal.locator('.letter-forge__palette button')).toHaveCount(17);
  const triangle=await modal.locator('.letter-forge__stage').evaluate(root=>{
   const center=node=>{const r=node.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};},c=center(root.querySelector('.letter-forge__result')),points=[...root.querySelectorAll('.letter-forge__slot')].map(center),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
   return {radii:points.map(p=>distance(p,c)),sides:points.map((p,i)=>distance(p,points[(i+1)%3]))};
  });
  expect(Math.max(...triangle.radii)-Math.min(...triangle.radii)).toBeLessThan(1);expect(Math.max(...triangle.sides)-Math.min(...triangle.sides)).toBeLessThan(1);expect(Math.min(...triangle.radii)).toBeGreaterThan(70);
  const bad=await modal.evaluate(root=>[...root.querySelectorAll('button,p,svg')].filter(node=>node.getClientRects().length).filter(node=>{const r=node.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1;}).map(node=>node.outerHTML.slice(0,120)));expect(bad).toEqual([]);
  const bounds=await modal.locator('.app-modal').boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(height);
  const sprites=await modal.locator('.liveops__letter-art').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).backgroundImage));expect(sprites.every(url=>url.includes('letter'))).toBe(true);
  if(width===412&&motion==='reduce'&&['default','storybook'].includes(skin))await page.screenshot({path:info.outputPath(`${skin}-fusion.png`)});
  await close(page);await expect(modal).toHaveCount(0);
 }
});

test('twenty forge owners release nodes and resources; stale identity cannot update a closed forge',async({page})=>{
 await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});
 const result=await page.evaluate(async()=>{
  const {createGameShellLifecycle}=await import('/js/gameShell/gameShellLifecycle.js'),{openLetterFusion}=await import('/js/liveops/letterCrafting.js');
  for(let i=0;i<20;i++){
   const owner=createGameShellLifecycle();let current=true;
   const modal=openLetterFusion({initialLetter:'A',owner,current:()=>current,getContext:()=>({counts:{A:1,M:2},sequence:0,canUse:true}),execute:async()=>{throw Error('Unexpected submission');},refresh:async()=>null});
   modal.panel.querySelector('[aria-label="Chọn chữ M, còn 2"]').click();current=false;modal.destroy();owner.dispose();owner.dispose();
   if(document.querySelector('#letter-fusion-modal,.liveops-reward-feedback'))throw Error('Forge retained nodes');
   if(Object.entries(owner.diagnostics()).some(([key,value])=>key==='active'?value!==false:value!==0))throw Error('Forge retained resources');
  }return true;
 });expect(result).toBe(true);
});

test('switching identity closes a pending forge and suppresses its old result',async({page})=>{
 await ready(page,{A:1,M:2});
 await page.evaluate(async()=>{
  const accounts=await import('/js/accountService.js'),account=accounts.getAccountService()||accounts.initializeAccountService();await account.ready;
  fusionFixture.identity={uid:'ui-owner',profileId:'fusion-profile'};fusionFixture.accountListeners=new Set();
  account.getIdentity=()=>fusionFixture.identity;account.subscribe=listener=>{fusionFixture.accountListeners.add(listener);listener({});return()=>fusionFixture.accountListeners.delete(listener);};
  fusionFixture.switchIdentity=()=>{fusionFixture.identity={uid:'another-owner',profileId:'another-profile'};for(const listener of fusionFixture.accountListeners)listener({});};
 });
 await openLetters(page);await start(page);await palette(page,'M').click();await palette(page,'M').click();await page.evaluate(()=>fusionFixture.delay=true);await submit(page).click();
 await expect(page.getByRole('button',{name:'Đang ghép…',exact:true})).toBeDisabled();await page.evaluate(()=>fusionFixture.switchIdentity());await expect(page.locator('#letter-fusion-modal')).toHaveCount(0);
 await page.evaluate(()=>{fusionFixture.delay=false;fusionFixture.resolve();});await expect.poll(()=>page.evaluate(()=>fusionFixture.letters.sequence)).toBe(1);
 await expect(page.locator('#letter-fusion-modal,.liveops-reward-feedback')).toHaveCount(0);await expect(page.locator('.liveops__status')).toContainText('Tài khoản đã thay đổi');
});


test('lost response recovers the saved mixed recipe without spending or presenting it twice',async({page})=>{
 await ready(page,{A:1,M:2});await start(page);await palette(page,'M').click();await palette(page,'M').click();await page.evaluate(()=>fusionFixture.loseResponse=true);await submit(page).click();
 await expect(page.locator('#letter-fusion-modal').getByRole('button',{name:'Thử lại',exact:true})).toBeEnabled();expect(await page.evaluate(()=>fusionFixture.letters.sequence)).toBe(1);
 await page.locator('#letter-fusion-modal').getByRole('button',{name:'Thử lại',exact:true}).click();await expect(page.locator('#letter-fusion-modal')).toContainText('Đã ghép được chữ M');expect(await page.evaluate(()=>fusionFixture.letters.sequence)).toBe(1);expect(await page.evaluate(()=>fusionFixture.letters.counts)).toEqual({A:0,M:1});
 await expect(page.locator('.liveops-reward-feedback')).toHaveCount(0);
});

test('recipe keyboard keeps the chosen tab visible inside its horizontal strip',async({page})=>{
 await page.setViewportSize({width:320,height:740});await ready(page);
 const first=page.getByRole('tab',{name:'MEMORY MATCH',exact:true});await first.focus();await first.press('End');
 const last=page.getByRole('tab',{name:'ADVENTURE',exact:true});await expect(last).toBeFocused();await expect(last).toBeInViewport();await expect(last).toHaveAttribute('aria-selected','true');
 await last.press('Home');await expect(first).toBeFocused();await expect(first).toBeInViewport();
 await first.press('ArrowRight');await expect(page.getByRole('tab',{name:'LINK CONNECT',exact:true})).toBeFocused();
});

test('while a closed forge is still committing, its inventory cannot open a stale second forge',async({page})=>{
 await ready(page,{A:2,M:4});await start(page);await palette(page,'M').click();await palette(page,'M').click();await page.evaluate(()=>fusionFixture.delay=true);await submit(page).click();await close(page);
 const inventoryLetter=page.getByRole('button',{name:/^Chữ A, \d+ chữ$/});await expect(inventoryLetter).toBeDisabled();await inventoryLetter.evaluate(node=>node.click());await expect(page.locator('#letter-action-modal,#letter-fusion-modal')).toHaveCount(0);
 await page.evaluate(()=>{fusionFixture.delay=false;fusionFixture.resolve();});await expect(inventoryLetter).toBeEnabled();await start(page);await expect(submit(page)).toBeDisabled();expect(await page.evaluate(()=>fusionFixture.letters.sequence)).toBe(1);
});

test('compact recipe keeps the reward on the right and captures narrow layouts',async({page},info)=>{
 await ready(page);
 for(const width of [320,412]){
  await page.setViewportSize({width,height:915});await page.getByRole('tab',{name:'ADVENTURE',exact:true}).click();
  const boxes=await page.locator('.liveops__recipe').evaluate(root=>{
   const panel=root.getBoundingClientRect(),word=root.querySelector('.liveops__recipe-word').getBoundingClientRect(),reward=root.querySelector('.liveops__recipe-reward').getBoundingClientRect();
   return {left:panel.left,right:panel.right,wordRight:word.right,rewardLeft:reward.left,rewardRight:reward.right,children:[...root.querySelectorAll('.liveops__recipe-reward > *')].map(node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right};})};
  });
  expect(boxes.left).toBeGreaterThanOrEqual(0);expect(boxes.right).toBeLessThanOrEqual(width);expect(boxes.wordRight).toBeLessThanOrEqual(boxes.rewardLeft);expect(boxes.rewardRight).toBeLessThanOrEqual(boxes.right);for(const child of boxes.children){expect(child.left).toBeGreaterThanOrEqual(boxes.rewardLeft);expect(child.right).toBeLessThanOrEqual(boxes.right);}
  await page.locator('.liveops__recipe').screenshot({path:info.outputPath(`recipe-${width}.png`)});
 }
});

test('hidden or reduced motion finishes local crafting animations without granting early or losing the result',async({page})=>{
 await ready(page,{A:1,M:2});await page.emulateMedia({reducedMotion:'no-preference'});await start(page);await palette(page,'M').click();await palette(page,'M').click();await page.evaluate(()=>fusionFixture.delay=true);await submit(page).click();
 await page.locator('.letter-forge__aura').evaluate(node=>{for(const animation of node.getAnimations()){animation.pause();animation.currentTime=100;}Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 expect(await page.locator('.letter-forge__aura').evaluate(node=>node.getAnimations().every(animation=>animation.playState==='finished'))).toBe(true);expect(await page.evaluate(()=>fusionFixture.letters.sequence)).toBe(0);
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));fusionFixture.delay=false;fusionFixture.resolve();});await expect(page.locator('#letter-fusion-modal')).toContainText('Đã ghép được chữ M');
 await page.locator('.letter-forge__face').evaluate(node=>{for(const animation of node.getAnimations()){animation.pause();animation.currentTime=100;}});await page.emulateMedia({reducedMotion:'reduce'});
 expect(await page.locator('.letter-forge__face').evaluate(node=>node.getAnimations().every(animation=>animation.playState==='finished'))).toBe(true);expect(await page.evaluate(()=>fusionFixture.letters.sequence)).toBe(1);
 await close(page);await expect(page.locator('#letter-fusion-modal,.liveops-reward-feedback')).toHaveCount(0);
});

test('the centered 3D action absorbs three committed ingredients and reveals one letter without extra buttons',async({page},info)=>{
 await ready(page,{A:1,M:2,E:3});await page.emulateMedia({reducedMotion:'no-preference'});await start(page);await palette(page,'M').click();await palette(page,'M').click();
 const geometry=async()=>page.locator('.letter-forge__result').evaluate(button=>{const b=button.getBoundingClientRect(),face=button.querySelector('.letter-forge__face').getBoundingClientRect(),stage=button.parentElement.getBoundingClientRect();return {w:b.width,h:b.height,center:b.x+b.width/2,stageCenter:stage.x+stage.width/2,faceCenter:face.x+face.width/2};});
 const before=await geometry();expect(before.w).toBe(before.h);expect(Math.abs(before.center-before.stageCenter)).toBeLessThan(1);expect(Math.abs(before.center-before.faceCenter)).toBeLessThan(1);
 await expect(page.locator('.letter-forge__submit,.letter-forge__ring')).toHaveCount(0);await expect(submit(page)).toHaveClass('letter-forge__result');await page.screenshot({path:info.outputPath('forge-ready.png')});
 await submit(page).click();await expect(page.locator('.letter-forge__ingredient')).toHaveCount(3);await expect(page.locator('.letter-forge__lightning path')).toHaveCount(6);await expect(page.locator('.letter-forge__stage')).toHaveAttribute('data-phase','revealing');expect(await page.evaluate(()=>fusionFixture.letters.sequence)).toBe(1);
 await page.locator('.letter-forge__stage').evaluate(n=>n.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=180;}));await page.screenshot({path:info.outputPath('forge-absorb.png')});
 expect(await page.locator('.letter-forge__ingredient').first().evaluate(n=>getComputedStyle(n).filter)).toContain('brightness(1.5)');
 await page.locator('.letter-forge__stage').evaluate(n=>n.getAnimations({subtree:true}).forEach(a=>a.finish()));await expect(page.locator('.letter-forge__ingredient,.letter-forge__lightning')).toHaveCount(0);await expect(page.locator('.letter-forge__stage')).toHaveAttribute('data-phase','result');
 await expect(page.locator('.liveops-reward-feedback__particle')).toHaveCount(0);await expect(page.locator('.liveops-reward-feedback__toast')).toHaveText('Đã nhận Chữ M');await expect(page.locator('.letter-forge__face .liveops__letter-art')).toHaveCount(1);await expect(page.getByRole('button',{name:'Ghép tiếp',exact:true})).toHaveCount(0);expect((await geometry()).center).toBe(before.center);
 await page.screenshot({path:info.outputPath('forge-result.png')});await palette(page,'E').click();await expect(page.locator('.letter-forge__stage')).toHaveAttribute('data-phase','select');await expect(page.locator('.letter-forge__slot[data-filled="true"]')).toHaveCount(1);await close(page);await expect(page.locator('.letter-forge__ingredient,.liveops-reward-feedback')).toHaveCount(0);
});

test('closing twenty forges during absorption cancels ghosts and prevents detached result feedback',async({page})=>{
 await ready(page);await page.emulateMedia({reducedMotion:'no-preference'});
 expect(await page.evaluate(async()=>{
  const {createGameShellLifecycle}=await import('/js/gameShell/gameShellLifecycle.js'),{openLetterFusion}=await import('/js/liveops/letterCrafting.js');
  for(let i=0;i<20;i++){
   const owner=createGameShellLifecycle(),modal=openLetterFusion({initialLetter:'A',owner,current:()=>owner.active,getContext:()=>({counts:{A:1,M:2},sequence:0,canUse:true}),execute:async ingredients=>({state:{letters:{last:{kind:'fuse',ingredients,received:'C',sequence:1}}},committedRewards:[]}),refresh:async()=>null});
   modal.panel.querySelector('[aria-label="Chọn chữ M, còn 2"]').click();modal.panel.querySelector('[aria-label="Chọn chữ M, còn 1"]').click();modal.panel.querySelector('[aria-label="Ghép"]').click();await new Promise(requestAnimationFrame);
   if(modal.panel.querySelectorAll('.letter-forge__ingredient').length!==3)throw Error('Absorption did not start');
   modal.destroy();owner.dispose();owner.dispose();await Promise.resolve();await Promise.resolve();
   if(document.querySelector('#letter-fusion-modal,.letter-forge__ingredient,.liveops-reward-feedback'))throw Error('Detached forge retained effects');
   if(Object.entries(owner.diagnostics()).some(([key,value])=>key==='active'?value!==false:value!==0))throw Error('Owner resources retained');
  }return true;
 })).toBe(true);
});
