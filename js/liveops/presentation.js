import { createWheelArt } from './wheelArt.js';
import { loadPersistentGameData } from '../persistence.js';
import { FESTIVAL_MILESTONES } from './chestConfig.js';
import { getAppPageScope } from '../appPageLifecycle.js';
import { renderMissions as mountMissions, updateMissionCountdown } from './missionsPresentation.js';
import { getAccountService } from '../accountService.js';
import { CHEST_NAMES } from './chestConfig.js';
import { letterSetSlots } from './letters.js';
import { action } from './ui.js';
import { createTabs } from './ui.js';
import { festivalChestsEnabled } from './availability.js';
import { LETTER_SETS, LETTER_ALPHABET, LETTER_SELL_COINS } from './config.js';
import { createIcon } from '../icons.js';
import { LETTER_REWARD_ITEMS } from './letterCatalog.generated.js';
import { letterProgressLabel } from './letters.js';
import { openAppModal, showAppToast } from '../modal.js';
import { createGameShellLifecycle, getActiveGameScope, clearShellInterval } from '../gameShell/gameShellLifecycle.js';
import { requestLiveops } from './service.js';
import { WHEEL, DAY_MS } from './model.js';
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
  modal.overlay.classList.add('liveops-page'); modal.panel.classList.add('liveops-surface'); root.classList.add(`liveops--${kind}`);

  let view = null, tab = 'daily', busy = false, animation = null, presentedSpin = null, selectedLetter = LETTER_ALPHABET[0], eventTab = 'wheel', selectedSetId = 'adventure';
  let wheelRotor=null, wheelArt=null, confirmedView=false;
  const active = () => scope.active && root.isConnected;
  const canClaim=()=>confirmedView&&navigator.onLine&&!getActiveGameScope()&&view&&Math.floor((view.serverNow+performance.now()-observedAt)/DAY_MS)===view.state.day;
  scope.own(() => animation?.cancel());
  const button = action;
  function panel(title) { const node = el('section', 'liveops__card'); node.append(el('h3', '', title)); return node; }
  function progress(value, target, label) {
    const bar = el('progress', 'liveops__progress'); bar.max = target; bar.value = Math.min(value, target); bar.setAttribute('aria-label', label);
    const wrap = el('div', 'liveops__progress-row'); wrap.append(bar, el('span', '', `${Math.min(value, target)}/${target}`)); return wrap;
  }
  async function run(command, { spin = false, rewarded = false } = {}) {
    if (busy || !active()) return;
    if(command?.type!=='status'&&!canClaim()){status.textContent='Kết nối và tải lại tiến độ để nhận thưởng.';return;}
    const identity = getAccountService()?.getIdentity();
    const owns = () => active() && getAccountService()?.getIdentity()?.profileId === identity?.profileId && getAccountService()?.getIdentity()?.uid === identity?.uid;
    let renderOnFinish=true;
    busy = true; if(view)render();else root.setAttribute('aria-busy','true'); status.textContent = 'Đang kết nối…';
    try {
      const result = rewarded ? await requestRewardedSpin() : await requestLiveops(command);
      if (!owns()) return;
      observedAt = performance.now(); view = result; confirmedView=true; refreshAppWallet(); status.textContent = result.appliedCoins > 0 ? `Đã nhận ${result.appliedCoins} Xu.` : 'Đã cập nhật tiến độ.';
      if(result.letterResult?.kind==='exchange' && result.letterResult.chestType)status.textContent=`Đã nhận ${CHEST_NAMES[result.letterResult.chestType]}. Mở trong Kho rương khi bạn muốn.`;
      else if(result.letterResult?.kind==='exchange')status.textContent=result.letterResult.itemId?`Đã nhận ${LETTER_REWARD_ITEMS.find(item=>item.id===result.letterResult.itemId).name}.`:'Đã mở rương · 10.000 Xu.';
      if (command?.type === 'fuseLetter' && result.state.letters.last?.kind === 'fuse') status.textContent = `Đã nhận chữ ${result.state.letters.last.received}.`;
      busy=spin;render();renderOnFinish=spin;
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
          if (owns()) { rotor.style.transform = `rotate(${-receipt.sector * 45}deg)`; status.textContent = `Đã nhận ${receipt.coins} Xu.`; }
        }
      }
    } catch (error) {
      if(owns())confirmedView=false;
      if(owns()&&!view&&(!navigator.onLine||getActiveGameScope())){
        try {const cached=await loadPersistentGameData();if(owns()&&cached.appearance.spark?.ownerUid===identity?.uid&&cached.appearance.spark.state){view={state:cached.appearance.spark.state,serverNow:Date.now()};observedAt=performance.now();}}
        catch {if(owns())status.textContent='Chưa đọc được bản lưu. Hãy tải lại trang.';return;}
      }
      if (owns()) status.textContent = error.code === 'rewards/invalid-operation' ? error.message : error.code === 'rewards/not-enabled' ? 'Nhiệm vụ và vòng quay sắp mở.'
        : 'Chưa thể cập nhật. Quyền nhận được giữ để thử lại khi kết nối.';
      if (error.code !== 'rewards/not-enabled') console.warn('Liveops page operation unavailable', error.code || error.name);
    } finally { busy = false; if (active()&&renderOnFinish) render(); }
  }
  function play() { if(getActiveGameScope())return; modal.destroy(); openGameMenu(getRecentGameId()); }
  let observedAt=performance.now(), timer=null, refreshDay=null;
  const scrolls = new Map();
  const scrollHost = root.closest('.app-modal__body') || root.parentElement;
  const rememberScroll = key => { if(scrollHost)scrolls.set(key,scrollHost.scrollTop); };
  function renderMissions() {
    mountMissions(content, {view, tab, busy, canClaim:Boolean(canClaim()), run, play, canPlay:!getActiveGameScope(), selectTab:key=>{
      if(key!==tab){rememberScroll(tab);tab=key;scope.frame(()=>{if(scrollHost)scrollHost.scrollTop=scrolls.get(key)||0;});}
    }});
    tick();
  }
  function tick() {
    if(!active()||document.hidden||!view||kind!=='missions')return;
    const now=Math.floor(view.serverNow+performance.now()-observedAt);
    updateMissionCountdown(root,view.state,now);
    const targetDay=Math.floor(now/DAY_MS);
    if(targetDay>view.state.day&&refreshDay!==targetDay&&!busy&&navigator.onLine){refreshDay=targetDay;void run({type:'status'});}
  }
  function visibility() {
    if(timer!==null){clearShellInterval(timer);timer=null;}
    if(!document.hidden&&kind==='missions'){tick();timer=scope.interval(tick,60000);}
  }
  scope.listen(document,'visibilitychange',visibility);
  scope.own(()=>{if(timer!==null)clearShellInterval(timer);});
  const account=getAccountService();const accountKey=()=>{const identity=account?.getIdentity();return identity?`${identity.uid}:${identity.profileId}`:null;};let ownerKey=accountKey();
  if(account)scope.own(account.subscribe(()=>{
    const key=accountKey();
    if(key!==ownerKey){ownerKey=key;view=null;confirmedView=false;animation?.cancel();status.textContent='Tài khoản đã thay đổi. Tải lại tiến độ để xem phần thưởng.';render();}
  }));
  scope.listen(window,'offline',()=>{confirmedView=false;status.textContent='Đang xem tiến độ đã lưu. Kết nối để nhận thưởng.';render();});
  scope.listen(window,'online',()=>{if(active())void run({type:'status'});});
  function renderEvents() {
    const tabs = createTabs('events', [['wheel','Vòng quay'],['letters','Sưu tập chữ'],['festival','Sưu tập huy hiệu']], eventTab, (key, panel) => {
      if(key!==eventTab){rememberScroll(`event:${eventTab}`);scope.frame(()=>{if(scrollHost)scrollHost.scrollTop=scrolls.get(`event:${key}`)||0;});}
      eventTab = key; animation?.cancel(); panel.replaceChildren();
      const old = content; content = panel;
      if (key === 'wheel') renderWheel(); else if (key === 'letters') renderLetters(); else renderFestival();
      content = old;
    });
    content.append(tabs.root, tabs.panel); tabs.select(eventTab, false);
  }
  function renderFestival() {
    const festival=view?.state.festival, available=festival?festival.earnedTotal-festival.completedCycles*100:null;
    const banner=panel('Sưu tập huy hiệu');banner.classList.add('liveops__festival-hero');
    banner.append(createIcon('collection-badge'),el('strong','liveops__festival-round',festival?`Vòng ${festival.completedCycles+1}`:'Hành trình huy hiệu'));
    if(festival)banner.append(el('p','',`${available.toLocaleString('vi-VN')} huy hiệu · Mỗi vòng 100 huy hiệu`),progress(Math.min(available,100),100,'Huy hiệu đã thu thập'));
    else banner.append(el('p','',festivalChestsEnabled()?'Kết nối để xem vòng và số huy hiệu đang có.':'Xem trước các mốc quà. Sưu tập huy hiệu sẽ sớm mở.'));
    content.append(banner);
    const road=el('div','liveops__festival-road');
    for(const [index,item]of FESTIVAL_MILESTONES.entries()){
      const claimed=Boolean(festival&&(festival.mask&(1<<index))),ready=available!==null&&available>=item.points;
      const row=panel(`${item.points} huy hiệu`);row.classList.add('liveops__festival-milestone');row.dataset.claimed=String(claimed);
      const body=el('div','liveops__festival-reward');body.append(el('strong','',[item.coins?`${item.coins} Xu`:'',item.chest?CHEST_NAMES[item.chest]:''].filter(Boolean).join(' + ')),el('p','',claimed?'Đã nhận':!festival?'Mốc phần thưởng':ready?'Đủ điều kiện':'Chưa đủ'));
      row.append(createIcon(item.chest?'chest':'coins'),body,button(claimed?'Đã nhận':'Nhận',()=>void run({type:'claimFestival',cycle:festival.completedCycles,points:item.points}),busy||!festivalChestsEnabled()||!canClaim()||claimed||!ready,`festival-${item.points}`));road.append(row);
    }
    content.append(road);
    if(festivalChestsEnabled())content.append(button('Xem quà & Kho rương',openChests));
    content.append(button(getActiveGameScope()?'Quay lại ván chơi':'Chơi ngay',play,busy||Boolean(getActiveGameScope())),
      el('p','liveops__guidance','Thu thập huy hiệu khi ghép nhóm thẻ đặc biệt. Huy hiệu được giữ kể cả khi thua. Nhận đủ bốn mốc để sang vòng mới và giữ huy hiệu dư; rương có thể mở sau.'));
  }
  function renderWheel() {
    const wheel = panel('Vòng quay may mắn'), stage = el('div', 'liveops__wheel');wheel.classList.add('liveops__wheel-card');
    if(!wheelArt)wheelArt=createWheelArt();
    const rotor = wheelRotor || el('div', 'liveops__rotor');wheelRotor=rotor;
    if(!rotor.childElementCount){rotor.append(wheelArt.rotor);for(const [index,amount]of WHEEL.entries()){
      const label=el('span','liveops__sector',String(amount));label.style.setProperty('--sector',index);rotor.append(label);
    }}
    stage.append(rotor,wheelArt.rim,el('span','liveops__pointer'));stage.setAttribute('aria-label','Tám ô: 5, 10, 10, 15, 15, 20, 20, 25 Xu');
    const spin=view?.state.spins,last=presentedSpin||spin?.ticket||spin?.ads.at(-1)||spin?.free;
    if(last)rotor.style.transform=`rotate(${-last.sector*45}deg)`;
    const primary=el('div','liveops__spin-actions'),ticketBalance=el('span','liveops__ticket-balance');
    ticketBalance.append(createIcon('ticket'),el('span','',view?`Vé quay: ${view.state.tickets}`:'Vé quay: …'));
    const free=button(spin?.free?'Đã quay miễn phí hôm nay':'Quay miễn phí',()=>void run({type:'spin',source:'free'},{spin:true}),busy||!canClaim()||Boolean(spin?.free));free.classList.add('liveops__spin-primary');primary.append(free,ticketBalance);
    const secondary=el('div','liveops__spin-secondary');
    secondary.append(button((spin?.ads.length||0)>=10?'Đã dùng 10 lượt quảng cáo hôm nay':view?.adPending?'Đang xác nhận lượt thưởng':'Xem quảng cáo · Thêm 1 lượt',()=>void run(null,{spin:true,rewarded:true}),busy||!canClaim()||(spin?.ads.length||0)>=10||view?.adPending||!rewardedSpinAvailable()),
      button('Dùng 1 vé',()=>void run({type:'spin',source:'ticket'},{spin:true}),busy||!canClaim()||view.state.tickets<1));
    const rules=el('details','liveops__rules');rules.append(el('summary','','Thể lệ'),el('p','','Mỗi ô có xác suất 12,5%. Một lượt miễn phí và tối đa 10 lượt quảng cáo mỗi ngày; vé quay dùng riêng, không hết hạn. Không mua thêm lượt.'));
    wheel.append(stage,primary,secondary,rules);content.append(wheel);
    if(view){const set=LETTER_SETS.find(item=>item.id===selectedSetId),mini=panel('Sưu tập chữ');mini.classList.add('liveops__letter-mini');mini.append(el('strong','',set.label),letterSlots(set,view.state.letters.counts),button('Xem Sưu tập chữ',()=>{eventTab='letters';render();}));content.append(mini);}
    if(festivalChestsEnabled())content.append(button('Xem Kho rương',openChests));
  }
  function openChests() {
    const round=getActiveGameScope(),owner=surface.owner||round||getAppPageScope(),identity=getAccountService()?.getIdentity();
    const current=()=> (!owner||owner.active)&&(!round||round.active&&getActiveGameScope()===round)&&getAccountService()?.getIdentity()?.uid===identity?.uid;
    modal.destroy();
    void import('../mainmenu.js').then(async module=>{if(current())await module.showCollectionModal({initialChest:true,fromGame:Boolean(round),surface:{...surface,owner}});})
      .catch(()=>{if(current())showAppToast('Chưa mở được Kho rương. Hãy thử lại.',{tone:'error'});});
  }
  function letterSlots(set,counts){
    const slots=el('div','liveops__letter-slots');
    for(const slot of letterSetSlots(set,counts)){
      const cell=el('span','liveops__letter-slot',slot.space?'':slot.letter);cell.dataset.filled=String(slot.filled);if(slot.space)cell.dataset.space='true';slots.append(cell);
    }
    slots.setAttribute('aria-label',`${set.label}: ${letterProgressLabel(set,counts)}`);return slots;
  }
  function renderLetters() {
    if(!view){content.append(el('p','','Kết nối để xem kho chữ và phần thưởng.'));return;}
    const counts=view.state.letters.counts,choices=el('div','liveops__set-choices');
    for(const set of LETTER_SETS){const choice=button(set.label,()=>{selectedSetId=set.id;render();},false,`set-${set.id}`);choice.setAttribute('aria-pressed',String(selectedSetId===set.id));choices.append(choice);}
    const set=LETTER_SETS.find(item=>item.id===selectedSetId),letters=panel('Sưu tập chữ');letters.classList.add('liveops__recipe');
    const filled=letterSetSlots(set,counts).filter(slot=>slot.filled).length,total=Object.values(set.required).reduce((sum,n)=>sum+n,0);
    letters.append(choices,el('h4','liveops__recipe-name',set.label),letterSlots(set,counts),progress(filled,total,`Số chữ ${set.label}`));
    const reward=el('div','liveops__recipe-reward');
    if(festivalChestsEnabled())reward.append(createIcon('chest'),el('strong','',CHEST_NAMES[set.chestType]));
    else{const next=LETTER_REWARD_ITEMS.find(item=>item.id===view.nextLetterRewardId);reward.append(createIcon('chest'),el('strong','',next?next.name:'10.000 Xu'));}
    const exchange=button('Đổi quà',()=>void run({type:'exchangeLetterSet',setId:set.id}),busy||!canClaim()||filled<total,`exchange-${set.id}`);exchange.setAttribute('aria-label',`Đổi ${set.label}`);reward.append(exchange);letters.append(reward);
    if(festivalChestsEnabled())letters.append(button('Xem Kho rương',openChests));
    const inventory=panel('Kho chữ'),grid=el('div','liveops__letter-grid');inventory.classList.add('liveops__inventory');
    for(const letter of LETTER_ALPHABET){const count=counts[letter]||0,choice=button('',()=>{selectedLetter=letter;render();},false,`letter-${letter}`);
      choice.append(el('span','liveops__letter-glyph',letter),el('span','liveops__letter-count',`×${count}`));choice.dataset.empty=String(count===0);choice.setAttribute('aria-label',`Chữ ${letter}, ${count} chữ`);choice.setAttribute('aria-pressed',String(letter===selectedLetter));grid.append(choice);}
    const amount=counts[selectedLetter]||0,actions=el('div','liveops__letter-actions');
    actions.append(button(`Ghép 3 chữ ${selectedLetter}`,()=>void run({type:'fuseLetter',letter:selectedLetter}),busy||!canClaim()||amount<3),button('Bán chữ',()=>sellSheet(selectedLetter,amount),busy||!canClaim()||amount<1));
    inventory.append(grid,el('p','liveops__selected-letter',`Đang chọn chữ ${selectedLetter} · Có ${amount}`),actions,
      el('p','liveops__guidance',`Bán ${LETTER_SELL_COINS.toLocaleString('vi-VN')} Xu mỗi chữ. Ghép 3 chữ giống nhau nhận 1 chữ ngẫu nhiên; có thể nhận lại chữ vừa ghép.`));
    content.append(letters,inventory);
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
    const focusKey = document.activeElement?.dataset.focusKey, previousScroll=scrollHost?.scrollTop;
    content.replaceChildren();
    if (kind === 'missions') renderMissions(); else renderEvents();
    if(scrollHost&&previousScroll!==undefined)scrollHost.scrollTop=previousScroll;
    root.setAttribute('aria-busy', String(busy));
    if(focusKey) [...root.querySelectorAll('button')].find(button=>button.dataset.focusKey===focusKey&&!button.disabled)?.focus({preventScroll:true});
  }
  root.append(button('Tải lại tiến độ', () => void run({ type: 'status' })));
  render(); visibility(); void run({ type: 'status' }); return modal;
}
