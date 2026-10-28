import { createTreasureArt } from './treasureArt.js';
export function renderTreasureMapCard(control, view) {
  const chest=view.chests.find(item=>item.tier===view.activeTier) || view.chests[3];
  control.dataset.block=String(view.block);control.dataset.ready=String(chest.state==='ready');
  const progress = view.allClaimed ? 'Đã nhận đủ bốn rương' : chest.name+' · '+chest.completedLevels+'/10 màn '+chest.difficulty;
  const reward = view.allClaimed ? 'Xem lại kho báu' : 'Thưởng '+chest.reward.coins+' Xu · '+chest.reward.hints+' Gợi ý';
  control.setAttribute('aria-label','Kho báu · '+progress+' · '+reward);
  control.title = 'Màn '+view.firstLevel+'–'+view.lastLevel+' · '+progress;
  control.replaceChildren(createTreasureArt(chest.tier,chest.state==='claimed'));
}
