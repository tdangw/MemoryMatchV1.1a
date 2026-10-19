import { openAppModal } from '../modal.js';
import { gameState } from '../gameState.js';
import { getGameProgressKey } from '../gameCatalog.js';
import { getChapterNumber } from '../adventureProgress.js';
import { loadPersistentChapter } from '../persistence.js';
import { claimJourneyTreasure } from '../adventureRewards.js';
import { getRankingOwner } from '../rankingOwner.js';
import { canLaunchGame } from '../profileOperations.js';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { renderMasteryCollection } from './masteryCollection.js';
import { projectJourneyTreasure, nextTreasureLevel } from './treasureProjection.js';
import { renderTreasureContent } from './treasureView.js';

/** A single modal owns selection and presentation; only the reward transaction grants inventory. */
export function openJourneyTreasure({ gameId, block, owner, selectedTier, onClaimed = () => {}, onPlay }) {
  const key = getGameProgressKey(gameId), profile = gameState.progress[key];
  const identity = JSON.stringify(getRankingOwner());
  const scope = createGameShellLifecycle();
  const release = owner?.own(() => scope.dispose(), 'cleanup');
  scope.own(() => release?.forget());
  const content = document.createElement('div');
  content.textContent = 'Đang mở kho báu…';
  let view, completed, selected = selectedTier, phase = 'idle', error = '', generation = 0;
  const current = () => scope.active && gameState.progress[key] === profile && identity === JSON.stringify(getRankingOwner()) && canLaunchGame();
  const modal = openAppModal({ id: 'adventure-chest-modal', title: 'Kho báu hành trình', content, owner: scope,
    alignment: 'center', keepBanner: true, onDestroy: () => scope.dispose() });
  modal.panel.classList.add('treasure-dialog');
  const draw = () => renderTreasureContent(content,view,{selected,phase,error});
  async function read() {
    const token = ++generation;
    const record = await loadPersistentChapter(key,getChapterNumber(block * 10));
    if (!current() || token !== generation) { if (scope.active) modal.destroy(); return false; }
    completed = {...record.bestByLevel};
    // Only one chapter and the existing frontier are needed; no scan through history.
    view = projectJourneyTreasure({completed,block,claim:record.claimedChests[block]});
    selected ||= view.activeTier || 'S'; return true;
  }
  async function load() {
    try { if (await read()) draw(); }
    catch (cause) {
      if (!current()) { modal.destroy(); return; }
      console.error('Treasure load failed',cause.name);
      content.className='treasure-content';
      const message=document.createElement('p');message.textContent='Chưa tải được kho báu. Hãy thử lại.';
      const retry=document.createElement('button');retry.type='button';retry.className='app-button app-button--primary';
      retry.textContent='Thử lại';retry.dataset.treasureAction='reload';content.replaceChildren(message,retry);
    }
  }
  scope.listen(content,'click',event => {
    if (!current()) { modal.destroy(); return; }
    const control=event.target.closest('button');
    if (!control || control.disabled || phase === 'busy') return;
    if (control.dataset.treasureTier) {
      selected=control.dataset.treasureTier;error='';phase='idle';draw();
      content.querySelector(`[data-treasure-tier="${selected}"]`).focus();return;
    }
    const action=control.dataset.treasureAction;
    if (action==='reload') { void load(); return; }
    if (!view) return;
    if (action==='close') { modal.close(); return; }
    if (action==='next' || action==='previous') { selected=view.activeTier || 'S';error='';phase='idle';draw();return; }
    if (action==='play') {
      const target=nextTreasureLevel({completed,block,tier:selected,unlockedThrough:profile.adventure?.unlockedThrough});
      if (target) { modal.destroy(); void onPlay?.(target); } return;
    }
    if (action==='collection') {
      modal.destroy();
      const collection=document.createElement('div');
      openAppModal({id:'treasure-collection-modal',title:'Bộ sưu tập tranh',content:collection,owner,alignment:'center',keepBanner:true});
      renderMasteryCollection(collection,gameId,{block});return;
    }
    if (action==='claim') void modal.submit(async () => {
      const requested=selected;phase='busy';error='';draw();
      try {
        const result=await claimJourneyTreasure(gameId,block,requested);
        if (!current()) { modal.destroy(); return false; }
        if (!result.ok) {
          phase='idle';
          error=result.reason==='inventory-full' ? 'Hãy dùng bớt Gợi ý để có chỗ nhận thưởng.' : 'Chưa nhận được thưởng. Hãy thử lại.';
          if (result.reason==='stale-tier') await read();
          if(current()) draw();return false;
        }
        if (!await read()) return false;
        selected=requested;phase='success';draw();onClaimed(result.outcome);
      } catch(cause) {
        if (current()) { phase='idle';error='Chưa nhận được thưởng. Hãy thử lại.';draw();console.error('Treasure claim failed',cause.name); }
      }
      return false;
    });
  });
  void load();
  return { ...modal, diagnostics: () => scope.diagnostics() };
}
