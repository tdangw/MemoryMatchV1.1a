import { test, expect } from '@playwright/test';

const flags = process.env.VITE_LIVEOPS_ENABLED === '1' && process.env.VITE_FESTIVAL_CHESTS_ENABLED === '1';

for (const id of ['memory-match','link-connect','triple-connect']) test(`${id}: a normal manual group saves and presents all three collection rewards`, async ({ page }) => {
  test.skip(!flags, 'Explicit collection reward flags required');
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion:'no-preference' });
  await page.goto('/');
  const witness = await page.evaluate(async id => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
    const { gameState } = await import('/js/gameState.js');
    gameState.settings.sound = gameState.settings.music = false;
    gameState.settings.mode = 'easy';
    if (id === 'memory-match') await (await import('/js/gameController.js')).startNewMemoryRun(1, { skipIntro:true });
    else if (id === 'link-connect') await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode:'easy', level:1, skipIntro:true });
    else {
      const c = await import('/js/tripleConnect/tripleController.js');
      window.normalLootRun = await c.startTripleConnectRound({ mode:'easy', level:1, seed:'normal-loot-ui', skipIntro:true });
      window.normalLootWitness = window.normalLootRun.generated.witness;
      const session = structuredClone((await import('/js/sessionProgress.js')).getActiveSession(id, 'easy'));
      session.snapshot.tiles.forEach(tile => { delete tile.magnet; tile.lucky = null; });
      window.normalLootRun = await c.continueTripleConnectSession(session);
    }
    window.normalLootSeen = { letter:0, ticket:0, badge:0 };
    window.normalLootObserver = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node.classList?.contains('letter-drop-feedback__entry')) window.normalLootSeen.letter++;
        if (node.classList?.contains('game-loot-drop')) {
          if (node.querySelector('.ui-icon--ticket')) window.normalLootSeen.ticket++;
          if (node.querySelector('.ui-icon--collection-badge')) window.normalLootSeen.badge++;
        }
      }
    });
    window.normalLootObserver.observe(document.body, { subtree:true, childList:true });
    const originalRandom = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = array => {
      if (array instanceof Uint32Array && array.length === 1) { array[0] = 0; return array; }
      return originalRandom(array);
    };
    Math.random = () => .99; // No energy/support hit can disguise a normal group as special.
    return id === 'triple-connect' ? window.normalLootWitness : null;
  }, id);
  if (id === 'memory-match') {
    await page.evaluate(async () => {
      const { gameState } = await import('/js/gameState.js');
      const { memoryBoard } = await import('/js/memoryMatch/memoryBoard.js');
      gameState.luckyRewards.clear(); gameState.isLocked = false;
      for (const tile of memoryBoard.tiles.values()) tile.special = false;
      const all = [...memoryBoard.tiles];
      const first = all[0], second = all.find(([key,tile]) => key !== first[0] && tile.imageId === first[1].imageId);
      const { handleTileClick } = await import('/js/logic.js');
      await handleTileClick(document.getElementById(first[0])); await handleTileClick(document.getElementById(second[0]));
    });
  } else if (id === 'link-connect') {
    await page.evaluate(async () => {
      const { linkGameState:s } = await import('/js/linkConnect/linkState.js');
      for (const row of s.board.grid) for (let i = 0; i < row.length; i++) if (row[i]) row[i] = { ...row[i], special:false, luckyReward:null, frozen:false };
      s.isLocked = false;
      const pair = (await import('/js/linkConnect/pathfinder.js')).findAvailableConnections(s.board.grid)[0];
      for (const p of [pair.start,pair.end]) document.querySelector(`.link-board__cell[data-row="${p.row}"][data-column="${p.column}"] .link-tile`).click();
    });
  } else {
    for (const command of witness) {
      await page.locator(`.triple-connect__board [data-tile-id="${command.tileId}"]`).click();
      await page.evaluate(() => window.normalLootRun.whenIdle());
      await page.waitForFunction(() => !document.querySelector('.triple-connect__ghost,.triple-connect__tray-flight'));
      if (await page.evaluate(() => window.normalLootSeen.letter > 0)) break;
    }
  }
  await expect.poll(() => page.evaluate(() => window.normalLootSeen)).toEqual({ letter:1, ticket:1, badge:1 });
  const saved = await page.evaluate(async () => {
    const data = await (await import('/js/persistence.js')).loadPersistentGameData();
    return { letters:Object.values(data.appearance.spark.letterEarned).reduce((a,b) => a+b,0), tickets:data.appearance.spark.ticketEarned, badges:data.appearance.spark.fireflyEarned };
  });
  expect(saved).toEqual({ letters:1, tickets:1, badges:1 });
  await page.evaluate(async id => {
    window.normalLootObserver.disconnect();
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
  }, id);
  await expect(page.locator('.letter-drop-feedback,.game-loot-drop')).toHaveCount(0);
  await page.reload();
  expect(await page.evaluate(async () => {
    const data = await (await import('/js/persistence.js')).loadPersistentGameData();
    return { letters:Object.values(data.appearance.spark.letterEarned).reduce((a,b) => a+b,0), tickets:data.appearance.spark.ticketEarned, badges:data.appearance.spark.fireflyEarned };
  })).toEqual(saved);
});

