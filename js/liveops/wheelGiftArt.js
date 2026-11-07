import { isAppActive } from '../appVisibility.js';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { createIcon } from '../icons.js';
import { uiSkinAssetUrl } from '../uiSkinRegistry.js';
import { WHEEL_SLOTS } from './wheelRewards.js';
import '../../styles/wheel-gifts.css';

export const WHEEL_BOX_LABELS=Object.freeze({coins:WHEEL_SLOTS[2].label,...Object.fromEntries(WHEEL_SLOTS.filter(slot=>slot.box).map(slot=>[slot.box,slot.label]))});
const artKinds=Object.freeze({coins:{tier:'C',icon:'coin'},mystery:{tier:'S',icon:'shuffle'},cosmetic:{tier:'A',icon:'profile'},flip:{tier:'B',icon:'cards'},theme:{tier:'S',icon:'images'},path:{tier:'B',icon:'map'},exit:{tier:'A',icon:'exit'},support:{tier:'C',icon:'wand'}});
function chestImage(box,state){
  const skin=document.documentElement.dataset.uiSkin,kind=artKinds[box];
  const id=`chest-${skin==='woodland'?kind.tier:kind.tier.toLowerCase()}-${state}`;
  return uiSkinAssetUrl(skin,id)||uiSkinAssetUrl('woodland',`chest-${kind.tier}-${state}`);
}
function refreshArt(art){
  const box=art.dataset.wheelBox;
  for(const state of ['closed','open'])art.querySelector(`.wheel-gift__image--${state}`).src=chestImage(box,state);
  art.dataset.skin=document.documentElement.dataset.uiSkin||'default';
}
/** Reuse the game's paired chest images. The category badge distinguishes shared tiers. */
export function createWheelGiftArt(box){
  const kind=artKinds[box];if(!kind)throw new TypeError(`Unknown wheel chest: ${box}`);
  const art=document.createElement('span');art.className='wheel-gift-art';art.dataset.wheelBox=box;art.setAttribute('aria-hidden','true');
  for(const state of ['closed','open']){const image=document.createElement('img');image.className=`wheel-gift__image wheel-gift__image--${state}`;image.alt='';image.decoding='async';image.draggable=false;art.append(image);}
  const badge=document.createElement('span');badge.className='wheel-gift__badge';badge.append(createIcon(kind.icon));art.append(badge);refreshArt(art);return art;
}
export function refreshWheelGiftArt(root){for(const art of root.querySelectorAll('.wheel-gift-art'))if(art.dataset.skin!==(document.documentElement.dataset.uiSkin||'default'))refreshArt(art);}

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
