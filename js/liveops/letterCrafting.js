import { openAppModal } from '../modal.js';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { createIcon } from '../icons.js';
import { LETTER_ALPHABET } from './config.js';
import { createRewardFeedback } from './rewardFeedback.js';
import '../../styles/letter-crafting.css';
const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
export function letterArtwork(letter){
  const index=LETTER_ALPHABET.indexOf(letter);if(index<0)throw new TypeError('Unknown letter artwork');
  const sprite=node('span','liveops__letter-art');sprite.setAttribute('aria-hidden','true');
  sprite.style.backgroundPosition=`${index%5*25}% ${Math.floor(index/5)*100/3}%`;return sprite;
}
export function openLetterActions({letter,count,owner,current,onFuse,onSell}){
  const content=node('div','letter-actions'),art=letterArtwork(letter);art.classList.add('letter-actions__art');
  content.append(art,node('p','',`Bạn có ${count} chữ ${letter}`));
  const actions=node('div','letter-actions__buttons');
  const modal=openAppModal({id:'letter-action-modal',title:`Chữ ${letter}`,content,owner,alignment:'center',keepBanner:true});
  for(const [text,callback]of [['Ghép',onFuse],['Bán',onSell]]){
    const button=node('button','app-button',text);button.type='button';button.disabled=count<1;
    button.onclick=async()=>{button.disabled=true;modal.close();await modal.whenClosed;if(owner.active&&current())callback();};actions.append(button);
  }
  content.append(actions);return modal;
}
const multiset=letters=>letters.reduce((counts,letter)=>{counts[letter]=(counts[letter]||0)+1;return counts;},{});
const sameIngredients=(last,selected)=>{
  const ingredients=last.ingredients || [last.letter,last.letter,last.letter];
  return [...ingredients].sort().join('')===[...selected].sort().join('');
};
const FORGE_MOTION={absorb:520,stagger:60,flash:480};
/** Local selection never changes inventory; only the existing transaction can consume it. */
export function openLetterFusion({initialLetter,owner,current,getContext,execute,refresh}){
  const scope=createGameShellLifecycle(),content=node('div','letter-forge');
  const description=node('p','letter-forge__intro','Ghép 3 chữ bất kỳ, ưu tiên chữ chưa có.');
  const stage=node('div','letter-forge__stage');
  const action=node('button','letter-forge__result');action.type='button';
  const aura=node('span','letter-forge__aura'),face=node('span','letter-forge__face');aura.setAttribute('aria-hidden','true');action.append(aura,face);stage.append(action);
  const effects=node('div','letter-forge__effects');effects.setAttribute('aria-hidden','true');stage.append(effects);
  const slots=Array.from({length:3},(_,i)=>{const b=node('button',`letter-forge__slot letter-forge__slot--${i+1}`);b.type='button';stage.append(b);return b;});
  const palette=node('div','letter-forge__palette');palette.setAttribute('aria-label','Chọn nguyên liệu');
  const status=node('p','letter-forge__status');status.setAttribute('role','status');
  content.append(description,stage,palette,status);
  const modal=openAppModal({id:'letter-fusion-modal',title:'Ghép chữ',content,owner,alignment:'center',keepBanner:true,onDestroy:()=>scope.dispose()});
  modal.panel.classList.add('letter-forge-dialog');
  const feedback=createRewardFeedback({owner:scope,host:modal.panel});
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const finishLocalMotion=()=>{for(const animation of stage.getAnimations({subtree:true}))if(animation.playState!=='idle')animation.finish();};
  scope.listen(motion,'change',event=>{if(event.matches)finishLocalMotion();});
  scope.listen(document,'visibilitychange',()=>{if(document.hidden)finishLocalMotion();});
  let selected=(getContext().counts[initialLetter]||0)>0?[initialLetter]:[],phase='select',received=null,error='',requestSequence=null;
  const active=()=>scope.active&&current();
  const valid=()=>{const context=getContext(),needed=multiset(selected);return selected.length===3&&Object.entries(needed).every(([letter,count])=>(context.counts[letter]||0)>=count);};
  function render(){
    if(!active())return;const context=getContext(),needed=multiset(selected),locked=phase!=='select';
    for(const [i,slot]of slots.entries()){
      slot.replaceChildren();slot.disabled=locked||!selected[i];slot.dataset.filled=String(Boolean(selected[i]));
      if(selected[i]){slot.append(letterArtwork(selected[i]));slot.setAttribute('aria-label',`Bỏ chữ ${selected[i]} ở ô ${i+1}`);}
      else{slot.append(createIcon('plus'));slot.setAttribute('aria-label',`Ô nguyên liệu ${i+1}`);}
    }
    face.replaceChildren();
    if(phase==='result')face.append(letterArtwork(received));else face.append(createIcon('shuffle'),node('span','',phase==='recover'?'Thử lại':phase==='submitting'||phase==='revealing'?'Đang ghép…':'Ghép'));
    stage.dataset.phase=phase;palette.replaceChildren();
    for(const letter of LETTER_ALPHABET){
      const available=Math.max(0,(context.counts[letter]||0)-(needed[letter]||0));
      const tile=node('button','letter-forge__tile');tile.type='button';tile.disabled=(locked&&phase!=='result')||selected.length>=3||available<1;
      tile.setAttribute('aria-label',`Chọn chữ ${letter}, còn ${available}`);tile.dataset.empty=String(available<1);tile.append(letterArtwork(letter),node('span','letter-forge__count',`×${available}`));
      tile.onclick=()=>{if(!active())return;if(phase==='result'){selected=[];received=null;phase='select';requestSequence=null;feedback.clear();}if(phase==='select'&&selected.length<3){selected.push(letter);error='';render();}};palette.append(tile);
    }
    description.textContent=phase==='result'?`Đã ghép được chữ ${received}`:'Ghép 3 chữ bất kỳ, ưu tiên chữ chưa có.';
    status.textContent=error|| (phase==='result'?'Chọn chữ trong kho để ghép.':phase==='select'?(context.canUse?`Đã chọn ${selected.length}/3`:'Kết nối để ghép chữ.'):'');
    action.setAttribute('aria-label',phase==='submitting'||phase==='revealing'?'Đang ghép…':phase==='result'?`Đã nhận chữ ${received}`:phase==='recover'?'Thử lại':'Ghép');
    action.disabled=phase==='submitting'||phase==='revealing'||phase==='result'||(phase==='select'&&(!valid()||!context.canUse));
    action.dataset.ready=String(phase==='select'&&valid()&&context.canUse);
  }
  slots.forEach((slot,i)=>scope.listen(slot,'click',()=>{if(active()&&phase==='select'){selected.splice(i,1);error='';render();}}));
  async function resolve(response){
    const last=response.state?.letters.last;
    if(!last||last.kind!=='fuse'||last.sequence<=requestSequence||!sameIngredients(last,selected))return false;
    received=last.received;phase='revealing';error='';render();
    if(!motion.matches&&!document.hidden){
      const origin=stage.getBoundingClientRect(),center=action.getBoundingClientRect(),rects=slots.map(slot=>slot.getBoundingClientRect());
      const flights=rects.map((r,i)=>{const ghost=letterArtwork(selected[i]);ghost.classList.add('letter-forge__ingredient');ghost.style.cssText+=`;left:${r.left-origin.left}px;top:${r.top-origin.top}px;width:${r.width}px;height:${r.height}px`;effects.append(ghost);
        const animation=scope.animation(ghost.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${center.left+center.width/2-r.left-r.width/2}px,${center.top+center.height/2-r.top-r.height/2}px) scale(.12)`,opacity:0}],{duration:FORGE_MOTION.absorb,delay:i*FORGE_MOTION.stagger,easing:'cubic-bezier(.55,0,.85,.6)',fill:'both'}));
        return animation.finished.then(()=>true,()=>false);
      });
      await Promise.all(flights);effects.replaceChildren();if(!active())return true;
    }
    selected=[];phase='result';render();
    const r=action.getBoundingClientRect();feedback.present(response.committedRewards,{x:r.left+r.width/2,y:r.top+r.height/2});
    if(!motion.matches&&!document.hidden){scope.animation(face.animate([{transform:'scale(.25)',opacity:0},{transform:'scale(1.12)',opacity:1},{transform:'scale(1)',opacity:1}],{duration:FORGE_MOTION.flash,easing:'ease-out'}));scope.animation(aura.animate([{transform:'scale(.8)',opacity:0},{transform:'scale(1.25)',opacity:.7,offset:.35},{transform:'scale(1.5)',opacity:0}],{duration:FORGE_MOTION.flash}));}
    return true;
  }
  scope.listen(action,'click',async()=>{
    if(!active()||['submitting','revealing','result'].includes(phase))return;
    const recovering=phase==='recover';if(!recovering&&(!valid()||!getContext().canUse))return;
    if(!recovering)requestSequence=getContext().sequence;
    phase='submitting';error='';render();
    if(!motion.matches&&!document.hidden)scope.animation(aura.animate([{opacity:0,transform:'scale(.9)'},{opacity:.6,transform:'scale(1.15)'},{opacity:0,transform:'scale(1.3)'}],{duration:FORGE_MOTION.flash,easing:'ease-out'}));
    try{
      const response=await (recovering?refresh():execute([...selected]));if(!active())return;
      if(!response||response.error)throw new Error(response?.error||'Chưa thể ghép chữ. Hãy thử lại.');
      if(await resolve(response))return;
      phase='select';error=recovering?'Kho chữ đã cập nhật. Kiểm tra nguyên liệu rồi ghép lại.':'Chưa thể ghép chữ. Hãy thử lại.';render();
    }catch(cause){if(active()){phase='recover';error=cause.message||'Chưa kết nối được. Hãy thử lại.';render();}}
  });
  render();return modal;
}