test('mixed feedback has no miss layout read, shares cap12 and cleans20 owners in five skins/four viewports/both motion settings', async ({ page }) => {
  test.setTimeout(180000); await page.goto('/');
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  for (const skin of ['default','woodland','papercut','starship','storybook']) {
    await page.evaluate(async skin => {
      const applied = await (await import('/js/uiSkin.js')).selectUiSkin(skin);
      if (applied.status !== 'applied') throw Error('Skin did not load');
    }, skin);
    for (const viewport of [{ width:320,height:740 },{ width:412,height:915 },{ width:1024,height:900 },{ width:844,height:390 }]) {
      await page.setViewportSize(viewport);
      for (const motion of ['reduce','no-preference']) {
        await page.emulateMedia({ reducedMotion:motion });
        const result = await page.evaluate(async () => {
          const lifecycle = await import('/js/gameShell/gameShellLifecycle.js');
          const { getEffectRegistry } = await import('/js/gameShell/gameShellEffects.js');
          const { prepareLetterDropFeedback } = await import('/js/liveops/letterDropFeedback.js');
          const { playLootDrop } = await import('/js/lootEffects.js');
          const oldFont = document.documentElement.style.fontSize;
          document.documentElement.style.fontSize = '20px';
          const anchor = document.createElement('button'); anchor.style.cssText = 'position:fixed;left:30px;top:120px;width:40px;height:40px'; document.body.append(anchor);
          const nativeRect = anchor.getBoundingClientRect.bind(anchor);
          let reads = 0, max = 0;
          anchor.getBoundingClientRect = () => { reads++; return nativeRect(); };
          const previousHidden = Object.getOwnPropertyDescriptor(document,'hidden');
          for (let cycle = 0; cycle < 20; cycle++) {
            const scope = lifecycle.createGameShellLifecycle(); lifecycle.activateGameScope(scope);
            const callback = prepareLetterDropFeedback(anchor,scope);
            const before = reads; callback({ letter:null, ticket:false, firefly:false });
            if (reads !== before) throw Error('Miss measured source layout');
            callback({ letter:'M', ticket:true, firefly:true });
            if (reads !== before + 1) throw Error('Three hits did not share one source measurement');
            for (let i = 0; i < 20; i++) {
              // Mixed existing energy/support/milestone loot and new collection rewards.
              if (i % 2) playLootDrop(anchor,{ icon:'energy',preset:'memory' });
              else callback({ letter:'A',ticket:true,firefly:true });
              const diagnostics = getEffectRegistry(scope).diagnostics();
              const count = diagnostics.item + diagnostics.loot;
              const nodes = document.querySelectorAll('.game-loot-drop,.letter-drop-feedback__entry').length;
              if (count > 12 || nodes > 12 || nodes !== count) throw Error(`Shared loot budget failed: ${count}/${nodes}`);
              max = Math.max(max,count);
            }
            const letters = [...document.querySelectorAll('.letter-drop-feedback__entry')];
            for (const letter of letters) {
              const rect = letter.getBoundingClientRect();
              if (rect.left < 0 || rect.right > innerWidth + 1) throw Error('Large-font letter reward overflows viewport');
            }
            if (cycle % 2) {
              Object.defineProperty(document,'hidden',{ configurable:true,value:true });
              document.dispatchEvent(new Event('visibilitychange'));
            }
            scope.dispose(); scope.dispose(); callback({ letter:'M',ticket:true,firefly:true });
            if (document.querySelector('.game-loot-drop,.letter-drop-feedback')) throw Error('Stale round reward remains');
            if (Object.values(getEffectRegistry(scope).diagnostics()).some(Boolean)) throw Error('Registry survived disposal');
            if (Object.entries(scope.diagnostics()).some(([key,value]) => key === 'active' ? value !== false : value !== 0)) throw Error('Scope resources survived disposal');
            if (document.getAnimations().some(animation => animation.effect?.target.closest('.letter-drop-feedback,.game-loot-drop'))) throw Error('Reward animation survived disposal');
            if (previousHidden) Object.defineProperty(document,'hidden',previousHidden); else delete document.hidden;
          }
          anchor.remove(); document.documentElement.style.fontSize = oldFont;
          return { max, cycles:20 };
        });
        expect(result.cycles).toBe(20); expect(result.max).toBeLessThanOrEqual(12);
        if (motion === 'no-preference') expect(result.max).toBe(12);
      }
    }
  }
  expect(errors).toEqual([]);
});


