import { expect, test } from '@playwright/test';

for (const id of ['memory-match', 'link-connect']) test(`${id} first durable pair includes lucky, energy and item rewards before effects finish`, async ({ page }) => {
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  const before = await page.evaluate(async id => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
    const { gameState } = await import('/js/gameState.js'); gameState.settings.mode = 'challenge';
    gameState.settings.sound = gameState.settings.music = false;
    const key = (await import('/js/gameCatalog.js')).getGameProgressKey(id);
    if (id === 'memory-match') await (await import('/js/gameController.js')).startNewMemoryRun(1, { skipIntro: true });
    else await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'challenge', level: 1, skipIntro: true });
    const initial = { coins: gameState.coins, hints: gameState.progress[key].items.hint || 0,
      lettersEnabled:(await import('/js/liveops/availability.js')).liveopsEnabled() };
    window.letterFeedbackSeen=[];window.ticketFeedbackSeen=0;
    new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)
      {if(node.classList?.contains('letter-drop-feedback__entry')&&node.dataset.rewardKind==='letter')window.letterFeedbackSeen.push(node.textContent);
      if(node.classList?.contains('game-loot-drop')&&node.querySelector('.ui-icon--ticket'))window.ticketFeedbackSeen++;}
    }).observe(document.body,{childList:true,subtree:true});
    const originalRandom=crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues=array=>{if(array instanceof Uint32Array&&array.length===1){array[0]=0;return array;}return originalRandom(array);};
    (await import('/js/persistence.js')).subscribeToLocalCommit(({ patch }) => {
      const session = patch.progress?.[key]?.sessionsByMode.challenge;
      if (!window.firstPairCommit && session?.pairSnapshot?.matchedPairs === 1) window.firstPairCommit = { coins: patch.coins, session: structuredClone(session), items: structuredClone(patch.progress[key].items) };
    });
    if (id === 'memory-match') {
      const first = document.querySelector('#grid-container .tile'); const pair = [...document.querySelectorAll('#grid-container .tile')].filter(tile => tile.dataset.imageId === first.dataset.imageId);
      pair.forEach(tile => { tile.dataset.special = 'true'; });
      const {memoryBoard}=await import('/js/memoryMatch/memoryBoard.js');
      pair.forEach(tile=>{memoryBoard.tiles.get(tile.id).special=true;});
      gameState.luckyRewards.set(first.dataset.imageId, { type: 'coins', value: 10 });
      gameState.specialProgress = 3; gameState.isLocked = false; Math.random = () => .99;
      const { handleTileClick } = await import('/js/logic.js'); await handleTileClick(pair[0]); void handleTileClick(pair[1]);
    } else {
      const { linkGameState } = await import('/js/linkConnect/linkState.js');
      const connection = (await import('/js/linkConnect/pathfinder.js')).findAvailableConnections(linkGameState.board.grid)[0];
      linkGameState.specialProgress = 1; linkGameState.isLocked = false;
      for (const position of [connection.start, connection.end]) {
        const tile = linkGameState.board.grid[position.row][position.column];
        linkGameState.board.grid[position.row][position.column] = { ...tile, special: true, premiumType: 'blue', luckyReward: { type: 'coins', value: 10 }, frozen: false };
      }
      Math.random = () => 0;
      for (const position of [connection.start, connection.end]) document.querySelector(`.link-board__cell[data-row="${position.row}"][data-column="${position.column}"] .link-tile`).click();
    }
    return initial;
  }, id);
  await page.waitForFunction(() => window.firstPairCommit);
  const committed = await page.evaluate(() => window.firstPairCommit);
  expect(committed.coins - before.coins).toBe(12);
  if(before.lettersEnabled){
    await expect.poll(()=>page.evaluate(()=>window.letterFeedbackSeen.length)).toBe(1);
    await expect.poll(()=>page.evaluate(()=>window.ticketFeedbackSeen)).toBe(1);
    expect(await page.evaluate(async()=>(await (await import('/js/persistence.js')).loadPersistentGameData()).appearance.spark.ticketEarned)).toBe(1);
    expect(await page.evaluate(async()=>Object.values((await (await import('/js/persistence.js')).loadPersistentGameData()).appearance.spark.letterEarned).reduce((a,b)=>a+b,0))).toBe(1);
    await page.screenshot({path:`design/rewards-letters/drop/review/${id}-gameplay.png`});
  }
  expect(committed.session.specialProgress).toBe(id === 'memory-match' ? 4 : 2);
  expect(committed.session.pairSnapshot.luckyAwards).toEqual([{ type: 'coins', value: 10 }]);
  if (id === 'link-connect') expect(committed.items.hint).toBe(before.hints + 2); // Blue supply + second energy milestone.
  await page.reload();
  const restored = await page.evaluate(async id => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
    const persistence = await import('/js/persistence.js'); const saved = await persistence.loadPersistentGameData();
    const key = (await import('/js/gameCatalog.js')).getGameProgressKey(id);
    const session = saved.progress[key].sessionsByMode.challenge;
    if (id === 'memory-match') await (await import('/js/gameController.js')).continueMemorySession(session);
    else await (await import('/js/linkConnect/linkController.js')).continueLinkSession(session);
    const after = await persistence.loadPersistentGameData(); return { coins: after.coins, session: after.progress[key].sessionsByMode.challenge, items: after.progress[key].items };
  }, id);
  expect(restored.coins).toBe(committed.coins);
  expect(restored.session.specialProgress).toBe(committed.session.specialProgress);
  expect(restored.session.pairSnapshot.matchedPairs).toBe(1);
  expect(restored.session.pairSnapshot.luckyAwards).toEqual(committed.session.pairSnapshot.luckyAwards);
  expect(restored.items).toEqual(committed.items);
});
test('Link bonus pair exits remain bounded and a restart cancels their pending presentation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.goto('/');
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.evaluate(async () => (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu('link-connect'));
  for (let cycle = 0; cycle < 5; cycle++) {
    await page.evaluate(async () => {
      await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'challenge', level: 1, skipIntro: true });
      const { linkGameState } = await import('/js/linkConnect/linkState.js');
      const connection = (await import('/js/linkConnect/pathfinder.js')).findAvailableConnections(linkGameState.board.grid)[0];
      for (const row of linkGameState.board.grid) for (let c = 0; c < row.length; c++) if (row[c]) row[c] = { ...row[c], special: false, luckyReward: null, frozen: false };
      for (const p of [connection.start, connection.end]) linkGameState.board.grid[p.row][p.column] = { ...linkGameState.board.grid[p.row][p.column], special: true, premiumType: 'red' };
      linkGameState.isLocked = false; Math.random = () => 0;
      window.bonusScope = (await import('/js/gameShell/gameShellLifecycle.js')).getActiveGameScope();
      for (const p of [connection.start, connection.end]) document.querySelector(`.link-board__cell[data-row="${p.row}"][data-column="${p.column}"] .link-tile`).click();
    });
    await expect.poll(() => page.evaluate(async () => (await import('/js/linkConnect/linkState.js')).linkGameState.matchedPairs)).toBe(3);
    expect(await page.locator('.link-thunder-strike').count()).toBeLessThanOrEqual(1);
    await page.evaluate(async () => (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'challenge', level: 1, restart: true, skipIntro: true }));
    await expect(page.locator('.link-thunder-strike')).toHaveCount(0);
    const disposed = await page.evaluate(() => window.bonusScope.diagnostics());
    expect(disposed.active).toBe(false); expect(disposed.timeout).toBe(0); expect(disposed.listener).toBe(0); expect(disposed.frame).toBe(0);
  }
  expect(errors).toEqual([]);
});
for (const id of ['memory-match', 'link-connect']) test(`${id} a failed pair transaction rolls back board, wallet and rewards together`, async ({ page }) => {
  await page.goto('/');
  const before = await page.evaluate(async id => {
    await (await import('/tests/ui/helpers/gameNavigation.js')).openReadyGameMenu(id);
    const { gameState } = await import('/js/gameState.js'); gameState.settings.mode = 'challenge';
    if (id === 'memory-match') await (await import('/js/gameController.js')).startNewMemoryRun(1, { skipIntro: true });
    else await (await import('/js/linkConnect/linkController.js')).startLinkLevel({ mode: 'challenge', level: 1, skipIntro: true });
    const key = (await import('/js/gameCatalog.js')).getGameProgressKey(id);
    const initial = { coins: gameState.coins, items: structuredClone(gameState.progress[key].items) };
    window.pairOriginalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function(value, ...args) {
      if (this.name === 'profile' && value.data?.progress[key]?.sessionsByMode.challenge?.pairSnapshot?.matchedPairs > 0) throw new DOMException('Fixture pair quota failure', 'QuotaExceededError');
      return window.pairOriginalPut.call(this, value, ...args);
    };
    if (id === 'memory-match') {
      const tiles = [...document.querySelectorAll('#grid-container .tile')]; const pair = tiles.filter(tile => tile.dataset.imageId === tiles[0].dataset.imageId);
      pair.forEach(tile => { tile.dataset.special = 'true'; }); gameState.isLocked = false; gameState.specialProgress = 3;
      gameState.luckyRewards.set(pair[0].dataset.imageId, { type: 'coins', value: 10 });
      const { handleTileClick } = await import('/js/logic.js'); await handleTileClick(pair[0]); await handleTileClick(pair[1]);
    } else {
      const { linkGameState } = await import('/js/linkConnect/linkState.js'); linkGameState.isLocked = false; linkGameState.specialProgress = 1;
      const connection = (await import('/js/linkConnect/pathfinder.js')).findAvailableConnections(linkGameState.board.grid)[0];
      for (const p of [connection.start, connection.end]) {
        linkGameState.board.grid[p.row][p.column] = { ...linkGameState.board.grid[p.row][p.column], special: true, premiumType: 'blue', luckyReward: { type: 'coins', value: 10 } };
        document.querySelector(`.link-board__cell[data-row="${p.row}"][data-column="${p.column}"] .link-tile`).click();
      }
    }
    return initial;
  }, id);
  await expect.poll(() => page.evaluate(async () => (await import('/js/persistence.js')).isPersistenceBlocked())).toBe(true);
  const result = await page.evaluate(async id => {
    IDBObjectStore.prototype.put = window.pairOriginalPut;
    const { gameState } = await import('/js/gameState.js'); const key = (await import('/js/gameCatalog.js')).getGameProgressKey(id);
    const state = id === 'memory-match' ? gameState : (await import('/js/linkConnect/linkState.js')).linkGameState;
    const ram = { coins: gameState.coins, items: structuredClone(gameState.progress[key].items), matched: state.matchedPairs, lucky: state.luckyAwards.length };
    const saved = await (await import('/js/persistence.js')).loadPersistentGameData();
    return { ram, coins: saved.coins, matched: saved.progress[key].sessionsByMode.challenge.pairSnapshot.matchedPairs };
  }, id);
  expect(result.ram).toMatchObject({ coins: before.coins, items: before.items, matched: 0, lucky: 0 });
  expect(result.coins).toBe(before.coins); expect(result.matched).toBe(0);
});
