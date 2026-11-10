import {test,expect} from '@playwright/test';
test.skip(process.env.VITE_FIREBASE_USE_EMULATORS!=='1','Isolated emulator only.');
test.beforeEach(async({page})=>{
 await page.route('**/js/firebaseBackend.js*',async route=>{
  const response=await route.fetch(),source=(await response.text()).replace('127.0.0.1:9199','127.0.0.1:9399').replace('"127.0.0.1", 8180','"127.0.0.1", 8380');
  await route.fulfill({response,body:source});
 });
});
for(const [game,key,record] of [['memory-match','memoryMatch','recordMemoryMatchResult'],['link-connect','linkConnect','recordLinkConnectResult'],['triple-connect','tripleConnect','recordTripleConnectResult']])test(`${game} complete tuple is durable offline and publishes once after reload`,async({page,context})=>{
 test.setTimeout(90000);await page.goto('/');
 await expect.poll(()=>page.evaluate(async()=>(await import('/js/accountService.js')).getAccountService()?.getState().phase),{timeout:30000}).toBe('synced');
 await page.evaluate(async()=>await(await import('/js/leaderboardService.js')).getLeaderboardService().ready);
 await context.setOffline(true);
 const expected=await page.evaluate(async({game,key,record})=>{
  const state=await import('/js/gameState.js'),waves=await import('/js/progression/waveProgress.js');
  let wave=waves.createWaveProgress({attemptId:crypto.randomUUID(),gameId:game,mode:'easy',level:1,groupsPerWave:6});
  for(let i=1;i<=wave.count;i++){wave=waves.completeWave(wave,{score:i*100,moves:i*20,misses:i,matchedGroups:6}).progress;if(wave.phase==='advance')wave=waves.activateNextWave(wave);}
  state[record]({mode:'easy',level:1,score:wave.completedScore+10,stars:3,wave});
  const persistence=await import('/js/persistence.js');if(!await persistence.saveProgress(state.gameState.progress))throw Error('Local completion failed');
  await(await import('/js/leaderboardService.js')).getLeaderboardService().recover(state.gameState.progress);
  const saved=await persistence.loadPersistentGameData();return saved.progress[key].adventureBestsV4.easy;
 },{game,key,record});
 expect(expected).toMatchObject({rulesVersion:4,kind:'adventure',score:210,moves:40,misses:2,metricsComplete:true});
 expect(await page.evaluate(async()=>await(await import('/js/leaderboardService.js')).getLeaderboardService().flush())).toBe(false);
 await context.setOffline(false);await page.reload();
 await expect.poll(()=>page.evaluate(async()=>(await import('/js/accountService.js')).getAccountService()?.getState().phase),{timeout:30000}).toBe('synced');
 const read=()=>page.evaluate(async game=>{const b=await(await import('/js/firebaseBackend.js')).getFirebaseBackend(),store=await import('/js/leaderboardStore.js');store.clearLeaderboardCache();return (await store.readLeaderboard({database:b.database,environment:b.environment,uid:b.auth.currentUser.uid,board:{gameId:game,mode:'easy',family:'adventure',kind:'adventure',rulesVersion:4}})).own;},game);
 await page.evaluate(async()=>{const s=(await import('/js/leaderboardService.js')).getLeaderboardService();await s.ready;await s.flush();});
 await expect.poll(async()=>(await read())?.resultId,{timeout:20000}).toBe(expected.id);
 const published=await read();expect(published).toMatchObject({score:210,moves:40,misses:2,metricsComplete:true});
 await page.evaluate(async()=>{const s=(await import('/js/leaderboardService.js')).getLeaderboardService();await s.recover();await s.flush();});
 expect((await read()).reachedAt).toEqual(published.reachedAt);
 await page.locator('[data-dock-action="ranking"]').click();await page.locator(`[data-rank-game="${game}"]`).click();
 await expect(page.locator('.leaderboard-own .leaderboard-card-stat--score')).toHaveText('210');
 await expect(page.locator('.leaderboard-own .leaderboard-card-stat--moves')).toHaveText('40');
 await expect(page.locator('.leaderboard-own .leaderboard-card-stat--misses')).toHaveText('2');
});
