import { playRewardPhase } from '../rewardAudio.js';
import { LETTER_ALPHABET } from './config.js';
import { playLootDrop } from '../lootEffects.js';
import { getEffectRegistry } from '../gameShell/gameShellEffects.js';
import { clearShellTimeout, getActiveGameScope } from '../gameShell/gameShellLifecycle.js';
import '../../styles/letter-drop-feedback.css';

export const LETTER_FEEDBACK = Object.freeze({ duration:2500, reducedDuration:1100, maxVisible:5, dropSize:40 });
const owners=new WeakMap();
const positions=[0,-1,1,-2,2];

/** Persistence calls this before controllers replace their matched board. */
export function prepareLetterDropFeedback(anchor,scope) {
  return outcome=>{
    if(!scope?.active || !anchor?.isConnected || !(outcome?.letter || outcome?.firefly || outcome?.ticket))return;
    // Misses do not read layout. One source measurement serves all three hits.
    const rect=anchor.getBoundingClientRect();
    const origin={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
    if(outcome.letter)showLetterDropFeedback(outcome.letter,origin,scope);
    if(outcome.firefly)showTicketDropFeedback(origin,scope,'collection-badge');
    if(outcome.ticket)showTicketDropFeedback(origin,scope);
  };
}

export function showLetterDropFeedback(letter,origin,scope) {
  const index=LETTER_ALPHABET.indexOf(letter);
  if(index<0 || !scope?.active || !Number.isFinite(origin?.x) || !Number.isFinite(origin?.y))return;
  let owner=owners.get(scope);
  if(!owner){
    const root=document.createElement('div');root.className='letter-drop-feedback';
    root.setAttribute('role','status');root.setAttribute('aria-live','polite');root.setAttribute('aria-atomic','false');
    document.body.append(root);
    owner={root,entries:[]};owners.set(scope,owner);
    scope.own(()=>{for(const entry of [...owner.entries])entry.dispose();root.remove();owners.delete(scope);},'node');
  }
  if(owner.entries.length>=LETTER_FEEDBACK.maxVisible)owner.entries[0].dispose();
  let release;
  const budget=getEffectRegistry(scope).track('item',()=>release(),{allowReducedMotion:true});
  if(!budget)return;
  const slot=positions.find(position=>!owner.entries.some(entry=>entry.slot===position));
  const node=document.createElement('div');node.className='letter-drop-feedback__entry';
  node.dataset.rewardKind='letter';
  node.style.setProperty('--letter-slot',slot);
  const sprite=document.createElement('span');sprite.className='letter-drop-feedback__sprite';sprite.setAttribute('aria-hidden','true');
  sprite.style.backgroundPosition=`${index%5*25}% ${Math.floor(index/5)*100/3}%`;
  const label=document.createElement('span');label.className='letter-drop-feedback__label';label.textContent=`Đã nhận chữ ${letter}`;
  node.append(sprite,label);owner.root.append(node);
  const entry={slot,dispose:null};let animation=null,labelAnimation=null,timer=null;
  release=scope.own(()=>{
    animation?.cancel();labelAnimation?.cancel();timer?.();node.remove();
    const at=owner.entries.indexOf(entry);if(at>=0)owner.entries.splice(at,1);
  },'node');
  entry.dispose=()=>budget.dispose();
  owner.entries.push(entry);
  playRewardPhase('receive',scope);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced){
    const handle=scope.timeout(entry.dispose,LETTER_FEEDBACK.reducedDuration);
    timer=()=>clearShellTimeout(handle);
    return;
  }
  playRewardPhase('drop',scope);
  const target=sprite.getBoundingClientRect();
  const dx=origin.x-(target.left+target.width/2),dy=origin.y-(target.top+target.height/2);
  const startScale=LETTER_FEEDBACK.dropSize/target.width;
  animation=sprite.animate([
    {transform:`translate(${dx}px,${dy}px) scale(${startScale})`,opacity:0,offset:0},
    {transform:`translate(${dx}px,${dy-24}px) scale(${startScale*1.14})`,opacity:1,offset:.12},
    {transform:'translate(0,0) scale(1)',opacity:1,offset:.30},
    {transform:'translate(0,0) scale(1.16)',opacity:1,offset:.44},
    {transform:'translate(0,0) scale(1.08)',opacity:1,offset:.62},
    {transform:'translate(0,0) scale(.85)',opacity:.9,offset:.82},
    {transform:'translate(0,0) scale(.35)',opacity:0,offset:1},
  ],{duration:LETTER_FEEDBACK.duration,easing:'ease-out',fill:'both'});
  labelAnimation=scope.animation(label.animate([{opacity:0,offset:0},{opacity:0,offset:.28},{opacity:1,offset:.36},{opacity:1,offset:.82},{opacity:0,offset:1}],
    {duration:LETTER_FEEDBACK.duration,fill:'both'}));
  animation.finished.then(()=>{playRewardPhase('collect',scope);entry.dispose();},entry.dispose);
}

export function showTicketDropFeedback(origin,scope,icon='ticket') {
  if(!scope?.active || getActiveGameScope()!==scope || !Number.isFinite(origin?.x) || !Number.isFinite(origin?.y))return;
  const source={getBoundingClientRect:()=>({left:origin.x-20,top:origin.y-20,width:40,height:40})};
  return playLootDrop(source,{icon,tier:'gold',preset:'linkItem',holdMs:450,
    target:document.querySelector('[data-dock-action="events"]')});
}
