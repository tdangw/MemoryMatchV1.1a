import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

test('startup trace separates JavaScript from browser layout and paint', async ({ browser }, testInfo) => {
  test.setTimeout(120000);
  const output = process.env.STARTUP_PROFILE_DIR || testInfo.outputDir;
  await mkdir(output, { recursive: true });
  for (const id of ['memory-match', 'link-connect', 'triple-connect']) {
    const context = await browser.newContext({ viewport: { width: 412, height: 915 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:' + (process.env.GAME_SHELL_TEST_PORT || 4173));
    await expect(page.locator('.game-selector__choice').first()).toBeVisible();
    await page.evaluate(async id => {
      await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
      await Promise.all([import('/js/gameController.js'), import('/js/linkConnect/linkController.js'), import('/js/tripleConnect/tripleController.js')]);
      const { gameState } = await import('/js/gameState.js');
      gameState.settings.mode = 'superHard'; gameState.settings.sound = false; gameState.settings.music = false;
    }, id);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
    const events = [];
    cdp.on('Tracing.dataCollected', event => events.push(...event.value));
    await cdp.send('Tracing.start', { categories: 'devtools.timeline,v8,disabled-by-default-v8.cpu_profiler', options: 'sampling-frequency=1000' });
    await page.evaluate(async id => {
      if (id === 'memory-match') await (await import('/js/gameController.js')).startNewMemoryRun();
      else if (id === 'link-connect') await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'superHard' });
      else await (await import('/js/tripleConnect/tripleController.js')).startTripleConnectRound({ mode: 'superHard', seed: 'startup-profile', skipIntro: true });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }, id);
    const complete = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
    await cdp.send('Tracing.end');
    await complete;
    await writeFile(`${output}/${id}.trace.json`, JSON.stringify({ traceEvents: events }));
    console.log(id, JSON.stringify(events.filter(event => event.ph === 'X' && event.dur >= 20000).sort((a,b) => b.dur-a.dur).slice(0,16).map(({name,dur,args}) => ({name,ms:dur/1000,args}))));
    await context.close();
  }
});
