import { isAppActive } from '../appVisibility.js';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { createChestArt } from './chestArt.js';
import { WHEEL_SLOTS } from './wheelRewards.js';
import { CHEST_TYPES } from './chestConfig.js';
import '../../styles/wheel-gifts.css';

export const WHEEL_BOX_LABELS=Object.freeze({coins:WHEEL_SLOTS[2].label,...Object.fromEntries(WHEEL_SLOTS.filter(slot=>slot.box).map(slot=>[slot.box,slot.label]))});
const artKinds=new Set([...CHEST_TYPES,'coins','mystery','cosmetic','flip','theme','path','exit','support']);
/** Each reward category has its own paired image, shared across all skins. */
export function createWheelGiftArt(box){
  if(!artKinds.has(box))throw new TypeError(`Unknown wheel chest: ${box}`);
  const art=document.createElement('span');art.className='wheel-gift-art';art.dataset.wheelBox=box;art.setAttribute('aria-hidden','true');
  for(const state of ['closed','open']){const image=createChestArt(box,state);image.className=`wheel-gift__image wheel-gift__image--${state}`;art.append(image);}
  art.dataset.skin=document.documentElement.dataset.uiSkin||'default';return art;
}
// Artwork is skin-independent. Preserve its nodes, animation targets and fallback
// instead of reassigning a failed URL when the surrounding skin changes.
export function refreshWheelGiftArt(root){const skin=document.documentElement.dataset.uiSkin||'default';for(const art of root.querySelectorAll('.wheel-gift-art'))if(art.dataset.skin!==skin)art.dataset.skin=skin;}

/** One finite image transition; the server grant is already committed. */
export async function presentWheelGift(box,{owner,host,title=WHEEL_BOX_LABELS[box]}){
  if(!owner.active||!host.isConnected)return null;
  const scope=createGameShellLifecycle(),release=owner.own(()=>scope.dispose());scope.own(()=>release.forget());
  const card=document.createElement('div');card.className='wheel-gift-opening';
  const art=createWheelGiftArt(box),label=document.createElement('strong');label.textContent=title;card.append(art,label);host.append(card);scope.own(()=>card.remove(),'node');
  const rect=card.getBoundingClientRect(),origin={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  try{
    if(!reduced.matches&&isAppActive()){
      const animations=[scope.animation(art.animate([{transform:'scale(.7)',opacity:0},{transform:'scale(1.08)',opacity:1,offset:.5},{transform:'scale(1)',opacity:1}],{duration:460})),
        scope.animation(art.querySelector('.wheel-gift__image--closed').animate([{opacity:1},{opacity:0}],{duration:220,delay:300,fill:'forwards'})),
        scope.animation(art.querySelector('.wheel-gift__image--open').animate([{opacity:0,transform:'scale(.9)'},{opacity:1,transform:'scale(1)'}],{duration:260,delay:300,fill:'both'}))];
      const finish=()=>{for(const animation of animations)if(animation.playState!=='idle')animation.finish();};
      scope.listen(reduced,'change',event=>{if(event.matches)finish();});scope.listen(document,'appvisibilitychange',()=>{if(!isAppActive())finish();});
      await Promise.all(animations.map(animation=>animation.finished));
    }else if(isAppActive()){
      art.dataset.open='true';await new Promise(resolve=>{const cancel=scope.own(resolve);scope.timeout(()=>{cancel.forget();resolve();},350);});
    }
    return owner.active?origin:null;
  }catch(error){if(error.name!=='AbortError')throw error;return null;}
  finally{scope.dispose();}
}
