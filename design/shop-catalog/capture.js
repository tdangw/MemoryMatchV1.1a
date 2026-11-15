import { renderConnectionV2, clearConnectionV2 } from '/js/effects/connectionEngine.js';
import { getEffectV2Path } from '/js/effects/effectCatalog.js';
import { clearCanvasExit } from '/js/effects/exitEngine.js';
import { presentLinkExit } from '/js/linkConnect/linkEffectAdapter.js';
import { CARD_BACKS, FLIP_EFFECTS } from '/js/appearance.js';
import { LINK_PATH_EFFECTS, LINK_EXIT_EFFECTS } from '/js/linkConnect/linkEffects.js';
import { THEMES, getThemeCards, isThemePlayable } from '/js/themeCatalog.js';
import { decorateAchievementFlip } from '/js/effects/achievementFlip.js';
import { applyLinkTimingStyles } from '/js/linkConnect/linkShell.js';
import { LINK_CONNECT_TIMING } from '/js/linkConnect/linkConfig.js';

let stage, surface, releaseFlip;
export function installCaptureStage() {
  const css=document.createElement('style');css.textContent=`html,body{background:transparent!important}body>*{visibility:hidden!important}#catalog-capture,#catalog-capture *{visibility:visible!important}#catalog-capture{display:block;position:fixed;left:0;top:0;width:256px;height:256px;overflow:hidden;z-index:2147483647;background:transparent;pointer-events:none}#catalog-capture .sample-card{position:absolute;width:92px;height:124px;min-width:0;min-height:0;margin:0;border-radius:12px;padding:3px;background:#133641;border:2px solid #ddbd70;box-sizing:border-box;overflow:visible}#catalog-capture .sample-card img{display:block;width:100%;height:100%;object-fit:contain;border-radius:8px}#catalog-capture .sample-back{position:absolute;left:62px;top:36px;width:132px;height:184px;border:2px solid #ddbd70;border-radius:14px}#catalog-capture .theme-sample{position:absolute;width:120px;height:162px;border-radius:12px;background:#173942;border:2px solid #ddbd70;box-sizing:border-box;padding:4px;object-fit:contain}#catalog-capture .link-path-overlay{border-radius:0}`;
  document.head.append(css);stage=document.createElement('div');stage.id='catalog-capture';stage.className='link-connect-game';document.body.append(stage);applyLinkTimingStyles(stage,LINK_CONNECT_TIMING);
}
export function captureEntries(){
  return [
    ...LINK_PATH_EFFECTS.map(item=>({kind:'path',id:item.id,title:item.title,source:'connectionEngine',frameMs:item.id==='bullet'?90:['electric','fire','meteor','link-effect-meteor-route','triple-effect-triad-converge'].includes(item.id)?180:400})),
    ...LINK_EXIT_EFFECTS.map(item=>({kind:'exit',id:item.id,title:item.title,source:'linkEffectAdapter/exitEngine/CSS',frameMs:item.achievementOnly?100:420})),
    ...FLIP_EFFECTS.map(item=>({kind:'flip',id:item.id,title:item.title,source:'board.css/achievementFlip',frameMs:120})),
    ...CARD_BACKS.map(item=>({kind:'back',id:item.id,title:item.title,source:'gameplay-effects.css',frameMs:0})),
    ...THEMES.filter(isThemePlayable).map(item=>({kind:'theme',id:item.id,title:item.title,source:'themeCatalog/getThemeCards',frameMs:0})),
  ];
}
async function sampleImage(src,className,styles){const img=new Image();img.className=className;img.src=src;Object.assign(img.style,styles);stage.append(img);await img.decode();return img;}
export async function renderCapture(entry){
  if(surface){clearConnectionV2(surface);surface=null;}clearCanvasExit();if(releaseFlip){releaseFlip();releaseFlip=null;}stage.replaceChildren();
  const sample=getThemeCards('default',3,{random:()=>0.42});
  if(entry.kind==='path'){
    surface=document.createElementNS('http://www.w3.org/2000/svg','svg');stage.append(surface);
    renderConnectionV2({surface,points:[{x:12,y:72},{x:48,y:28},{x:88,y:68}],effect:getEffectV2Path(entry.id),seed:12345});
  }else if(entry.kind==='theme'){
    const cards=getThemeCards(entry.id,3,{random:()=>0.42});
    await Promise.all(cards.map((card,i)=>sampleImage(card.src,'theme-sample',{left:`${18+i*52}px`,top:`${56-i*10}px`,transform:`rotate(${(i-1)*12}deg)`})));
  }else if(entry.kind==='back'){
    const item=CARD_BACKS.find(x=>x.id===entry.id),back=document.createElement('div');back.className=`sample-back ${item.previewClass}`;stage.append(back);
  }else{
    const cards=[];
    for(let i=0;i<(entry.kind==='exit'?2:1);i++){
      const card=document.createElement('div');card.className=`sample-card ${entry.kind==='exit'?'link-tile':'tile'}`;Object.assign(card.style,{left:`${entry.kind==='exit'?26+i*112:82}px`,top:'66px'});stage.append(card);
      const img=new Image();img.src=sample[i].src;card.append(img);await img.decode();cards.push(card);
    }
    if(entry.kind==='exit')presentLinkExit({frame:stage,tiles:cards,appearance:{linkExitEffect:entry.id,linkPathEffect:'default'}});
    else{const item=FLIP_EFFECTS.find(x=>x.id===entry.id),img=cards[0].firstElementChild;img.classList.add(item.animationClass);releaseFlip=decorateAchievementFlip(img,item.animationClass);}
  }
}
export function freezeCapture(ms){
  for(const animation of stage.getAnimations({subtree:true})){animation.pause();animation.currentTime=ms;}
  if(surface){surface.pauseAnimations();surface.setCurrentTime(ms/1000);}
}
export function disposeCapture(){if(surface)clearConnectionV2(surface);clearCanvasExit();if(releaseFlip)releaseFlip();stage.remove();}
