// Separate production QA entry. Never included by the ordinary product build.
import * as effects from '../../../js/backgroundEffects.js';
import { gameState } from '../../../js/gameState.js';
import { openGameMenu, showGameSelector } from '../../../js/gameSelector.js';
import { selectUiSkin } from '../../../js/uiSkin.js';
import { startNewMemoryRun } from '../../../js/gameController.js';
import { startLinkLevel, runLinkGameAction } from '../../../js/linkConnect/linkController.js';
import { startTripleConnectRound } from '../../../js/tripleConnect/tripleController.js';
import { changeMemoryItemCount } from '../../../js/memoryItems.js';
import { grantLinkItem, getLinkItemCount } from '../../../js/linkConnect/linkItems.js';
import { linkGameState } from '../../../js/linkConnect/linkState.js';
import { grantTripleItem, getTripleItemCount } from '../../../js/tripleConnect/tripleItems.js';
import { openQuickAssistOverlay } from '../../../js/shop.js';
import { GAMEPLAY_RULES_VERSION } from '../../../js/progression/gameplayRules.js';
import { saveSetting } from '../../../js/persistence.js';
import { disposeAppPage, getAppPageScope } from '../../../js/appPageLifecycle.js';
import { mountMapAmbient } from '../../../js/background/bindings.js';

let triple = null;
window.ambientProbe = {
  ...effects, home: showGameSelector, map: openGameMenu, skin: selectUiSkin, linkAction: runLinkGameAction, saveSetting, disposeAppPage,
  mapDetails() {
    const root = document.querySelector('#menu-container[data-map-ready="true"]');
    if (!root) throw new Error('Map is not ready');
    return mountMapAmbient(getAppPageScope(), root, root.querySelector('.adventure-map-trail'), root.querySelector('.adventure-map-scroll'), {mapDetails:true});
  },
  memoryTime() { openQuickAssistOverlay('time'); },
  linkFreeze() { document.querySelector('#link-connect-container [data-item="freeze"]').click(); },
  linkItemCount: () => getLinkItemCount('freeze'),
  linkUnlocked: () => !linkGameState.isLocked,
  async tripleTime() { const before=getTripleItemCount('time'); document.querySelector('[data-triple-item="time"]').click(); await triple.whenIdle(); if(getTripleItemCount('time')!==before-1)throw new Error('Time fixture was not applied'); },
  tripleTimeCount: () => getTripleItemCount('time'),
  async start(game, mode = 'easy') {
    // Disposable QA profile, identical for each A/B arm; no production bypass.
    if(mode==='superHard') {
      const key={'memory-match':'memoryMatch','link-connect':'linkConnect','triple-connect':'tripleConnect'}[game];
      for(const prerequisite of ['easy','normal','hard']) gameState.progress[key].bestByLevel[`${prerequisite}:1`]={cleared:true,rulesVersion:GAMEPLAY_RULES_VERSION};
    }
    gameState.settings.sound = gameState.settings.music = false; gameState.settings.mode = mode;
    let seed = 20261026;
    Math.random = () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    if(game==='memory-match') { changeMemoryItemCount('time60',20); return startNewMemoryRun(1,{skipIntro:true}); }
    if(game==='link-connect') { await grantLinkItem('freeze',40); return startLinkLevel({mode,level:1,skipIntro:true}); }
    await grantTripleItem('time',40); triple=await startTripleConnectRound({mode,level:1,skipIntro:true,seed:20261026}); return true;
  },
};
