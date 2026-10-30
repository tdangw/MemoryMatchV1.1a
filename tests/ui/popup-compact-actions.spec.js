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
        await page.locator('[data-special-mode="endless"]').click();
        const popup=page.locator('#adventure-level-modal');
        const play=popup.getByRole('button',{name:'Chơi',exact:true});await expect(play).toBeEnabled();
        const a=await play.boundingBox(),b=await popup.locator('.app-modal').boundingBox();
        expect(a.width).toBeLessThanOrEqual(200);expect(a.height).toBeGreaterThanOrEqual(44);
        expect(Math.abs(a.x+a.width/2-b.x-b.width/2)).toBeLessThanOrEqual(2);
        expect(a.x).toBeGreaterThanOrEqual(0);expect(a.x+a.width).toBeLessThanOrEqual(viewport.width);
        expect(a.y+a.height).toBeLessThanOrEqual(viewport.height);
        if(viewport.width===412 && skin==='default' && game==='memory-match')await page.screenshot({path:info.outputPath('compact-play.png')});
        await popup.getByRole('button',{name:'Đóng',exact:true}).click();
      }
    }
  }
  expect(errors).toEqual([]);
});
