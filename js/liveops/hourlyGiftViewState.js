import { gameState } from '../gameState.js';
import { getAccountService } from '../accountService.js';
import { HOURLY_GIFT_MS } from './hourlyGift.js';
let confirmed = null;
const listeners = new Set();
const identity = () => { const value=getAccountService()?.getIdentity();return `${value?.uid||''}:${value?.profileId||''}`; };
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
export function mountHourlyGiftCountdown(control,owner) {
  const text=document.createElement('span');text.className='adventure-gift-countdown';text.setAttribute('aria-hidden','true');control.append(text);
  control.classList.add('adventure-map-shortcut--gift');
  const update=()=>{const seconds=Math.ceil(hourlyGiftRemaining()/1000),label=seconds?`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`:'Sẵn sàng';text.textContent=label;control.title=`Quà tặng · ${label}`;};
  listeners.add(update);owner.own(()=>listeners.delete(update));owner.interval(update,1000);update();
}
