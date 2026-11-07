import { isAppActive } from './appVisibility.js';
import { playOwnedRewardCue } from './sound.js';
import { gameState } from './gameState.js';
const cues=Object.freeze({receive:'reward',drop:'coinDrop',collect:'coinCollect'});
const recent=new WeakMap();
/** One sound per phase for a simultaneous batch; the page/round owns its tail. */
export function playRewardPhase(phase,owner){
  if(!Object.hasOwn(cues,phase))throw new TypeError(`Unknown reward phase: ${phase}`);
  if(!owner?.active||!isAppActive()||!gameState.settings.sound)return;
  let times=recent.get(owner);if(!times){times={};recent.set(owner,times);}
  const now=performance.now();if(times[phase]!==undefined&&now-times[phase]<100)return;
  times[phase]=now;playOwnedRewardCue(cues[phase],owner,gameState.settings);
}
