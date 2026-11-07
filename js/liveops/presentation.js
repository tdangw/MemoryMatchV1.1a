import { letterArtwork, openLetterActions, openLetterFusion } from './letterCrafting.js';
import { showCollectionModal } from '../mainmenu.js';
import { createRewardFeedback, captureRewardOrigin } from './rewardFeedback.js';
import { createWheelArt } from './wheelArt.js';
import { startWheelMotion } from './wheelMotion.js';
import { gameState } from '../gameState.js';
import { createWheelGiftArt, presentWheelGift, refreshWheelGiftArt, WHEEL_BOX_LABELS } from './wheelGiftArt.js';
import { WHEEL_SLOTS, WHEEL_ANGLE, WHEEL_VERSION } from './wheelRewards.js';
import { WHEEL_ITEMS } from './wheelCatalog.js';
import { loadPersistentGameData } from '../persistence.js';
import { FESTIVAL_MILESTONES, CHEST_SUPPORTS, CHEST_POLICY } from './chestConfig.js';
import { getAppPageScope } from '../appPageLifecycle.js';
import { renderMissions as mountMissions, updateMissionCountdown } from './missionsPresentation.js';
import { getAccountService } from '../accountService.js';
import { CHEST_NAMES } from './chestConfig.js';
import { letterSetSlots } from './letters.js';
import { action } from './ui.js';
import { createTabs } from './ui.js';
import { festivalChestsEnabled } from './availability.js';
import { LETTER_SETS, LETTER_ALPHABET, LETTER_SELL_COINS, LETTER_FALLBACK_COINS } from './config.js';
import { createIcon } from '../icons.js';
import { LETTER_REWARD_ITEMS } from './letterCatalog.generated.js';
import { letterProgressLabel } from './letters.js';
import { openAppModal, showAppToast } from '../modal.js';
import { createGameShellLifecycle, getActiveGameScope, clearShellInterval } from '../gameShell/gameShellLifecycle.js';
import { requestLiveops } from './service.js';
import { DAY_MS } from './model.js';
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

  const rewardFeedback=createRewardFeedback({owner:scope,host:modal.panel});
  let letterDialog=null;scope.own(()=>letterDialog?.destroy());
  let view = null, tab = 'daily', busy = false, animation = null, presentedSpin = null, eventTab = 'wheel', selectedSetId = 'adventure', selectedLetter=null;
  let wheelRotor=null, wheelPointer=null, wheelArt=null, confirmedView=false;
  let wheelPresentation=null;
  scope.own(()=>wheelPresentation?.dispose());
  const wheelMotion=matchMedia('(prefers-reduced-motion: reduce)');
  scope.listen(wheelMotion,'change',event=>{if(event.matches&&['running','paused'].includes(animation?.playState))animation.finish();});
  const active = () => scope.active && root.isConnected;
  const canClaim=()=>confirmedView&&navigator.onLine&&!getActiveGameScope()&&view&&Math.floor((view.serverNow+performance.now()-observedAt)/DAY_MS)===view.state.day;
  scope.own(() => animation?.cancel());
  const button = action;
  const retry=button('Thử lại',()=>void run({type:'status'}),false,'retry-liveops');retry.hidden=true;retry.classList.add('liveops__retry');
  function resetConnection(){root.insertBefore(status,content);root.append(retry);}
  function renderConnection(host){const notice=el('div','liveops__connection');notice.append(status,retry);host.append(notice);}
  function panel(title) { const node = el('section', 'liveops__card'); node.append(el('h3', '', title)); return node; }
  function progress(value, target, label) {
    const bar = el('progress', 'liveops__progress'); bar.max = target; bar.value = Math.min(value, target); bar.setAttribute('aria-label', label);
    const wrap = el('div', 'liveops__progress-row'); wrap.append(bar, el('span', '', `${Math.min(value, target)}/${target}`)); return wrap;
  }
  async function run(command, { spin = false, rewarded = false, feedback = true } = {}) {
    if (busy || !active()) return;
    if(command?.type!=='status'&&!canClaim()){status.textContent='Kết nối để cập nhật phần thưởng.';retry.hidden=false;return;}
    const identity = getAccountService()?.getIdentity();
    const owns = () => active() && getAccountService()?.getIdentity()?.profileId === identity?.profileId && getAccountService()?.getIdentity()?.uid === identity?.uid;
    const wheelAction=spin||command?.type==='claimWheelReward';
    let presentWheelResult=wheelAction;
    const spinHadFocus=wheelAction&&document.activeElement?.dataset.focusKey==='spin-primary';
    let rewardOrigin=captureRewardOrigin(root);
    let renderOnFinish=true;
    retry.hidden=true;busy = true; if(view)render();else root.setAttribute('aria-busy','true'); status.textContent = kind==='events'&&eventTab==='wheel'?'':'Đang kết nối…';
    try {
      const result = rewarded ? await requestRewardedSpin() : await requestLiveops(command);
      if (!owns()) return;
      observedAt = performance.now(); view = result; confirmedView=true; refreshAppWallet(); status.textContent = kind==='events'&&eventTab==='wheel'?'':result.appliedCoins > 0 ? `Đã nhận ${result.appliedCoins} Xu.` : '';
      if(result.letterResult?.kind==='exchange' && result.letterResult.chestType)status.textContent=`Đã nhận ${CHEST_NAMES[result.letterResult.chestType]}. Mở trong Kho rương khi bạn muốn.`;
      else if(result.letterResult?.kind==='exchange')status.textContent=result.letterResult.itemId?`Đã nhận ${LETTER_REWARD_ITEMS.find(item=>item.id===result.letterResult.itemId).name}.`:`Đã nhận ${result.letterResult.coins} Xu.`;
      if (command?.type === 'fuseLetter' && result.state.letters.last?.kind === 'fuse') status.textContent = `Đã nhận chữ ${result.state.letters.last.received}.`;
      presentWheelResult=wheelAction||Boolean(eventTab==='wheel'&&result.committedWheelRewards?.length);
      busy=presentWheelResult;render();renderOnFinish=presentWheelResult;
      if (presentWheelResult) {
        const source=rewarded?'ad':command.source,receipt=result.spin||(spin?(source==='ad'?result.state.spins.ads.at(-1):result.state.spins[source]):null);
        if(receipt)presentedSpin=receipt;
        const rotor = root.querySelector('.liveops__rotor');
        const freshSpin=Boolean(spin&&result.spinApplied),prizes=result.committedWheelRewards||[];
        const wheel=result.wheelReward||receipt?.wheel;
        if(freshSpin||prizes.length){
          wheelPresentation?.dispose();const local=createGameShellLifecycle(),release=scope.own(()=>local.dispose());wheelPresentation=local;
          local.own(()=>{release.forget();if(wheelPresentation===local)wheelPresentation=null;});
          try {
          if(freshSpin&&receipt?.wheel?.version===WHEEL_VERSION&&rotor){
          const angle = 5 * 360 - receipt.sector * WHEEL_ANGLE;
          if (!wheelMotion.matches&&!document.hidden) {
            animation = startWheelMotion({rotor,pointer:root.querySelector('.liveops__pointer'),angle,owner:local,settings:gameState.settings});
            try { await animation.finished; } catch (error) { if (error.name !== 'AbortError') throw error; }
          }
          if (owns()&&local.active&&eventTab==='wheel') {
            rotor.style.transform = `rotate(${-receipt.sector * WHEEL_ANGLE}deg)`;
            const prize=rotor.querySelector(`[data-wheel-sector="${receipt.sector}"]`).getBoundingClientRect();
            rewardOrigin={x:prize.left+prize.width/2,y:prize.top+prize.height/2};
            status.textContent='';
          }
          }
          if(owns()&&local.active&&eventTab==='wheel'&&prizes.length){
            const box=wheel?.box||(wheel?.version===WHEEL_VERSION&&wheel.sector===2?'coins':null);
            if(box){const opened=await presentWheelGift(box,{owner:local,host:modal.overlay});if(opened)rewardOrigin=opened;}
            if(owns()&&local.active&&eventTab==='wheel')rewardFeedback.present(prizes,rewardOrigin,{contextualNames:true});
          }
          } finally { local.dispose(); }
        }
      }
      if(owns()&&feedback&&!presentWheelResult){
        if(result.bonusApplied||result.loginApplied&&result.loginResult?.index===6){
          const opened=await presentWheelGift(result.bonusApplied?'mystery':'support',{owner:scope,host:modal.overlay,title:result.bonusApplied?'Thưởng nhiệm vụ':'Gói hỗ trợ'});if(opened)rewardOrigin=opened;
        }
        if(owns())rewardFeedback.present(result.committedRewards,rewardOrigin,{contextualNames:true});
      }
      return result;
    } catch (error) {
      if(owns()){if(error.code!=='rewards/inventory-full')confirmedView=false;retry.hidden=false;}
      if(owns()&&!view&&(!navigator.onLine||getActiveGameScope())){
        try {const cached=await loadPersistentGameData();if(owns()&&cached.appearance.spark?.ownerUid===identity?.uid&&cached.appearance.spark.state){view={state:cached.appearance.spark.state,serverNow:Date.now()};observedAt=performance.now();}}
        catch {if(owns())status.textContent='Chưa đọc được bản lưu. Hãy tải lại trang.';return;}
      }
      if (owns()) status.textContent = error.code === 'rewards/inventory-full' ? error.message : error.code === 'rewards/wheel-pending' ? 'Phần quà trước vẫn được giữ. Bấm Thử lại để nhận quà rồi quay tiếp.' : error.code === 'rewards/invalid-operation' ? error.message : error.code === 'rewards/not-enabled' ? 'Chưa mở được Nhiệm vụ và Sự kiện. Hãy thử lại sau.'
        : 'Chưa thể cập nhật. Phần thưởng chưa nhận vẫn được giữ. Hãy kết nối và thử lại.';
      if (error.code !== 'rewards/not-enabled') console.warn('Liveops page operation unavailable', error.code || error.name);
      return {error:status.textContent};
    } finally { busy = false; if (active()&&renderOnFinish) { render(); if(spinHadFocus)root.querySelector('.liveops__spin-primary:not(:disabled)')?.focus({preventScroll:true}); } }
  }
  function play() { if(getActiveGameScope())return; modal.destroy(); openGameMenu(getRecentGameId()); }
  let observedAt=performance.now(), timer=null, refreshDay=null;
  const scrolls = new Map();
  const scrollHost = root.closest('.app-modal__body') || root.parentElement;
  const rememberScroll = key => { if(scrollHost)scrolls.set(key,scrollHost.scrollTop); };
  function renderMissions() {
    mountMissions(content, {view, tab, busy, canClaim:Boolean(canClaim()), run, play, renderEmpty:renderConnection, canPlay:!getActiveGameScope(), selectTab:key=>{
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
    if(document.hidden&&['running','paused'].includes(animation?.playState))animation.finish();
    if(timer!==null){clearShellInterval(timer);timer=null;}
    if(!document.hidden&&kind==='missions'){tick();timer=scope.interval(tick,60000);}
  }
  scope.listen(document,'visibilitychange',visibility);
  scope.own(()=>{if(timer!==null)clearShellInterval(timer);});
  const account=getAccountService();const accountKey=()=>{const identity=account?.getIdentity();return identity?`${identity.uid}:${identity.profileId}`:null;};let ownerKey=accountKey();
  if(account)scope.own(account.subscribe(()=>{
    const key=accountKey();
    if(key!==ownerKey){ownerKey=key;selectedLetter=null;letterDialog?.destroy();letterDialog=null;wheelPresentation?.dispose();view=null;confirmedView=false;animation?.cancel();status.textContent='Tài khoản đã thay đổi. Cập nhật để xem phần thưởng.';retry.hidden=false;render();}
  }));
  scope.listen(window,'offline',()=>{confirmedView=false;status.textContent='Đang xem tiến độ đã lưu. Kết nối để nhận thưởng.';render();});
  scope.listen(window,'online',()=>{if(active())void run({type:'status'});});
  function renderEvents() {
    const tabs = createTabs('events', [['wheel','Vòng quay'],['letters','Sưu tập chữ'],['festival','Sưu tập huy hiệu']], eventTab, (key, panel) => {
      if(key!==eventTab){rememberScroll(`event:${eventTab}`);scope.frame(()=>{if(scrollHost)scrollHost.scrollTop=scrolls.get(`event:${key}`)||0;});}
      if(key!==eventTab){wheelPresentation?.dispose();animation?.cancel();}
      eventTab = key; panel.replaceChildren();
      resetConnection();
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
    else banner.append(el('p','',festivalChestsEnabled()?'Kết nối để xem vòng và số huy hiệu đang có.':'Thu thập huy hiệu để nhận quà theo từng mốc.'));
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
      el('p','liveops__guidance','Mỗi nhóm ghép thường có 6% cơ hội nhận huy hiệu; nhóm đặc biệt, Lucky hoặc Magnet có 30%. Huy hiệu được giữ kể cả khi thua. Nhận đủ bốn mốc để sang vòng mới và giữ huy hiệu dư; rương có thể mở sau.'));
  }
  function renderWheel() {
    const wheel=el('section','liveops__card liveops__wheel-card'),stage=el('div','liveops__wheel');wheel.setAttribute('aria-label','Vòng quay');
    if(!wheelArt)wheelArt=createWheelArt();
    const rotor = wheelRotor || el('div', 'liveops__rotor');wheelRotor=rotor;
    if(!rotor.childElementCount){rotor.append(wheelArt.rotor);for(const [index,slot]of WHEEL_SLOTS.entries()){
      const label=el('span','liveops__sector');label.style.setProperty('--sector',index);label.dataset.wheelSector=String(index);label.setAttribute('aria-hidden','true');
      label.append(slot.box||index===2?createWheelGiftArt(slot.box||'coins'):createIcon('coin'),el('span','',slot.label.replace('Rương ','Rương\n')));rotor.append(label);
    }}
    refreshWheelGiftArt(rotor);
    if(!wheelPointer)wheelPointer=el('span','liveops__pointer');
    stage.append(rotor,wheelArt.rim,wheelPointer);stage.setAttribute('aria-label','Vòng quay mười ô: 5 Xu, 10 Xu và tám loại rương');
    const spin=view?.state.spins,last=presentedSpin||spin?.ticket||spin?.ads.at(-1)||spin?.free;
    rotor.style.transform=`rotate(${last?.wheel?.version===WHEEL_VERSION?-last.sector*WHEEL_ANGLE:0}deg)`;
    const pending=view?.state.pendingWheel;
    const source=!spin?.free?'free':view.state.tickets>0?'ticket':'ad';
    const exhausted=source==='ad'&&(spin?.ads.length||0)>=10;
    const labels={free:'Quay miễn phí',ticket:'Dùng 1 vé',ad:'Xem quảng cáo · Thêm 1 lượt'};
    const unavailable=source==='ad'&&(exhausted||view?.adPending||!rewardedSpinAvailable());
    const trigger=button('',()=>pending?void run({type:'claimWheelReward',wheelOperation:pending.operation}):source==='ad'?void run(null,{spin:true,rewarded:true}):void run({type:'spin',source},{spin:true}),busy||!canClaim()||(!pending&&Boolean(unavailable)),'spin-primary');
    trigger.classList.add('liveops__spin-primary');trigger.dataset.spinSource=source;
    trigger.setAttribute('aria-label',busy?'Đang quay':pending?'Nhận quà':exhausted?'Đã hết lượt quảng cáo hôm nay':labels[source]);
    trigger.append(el('strong','',busy?'Chờ…':pending?'Nhận quà':exhausted?'Hết lượt':source==='ad'?'Thêm lượt':'Quay'),
      el('small','',busy?'':pending?'Đang giữ':exhausted?'Hôm nay':source==='free'?'Miễn phí':source==='ticket'?'1 vé':'Quảng cáo'));
    if(unavailable)trigger.title=exhausted?'Đã dùng 10 lượt quảng cáo hôm nay.':view?.adPending?'Đang xác nhận lượt thưởng.':'Chưa có quảng cáo. Hãy thử lại sau.';
    stage.append(trigger);
    const primary=el('div','liveops__spin-actions'),ticketBalance=el('span','liveops__ticket-balance');
    ticketBalance.append(createIcon('ticket'),el('span','',view?`Vé quay: ${view.state.tickets}`:'Vé quay: …'));primary.append(ticketBalance);
    const info=button('',()=>{
      const rules=el('div','liveops__wheel-rules'),list=el('ul');
      for(const slot of WHEEL_SLOTS)list.append(el('li','',`${slot.label}: ${slot.weight}%`));
      rules.append(list,el('p','','Rương mở ngay sau khi quay. Rương Xu nhận ngẫu nhiên từ 5 đến 50 Xu. Rương Ngẫu nhiên chọn đều một rương C, Avatar, Khung hoặc Huy hiệu rồi mở rương đó. Các rương còn lại nhận đúng loại quà ghi trên rương; Rương Hỗ trợ chọn đều một trong ba trò rồi chọn đều loại hỗ trợ của trò đó.'),el('p','','Trong các nhóm ngoại hình, hiệu ứng và chủ đề, ưu tiên chọn đều món chưa sở hữu. Khi đã có đủ nhóm, nhận 100 Xu. Nếu món quà đã được chọn nay trở thành trùng, nhận 100 Xu. Kho hỗ trợ đầy thì quà được giữ để nhận sau, không quay lại hoặc dùng thêm lượt.'),el('p','','Một lượt miễn phí và tối đa 10 lượt quảng cáo mỗi ngày. Vé quay dùng riêng, không hết hạn; không mua thêm lượt.'));
      const games={'memory-match':'Memory Match','link-connect':'Link Connect','triple-connect':'Triple Connect'};
      for(const slot of WHEEL_SLOTS.filter(slot=>slot.box)){
        const details=el('details'),summary=el('summary','',`Xem quà trong ${slot.label}`),pool=el('ul');details.append(summary,pool);
        details.ontoggle=()=>{if(!details.open||pool.childElementCount)return;
          if(slot.box==='support')for(const [id,items]of Object.entries(CHEST_SUPPORTS))pool.append(el('li','',`${games[id]}: ${items.map(item=>item.label).join(', ')}`));
          else if(slot.box==='mystery')for(const [type,policy]of Object.entries(CHEST_POLICY))pool.append(el('li','',`${CHEST_NAMES[type]}: ${policy.coinChance*100}% nhận ${policy.coins} Xu, ${policy.supportChance*100}% nhận hỗ trợ${type==='c'?'':', 20% nhận ngoại hình đúng loại'}.`));
          else for(const item of WHEEL_ITEMS.filter(item=>item.category===slot.box))pool.append(el('li','',item.name+(item.category!=='cosmetic'&&item.gameId?` · ${games[item.gameId]}`:'')));
        };rules.append(details);
      }
      openAppModal({id:'wheel-rules-modal',title:'Thể lệ vòng quay',content:rules,owner:scope,alignment:'center',keepBanner:true});
    },busy,'wheel-rules');
    info.classList.add('liveops__wheel-info');info.setAttribute('aria-label','Thể lệ vòng quay');info.append(createIcon('info'));
    wheel.append(info,stage,primary);content.append(wheel);
    if(pending){const held=el('div','liveops__wheel-pending');held.append(createWheelGiftArt(pending.wheel.box),el('p','',`${WHEEL_BOX_LABELS[pending.wheel.box]} đang được giữ. Hãy dùng bớt hỗ trợ trong kho rồi bấm Nhận quà.`));content.append(held);}
    if(view){const mini=el('section','liveops__card liveops__letter-mini');mini.setAttribute('aria-label','Tiến độ bốn bộ chữ');
      for(const set of LETTER_SETS)mini.append(letterSlots(set,view.state.letters.counts));content.append(mini);}
  }
  function openChests() {
    const round=getActiveGameScope(),owner=surface.owner||round||getAppPageScope(),identity=getAccountService()?.getIdentity();
    const current=()=> (!owner||owner.active)&&(!round||round.active&&getActiveGameScope()===round)&&getAccountService()?.getIdentity()?.uid===identity?.uid;
    modal.destroy();
    if(current())void showCollectionModal({initialChest:true,fromGame:Boolean(round),surface:{...surface,owner}})
      .catch(()=>{if(current())showAppToast('Chưa mở được Kho rương. Hãy thử lại.',{tone:'error'});});
  }
  function letterSlots(set,counts){
    const slots=el('div','liveops__letter-slots');
    for(const slot of letterSetSlots(set,counts)){
      const cell=el('span','liveops__letter-slot');if(!slot.space)cell.append(letterArtwork(slot.letter));cell.dataset.filled=String(slot.filled);if(slot.space)cell.dataset.space='true';slots.append(cell);
    }
    slots.setAttribute('aria-label',`${set.label}: ${letterProgressLabel(set,counts)}`);return slots;
  }
  function showLetterMenu(letter){
    if(busy)return;
    selectedLetter=letter;render();
    const key=accountKey(),current=()=>active()&&accountKey()===key;
    letterDialog?.destroy();
    letterDialog=openLetterActions({letter,count:letterContext().counts[letter]||0,owner:scope,current,
      onSell:()=>openLetterOperation('sell',letter),onFuse:()=>openLetterOperation('fuse',letter)});
  }
  function letterContext(){return {counts:view?.state.letters.counts||{},sequence:view?.state.letters.sequence||0,canUse:Boolean(canClaim())&&!busy};}
  function openLetterOperation(kind,letter){
    if(busy||!active()||!(letterContext().counts[letter]>0))return;
    const key=accountKey(),current=()=>active()&&accountKey()===key;letterDialog?.destroy();
    letterDialog=kind==='sell'?sellSheet(letter,letterContext().counts[letter]):openLetterFusion({initialLetter:letter,owner:scope,current,getContext:letterContext,
      execute:ingredients=>run({type:'fuseLetter',ingredients},{feedback:false}),refresh:()=>run({type:'status'},{feedback:false})});
  }
  function renderLetters() {
    if(!view){renderConnection(content);return;}
    const counts=view.state.letters.counts,choices=el('div','liveops__set-choices');
    choices.setAttribute('role','tablist');choices.setAttribute('aria-label','Bộ chữ');
    for(const set of LETTER_SETS){const choice=button(set.label,()=>{selectedSetId=set.id;render();},false,`set-${set.id}`);choice.id=`letter-recipe-${set.id}`;choice.setAttribute('aria-controls','letter-recipe-panel');choice.setAttribute('role','tab');choice.setAttribute('aria-selected',String(selectedSetId===set.id));choice.setAttribute('aria-pressed',String(selectedSetId===set.id));choices.append(choice);}
    choices.onkeydown=event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      const index=LETTER_SETS.findIndex(set=>set.id===selectedSetId),next=event.key==='Home'?0:event.key==='End'?LETTER_SETS.length-1:(index+(event.key==='ArrowRight'?1:-1)+LETTER_SETS.length)%LETTER_SETS.length;
      event.preventDefault();selectedSetId=LETTER_SETS[next].id;render();root.querySelector(`[data-focus-key="set-${selectedSetId}"]`)?.focus({preventScroll:true});
    };
    const set=LETTER_SETS.find(item=>item.id===selectedSetId),letters=el('section','liveops__card liveops__recipe'),word=el('div','liveops__recipe-word');letters.setAttribute('aria-label','Bộ chữ và phần thưởng');
    word.style.setProperty('--recipe-columns',set.label.length);
    const filled=letterSetSlots(set,counts).filter(slot=>slot.filled).length,total=Object.values(set.required).reduce((sum,n)=>sum+n,0);
    const recipePanel=el('div','liveops__recipe-panel');recipePanel.id='letter-recipe-panel';recipePanel.setAttribute('role','tabpanel');recipePanel.setAttribute('aria-labelledby',`letter-recipe-${set.id}`);recipePanel.append(letterSlots(set,counts));word.append(choices,recipePanel);
    const reward=el('div','liveops__recipe-reward');
    if(festivalChestsEnabled())reward.append(createIcon('chest'),el('strong','',CHEST_NAMES[set.chestType]));
    else{const next=LETTER_REWARD_ITEMS.find(item=>item.id===view.nextLetterRewardId);reward.append(createIcon('chest'),el('strong','',next?next.name:`${LETTER_FALLBACK_COINS} Xu`));}
    const exchange=button('Đổi quà',()=>void run({type:'exchangeLetterSet',setId:set.id}),busy||!canClaim()||filled<total,`exchange-${set.id}`);exchange.setAttribute('aria-label',`Đổi ${set.label}`);reward.append(exchange);letters.append(word,reward);
    const inventory=panel('Kho chữ'),grid=el('div','liveops__letter-grid');inventory.classList.add('liveops__inventory');
    if(selectedLetter===null)selectedLetter=LETTER_ALPHABET.find(letter=>counts[letter]>0)||LETTER_ALPHABET[0];
    for(const letter of LETTER_ALPHABET){const count=counts[letter]||0,choice=button('',()=>showLetterMenu(letter),busy,`letter-${letter}`);
      const glyph=letterArtwork(letter);glyph.classList.add('liveops__letter-glyph');choice.append(glyph,el('span','liveops__letter-count',`×${count}`));choice.dataset.empty=String(count===0);choice.setAttribute('aria-label',`Chữ ${letter}, ${count} chữ`);choice.setAttribute('aria-pressed',String(selectedLetter===letter));grid.append(choice);}
    const tools=el('div','liveops__letter-tools'),disabled=busy||!canClaim()||!(counts[selectedLetter]>0);
    for(const [label,kind,icon]of [['Ghép','fuse','shuffle'],['Bán','sell','coins']]){const control=button(label,()=>openLetterOperation(kind,selectedLetter),disabled,`letter-${kind}`);control.prepend(createIcon(icon));control.setAttribute('aria-description',`Chữ ${selectedLetter}`);tools.append(control);}
    inventory.append(grid,tools);content.append(letters,inventory);
  }

  function sellSheet(letter, max) {
    const sheet=el('div','liveops__sale'), quantity=el('input','liveops__letter-quantity');
    quantity.type='number';quantity.min='1';quantity.max=String(max);quantity.value='1';quantity.step='1';quantity.setAttribute('aria-label','Số chữ muốn bán');
    quantity.inputMode='numeric';quantity.required=true;
    const description=el('p'),confirm=button('Xác nhận bán',()=>{ const n=Number(quantity.value);if(!Number.isSafeInteger(n)||n<1||n>max)return; sale.destroy();void run({type:'sellLetter',letter,quantity:n}); });
    const update=()=>{const n=Number(quantity.value);confirm.disabled=!Number.isSafeInteger(n)||n<1||n>max;quantity.setAttribute('aria-invalid',String(confirm.disabled));description.textContent=confirm.disabled?`Bạn có ${max} chữ ${letter}. Nhập số lượng từ 1 đến ${max}.`:`Bán ${n} chữ ${letter}, nhận ${(n*LETTER_SELL_COINS).toLocaleString('vi-VN')} Xu. Bạn đang có ${max} chữ ${letter}.`;};
    quantity.oninput=update;
    const label=el('label','liveops__sale-quantity','Số lượng');label.append(quantity);sheet.append(description,label,confirm);update();
    const sale=openAppModal({id:'letter-sale',title:'Bán chữ',content:sheet,owner:scope});sale.panel.classList.add('letter-sale-dialog');quantity.focus();return sale;
  }
  function render() {
    if (!active()) return;
    const focusKey = document.activeElement?.dataset.focusKey, previousScroll=scrollHost?.scrollTop;
    resetConnection();
    content.replaceChildren();
    if (kind === 'missions') renderMissions(); else renderEvents();
    if(scrollHost&&previousScroll!==undefined)scrollHost.scrollTop=previousScroll;
    const selectedRecipe=content.querySelector('.liveops__set-choices [aria-selected="true"]');
    if(selectedRecipe){const strip=selectedRecipe.parentElement,tabRect=selectedRecipe.getBoundingClientRect(),stripRect=strip.getBoundingClientRect();strip.scrollLeft+=tabRect.left-stripRect.left-(strip.clientWidth-tabRect.width)/2;}
    if(view&&confirmedView&&navigator.onLine&&!getActiveGameScope()&&!canClaim())retry.hidden=false;
    retry.disabled=busy;
    root.setAttribute('aria-busy', String(busy));
    if(focusKey) [...root.querySelectorAll('button')].find(button=>button.dataset.focusKey===focusKey&&!button.disabled)?.focus({preventScroll:true});
  }
  root.append(retry);
  render(); visibility(); void run({ type: 'status' }); return modal;
}
