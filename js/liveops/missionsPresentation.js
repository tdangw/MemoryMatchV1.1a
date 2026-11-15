import { node, action, createTabs } from './ui.js';
import { DAILY, WEEKLY, DAY_MS } from './model.js';
import { LOGIN_REWARDS, WEEKLY_JOURNEY_REWARDS } from './missionRewards.js';
import { createIcon } from '../icons.js';
import { createChestArt } from './chestArt.js';
import { createRewardInfo as rewardInfo } from '../rewardInfo.js';

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
export function renderMissions(host, { view, tab, busy, run, play, renderEmpty, canPlay, canClaim, selectTab, getNow=()=>view.serverNow }) {
  const tabs = createTabs('missions', [['daily','Hôm nay'],['weekly','Tuần này']], tab, (key, panel) => {
    selectTab(key); panel.replaceChildren();
    if (!view) { renderEmpty(panel); return; }
    const state = view.state, current = state[key], catalog = key === 'daily' ? DAILY : WEEKLY;
    const countdown = node('p', 'liveops__countdown'),value=node('span','');countdown.dataset.period=key;
    countdown.dataset.format='compact';value.dataset.countdownValue='';countdown.append(createIcon('restart'),value);
    if (key === 'daily') {
      const login = node('section', 'liveops__card liveops__login'), days = node('div', 'liveops__days');
      login.id = 'missions-login'; login.tabIndex = -1;
      const heading=sectionHeading('Điểm danh 7 ngày', 'calendar');heading.classList.add('liveops__timed-heading');
      heading.append(countdown);login.append(heading);
      for (const day of loginDayStates(state)) {
        const tile = node('button', 'liveops__day'); tile.type='button';tile.dataset.state = day.status;
        tile.disabled=busy||!canClaim||day.status!=='available';tile.dataset.focusKey=`login-day-${day.index}`;
        tile.onclick=()=>void run({type:'login',loginVersion:2});
        const game={'memory-match':'Memory Match','link-connect':'Link Connect','triple-connect':'Triple Connect'}[day.gameId];
        tile.setAttribute('aria-label',`Ngày ${day.index+1}: ${day.coins} Xu và ${game?`1 Gợi ý ${game}`:'gói 3 vật phẩm hỗ trợ'}${day.status==='received'?', đã nhận':day.status==='locked'?', khóa':''}`);
        const rewards = node('div', 'liveops__day-rewards'),coins=node('span','liveops__day-prize'),support=node('span','liveops__day-prize');
        coins.append(createIcon('coin'));
        support.append(createIcon(game?'wand':'chest', { vector: Boolean(game) }));rewards.append(coins,support);
        const status = node('span', 'liveops__day-status');
        if (day.status !== 'available') status.append(createIcon(day.status === 'received' ? 'check' : 'lock', { vector: true }));
        tile.append(node('strong', 'liveops__day-label', `Ngày ${day.index + 1}`), rewards,status);
        if(!game){const cell=node('div','liveops__day-cell reward-info-host');cell.append(tile,rewardInfo(`${day.coins} Xu và 3 hỗ trợ ngẫu nhiên, mỗi trò 1 hỗ trợ.`,'Thông tin quà điểm danh ngày 7'));days.append(cell);}
        else days.append(tile);
      }
      login.append(days);
      panel.append(login);
    }
    if(key==='daily')panel.append(node('h3','liveops__section-title','Nhiệm vụ hôm nay'));
    else{const heading=sectionHeading('Nhiệm vụ tuần này','missions');heading.classList.add('liveops__timed-heading');heading.append(countdown);panel.append(heading);}
    let completed = 0;
    for (const item of catalog) {
      const value = current[item.key], ready = value >= item.target, claimed = current.claimed.includes(item.id);
      if (ready) completed++;
      const row = node('section', 'liveops__card liveops__mission');
      row.dataset.state=claimed?'received':ready?'available':'locked';
      const symbol = node('div', 'liveops__mission-symbol');
      symbol.append(createIcon(item.key === 'wins' ? 'trophy' : item.key === 'matches' ? 'cards' : item.key === 'visits' ? 'calendar' : 'achievements'));
      const body = node('div', 'liveops__mission-body');
      const title=item.id==='win-without-hint'?'Thắng không dùng gợi ý':item.label;
      body.append(node('h3', '', title), progress(value, item.target, title));
      const controls = node('div', 'liveops__mission-action');
      if (key === 'daily'||ready||claimed) {
        const claim=action(claimed?'Đã nhận':ready?'':canPlay?'Chơi':'Quay lại ván chơi',ready?()=>void run({type:key,id:item.id}):play,busy||claimed||(ready?!canClaim:!canPlay),`mission-${item.id}`);
        if(ready&&!claimed){claim.append(node('span','',String(item.coins)),createIcon('coin'));claim.classList.add('liveops__claim-coins');claim.setAttribute('aria-label',`Nhận ${item.coins} Xu`);}
        controls.append(claim);
      }
      else if (item.key === 'visits') controls.append(action('Điểm danh', () => { tabs.select('daily'); tabs.panel.querySelector('#missions-login').focus(); }, busy));
      else controls.append(action(canPlay ? 'Chơi' : 'Quay lại ván chơi', play, busy || !canPlay, `mission-${item.id}`));
      row.append(symbol, body, controls);
      panel.append(row);
    }
    const bonus = node('section', 'liveops__card liveops__bonus'), received = current.claimed.includes('bonus');
    const eligible=completed===catalog.length;
    bonus.dataset.state=received?'received':eligible?'available':'locked';
    const bonusBody = node('div', 'liveops__bonus-body'), bonusArt = node('button', 'liveops__bonus-art');
    bonusArt.type='button';bonusArt.disabled=busy||!canClaim||received||!eligible;bonusArt.dataset.state=bonus.dataset.state;
    const reward=key==='daily'?'10 Xu và 1 Vé quay':'50 Xu và 2 Vé quay';
    bonusArt.dataset.focusKey=`claim-${key}-bonus`;bonusArt.setAttribute('aria-label',received?'Đã nhận thưởng nhiệm vụ':`${eligible?'Nhận thưởng':'Chưa đủ điều kiện nhận thưởng'} nhiệm vụ${key==='weekly'?' tuần':''}: ${reward}`);
    bonusArt.onclick=()=>void run({type:key==='daily'?'dailyBonus':'weekly'});
    bonusArt.append(createIcon('chest'));
    if(received||!eligible){const badge=createIcon(received?'check':'lock');badge.classList.add('liveops__bonus-state');bonusArt.append(badge);}
    const symbol=node('div','liveops__mission-symbol');symbol.append(createIcon('missions'));
    bonusBody.append(node('h3', '', 'Thưởng nhiệm vụ'),progress(completed, catalog.length, 'Nhiệm vụ đã hoàn thành'));
    const bonusReward=node('div','liveops__bonus-reward liveops__reward-with-info');
    bonusReward.append(bonusArt,rewardInfo(reward,`Thông tin rương nhiệm vụ ${key==='daily'?'ngày':'tuần'}`));
    bonus.append(symbol, bonusBody, bonusReward);
    panel.append(bonus);
    if (key === 'weekly') {
      const journey = node('section', 'liveops__card liveops__journey');journey.setAttribute('aria-label','Tiến trình thưởng tuần');
      const lane=node('div','liveops__festival-lane'),road=node('div','liveops__festival-rewards');
      const target=WEEKLY_JOURNEY_REWARDS.at(-1).points;
      for(const {points,coins}of WEEKLY_JOURNEY_REWARDS){
        const stop=node('div','liveops__festival-stop'),reward=node('span','liveops__festival-reward liveops__journey-reward');
        const claimed=state.event.claimed.includes(points),ready=state.event.points>=points;
        reward.dataset.state=claimed?'claimed':ready?'ready':'locked';stop.dataset.state=reward.dataset.state;
        reward.setAttribute('role','img');reward.setAttribute('aria-label',`${coins} Xu tại mốc ${points} điểm, ${claimed?'đã nhận':ready?'đủ điều kiện':'chưa đủ điều kiện'}`);
        reward.append(createChestArt('coins'));
        if(claimed||!ready){const badge=createIcon(claimed?'check':'lock');badge.classList.add('liveops__festival-state');reward.append(badge);}
        const marker=node('span','liveops__festival-marker');marker.setAttribute('aria-hidden','true');
        const rewardWrap=node('span','liveops__reward-with-info');rewardWrap.append(reward,rewardInfo(`${coins} Xu`,`Thông tin rương mốc ${points}`));
        stop.style.left=`${points/target*100}%`;stop.append(rewardWrap,node('span','liveops__festival-point',String(points)),marker);road.append(stop);
      }
      const bar=node('div','liveops__festival-progress'),fill=node('span','liveops__festival-fill'),count=node('span','liveops__festival-count',`${Math.min(state.event.points,target)}/${target}`);
      bar.setAttribute('role','progressbar');bar.setAttribute('aria-label','Điểm hành trình tuần');bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax',String(target));bar.setAttribute('aria-valuenow',String(Math.min(state.event.points,target)));
      fill.style.width=`${Math.min(state.event.points/target*100,100)}%`;bar.append(fill,count);lane.append(road,bar);journey.append(lane);panel.append(journey);
    }
    updateMissionCountdown(panel,state,getNow());
  });
  host.append(tabs.root, tabs.panel); tabs.select(tab, false);
}
export function updateMissionCountdown(root, state, now) {
  for (const label of root.querySelectorAll('.liveops__countdown')) {
    const end = (label.dataset.period === 'daily' ? state.day + 1 : state.week + 7) * DAY_MS;
    const minutes = Math.max(0, Math.ceil((end - now) / 60000));
    const description = `Làm mới sau: ${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
    const compact=label.dataset.format==='compact';
    const text=compact?`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`:description;
    const value=compact?label.querySelector('[data-countdown-value]'):label;
    if (value.textContent !== text) value.textContent = text;
    if(compact){label.setAttribute('aria-label',description);label.title=description;}
  }
}
