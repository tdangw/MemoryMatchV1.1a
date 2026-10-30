import { test, expect } from '@playwright/test';

test('Play actions fit their labels and stay centered across games, skins and sizes',async({page},info)=>{
  test.setTimeout(180000);await page.goto('/');
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const viewport of [{width:320,height:640},{width:412,height:915},{width:844,height:390},{width:1024,height:900}]){
    await page.setViewportSize(viewport);
    for(const skin of ['default','woodland','papercut','starship','storybook']){
      await page.evaluate(async skin=>(await import('/js/uiSkin.js')).selectUiSkin(skin),skin);
      for(const game of ['memory-match','link-connect','triple-connect']){
        await page.evaluate(async game=>(await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(game),game);
        for(const mode of ['normal','endless','challenge']){
          await page.locator(mode==='normal'?'[data-level="1"]':`[data-special-mode="${mode}"]`).click();
          const popup=page.locator('#adventure-level-modal');
          const play=popup.getByRole('button',{name:'Chơi',exact:true});await expect(play).toBeEnabled();
          const decoration=await popup.locator('.app-modal__title').evaluate(el=>['::before','::after'].map(pseudo=>({content:getComputedStyle(el,pseudo).content,width:getComputedStyle(el,pseudo).width})));
          for(const part of decoration){expect(part.content).toBe('""');expect(part.width).toBe('24px');}
          if(mode!=='normal'){
            const goal=popup.locator('.adventure-level-goal');await expect(goal).toHaveCSS('background-color','rgba(0, 0, 0, 0)');await expect(goal).toHaveCSS('border-top-width','0px');await expect(goal).toHaveCSS('font-weight','600');
            expect(await goal.evaluate(el=>Math.max(el.nextElementSibling.getBoundingClientRect().top-el.getBoundingClientRect().bottom,el.nextElementSibling.getBoundingClientRect().left-el.getBoundingClientRect().right))).toBeGreaterThanOrEqual(10);
          }
          expect(await popup.locator('.app-modal__body').evaluate(el=>el.scrollHeight-el.clientHeight)).toBeLessThanOrEqual(1);
          const a=await play.boundingBox(),b=await popup.locator('.app-modal').boundingBox();
          expect(a.width).toBeLessThanOrEqual(200);expect(a.height).toBeGreaterThanOrEqual(44);
          expect(Math.abs(a.x+a.width/2-b.x-b.width/2)).toBeLessThanOrEqual(2);
          expect(a.x).toBeGreaterThanOrEqual(0);expect(a.x+a.width).toBeLessThanOrEqual(viewport.width);
          expect(a.y+a.height).toBeLessThanOrEqual(viewport.height);
          if(viewport.width===412 && skin==='default' && game==='memory-match')await page.screenshot({path:info.outputPath(`compact-${mode}.png`)});
          await popup.getByRole('button',{name:'Đóng',exact:true}).click();
        }
      }
    }
  }
  expect(errors).toEqual([]);
});
