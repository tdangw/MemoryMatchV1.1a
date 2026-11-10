import { gameState } from '../gameState.js';
import { getAccountService } from '../accountService.js';
import { HOURLY_GIFT_MS } from './hourlyGift.js';
let confirmed = null;
const listeners = new Set();
const identity = () => { const account=getAccountService(),value=account?.getIdentity()||account?.getLocalIdentity();return `${value?.uid||''}:${value?.profileId||''}`; };
export function publishHourlyGiftView(response) {
  confirmed={identity:identity(),claimedAt:response.state.hourlyGift?.claimedAt??null,serverNow:response.serverNow,observedAt:performance.now()};
  for(const listener of listeners)listener();
}
export function hourlyGiftRemaining() {
  const trusted=confirmed?.identity===identity()?confirmed:null;
  const claimedAt=trusted?trusted.claimedAt:gameState.appearance.spark?.state?.hourlyGift?.claimedAt;
  if(claimedAt===null||claimedAt===undefined)return 0;
  const now=trusted?trusted.serverNow+performance.now()-trusted.observedAt:Date.now();
  return Math.max(0,claimedAt+HOURLY_GIFT_MS-now);
}
export function mountHourlyGiftCountdown(control,owner,isBlocked=()=>false) {
  const text=document.createElement('span');text.className='adventure-gift-countdown';text.setAttribute('aria-hidden','true');
  const dot=document.createElement('span');dot.className='adventure-gift-ready-dot';dot.setAttribute('aria-hidden','true');
  control.append(text,dot);control.classList.add('adventure-map-shortcut--gift');
  const update=()=>{
    const seconds=Math.ceil(hourlyGiftRemaining()/1000);
    const label=seconds?`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`:'';
    text.textContent=label;dot.hidden=seconds>0;
    control.dataset.giftCooling=String(seconds>0);
    control.disabled=isBlocked()||seconds>0;
    control.title=seconds?`Quà tặng · ${label}`:'Quà tặng';
  };
  listeners.add(update);owner.own(()=>listeners.delete(update));owner.interval(update,1000);update();
  return update;
}
