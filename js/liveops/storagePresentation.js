import {node,action} from './ui.js';
import {storageEntries,storagePage,FRAGMENT_NAMES} from './storageModel.js';
import {createChestArt} from './chestArt.js';
import {CHEST_POLICY,CHEST_POOLS,CHEST_SALE_PRICES} from './chestConfig.js';
import {openAppModal} from '../modal.js';
import {createGameShellLifecycle} from '../gameShell/gameShellLifecycle.js';
import {gameState} from '../gameState.js';

function fragmentArt(type){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 64 64');svg.setAttribute('aria-hidden','true');svg.classList.add('storage__fragment');svg.dataset.type=type;
  for(const d of ['M10 23 24 12 42 16 53 31 38 53 18 46Z','M24 12 27 31 10 23M27 31 42 16M27 31 38 53M27 31 53 31']){
    const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',d);svg.append(path);
  }return svg;
}
/** Inventory owns all dialogs; each chest is committed before starting the next. */
export function mountStorageGrid(host,{owner,current,getState,execute,describe,initialType}){
  const scope=createGameShellLifecycle(),release=owner.own(()=>scope.dispose());scope.own(()=>release.forget());
  const grid=node('div','storage__grid'),navigation=node('nav','storage__pages');host.append(grid,navigation);
  let page=0,columns=4,dialog=null,openedInitial=false,refreshOpenDialog=null;
  const active=()=>scope.active&&current();
  const art=item=>item.kind==='chest'?createChestArt(item.type):fragmentArt(item.type);
  scope.own(()=>dialog?.destroy());
  function render(){
    if(!active())return;
    const entries=storageEntries(getState()),slice=storagePage(entries,page,columns);page=slice.index;
    const focus=document.activeElement?.dataset.storageId;
    grid.replaceChildren();navigation.replaceChildren();grid.style.setProperty('--storage-columns',columns);
    for(const item of slice.items){const b=action('',()=>show(item));b.className='storage__item';b.dataset.storageId=item.id;b.setAttribute('aria-label',`${item.name}, số lượng ${item.count}`);b.append(art(item));grid.append(b);}
    if(!entries.length)grid.append(node('p','storage__empty','Kho đang trống.'));
    if(slice.pages>1)navigation.append(action('Trang trước',()=>{page--;render();},page===0),node('span','',`${page+1}/${slice.pages}`),action('Trang sau',()=>{page++;render();},page+1===slice.pages));
    if(focus)grid.querySelector(`[data-storage-id="${focus}"]`)?.focus({preventScroll:true});
    refreshOpenDialog?.();
    if(!openedInitial&&initialType){const initial=entries.find(item=>item.kind==='chest'&&item.type===initialType);if(initial){openedInitial=true;show(initial);}}
  }
  function show(item){
    dialog?.destroy();
    const local=createGameShellLifecycle(),content=node('div','storage__detail'),controls=node('div','storage__actions'),status=node('p','storage__status');status.setAttribute('role','status');
    let busy=false,stopBatch=false;
    let controlsOwner=null;
    local.own(()=>{controlsOwner?.dispose();controlsOwner=null;});
    function resetControls(){controlsOwner?.dispose();controlsOwner=createGameShellLifecycle();controls.replaceChildren();return controlsOwner;}
    const motion=matchMedia('(prefers-reduced-motion: reduce)');let currentAnimation=null;
    local.listen(motion,'change',event=>{if(event.matches&&currentAnimation)currentAnimation.finish();});
    local.own(()=>{currentAnimation=null;});
    const countLabel=node('p','',`Đang có: ${item.count.toLocaleString('vi-VN')}`);
    content.append(art(item),countLabel,controls,status);
    const modal=openAppModal({id:'storage-item-modal',title:item.name,content,owner:scope,alignment:'center',onDestroy:()=>{stopBatch=true;local.dispose();if(dialog===modal){dialog=null;refreshOpenDialog=null;}}});dialog=modal;
    refreshOpenDialog=()=>{const count=storageEntries(getState()).find(entry=>entry.id===item.id)?.count||0;countLabel.textContent=`Đang có: ${count.toLocaleString('vi-VN')}`;};
    const owns=()=>active()&&local.active;
    local.listen(window,'offline',()=>{stopBatch=true;});
    function quantity(kind){
      if(busy)return;const tools=resetControls();
      const count=storageEntries(getState()).find(entry=>entry.id===item.id)?.count||0;
      if(!count){status.textContent='Vật phẩm đã dùng hết.';renderActions();return;}
      const label=node('label','storage__quantity'),slider=node('input');slider.type='range';slider.min='1';slider.max=String(count);slider.value='1';slider.setAttribute('aria-label','Số lượng');
      const total=node('p'),confirm=action('Xác nhận',()=>void submit());
      function update(){const n=Number(slider.value);total.textContent=kind==='sell'?`Bán ${n} · Nhận ${(n*(item.kind==='chest'?CHEST_SALE_PRICES[item.type]:100)).toLocaleString('vi-VN')} Xu`:`Mở ${n} rương`;}
      label.append(slider);controls.append(label,total,confirm);tools.listen(slider,'input',update);update();
      async function submit(){
        if(busy||!owns())return;busy=true;confirm.disabled=true;slider.disabled=true;
        const count=Number(slider.value),rewards=new Map();let opened=0;
        try{
          if(kind==='sell'){
            await execute({type:item.kind==='chest'?'sellChest':'sellCosmeticFragments',...(item.kind==='chest'?{chestType:item.type}:{fragmentType:item.type}),quantity:count});
            if(owns())status.textContent=total.textContent;
          }else{
            for(let i=0;i<count&&owns()&&!stopBatch;i++){
              const result=await execute({type:'openChest',chestType:item.type});
              if(!result.chestResult)break;
              const text=describe(result.chestResult);rewards.set(text,(rewards.get(text)||0)+1);opened++;
              if(!owns())break;
              status.textContent=`Đã mở ${i+1}/${count}`;
              const image=content.querySelector('.liveops__chest-art');
              if(image&&!motion.matches){
                const animation=local.animation(image.animate([{transform:'scale(.9)',opacity:.6},{transform:'scale(1.08)',opacity:1},{transform:'scale(1)',opacity:1}],{duration:420,easing:'ease-out'}));
                currentAnimation=animation;
                try{await animation.finished.catch(error=>{if(error.name!=='AbortError')throw error;});}finally{currentAnimation=null;}
              }
            }
            if(owns()&&opened){const summary=node('div','storage__summary');summary.append(node('p','',`Đã mở ${opened} rương`));for(const [text,amount] of rewards)summary.append(node('p','',`${text} ×${amount}`));
              openAppModal({id:'storage-summary-modal',title:'Quà đã nhận',content:summary,owner:scope,alignment:'center'});modal.destroy();}
          }
        }catch(error){if(owns())status.textContent=error.message||'Chưa hoàn tất. Vật phẩm vẫn được giữ.';}
        finally{busy=false;if(owns())renderActions();render();}
      }
    }
    function renderActions(){
    resetControls();
    const empty=!(storageEntries(getState()).find(entry=>entry.id===item.id)?.count);
    if(item.kind==='chest'){
      controls.append(action('Xem tỷ lệ',()=>{const policy=CHEST_POLICY[item.type],pool=CHEST_POOLS[item.type]||[];
        status.textContent=`40%: ${policy.coins} Xu · ${item.type==='c'?'60':'40'}%: 1 hỗ trợ${pool.length?` · 20%: 1 ngoại hình. Cả ${pool.length} món được chọn đều, gồm món đã có. Bản trùng tăng 1 level; sau Level Max nhận 1 mảnh đúng loại.`:'.'}`;}),action('Mở',()=>quantity('open'),empty),action('Bán',()=>quantity('sell'),empty));
    }else controls.append(action('Bán',()=>quantity('sell'),empty),action('Ghép',()=>fusion()));
    }
    renderActions();
    function fusion(){
      if(busy)return;resetControls();const inputs={},counts=getState().cosmeticProgress?.fragments||{};
      for(const [type,name]of Object.entries(FRAGMENT_NAMES)){const label=node('label','',name),input=node('input');input.type='number';input.min='0';input.max=String(Math.min(3,counts[type]||0));input.value='0';input.setAttribute('aria-label',name);inputs[type]=input;label.append(input);controls.append(label);}
      const note=node('p','','3 mảnh bất kỳ + 20 Xu · Mỗi loại rương có cơ hội 1/3. Rương được thêm vào kho.'),confirm=action('Ghép · 20 Xu',async()=>{
        if(busy||!owns())return;
        const ingredients=Object.fromEntries(Object.entries(inputs).map(([type,input])=>[type,Number(input.value)]));
        if(Object.values(ingredients).some(n=>!Number.isInteger(n)||n<0)||Object.values(ingredients).reduce((a,b)=>a+b,0)!==3){status.textContent='Chọn đủ 3 mảnh để ghép.';return;}
        busy=true;confirm.disabled=true;
        try{await execute({type:'fuseCosmeticFragments',ingredients});if(owns()){status.textContent='Đã thêm rương vào Kho lưu trữ.';controls.replaceChildren();}render();}
        catch(error){if(owns())status.textContent=error.message;}
        finally{busy=false;if(owns())renderActions();}
      },gameState.coins<20);controls.append(note,confirm);
    }
  }
  const observer=new ResizeObserver(entries=>{const next=entries[0].contentRect.width>=480?6:4;if(next!==columns){columns=next;render();}});observer.observe(host);scope.own(()=>observer.disconnect());
  render();return {render,dispose:()=>scope.dispose()};
}
