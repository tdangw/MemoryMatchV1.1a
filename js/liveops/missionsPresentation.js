import { node, action, createTabs } from './ui.js';
import { DAILY, WEEKLY, LOGIN, DAY_MS } from './model.js';
import { createIcon } from '../icons.js';

export function loginDayStates(state) {
  const received = state.loginDay === state.day;
  const count = received ? state.loginNext || 7 : state.loginNext;
  return LOGIN.map((coins, index) => ({ coins, index,
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
    if (key === 'daily') {
      const login = node('section', 'liveops__card liveops__login'), days = node('div', 'liveops__days');
      login.id = 'missions-login'; login.tabIndex = -1;
      login.append(sectionHeading('Điểm danh 7 ngày', 'calendar'));
      for (const day of loginDayStates(state)) {
        const tile = node('section', 'liveops__day'); tile.dataset.state = day.status;
        const art = node('div', 'liveops__day-art'); art.append(createIcon('coin'));
        const status = node('span', 'liveops__day-status');
        if (day.status !== 'available') status.append(createIcon(day.status === 'received' ? 'check' : 'lock'));
        status.append(node('span', '', day.status === 'received' ? 'Đã nhận' : day.status === 'locked' ? 'Chưa đến lượt' : 'Hôm nay'));
        tile.append(node('strong', 'liveops__day-label', `Ngày ${day.index + 1}`), art,
          node('strong', 'liveops__day-coins', `${day.coins} Xu`), status);
        days.append(tile);
      }
      const loginAction = node('div', 'liveops__login-action');
      if (state.loginDay === state.day) loginAction.append(action('Đã nhận hôm nay', null, true));
      else loginAction.append(action(`Nhận ${LOGIN[state.loginNext]} Xu`, () => void run({type:'login'}), busy || !canClaim, 'claim-login'));
      login.append(days, loginAction);
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
      body.append(node('h3', '', item.label), progress(value, item.target, item.label));
      if (item.coins) body.append(node('strong', 'liveops__mission-reward', `${item.coins} Xu`));
      const controls = node('div', 'liveops__mission-action');
      if (key === 'daily') controls.append(action(claimed ? 'Đã nhận' : ready ? `Nhận ${item.coins} Xu` : canPlay ? 'Chơi' : 'Quay lại ván chơi', ready ? () => void run({ type:'daily', id:item.id }) : play, busy || claimed || (ready ? !canClaim : !canPlay), `mission-${item.id}`));
      else if (ready) {
        const done = node('p', 'liveops__mission-complete'); done.append(createIcon('check'), node('span', '', 'Hoàn thành')); controls.append(done);
      }
      else if (item.key === 'visits') controls.append(action('Điểm danh', () => { tabs.select('daily'); tabs.panel.querySelector('#missions-login').focus(); }, busy));
      else controls.append(action(canPlay ? 'Chơi' : 'Quay lại ván chơi', play, busy || !canPlay, `mission-${item.id}`));
      row.append(symbol, body, controls);
      panel.append(row);
    }
    const bonus = node('section', 'liveops__card liveops__bonus'), received = current.claimed.includes('bonus');
    const bonusBody = node('div', 'liveops__bonus-body'), bonusArt = node('div', 'liveops__bonus-art');
    bonusArt.append(createIcon('chest'));
    bonusBody.append(node('h3', '', 'Thưởng trọn bộ'),
      node('strong', 'liveops__bonus-reward', key === 'daily' ? '10 Xu + 1 Vé quay' : '50 Xu + 2 Vé quay'), progress(completed, catalog.length, 'Hoàn thành nhiệm vụ'));
    if (key === 'daily') {
      const claimed = DAILY.filter(item => current.claimed.includes(item.id)).length;
      bonusBody.append(node('p', '', received ? 'Đã nhận thưởng trọn bộ' : `Hoàn thành ${completed}/3 · Đã nhận ${claimed}/3`),
        node('p', '', received ? 'Vé quay đã vào Sự kiện.' : 'Nhận đủ ba quà nhiệm vụ để tự nhận thưởng trọn bộ.'));
    } else {
      const controls = node('div', 'liveops__bonus-action');
      controls.append(action(received ? 'Đã nhận' : 'Nhận thưởng trọn bộ', () => void run({type:'weekly'}), busy || !canClaim || received || completed < catalog.length, 'claim-weekly'));
      bonusBody.append(controls);
    }
    bonus.append(bonusBody, bonusArt);
    panel.append(bonus);
    if (key === 'weekly') {
      const journey = node('section', 'liveops__card liveops__journey'); journey.append(sectionHeading('Hành trình tuần', 'missions'));
      journey.append(progress(state.event.points, 80, 'Điểm hành trình tuần'), node('p', '', 'Mốc 20: 5 Xu · Mốc 50: 10 Xu · Mốc 80: 10 Xu'), node('p', '', 'Thắng ván để tích điểm, tối đa 40 điểm mỗi ngày. Xu được trao khi đạt mốc.')); panel.append(journey);
    }
    const countdown = node('p', 'liveops__countdown'); countdown.dataset.period = key; panel.append(countdown,
      node('p', 'liveops__guidance', 'Tiến độ được ghi sau mỗi ván thắng. Một cặp thẻ hoặc một bộ ba tính là một lần ghép. Làm mới lúc 07:00; tuần bắt đầu thứ Hai.'));
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
