import {node,action} from './ui.js';
import {storageEntries,storageLayout,storageAvailableQuantity,STORAGE_ACCESS_VERSION,FRAGMENT_NAMES} from './storageModel.js';
import {STORAGE_PAGE_COUNT,STORAGE_PAGE_SIZE,STORAGE_FREE_SLOTS,STORAGE_MAX_SLOTS,STORAGE_SLOT_PRICE,STORAGE_PURCHASE_VERSION} from './storageCapacity.js';
import {createChestArt} from './chestArt.js';
import {CHEST_SALE_PRICES} from './chestConfig.js';
import {openAppModal,showAppToast} from '../modal.js';
import {createGameShellLifecycle} from '../gameShell/gameShellLifecycle.js';
import {gameState} from '../gameState.js';
import {createIcon} from '../icons.js';
import {createRewardInfo} from '../rewardInfo.js';
import {chestContents} from './chestInfo.js';
import {clearTooltip} from '../tooltips.js';
import {revealTab} from '../tabVisibility.js';
import {fragmentArt} from './storageArt.js';
import {createWheelGiftArt} from './wheelGiftArt.js';
import {createRewardFeedback} from './rewardFeedback.js';
import {chestPresentationReward} from './rewardFeedbackModel.js';
import {playOwnedRewardCue} from '../sound.js';
import {isAppActive} from '../appVisibility.js';
import '../../styles/raised-actions.css';
const STORAGE_PRICE_LABEL=`${STORAGE_SLOT_PRICE.toLocaleString('vi-VN')} Xu`;

function storageAction(label,run,disabled=false,kind='open'){
  const button=action(label,run,disabled);
  button.className='app-button ui-raised-action storage__action';
  button.dataset.storageAction=kind;
  return button;
}

