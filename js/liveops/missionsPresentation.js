import { node, action, createTabs } from './ui.js';
import { DAILY, WEEKLY, DAY_MS } from './model.js';
import { LOGIN_REWARDS } from './missionRewards.js';
import { createIcon } from '../icons.js';

export function loginDayStates(state) {
  const received = state.loginDay === state.day;
  const count = received ? state.loginNext || 7 : state.loginNext;
  return LOGIN_REWARDS.map((reward, index) => ({ ...reward, index,
    status: index < count ? 'received' : !received && index === count ? 'available' : 'locked' }));
}
function progress(value, target, label) {
  const root = node('div', 'liveops__progress-row'), bar = node('progress', 'liveops__progress');
  bar.max = target; bar.value = Math.min(value, target); bar.setAttribute('aria-label', label);
  root.append(bar, node('span', '', `${Math.min(value, target)}/${target}`)); return root;
}
function sectionHeading(title, icon) {
  const heading = node('div', 'liveops__card-heading');
  if (icon) heading.append(createIcon(icon));
  heading.append(node('h3', '', title));
  return heading;
}
export function renderMissions(host, { view, tab, busy, run, play, renderEmpty, canPlay, canClaim, selectTab }) {
  const tabs = createTabs('missions', [['daily','Hôm nay'],['weekly','Tuần này']], tab, (key, panel) => {
    selectTab(key); panel.replaceChildren();
    if (!view) { renderEmpty(panel); return; }
    const state = view.state, current = state[key], catalog = key === 'daily' ? DAILY : WEEKLY;
    const countdown = node('p', 'liveops__countdown');countdown.dataset.period=key;panel.append(countdown);
    if (key === 'daily') {
      const login = node('section', 'liveops__card liveops__login'), days = node('div', 'liveops__days');
      login.id = 'missions-login'; login.tabIndex = -1;
      login.append(sectionHeading('Điểm danh 7 ngày', 'calendar'));
      for (const day of loginDayStates(state)) {
        const tile = node('button', 'liveops__day'); tile.type='button';tile.dataset.state = day.status;
        tile.disabled=busy||!canClaim||day.status!=='available';tile.dataset.focusKey=`login-day-${day.index}`;
        tile.onclick=()=>void run({type:'login',loginVersion:2});
        const game={'memory-match':'Memory Match','link-connect':'Link Connect','triple-connect':'Triple Connect'}[day.gameId];
        tile.setAttribute('aria-label',`Ngày ${day.index+1}: ${day.coins} Xu và ${game?`1 Gợi ý ${game}`:'gói 3 vật phẩm hỗ trợ'}${day.status==='received'?', đã nhận':day.status==='locked'?', khóa':''}`);
        const rewards = node('div', 'liveops__day-rewards'),coins=node('span','liveops__day-prize'),support=node('span','liveops__day-prize');
        coins.append(createIcon('coin'),node('small','',String(day.coins)));
        support.append(createIcon(game?'wand':'chest'),node('small','',game?'×1':'×3'));rewards.append(coins,support);
        const status = node('span', 'liveops__day-status');
        if (day.status !== 'available') status.append(createIcon(day.status === 'received' ? 'check' : 'lock'));
        tile.append(node('strong', 'liveops__day-label', `Ngày ${day.index + 1}`), rewards,status);
        days.append(tile);
      }
      login.append(days);
      panel.append(login);
    }
    panel.append(node('h3', 'liveops__section-title', key === 'daily' ? 'Nhiệm vụ hôm nay' : 'Nhiệm vụ tuần này'));
    let completed = 0;
    for (const item of catalog) {
      const value = current[item.key], ready = value >= item.target, claimed = current.claimed.includes(item.id);
      if (ready) completed++;
      const row = node('section', 'liveops__card liveops__mission');
      const symbol = node('div', 'liveops__mission-symbol');
      symbol.append(createIcon(item.key === 'wins' ? 'trophy' : item.key === 'matches' ? 'cards' : item.key === 'visits' ? 'calendar' : 'achievements'));
      const body = node('div', 'liveops__mission-body');
      const title=item.id==='win-without-hint'?'Thắng không dùng gợi ý':item.label;
      body.append(node('h3', '', title), progress(value, item.target, title));
      const controls = node('div', 'liveops__mission-action');
      if (key === 'daily') {
        const claim=action(claimed?'Đã nhận':ready?'':canPlay?'Chơi':'Quay lại ván chơi',ready?()=>void run({type:'daily',id:item.id}):play,busy||claimed||(ready?!canClaim:!canPlay),`mission-${item.id}`);
        if(ready&&!claimed){claim.append(node('span','',String(item.coins)),createIcon('coin'));claim.classList.add('liveops__claim-coins');claim.setAttribute('aria-label',`Nhận ${item.coins} Xu`);}
        controls.append(claim);
      }
      else if (ready) {
        const done = node('p', 'liveops__mission-complete'); done.append(createIcon('check'), node('span', '', 'Hoàn thành')); controls.append(done);
      }
      else if (item.key === 'visits') controls.append(action('Điểm danh', () => { tabs.select('daily'); tabs.panel.querySelector('#missions-login').focus(); }, busy));
      else controls.append(action(canPlay ? 'Chơi' : 'Quay lại ván chơi', play, busy || !canPlay, `mission-${item.id}`));
      row.append(symbol, body, controls);
      panel.append(row);
    }
    const bonus = node('section', 'liveops__card liveops__bonus'), received = current.claimed.includes('bonus');
    const bonusBody = node('div', 'liveops__bonus-body'), bonusArt = node('button', 'liveops__bonus-art');
    bonusArt.type='button';bonusArt.disabled=busy||!canClaim||received||completed<catalog.length;bonusArt.dataset.state=received?'received':completed===catalog.length?'available':'locked';
    bonusArt.dataset.focusKey=`claim-${key}-bonus`;bonusArt.setAttribute('aria-label',received?'Đã nhận thưởng nhiệm vụ':key==='daily'?'Mở rương nhiệm vụ: 10 Xu và 1 Vé quay':'Mở rương nhiệm vụ tuần: 50 Xu và 2 Vé quay');
    bonusArt.onclick=()=>void run({type:key==='daily'?'dailyBonus':'weekly'});
    bonusArt.append(createIcon('chest'));
    bonusArt.append(createIcon(received?'check':completed<catalog.length?'lock':'check'));
    bonusBody.append(node('h3', '', 'Nhiệm vụ đã hoàn thành'),progress(completed, catalog.length, 'Nhiệm vụ đã hoàn thành'));
    bonus.append(bonusBody, bonusArt);
    panel.append(bonus);
    if (key === 'weekly') {
      const journey = node('section', 'liveops__card liveops__journey'); journey.append(sectionHeading('Hành trình tuần', 'missions'));
      journey.append(progress(state.event.points, 80, 'Điểm hành trình tuần'), node('p', '', 'Mốc 20: 5 Xu · Mốc 50: 10 Xu · Mốc 80: 10 Xu'), node('p', '', 'Thắng ván để tích điểm, tối đa 40 điểm mỗi ngày. Xu được trao khi đạt mốc.')); panel.append(journey);
    }
  });
  host.append(tabs.root, tabs.panel); tabs.select(tab, false);
}
export function updateMissionCountdown(root, state, now) {
  for (const label of root.querySelectorAll('.liveops__countdown')) {
    const end = (label.dataset.period === 'daily' ? state.day + 1 : state.week + 7) * DAY_MS;
    const minutes = Math.max(0, Math.ceil((end - now) / 60000));
    const text = `Làm mới sau: ${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
    if (label.textContent !== text) label.textContent = text;
  }
}
