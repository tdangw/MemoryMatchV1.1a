import { createAdventureActionArt } from '../adventureActionArt.js';
import { createIcon } from '../icons.js';
import { publishHourlyGiftView, hourlyGiftRemaining } from './hourlyGiftViewState.js';
import { openAppModal, showAppToast } from '../modal.js';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { getAccountService } from '../accountService.js';
import { requestLiveops } from './service.js';
import { CHEST_SUPPORTS } from './chestConfig.js';
import { playOwnedRewardCue } from '../sound.js';
import { gameState } from '../gameState.js';
import { refreshAppWallet } from '../appNavigation.js';
import '../../styles/hourly-gift.css';
const el = (tag,cls,text) => { const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n; };
const supportIcons = {hint:'wand',preview4:'eye',time30:'timer',reshuffle:'shuffle',thunder:'energy',freeze:'snowflake',undo:'undo',shuffle:'shuffle',time:'timer'};
function describe(reward) {
  if(reward.kind==='ticket')return {icon:'ticket',label:'1 Vé quay',target:'.adventure-map-shortcuts--events [aria-label="Sự kiện"]'};
  if(reward.kind==='coins')return {icon:'coin',label:`${reward.coins.toLocaleString('vi-VN')} Xu`,target:'.adventure-map-wallet'};
  const item=CHEST_SUPPORTS[reward.gameId].find(item=>item.key===reward.key);
  const game={'memory-match':'Memory Match','link-connect':'Link Connect','triple-connect':'Triple Connect'}[reward.gameId];
  return {icon:supportIcons[reward.key],label:`${item.label} ×1 · ${game}`,target:'.adventure-map-shortcut[aria-label="Bộ sưu tập"]'};
}
async function revealGift(art,result,prize,owner) {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const cue=name=>playOwnedRewardCue(name,owner,gameState.settings);
  if(reduced.matches || document.hidden || typeof art.animate!=='function'){art.classList.add('is-open');cue('reward');return;}
  const scope=createGameShellLifecycle(),release=owner.own(()=>scope.dispose());scope.own(()=>release.forget());
  // Read both anchors before mounting the bounded particle batch.
  const from=art.getBoundingClientRect(),target=document.querySelector(prize.target),to=target?.getBoundingClientRect()||result.getBoundingClientRect();
  const count=prize.icon==='coin'?6:1;
  const start={x:from.x+from.width/2,y:from.y+from.height/2},end={x:to.x+to.width/2,y:to.y+to.height/2};
  const layer=el('div','hourly-gift-particles');layer.setAttribute('aria-hidden','true');document.body.append(layer);scope.own(()=>layer.remove(),'node');
  const animations=[];
  const animate=(node,frames,options)=>{const a=node.animate(frames,options);scope.animation(a);animations.push(a);};
  animate(art,[{transform:'scale(.7)',opacity:0},{transform:'scale(1.06)',opacity:1,offset:.3},{transform:'scale(.96) rotate(-6deg)',offset:.5},{transform:'scale(1.03) rotate(6deg)',offset:.65},{transform:'scale(1) rotate(0deg)',opacity:1}],{duration:650});
  animate(art.querySelector('.hourly-gift__lid'),[{transform:'translateY(0)',opacity:1},{transform:'translateY(-15px) rotate(-15deg)',opacity:0}],{duration:320,delay:480,fill:'forwards'});
  animate(result,[{opacity:0,transform:'translateY(8px) scale(.9)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:350,delay:700,fill:'both'});
  for(let i=0;i<count;i++){
    const p=el('span','hourly-gift-particle');p.append(createIcon(prize.icon));layer.append(p);
    const x=start.x-14,y=start.y-14,spread=count===1?0:(i-2.5)*18;
    animate(p,[{opacity:0,transform:`translate(${x}px,${y}px) scale(.5)`,offset:0},
      {opacity:1,transform:`translate(${x+spread}px,${y-48-(i%2)*14}px) scale(1)`,offset:.35},
      {opacity:1,transform:`translate(${x+spread}px,${y+18}px) scale(1)`,offset:.58},
      {opacity:0,transform:`translate(${end.x-14}px,${end.y-14}px) scale(.4)`,offset:1}],{duration:850,delay:700+i*24,fill:'both',easing:'ease-in-out'});
  }
  const finish=()=>{for(const a of animations)if(a.playState!=='idle')a.finish();};
  scope.listen(reduced,'change',event=>{if(event.matches)finish();});scope.listen(document,'visibilitychange',()=>{if(document.hidden)finish();});
  cue('openBox');scope.timeout(()=>cue(prize.icon==='coin'?'coinDrop':'reward'),730);
  try {await Promise.all(animations.map(a=>a.finished));if(owner.active){art.classList.add('is-open');if(prize.icon==='coin')cue('coinCollect');}}
  catch(error){if(error.name!=='AbortError')console.warn('Gift presentation interrupted',error);}
  finally {for(const a of animations)a.cancel();scope.dispose();}
}
async function presentGiftOnMap(reward,owner) {
  const scope=createGameShellLifecycle(),release=owner.own(()=>scope.dispose());scope.own(()=>release.forget());
  const floating=el('div','hourly-gift-reveal'),art=createAdventureActionArt('gift'),result=el('div','hourly-gift__result');
  floating.style.left=`${innerWidth/2}px`;floating.style.top=`${Math.max(70,Math.min(innerHeight*.35,innerHeight-190))}px`;
  const prize=describe(reward);result.setAttribute('role','status');result.append(createIcon(prize.icon),el('strong','',`Đã nhận ${prize.label}`));floating.append(art,result);document.body.append(floating);scope.own(()=>floating.remove(),'node');
  try {
    await revealGift(art,result,prize,scope);
    if(scope.active)await new Promise(resolve=>{const cancel=scope.own(resolve);scope.timeout(()=>{cancel.forget();resolve();},1000);});
  } finally {scope.dispose();}
}
export function openHourlyGift(owner) {
  const scope=createGameShellLifecycle(),identity=getAccountService()?.getIdentity();
  const identityMatches=()=>getAccountService()?.getIdentity()?.uid===identity?.uid&&getAccountService()?.getIdentity()?.profileId===identity?.profileId;
  const current=()=>scope.active&&identityMatches();
  const content=el('div','hourly-gift'),hero=el('div','hourly-gift__hero'),art=createAdventureActionArt('gift');hero.append(art);
  const claim=el('button','app-button app-button--primary','Đang kiểm tra…');claim.type='button';claim.disabled=true;
  content.append(hero,claim);
  const modal=openAppModal({id:'hourly-gift-modal',title:'Quà tặng bất ngờ',icon:'celebrate',content,owner,alignment:'center',keepBanner:true,onDestroy:()=>scope.dispose()});
  modal.panel.classList.add('hourly-gift-dialog');
  let ready=false,busy=false,failed=false;
  function tick(){if(!current()||busy||failed||!ready)return;claim.disabled=hourlyGiftRemaining()>0;claim.textContent='Mở quà';}
  async function run(command){
    if(busy||!current())return;busy=true;failed=false;claim.disabled=true;claim.textContent='Đang kiểm tra…';
    try {
      const response=await requestLiveops(command);if(!current())return;
      publishHourlyGiftView(response);ready=true;refreshAppWallet();
      const reward=response.hourlyGiftResult;
      if(reward){
        modal.close();await modal.whenClosed;
        if(owner.active&&identityMatches())await presentGiftOnMap(reward,owner);
      }
    } catch(error){if(current()){failed=true;claim.textContent='Thử lại';claim.disabled=false;showAppToast(error.code==='rewards/gift-cooldown'?'Quà chưa sẵn sàng. Hãy thử lại sau.':'Chưa kết nối được. Hãy đăng nhập và thử lại.');}}
    finally {busy=false;if(current())tick();}
  }
  scope.listen(claim,'click',()=>{if(failed)void run({type:'status'});else if(ready&&hourlyGiftRemaining()<=0)void run({type:'claimHourlyGift'});});
  scope.listen(window,'online',()=>void run({type:'status'}));scope.interval(tick,1000);
  void run({type:'status'});return modal;
}