/** Inventory owns all dialogs; each chest is committed before starting the next. */
export function mountStorageGrid(host,{owner,current,getState,execute,initialType}){
  const scope=createGameShellLifecycle(),release=owner.own(()=>scope.dispose());scope.own(()=>release.forget());
  scope.own(clearTooltip);
  const grid=node('div','storage__grid'),navigation=node('nav','storage__pages');host.append(grid,navigation);
  navigation.setAttribute('aria-label','Trang Kho lưu trữ');
  const feedback=createRewardFeedback({owner:scope,host:host.closest('.app-modal')});
  let page=0,overflowPage=0,showOverflow=false,dialog=null,openedInitial=false,refreshOpenDialog=null;
  const active=()=>scope.active&&current();
  const art=item=>item.kind==='chest'?createChestArt(item.type):fragmentArt(item.type);
  scope.own(()=>dialog?.destroy());
  function render(){
    if(!active())return;
    const entries=storageEntries(getState()),layout=storageLayout(getState(),page,overflowPage);page=layout.index;overflowPage=layout.overflowPage;
    if(!layout.overflow)showOverflow=false;
    const focus=document.activeElement?.dataset.storageId;
    const navigationFocus=navigation.contains(document.activeElement)?document.activeElement.dataset.focusKey:null;
    clearTooltip();grid.replaceChildren();navigation.replaceChildren();
    const slots=showOverflow?layout.overflowItems.map(item=>({item})):layout.slots;
    for(const {item,locked,slot:index} of slots){
      if(locked){const locked=action('',()=>unlock(index));locked.className='storage__slot storage__slot--locked';locked.dataset.storageSlot=String(index);locked.setAttribute('aria-label',`Mở ô ${index+1} · ${STORAGE_PRICE_LABEL}`);locked.append(createIcon('lock'));grid.append(locked);continue;}
      if(!item){const empty=node('span','storage__slot storage__slot--empty');empty.setAttribute('aria-hidden','true');grid.append(empty);continue;}
      const b=action('',()=>show(item));b.className='storage__slot storage__item';b.dataset.storageId=item.id;if(item.temporary)b.dataset.storageTemporary='true';b.setAttribute('aria-label',`${item.name}, số lượng ${item.count}${item.temporary?', kho tạm':''}`);b.append(art(item));
      if(item.kind==='chest'){const slot=node('span','storage__slot-wrap reward-info-host');slot.append(b,createRewardInfo(chestContents(item.type),`Thông tin ${item.name}`));grid.append(slot);}else grid.append(b);
    }
    for(let i=0;i<STORAGE_PAGE_COUNT;i++){const button=action(String(i+1),()=>{showOverflow=false;page=i;render();});button.setAttribute('aria-label',`Trang ${i+1}`);if(!showOverflow&&page===i)button.setAttribute('aria-current','page');navigation.append(button);}
    if(layout.overflow){const extra=action(`Tạm · ${layout.overflow}`,()=>{showOverflow=true;render();});extra.setAttribute('aria-label',`Kho tạm · ${layout.overflow}`);extra.setAttribute('aria-pressed',String(showOverflow));navigation.append(extra);}
    if(showOverflow&&layout.overflowPages>1)navigation.append(action('Trước',()=>{overflowPage--;render();},overflowPage===0),node('span','',`${overflowPage+1}/${layout.overflowPages}`),action('Sau',()=>{overflowPage++;render();},overflowPage+1===layout.overflowPages));
    if(focus)grid.querySelector(`[data-storage-id="${focus}"]`)?.focus({preventScroll:true});
    if(navigationFocus)Array.from(navigation.querySelectorAll('button')).find(button=>button.dataset.focusKey===navigationFocus)?.focus({preventScroll:true});
    const revealTarget=Array.from(navigation.querySelectorAll('button')).find(button=>button.dataset.focusKey===navigationFocus)||navigation.querySelector('[aria-current=page],[aria-pressed=true]');if(revealTarget)revealTab(navigation,revealTarget);
    refreshOpenDialog?.();
    if(!openedInitial&&initialType){const initial=entries.find(item=>item.kind==='chest'&&item.type===initialType);if(initial){openedInitial=true;show({...initial,entryId:initial.id,count:1,temporary:!storageAvailableQuantity(getState(),initial.id)});}}
  }
  function unlock(slot){
    dialog?.destroy();let submitting=false;
    const content=node('div','storage__unlock'),note=node('p','','Mở rộng thêm ô lưu trữ'),price=node('p','storage__unlock-price'),status=node('p');status.setAttribute('role','status');
    price.append(createIcon('coin'),node('strong','',STORAGE_PRICE_LABEL));content.append(note,price,status);
    const modal=openAppModal({id:'storage-item-modal',title:`Mở ô ${slot+1}`,owner:scope,content,alignment:'center',actions:[{label:'Hủy'},{label:'Mua',variant:'primary',onClick:async()=>{
      if(submitting||!active())return false;submitting=true;
      try{
        const result=await execute({type:'unlockStorageSlot',slot,storageVersion:STORAGE_PURCHASE_VERSION,sequence:(getState()?.storageUnlocks?.sequence||0)+1});
        if(active()&&result.receipts.some(receipt=>receipt.receiptId.includes(':storage-slot:')&&receipt.coins===-STORAGE_SLOT_PRICE))showAppToast(`−${STORAGE_PRICE_LABEL}`,{position:'center',presentation:'floating',duration:1400});
        render();return;
      }
      catch(error){if(active()&&modal.panel.isConnected)status.textContent=error.message;return false;}
      finally{submitting=false;}
    }}],onDestroy:()=>{if(dialog===modal)dialog=null;}});dialog=modal;
    modal.panel.classList.add('storage__purchase-modal','app-modal--confirmation');
    modal.panel.querySelector('.app-button--primary').classList.add('ui-raised-action');
  }
  function show(item){
    dialog?.destroy();
    const local=createGameShellLifecycle(),content=node('div','storage__detail'),controls=node('div','storage__actions'),status=node('p','storage__status');status.setAttribute('role','status');
    let busy=false;
    let controlsOwner=null;
    local.own(()=>{controlsOwner?.dispose();controlsOwner=null;});
    function resetControls(){controlsOwner?.dispose();controlsOwner=createGameShellLifecycle();controls.replaceChildren();return controlsOwner;}
    const motion=matchMedia('(prefers-reduced-motion: reduce)');let openingAnimations=[];
    const finishOpening=()=>{for(const animation of openingAnimations)if(animation.playState!=='idle')animation.finish();};
    local.listen(motion,'change',event=>{if(event.matches)finishOpening();});
    local.listen(document,'appvisibilitychange',()=>{if(!isAppActive())finishOpening();});
    local.own(()=>{openingAnimations=[];});
    const countLabel=node('p','',`Đang có: ${item.count.toLocaleString('vi-VN')}`);
    const visual=item.kind==='chest'?createWheelGiftArt(item.type):art(item);
    content.append(visual,...(item.kind==='chest'?[]:[countLabel]),controls,status);
    const modal=openAppModal({id:'storage-item-modal',title:item.name,content,owner:scope,alignment:'center',onDestroy:()=>{local.dispose();if(dialog===modal){dialog=null;refreshOpenDialog=null;}}});dialog=modal;
    if(item.kind==='chest'){
      const header=modal.panel.querySelector('.app-modal__header'),title=header.querySelector('.app-modal__title');
      const heading=node('div','storage__heading'),info=node('span','storage__info'),button=action('',()=>showRates()),tooltip=node('div','storage__rates');
      button.className='storage__info-button';button.setAttribute('aria-label','Xem tỷ lệ');button.append(createIcon('info'));
      tooltip.id='storage-chest-rates';tooltip.setAttribute('role','tooltip');tooltip.hidden=true;
      tooltip.textContent=chestContents(item.type);
      header.classList.add('storage__header');title.before(heading);heading.append(title,info);info.append(button,tooltip);
      function showRates(){tooltip.hidden=false;button.setAttribute('aria-describedby',tooltip.id);}
      function hideRates(){tooltip.hidden=true;button.removeAttribute('aria-describedby');}
      local.listen(info,'pointerenter',event=>{if(event.pointerType==='mouse')showRates();});
      local.listen(info,'pointerleave',event=>{if(event.pointerType==='mouse')hideRates();});
      local.listen(button,'focus',()=>{if(button.matches(':focus-visible'))showRates();});
      local.listen(button,'blur',hideRates);
      local.listen(button,'keydown',event=>{if(event.key==='Escape'&&!tooltip.hidden){event.stopPropagation();hideRates();}});
      local.listen(document,'pointerdown',event=>{if(!info.contains(event.target))hideRates();});
    }
    const available=()=>storageAvailableQuantity(getState(),item.entryId||item.id);
    countLabel.textContent=`Đang có: ${available().toLocaleString('vi-VN')}`;
    refreshOpenDialog=()=>{countLabel.textContent=`Đang có: ${available().toLocaleString('vi-VN')}`;};
    const owns=()=>active()&&local.active;
    async function chestAction(kind){
      if(item.temporary||busy||!owns()||!available())return;busy=true;
      for(const button of controls.querySelectorAll('button'))button.disabled=true;
      let result;
      try{
        result=await execute(kind==='sell'?{type:'sellChest',chestType:item.type,quantity:1,storageAccessVersion:STORAGE_ACCESS_VERSION}:{type:'openChest',chestType:item.type,storageAccessVersion:STORAGE_ACCESS_VERSION});
        if(!owns()||!result.chestResult)return;
        if(kind==='open'){
          playOwnedRewardCue('openBox',local,gameState.settings);
          if(!motion.matches&&isAppActive()){
            openingAnimations=[local.animation(visual.animate([{transform:'scale(.9)'},{transform:'scale(1.12)',offset:.5},{transform:'scale(1)'}],{duration:560})),
              local.animation(visual.querySelector('.wheel-gift__image--closed').animate([{opacity:1},{opacity:0}],{duration:260,delay:280,fill:'forwards'})),
              local.animation(visual.querySelector('.wheel-gift__image--open').animate([{opacity:0},{opacity:1}],{duration:260,delay:280,fill:'both'}))];
            try{await Promise.all(openingAnimations.map(animation=>animation.finished));}catch(error){if(error.name!=='AbortError')throw error;}
            finally{openingAnimations=[];}
          }else visual.dataset.open='true';
        }
        if(!owns())return;
        const rect=visual.getBoundingClientRect();
        feedback.present(chestPresentationReward(result),{x:rect.left+rect.width/2,y:rect.top+rect.height/2});
        modal.destroy();
      }catch(error){if(owns()){
        if(result?.chestResult){console.error('Chest feedback failed after commit',error);modal.destroy();showAppToast(kind==='sell'?'Đã bán 1 rương.':'Đã nhận quà từ rương.',{position:'center'});}
        else status.textContent=error.message||'Chưa hoàn tất. Rương vẫn được giữ.';
      }}
      finally{busy=false;if(owns())renderActions();render();}
    }
    function quantity(){
      if(item.temporary||busy)return;const tools=resetControls();
      const count=available();
      if(!count){status.textContent='Vật phẩm đã dùng hết.';renderActions();return;}
      const label=node('label','storage__quantity'),slider=node('input');slider.type='range';slider.min='1';slider.max=String(count);slider.value='1';slider.setAttribute('aria-label','Số lượng');
      const total=node('p'),confirm=storageAction('Xác nhận',()=>void submit(),false,'sell');
      function update(){total.textContent=`Bán ${slider.value} · Nhận ${(Number(slider.value)*100).toLocaleString('vi-VN')} Xu`;}
      label.append(slider);controls.append(label,total,confirm);tools.listen(slider,'input',update);update();
      async function submit(){
        if(busy||!owns())return;busy=true;confirm.disabled=true;slider.disabled=true;
        const count=Number(slider.value);
        try{
          await execute({type:'sellCosmeticFragments',fragmentType:item.type,quantity:count,storageAccessVersion:STORAGE_ACCESS_VERSION});
          if(owns())status.textContent=total.textContent;
        }catch(error){if(owns())status.textContent=error.message||'Chưa hoàn tất. Vật phẩm vẫn được giữ.';}
        finally{busy=false;if(owns())renderActions();render();}
      }
    }
    function renderActions(){
    resetControls();
    if(item.temporary){
      controls.append(node('p','storage__temporary-note','Vật phẩm sẽ lần lượt chuyển vào kho chính khi có ô trống.'));
      const unlocked=getState()?.storageUnlocks?.slots||[],next=Array.from({length:STORAGE_MAX_SLOTS-STORAGE_FREE_SLOTS},(_,i)=>i+STORAGE_FREE_SLOTS).find(slot=>!unlocked.includes(slot));
      if(next!==undefined)controls.append(storageAction('Mở rộng kho',()=>{modal.destroy();showOverflow=false;page=Math.floor(next/STORAGE_PAGE_SIZE);render();unlock(next);},false));
      return;
    }
    const empty=!available();
    if(item.kind==='chest'){
      const sell=storageAction('Bán',()=>void chestAction('sell'),empty,'sell');
      sell.dataset.tooltip=`Bán 1 rương · Nhận ${CHEST_SALE_PRICES[item.type].toLocaleString('vi-VN')} Xu`;
      controls.append(sell,storageAction('Mở',()=>void chestAction('open'),empty));
    }else controls.append(storageAction('Bán',()=>quantity(),empty,'sell'),storageAction('Ghép',()=>fusion(),false,'fuse'));
    }
    renderActions();
    function fusion(){
      if(item.temporary||busy)return;resetControls();const inputs={};
      for(const [type,name]of Object.entries(FRAGMENT_NAMES)){const label=node('label','',name),input=node('input');input.type='number';input.min='0';input.max=String(Math.min(3,storageAvailableQuantity(getState(),`fragment-${type}`)));input.value='0';input.setAttribute('aria-label',name);inputs[type]=input;label.append(input);controls.append(label);}
      const note=node('p','','3 mảnh bất kỳ + 20 Xu · Mỗi loại rương có cơ hội 1/3. Rương được thêm vào kho.'),confirm=storageAction('Ghép · 20 Xu',async()=>{
        if(busy||!owns())return;
        const ingredients=Object.fromEntries(Object.entries(inputs).map(([type,input])=>[type,Number(input.value)]));
        if(Object.values(ingredients).some(n=>!Number.isInteger(n)||n<0)||Object.values(ingredients).reduce((a,b)=>a+b,0)!==3){status.textContent='Chọn đủ 3 mảnh để ghép.';return;}
        busy=true;confirm.disabled=true;
        try{await execute({type:'fuseCosmeticFragments',ingredients,storageAccessVersion:STORAGE_ACCESS_VERSION});if(owns()){status.textContent='Đã thêm rương vào Kho lưu trữ.';controls.replaceChildren();}render();}
        catch(error){if(owns())status.textContent=error.message;}
        finally{busy=false;if(owns())renderActions();}
      },gameState.coins<20,'fuse');controls.append(note,confirm);
    }
  }
  render();return {render,dispose:()=>scope.dispose()};
}
