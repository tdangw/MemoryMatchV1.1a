import { CHEST_NAMES } from './chestConfig.js';
import { letterSetSlots } from './letters.js';
import { action } from './ui.js';
import { createTabs } from './ui.js';
import { festivalChestsEnabled } from './availability.js';
import { LETTER_SETS, LETTER_ALPHABET, LETTER_SELL_COINS } from './config.js';
import { createIcon } from '../icons.js';
import { LETTER_REWARD_ITEMS } from './letterCatalog.generated.js';
import { letterProgressLabel } from './letters.js';
import { openAppModal } from '../modal.js';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { requestLiveops } from './service.js';
import { DAILY, WEEKLY, LOGIN, WHEEL, DAY_MS } from './model.js';
import { openGameMenu } from '../gameSelector.js';
import { getRecentGameId } from '../recentGame.js';
import { refreshAppWallet } from '../appNavigation.js';
import { requestRewardedSpin, rewardedSpinAvailable } from '../ads/rewarded.js';
import '../../styles/liveops.css';

const el = (tag, className, text) => { const node = document.createElement(tag); node.className = className; if (text !== undefined) node.textContent = text; return node; };
export function openLiveopsPage(kind, surface = {}) {
  const scope = createGameShellLifecycle(), root = el('div', 'liveops'), status = el('p', 'liveops__status', 'Đang tải tiến độ…');
  status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  let content = el('div', 'liveops__content'); root.append(status, content);
  const modal = openAppModal({ ...surface, id: `${kind}-screen`, title: kind === 'missions' ? 'Nhiệm vụ' : 'Sự kiện',
    icon: kind, content: root, onDestroy: () => scope.dispose() });
  let view = null, tab = 'daily', busy = false, animation = null, presentedSpin = null, wheelExpanded = false, selectedLetter = LETTER_ALPHABET[0], eventTab = 'wheel';
  const active = () => scope.active && root.isConnected;
  scope.own(() => animation?.cancel());
  const button = action;
  function panel(title) { const node = el('section', 'liveops__card'); node.append(el('h3', '', title)); return node; }
  function progress(value, target, label) {
    const bar = el('progress', 'liveops__progress'); bar.max = target; bar.value = Math.min(value, target); bar.setAttribute('aria-label', label);
    const wrap = el('div', 'liveops__progress-row'); wrap.append(bar, el('span', '', `${Math.min(value, target)}/${target}`)); return wrap;
  }
  async function run(command, { spin = false, rewarded = false } = {}) {
    if (busy || !active()) return;
    busy = true; render(); status.textContent = 'Đang kết nối…';
    try {
      const result = rewarded ? await requestRewardedSpin() : await requestLiveops(command);
      if (!active()) return;
      view = result; refreshAppWallet(); status.textContent = result.appliedCoins > 0 ? `Đã nhận ${result.appliedCoins} Xu.` : 'Đã cập nhật tiến độ.';
      if(result.letterResult?.kind==='exchange' && result.letterResult.chestType)status.textContent=`Đã nhận ${CHEST_NAMES[result.letterResult.chestType]}. Mở trong Kho rương khi bạn muốn.`;
      else if(result.letterResult?.kind==='exchange')status.textContent=result.letterResult.itemId?`Đã nhận ${LETTER_REWARD_ITEMS.find(item=>item.id===result.letterResult.itemId).name}.`:'Đã mở rương · 10.000 Xu.';
      if (command?.type === 'fuseLetter' && result.state.letters.last?.kind === 'fuse') status.textContent = `Đã nhận chữ ${result.state.letters.last.received}.`;
      render();
      if (spin) {
        const source = rewarded ? 'ad' : command.source, receipt = result.spin || (source === 'ad' ? result.state.spins.ads.at(-1) : result.state.spins[source]);
        presentedSpin = receipt;
        const rotor = root.querySelector('.liveops__rotor');
        if (receipt && rotor) {
          const angle = 5 * 360 - receipt.sector * 45;
          if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
            animation = rotor.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${angle}deg)` }],
              { duration: 2400, easing: 'cubic-bezier(.14,.65,.2,1)', fill: 'forwards' });
            try { await animation.finished; } catch (error) { if (error.name !== 'AbortError') throw error; }
          }
          if (active()) { rotor.style.transform = `rotate(${-receipt.sector * 45}deg)`; status.textContent = `Đã nhận ${receipt.coins} Xu.`; }
        }
      }
    } catch (error) {
      if (active()) status.textContent = error.code === 'rewards/invalid-operation' ? error.message : error.code === 'rewards/not-enabled' ? 'Nhiệm vụ và vòng quay sắp mở.'
        : 'Chưa thể cập nhật. Quyền nhận được giữ để thử lại khi kết nối.';
      if (error.code !== 'rewards/not-enabled') console.warn('Liveops page operation unavailable', error.code || error.name);
    } finally { busy = false; if (active()) render(); }
  }
  function play() { modal.destroy(); openGameMenu(getRecentGameId()); }
  function renderMissions() {
    const tabs = el('div', 'liveops__tabs'); tabs.setAttribute('role', 'tablist');
    for (const [key, label] of [['daily', 'Hôm nay'], ['weekly', 'Tuần này']]) {
      const node = button(label, () => { tab = key; render(); }); node.setAttribute('role', 'tab'); node.setAttribute('aria-selected', String(tab === key)); tabs.append(node);
    }
    content.append(tabs);
    if (tab === 'daily') {
      const login = panel('Điểm danh 7 ngày'), days = el('div', 'liveops__days');
      const state = view?.state, received = state && state.loginDay === state.day;
      const next = state?.loginNext || 0;
      for (let index = 0; index < 7; index++) {
        const tile = el('div', 'liveops__day');
        if (index === next && !received) tile.dataset.current = 'true';
        tile.append(el('span', '', `Ngày ${index + 1}`), el('strong', '', `${LOGIN[index]} Xu`)); days.append(tile);
      }
      login.append(received ? el('p', '', 'Đã nhận hôm nay') : days,
        button(received ? 'Đã nhận hôm nay' : `Nhận ${LOGIN[next]} Xu`, () => void run({ type: 'login' }), busy || !view || received));
      if (received) login.append(button('Xem lịch điểm danh', () => { days.hidden = !days.hidden; }));
      if (received) { days.hidden = true; login.append(days); }
      content.append(login);
    }
    const state = view?.state[tab];
    for (const item of tab === 'daily' ? DAILY : WEEKLY) {
      const row = panel(item.label), value = state?.[item.key] || 0, claimed = state?.claimed.includes(item.id);
      row.append(progress(value, item.target, item.label));
      if (item.coins) row.append(el('p', '', `${item.coins} Xu`));
      if (tab === 'daily') row.append(button(claimed ? 'Đã nhận' : value >= item.target ? 'Nhận' : 'Chơi',
        value >= item.target ? () => void run({ type: 'daily', id: item.id }) : play, busy || claimed || value >= item.target && !view));
      content.append(row);
    }
    const bonus = panel(tab === 'daily' ? 'Hoàn thành 3 nhiệm vụ · 10 Xu và 1 vé quay' : 'Hoàn thành 4 nhiệm vụ · 50 Xu và 2 vé quay');
    if (tab === 'weekly') bonus.append(button(state?.claimed.includes('bonus') ? 'Đã nhận' : 'Nhận', () => void run({ type: 'weekly' }),
      busy || !view || state.claimed.includes('bonus') || !WEEKLY.every(item => state[item.key] >= item.target)));
    if(tab==='weekly'){
      const journey=panel('Thắp sáng hành trình');journey.append(progress(view?.state.event.points||0,80,'Điểm hành trình tuần'),
        el('p','','Mốc 20: 5 Xu · Mốc 50: 10 Xu · Mốc 80: 10 Xu'),el('p','','Thắng ván để tích điểm, tối đa 40 điểm mỗi ngày. Xu được trao khi đạt mốc; tiến độ làm mới thứ Hai lúc 07:00.'));content.append(journey);
    }
    content.append(bonus, el('p', '', 'Tiến độ được ghi sau mỗi ván thắng. Một cặp thẻ hoặc một bộ ba được tính là một lần ghép. Làm mới lúc 07:00 mỗi ngày; tuần mới bắt đầu thứ Hai.'));
  }
  function renderEvents() {
    const tabs = createTabs('events', [['wheel','Vòng quay'],['letters','Sưu tập chữ'],...(festivalChestsEnabled() ? [['festival','Lễ hội']] : [])], eventTab, (key, panel) => {
      eventTab = key; animation?.cancel(); panel.replaceChildren();
      const old = content; content = panel;
      if (key === 'wheel') renderWheel(); else if (key === 'letters') renderLetters(); else panel.append(el('p','','Lễ hội Đom Đóm sắp mở.'));
      content = old;
    });
    content.append(tabs.root, tabs.panel); tabs.select(eventTab, false);
  }
  function renderWheel() {
    const wheel = panel('Vòng quay may mắn'), stage = el('div', 'liveops__wheel');
    const rotor = el('div', 'liveops__rotor');
    for (const [index, amount] of WHEEL.entries()) {
      const label = el('span', 'liveops__sector', String(amount)); label.style.setProperty('--sector', index); rotor.append(label);
    }
    stage.append(rotor, el('span', 'liveops__hub', 'Xu'), el('span', 'liveops__pointer')); stage.setAttribute('aria-label', 'Tám ô: 5, 10, 10, 15, 15, 20, 20, 25 Xu');
    const spin = view?.state.spins, last = presentedSpin || spin?.ticket || spin?.ads.at(-1) || spin?.free;
    const exhausted = Boolean(spin?.free) && ((spin?.ads.length || 0) >= 10 || !rewardedSpinAvailable()) && !view?.state.tickets;
    if (last) rotor.style.transform = `rotate(${-last.sector * 45}deg)`;
    if (!exhausted || busy || wheelExpanded) wheel.append(stage);
    if (exhausted) {
      wheel.append(el('p', '', `Lượt miễn phí: ${spin.free.coins} Xu${spin.ads.length ? ` · Đã dùng ${spin.ads.length}/10 lượt quảng cáo` : ''}. Hẹn gặp lại ngày mai!`),
        button(wheelExpanded ? 'Thu gọn vòng quay' : 'Xem vòng quay', () => { wheelExpanded = !wheelExpanded; render(); }, busy));
    }
    wheel.append(button(spin?.free ? 'Đã quay miễn phí hôm nay' : 'Quay miễn phí', () => void run({ type: 'spin', source: 'free' }, { spin: true }), busy || !view || Boolean(spin?.free)),
      button((spin?.ads.length || 0) >= 10 ? 'Đã dùng 10 lượt quảng cáo hôm nay' : view?.adPending ? 'Đang xác nhận lượt thưởng' : 'Xem quảng cáo · Thêm 1 lượt', () => void run(null, { spin: true, rewarded: true }), busy || !view || (spin?.ads.length || 0) >= 10 || view?.adPending || !rewardedSpinAvailable()),
      el('p', '', rewardedSpinAvailable() ? 'Một lượt miễn phí và tối đa 10 lượt quảng cáo mỗi ngày.' : 'Quảng cáo nhận thưởng hiện chưa khả dụng. Bạn vẫn có lượt quay miễn phí mỗi ngày.'));
    const rules = el('details', 'liveops__rules'); rules.append(el('summary', '', 'Thể lệ'), el('p', '', 'Mỗi ô có xác suất 12,5%. Lượt miễn phí, quảng cáo và vé quay dùng riêng, chung tài khoản cho cả ba trò. Mỗi vé dùng được một lượt, không hết hạn. Không mua thêm lượt.'));
    const ticketBalance=el('p','liveops__ticket-balance');
    ticketBalance.append(createIcon('ticket'),el('span','',`Vé quay: ${view?.state.tickets || 0}`));
    wheel.append(ticketBalance,
      button('Dùng 1 vé', () => void run({ type:'spin', source:'ticket' }, { spin:true }), busy || !view || view.state.tickets < 1));
    wheel.append(rules); content.append(wheel);
    content.append(button('Xem Sưu tập chữ', () => { eventTab='letters'; render(); }));
    if(festivalChestsEnabled()) content.append(button('Xem Kho rương', openChests));
  }
  function openChests() {
    modal.destroy(); void import('../mainmenu.js').then(module => module.showCollectionModal({ initialChest:true, surface }));
  }
  function renderLetters() {
    const letters = panel('Sưu tập chữ'), counts = view?.state.letters.counts || {};
    const setChoices=el('div','liveops__set-choices');
    for (const set of LETTER_SETS) {
      const row = el('section', 'liveops__letter-set');
      const title = el('h4', '', set.label), slots = el('p', 'liveops__letter-slots');
      for(const slot of letterSetSlots(set,counts)){ const cell=el('span','liveops__letter-slot',slot.space?' ':slot.letter);cell.dataset.filled=String(slot.filled); slots.append(cell); }
      slots.setAttribute('aria-label', `${set.label}: ${letterProgressLabel(set,counts)}`);row.append(title,slots,
        button(festivalChestsEnabled()?`Đổi · ${CHEST_NAMES[set.chestType]}`:'Đổi quà',()=>void run({type:'exchangeLetterSet',setId:set.id}),busy||!view||!Object.entries(set.required).every(([letter,amount])=>(counts[letter]||0)>=amount)));
      row.lastChild.setAttribute('aria-label',`Đổi ${set.label}`);setChoices.append(row);
    }
    letters.append(setChoices);
    if(view && festivalChestsEnabled()){
      const type=null;
      const preview=panel('Quà lần đổi tiếp theo'); preview.append(createIcon('chest'),el('p','',type ? CHEST_NAMES[type] : 'Xem phần thưởng của từng bộ chữ'),el('p','','Đổi đủ bộ chữ để nhận loại rương được ghi trong phần thưởng.'),button('Xem Kho rương',openChests)); letters.prepend(preview);
    } else if(view){
      const next=LETTER_REWARD_ITEMS.find(item=>item.id===view.nextLetterRewardId);
      const preview=panel(next?'Quà tiếp theo':'Rương 10.000 Xu');
      if(next){const art=el('img','liveops__reward-preview');art.src=`${import.meta.env.BASE_URL}${next.files[256]}`;art.alt=next.name;art.width=art.height=128;art.loading='lazy';art.decoding='async';preview.append(art,el('p','',next.name));}
      else preview.append(el('p','','Bạn đã có đủ quà trong kho. Mỗi bộ chữ đổi được một rương 10.000 Xu.'));
      preview.append(el('p','','Bốn bộ chữ dùng chung kho quà. Mỗi lần đổi nhận một món chưa sở hữu.'));letters.prepend(preview);
    }
    letters.append(el('p', '', 'Thu thập chữ khi ghép thẻ đặc biệt. Chữ được giữ mãi; các bộ chữ dùng chung kho.'));
    const inventory = panel('Kho chữ'), choices = el('div', 'liveops__letter-grid');
    const amount=counts[selectedLetter]||0;
    for(const letter of LETTER_ALPHABET){
      const choice=button(`${letter} · ${counts[letter]||0}`,()=>{selectedLetter=letter;render();},false,`letter-${letter}`);
      choice.setAttribute('aria-label',`Chữ ${letter}, ${counts[letter]||0} chữ`);choice.setAttribute('aria-pressed',String(letter===selectedLetter));choices.append(choice);
    }
    inventory.append(choices,el('p','',`Đang có ${amount} chữ ${selectedLetter}`),
      button('Bán chữ',()=>sellSheet(selectedLetter,amount),busy||!view||amount<1),
      button(`Ghép 3 chữ ${selectedLetter}`,()=>void run({type:'fuseLetter',letter:selectedLetter}),busy||!view||amount<3),
      el('p','','Ghép 3 chữ giống nhau để nhận 1 chữ ngẫu nhiên. Có thể nhận lại chữ vừa ghép.'));
    letters.append(inventory);
    content.append(letters);
  }

  function sellSheet(letter, max) {
    const sheet=el('div','liveops__sale'), quantity=el('input','liveops__letter-quantity');
    quantity.type='number';quantity.min='1';quantity.max=String(max);quantity.value='1';quantity.step='1';quantity.setAttribute('aria-label','Số chữ muốn bán');
    const total=el('p'), confirm=button('Xác nhận bán',()=>{ const n=Number(quantity.value);if(!Number.isSafeInteger(n)||n<1||n>max)return; sale.destroy();void run({type:'sellLetter',letter,quantity:n}); });
    const update=()=>{const n=Number(quantity.value);confirm.disabled=!Number.isSafeInteger(n)||n<1||n>max;total.textContent=confirm.disabled?'Chọn số chữ đang có.':`Nhận ${(n*LETTER_SELL_COINS).toLocaleString('vi-VN')} Xu`;};
    const adjust=n=>{quantity.value=String(Math.min(max,Math.max(1,n)));update();};
    quantity.oninput=update;
    sheet.append(el('p','',`Bán chữ ${letter} · Đang có ${max}`),button('Giảm 1',()=>adjust(Number(quantity.value)-1)),quantity,button('Tăng 1',()=>adjust(Number(quantity.value)+1)),button('Bán một nửa',()=>adjust(Math.floor(max/2))),button('Bán tất cả',()=>adjust(max)),total,confirm);update();
    const sale=openAppModal({id:'letter-sale',title:'Bán chữ',content:sheet,owner:scope});quantity.focus();
  }
  function render() {
    if (!active()) return;
    const focusKey = document.activeElement?.dataset.focusKey;
    content.replaceChildren();
    if (kind === 'missions') renderMissions(); else renderEvents();
    root.setAttribute('aria-busy', String(busy));
    if(focusKey) [...root.querySelectorAll('button')].find(button=>button.dataset.focusKey===focusKey&&!button.disabled)?.focus({preventScroll:true});
  }
  root.append(button('Tải lại tiến độ', () => void run({ type: 'status' })));
  render(); void run({ type: 'status' }); return modal;
}
