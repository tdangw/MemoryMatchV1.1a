import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { playOwnedRewardCue } from '../sound.js';
import { WHEEL_ANGLE } from './wheelRewards.js';

export const WHEEL_SPIN_DURATION = 2400;
const ease = t => {
  const u=1-t;
  return {x:3*u*u*t*.14+3*u*t*t*.2+t*t*t,y:3*u*u*t*.65+3*u*t*t+t*t*t};
};
// Invert the rotor's easing once per crossing, never in a frame callback.
function crossingTime(progress){
  let low=0,high=1;
  for(let i=0;i<16;i++){const middle=(low+high)/2;if(ease(middle).y<progress)low=middle;else high=middle;}
  return ease((low+high)/2).x;
}
export function wheelPointerFrames(angle){
  const frames=[{offset:0,transform:'rotate(0deg)'}];
  const times=[];
  for(let degrees=WHEEL_ANGLE/2;degrees<angle;degrees+=WHEEL_ANGLE)times.push(crossingTime(degrees/angle));
  for(let i=0;i<times.length;i++){
    const start=times[i],next=times[i+1]??1,end=start+Math.min(105/WHEEL_SPIN_DURATION,(next-start)*.9);
    frames.push({offset:start,transform:'rotate(0deg)'},{offset:start+(end-start)*.22,transform:'rotate(-38deg)'},{offset:start+(end-start)*.72,transform:'rotate(8deg)'},{offset:end,transform:'rotate(0deg)'});
  }
  frames.push({offset:1,transform:'rotate(0deg)'});return frames;
}
/** One spin owns its ticker and audio; settling/cancelling the rotor stops both. */
export function startWheelMotion({rotor,pointer,angle,owner,settings}){
  const scope=createGameShellLifecycle(),release=owner.own(()=>scope.dispose());scope.own(()=>release.forget());
  const animation=owner.animation(rotor.animate([{transform:'rotate(0deg)'},{transform:`rotate(${angle}deg)`}],
    {duration:WHEEL_SPIN_DURATION,easing:'cubic-bezier(.14,.65,.2,1)',fill:'forwards'}));
  scope.animation(pointer.animate(wheelPointerFrames(angle),{duration:WHEEL_SPIN_DURATION,easing:'linear'}));
  playOwnedRewardCue('wheelSpin',scope,settings);
  void animation.finished.then(()=>scope.dispose(),()=>scope.dispose());
  return animation;
}
