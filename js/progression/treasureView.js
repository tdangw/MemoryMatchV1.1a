import { createTreasureArt } from './treasureArt.js';
import { createIcon } from '../icons.js';

function element(tag, className, text) {
  const node = document.createElement(tag); node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function action(text, name, primary = false) {
  const button = element('button', `app-button app-button--${primary ? 'primary' : 'secondary'}`, text);
  button.type = 'button'; button.dataset.treasureAction = name; return button;
}
export function renderTreasureContent(content, view, { selected = view.activeTier || 'S', phase = 'idle', error = '' } = {}) {
  const chest = view.chests.find(chest => chest.tier === selected);
  if (!chest) throw new RangeError('Missing selected treasure.');
  const range = element('p', 'treasure-range', `Màn ${view.firstLevel}–${view.lastLevel}`);
  const cards = element('div', 'treasure-cards'); cards.setAttribute('aria-label', 'Bốn rương hành trình');
  for (const item of view.chests) {
    const card = element('button', `treasure-card is-${item.state}`);
    card.type = 'button'; card.dataset.treasureTier = item.tier;
    card.setAttribute('aria-pressed', String(item.tier === selected));
    const stateLabel={claimed:'Đã nhận',ready:'Có thể mở',waiting:'Chờ rương trước',progress:'Đang tích lũy'}[item.state];
    card.setAttribute('aria-label', `${item.name}, ${item.completedLevels}/10 màn ${item.difficulty}, ${stateLabel}`);
    card.append(createTreasureArt(item.tier, item.state === 'claimed'), element('strong','',item.name),
      element('small','',item.state === 'claimed' ? 'Đã nhận' : item.state === 'ready' ? 'Có thể mở' : item.state === 'waiting' ? 'Chờ rương trước' : `${item.completedLevels}/10 · ${item.difficulty}`));
    cards.append(card);
  }
  const detail = element('section','treasure-detail'); detail.dataset.selectedTier = selected;
  const hero = element('div','treasure-hero');
  hero.append(createTreasureArt(selected, phase === 'success' || phase !== 'opening' && chest.state === 'claimed'));
  const heading = element('h3','',chest.name);
  const progress = element('progress','treasure-progress'); progress.max = 10; progress.value = chest.completedLevels;
  progress.setAttribute('aria-label', `${chest.name}: ${chest.completedLevels}/10 màn ${chest.difficulty}`);
  const copy = element('p','treasure-progress-copy',`Đã hoàn thành ${chest.completedLevels}/10 màn ${chest.difficulty}`);
  let message = view.allClaimed ? `Đã mở trọn bộ kho báu Màn ${view.firstLevel}–${view.lastLevel}.`
    : chest.state === 'claimed' ? 'Đã nhận'
    : chest.state === 'waiting' ? `Đã hoàn thành đủ 10 màn. Mở ${chest.previousName} trước.`
    : chest.state === 'ready' ? `${chest.name} đã sẵn sàng!`
    : `Còn ${10 - chest.completedLevels} màn ${chest.difficulty} để mở rương.`;
  if (phase === 'opening') message = 'Đang mở rương…';
  if (phase === 'busy') message = 'Đang nhận thưởng…';
  if (phase === 'success') message = `Bạn đã mở ${chest.name}`;
  if (error) message = error;
  const status = element('p',`treasure-status${error ? ' treasure-error' : ''}`, message);
  status.setAttribute('role','status');
  const rewards = element('div','treasure-rewards');
  for (const [icon,label] of [['coin',`${chest.reward.coins} Xu`],['wand',`${chest.reward.hints} Gợi ý`]]) {
    const cell = element('div','treasure-reward'); cell.append(createIcon(icon), document.createTextNode(label)); rewards.append(cell);
  }
  const actions = element('div','treasure-actions');
  if (phase === 'success' || chest.state === 'claimed' || view.allClaimed) {
    actions.append(action('Xong','close',true));
    if (!view.allClaimed && selected !== view.activeTier) actions.append(action('Xem rương tiếp','next'));
  } else if (chest.state === 'ready') actions.append(action(error ? 'Thử lại' : 'Mở rương','claim',true));
  else if (chest.state === 'waiting') actions.append(action(`Xem rương trước`,'previous',true));
  else actions.append(action('Chơi tiếp','play',true));
  detail.append(hero,heading,copy,progress,status,rewards,actions);
  const collection = element('button','treasure-collection-link','Bộ sưu tập tranh');
  collection.type = 'button'; collection.dataset.treasureAction = 'collection';
  content.className = 'treasure-content'; content.dataset.phase = phase;
  content.replaceChildren(range,cards,detail,collection);
  if (phase === 'busy' || phase === 'opening') for (const control of content.querySelectorAll('button')) control.disabled = true;
}

