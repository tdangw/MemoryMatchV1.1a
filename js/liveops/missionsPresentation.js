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
function card(title, icon) {
  const root = node('section', 'liveops__card'); root.append(createIcon(icon), node('h3', '', title)); return root;
}
export function renderMissions(host, { view, tab, busy, run, play, canPlay, selectTab }) {
  const tabs = createTabs('missions', [['daily','Hôm nay'],['weekly','Tuần này']], tab, (key, panel) => {
    selectTab(key); panel.replaceChildren();
    if (!view) { panel.append(node('p', '', 'Kết nối để xem tiến độ và phần thưởng.')); return; }
    const state = view.state, current = state[key], catalog = key === 'daily' ? DAILY : WEEKLY;
    if (key === 'daily') {
      const login = card('Điểm danh 7 ngày', 'calendar'), days = node('div', 'liveops__days');
      login.id = 'missions-login'; login.tabIndex = -1;
      for (const day of loginDayStates(state)) {
        const tile = node('section', 'liveops__day'); tile.dataset.state = day.status;
        tile.append(node('strong', '', `Ngày ${day.index + 1}`), createIcon(day.status === 'received' ? 'check' : day.status === 'locked' ? 'lock' : 'coins'),
          node('strong', '', `${day.coins} Xu`), node('span', '', day.status === 'received' ? 'Đã nhận' : day.status === 'locked' ? 'Chưa đến lượt' : 'Hôm nay'));
        if (day.status === 'available') tile.append(action(`Nhận ${day.coins} Xu`, () => void run({type:'login'}), busy, 'claim-login'));
        days.append(tile);
      }
      login.append(days); panel.append(login);
    }
    let completed = 0;
    for (const item of catalog) {
      const value = current[item.key], ready = value >= item.target, claimed = current.claimed.includes(item.id);
      if (ready) completed++;
      const row = card(item.label, item.key === 'wins' ? 'trophy' : item.key === 'matches' ? 'cards' : item.key === 'visits' ? 'calendar' : 'achievements');
      row.append(progress(value, item.target, item.label));
      if (item.coins) row.append(node('strong', '', `${item.coins} Xu`));
      if (key === 'daily') row.append(action(claimed ? 'Đã nhận' : ready ? `Nhận ${item.coins} Xu` : canPlay ? 'Chơi' : 'Quay lại ván chơi', ready ? () => void run({ type:'daily', id:item.id }) : play, busy || claimed || !ready && !canPlay, `mission-${item.id}`));
      else if (ready) row.append(node('p', '', 'Hoàn thành'));
      else if (item.key === 'visits') row.append(action('Điểm danh', () => { tabs.select('daily'); tabs.panel.querySelector('#missions-login').focus(); }, busy));
      else row.append(action(canPlay ? 'Chơi' : 'Quay lại ván chơi', play, busy || !canPlay, `mission-${item.id}`));
      panel.append(row);
    }
    const bonus = card('Thưởng trọn bộ', 'chest'), received = current.claimed.includes('bonus');
    bonus.append(node('strong', '', key === 'daily' ? '10 Xu + 1 Vé quay' : '50 Xu + 2 Vé quay'), progress(completed, catalog.length, 'Hoàn thành nhiệm vụ'));
    if (key === 'daily') {
      const claimed = DAILY.filter(item => current.claimed.includes(item.id)).length;
      bonus.append(node('p', '', received ? 'Đã nhận thưởng trọn bộ' : `Hoàn thành ${completed}/3 · Đã nhận ${claimed}/3`),
        node('p', '', received ? 'Vé quay đã vào Sự kiện.' : 'Nhận đủ ba quà nhiệm vụ để tự nhận thưởng trọn bộ.'));
    } else bonus.append(action(received ? 'Đã nhận' : 'Nhận thưởng trọn bộ', () => void run({type:'weekly'}), busy || received || completed < catalog.length, 'claim-weekly'));
    panel.append(bonus);
    if (key === 'weekly') {
      const journey = card('Hành trình tuần', 'missions');
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