test('PC mixed collection loot frame sample is bounded across30 restarts', async ({ page }, info) => {
  await page.setViewportSize({ width:412,height:915 });
  await page.emulateMedia({ reducedMotion:'no-preference' });
  await page.goto('/');
  const metrics = await page.evaluate(async () => {
    const lifecycle = await import('/js/gameShell/gameShellLifecycle.js');
    const { prepareLetterDropFeedback } = await import('/js/liveops/letterDropFeedback.js');
    const { playLootDrop } = await import('/js/lootEffects.js');
    const anchor = document.createElement('span'); anchor.style.cssText = 'position:fixed;left:50px;top:250px;width:40px;height:40px'; document.body.append(anchor);
    const frames = [], tasks = [];
    const heapBefore = performance.memory?.usedJSHeapSize;
    const observer = new PerformanceObserver(list => { for (const entry of list.getEntries()) tasks.push(entry.duration); });
    observer.observe({ type:'longtask' });
    let current = null, maxNodes = 0, previous = null, restart = 0;
    await new Promise(resolve => {
      const frame = now => {
        if (previous !== null) frames.push(now - previous);
        previous = now;
        if (frames.length % 6 === 0) {
          current?.dispose(); current = lifecycle.createGameShellLifecycle(); lifecycle.activateGameScope(current); restart++;
          const present = prepareLetterDropFeedback(anchor,current);
          for (let i = 0; i < 4; i++) { present({ letter:'M',ticket:true,firefly:true }); playLootDrop(anchor,{ icon:'energy' }); }
        }
        maxNodes = Math.max(maxNodes,document.querySelectorAll('.game-loot-drop,.letter-drop-feedback__entry').length);
        if (frames.length < 179) requestAnimationFrame(frame); else resolve();
      };
      requestAnimationFrame(frame);
    });
    current.dispose(); anchor.remove(); observer.disconnect();
    frames.sort((a,b) => a-b);
    return { device:'Desktop Chrome, mobile viewport; not physical S22', restarts:restart, frames:frames.length, frameP95:frames[Math.ceil(frames.length*.95)-1], frameP99:frames[Math.ceil(frames.length*.99)-1], maxFrame:Math.max(...frames), longTasks:tasks.length, maxLongTask:Math.max(0,...tasks), maxNodes, heapBefore, heapAfter:performance.memory?.usedJSHeapSize, remaining:document.querySelectorAll('.game-loot-drop,.letter-drop-feedback').length };
  });
  expect(metrics.restarts).toBe(30); expect(metrics.maxNodes).toBeLessThanOrEqual(12); expect(metrics.remaining).toBe(0);
  console.log('GROUP_LOOT_PC_METRICS',JSON.stringify(metrics));
  await info.attach('group-loot-pc-metrics.json',{ body:JSON.stringify(metrics,null,2),contentType:'application/json' });
});
