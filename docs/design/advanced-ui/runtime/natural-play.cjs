const {expect}=require('@playwright/test');
async function startNatural(page,game){
  await page.locator(`.game-selector__choice[data-game-id="${game}"]`).click();await expect(page.locator('#menu-container[data-map-ready="true"]')).toBeVisible();
  await startMapLevel(page);
}
async function startMapLevel(page){await page.locator('[data-level="1"]').click();await page.locator('#adventure-level-modal').getByRole('button',{name:'Chơi',exact:true}).click();await expect(page.locator('.progression-wave-notice')).toBeVisible();await expect(page.locator('.progression-wave-notice')).toHaveCount(0);if(await page.locator('.tutorial-guide button').isVisible())await page.locator('.tutorial-guide button').click();}
async function solveNatural(page,game){
  if(game==='memory-match') for(let wave=1;wave<=2;wave++){
    await expect.poll(()=>page.evaluate(async()=>{const {gameState:s}=await window.productModule('/js/gameState.js');return !s.isLocked&&!document.querySelector('#game-container.is-previewing')&&s.wave.index;}),{timeout:15000}).toBe(wave);
    for(let pair=0;pair<6;pair++){
      const ids=await page.evaluate(async()=>{const {memoryBoard:b}=await window.productModule('/js/memoryMatch/memoryBoard.js');const tiles=[...b.tiles].filter(([,t])=>!t.matched);const [a,t]=tiles[0], [z]=tiles.find(([id,u])=>id!==a&&u.imageId===t.imageId);return[a,z];});
      for(const id of ids) await page.locator(`[id="${id}"]`).click();
      await expect.poll(()=>page.evaluate(async({id,wave})=>{const {memoryBoard:b}=await window.productModule('/js/memoryMatch/memoryBoard.js');const {gameState:s}=await window.productModule('/js/gameState.js');return b.tiles.get(id)?.matched===true||s.wave.index>wave||s.wave.phase==='won';},{id:ids[0],wave})).toBe(true);
      await expect.poll(()=>page.evaluate(async()=>{const{gameState:s}=await window.productModule('/js/gameState.js');return !s.isLocked||s.wave.phase==='won';}),{timeout:15000}).toBe(true);
    }
  }
  else if(game==='link-connect') {
    for(let step=0;step<20;step++){
      await expect.poll(()=>page.evaluate(async()=>{const{linkGameState:s}=await window.productModule('/js/linkConnect/linkState.js');return s.wave.phase==='won'||!s.isLocked;}),{timeout:15000}).toBe(true);
      const pair=await page.evaluate(async()=>{const{linkGameState:s}=await window.productModule('/js/linkConnect/linkState.js');if(s.wave.phase==='won')return null;const {findAvailableConnections}=await window.productModule('/js/linkConnect/pathfinder.js');return findAvailableConnections(s.board.grid).find(({start:a,end:b})=>!s.board.grid[a.row][a.column].frozen&&!s.board.grid[b.row][b.column].frozen);});
      if(pair===null)break;if(!pair)throw Error('No available real Link pair');
      for(const p of [pair.start,pair.end])await page.locator(`.link-board__cell[data-row="${p.row}"][data-column="${p.column}"] .link-tile`).click();
      await expect.poll(()=>page.evaluate(async()=>{const{linkGameState:s}=await window.productModule('/js/linkConnect/linkState.js');return s.wave.phase==='won'||!s.isLocked;}),{timeout:15000}).toBe(true);
    }
  } else for(let wave=1;wave<=2;wave++){
    await expect.poll(()=>page.evaluate(async()=>{const s=(await window.productModule('/js/sessionProgress.js')).getActiveSession('triple-connect','easy');return s?.wave.phase==='playing'&&s.wave.index;}),{timeout:15000}).toBe(wave);
    const commands=await page.evaluate(async()=>{const s=(await window.productModule('/js/sessionProgress.js')).getActiveSession('triple-connect','easy');const{restoreSerializedTripleRoundState}=await window.productModule('/js/tripleConnect/tripleState.js');const{solveTripleState}=await window.productModule('/js/tripleConnect/tripleSolver.js');const result=solveTripleState({initialState:restoreSerializedTripleRoundState(s.snapshot),maxNodes:10000,maxMemo:5000,deadlineMs:1000});if(result.status!=='solved')throw Error(result.status);return result.witness;});
    for(const command of commands){await page.locator(`.triple-connect__board [data-tile-id="${command.tileId}"]`).click();await expect(page.locator(`.triple-connect__board [data-tile-id="${command.tileId}"]`)).toHaveCount(0);await expect(page.locator('.triple-connect__tray-flight, .triple-connect__ghost')).toHaveCount(0);}
  }
  await expect(page.locator('#level-summary-modal')).toBeVisible({timeout:15000});
}
module.exports={startNatural,startMapLevel,solveNatural};
