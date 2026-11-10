import { gameState } from '../gameState.js';
import { subscribeToLocalCommit } from '../persistence.js';
import { cosmeticPortrait } from './profilePortrait.js';
import { openPlayerProfile } from '../appNavigation.js';
import { showAppToast } from '../modal.js';
import { clearTooltip } from '../tooltips.js';
import '../../styles/player-header-portrait.css';

/** The title owner mounts one portrait and releases its only subscription. */
export function mountPlayerHeaderPortrait(title,scope) {
  const host=document.createElement('button');host.type='button';host.className='player-header-portrait';
  host.setAttribute('aria-label','Mở hồ sơ');host.setAttribute('aria-haspopup','dialog');
  title.classList.add('player-header-title');title.prepend(host);let fingerprint=null;
  function render(appearance){
    const selection=appearance.profileCosmetics,levels=appearance.spark?.state?.cosmeticProgress?.levels || {};
    const next=JSON.stringify(['avatar','frame','badge'].map(slot=>[selection?.[slot]||null,levels[selection?.[slot]]||1]));
    if(!scope.active||next===fingerprint)return;
    fingerprint=next;host.replaceChildren(cosmeticPortrait(selection,{label:'Ngoại hình đang trang bị',size:128,levels}));
  }
  render(gameState.appearance);
  let opening=false,profile=null;
  scope.listen(host,'click',async()=>{
    if(opening||profile?.panel.isConnected||(scope.startup&&scope.startup.status!=='ready'))return;
    opening=true;
    const resume=scope.pauseForProfile?.();
    const finished=()=>{profile=null;resume?.();clearTooltip();};
    try{profile=await openPlayerProfile({owner:scope});if(profile)profile.whenClosed.then(finished,finished);else finished();}
    catch(error){resume?.();if(scope.active)showAppToast('Chưa mở được hồ sơ. Hãy thử lại.');console.warn('Header profile unavailable',error.name);}
    finally{opening=false;}
  });
  scope.own(subscribeToLocalCommit(({patch})=>{
    if(patch.appearance)render(patch.appearance);
  }),'listener');
  scope.own(()=>{host.remove();title.classList.remove('player-header-title');},'node');
}
