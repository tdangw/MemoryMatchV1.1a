import { createTreasureArt } from './treasureArt.js';
export function renderTreasureMapCard(control, view) {
  const chest=view.chests.find(item=>item.tier===view.activeTier) || view.chests[3];
  control.dataset.block=String(view.block);control.dataset.ready=String(chest.state==='ready');
  const copy=document.createElement('span');copy.className='treasure-map-card__copy';
  const range=document.createElement('small');range.textContent='Màn '+view.firstLevel+'–'+view.lastLevel;
  const title=document.createElement('strong');title.textContent=view.allClaimed?'Đã nhận đủ bốn rương':chest.name+' · '+chest.completedLevels+'/10 màn '+chest.difficulty;
  const reward=document.createElement('span');reward.textContent=view.allClaimed?'Xem lại kho báu':(chest.state==='ready'?'Có thể mở · ':'Thưởng: ')+chest.reward.coins+' Xu · '+chest.reward.hints+' Gợi ý';
  const action=document.createElement('span');action.className='treasure-map-card__action';action.textContent='Xem kho báu';
  copy.append(range,title,reward);control.replaceChildren(createTreasureArt(chest.tier,chest.state==='claimed'),copy,action);
}
