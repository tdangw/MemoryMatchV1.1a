import { sounds } from '../sound.js';
import { gameState } from '../gameState.js';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';

/** At most four finite animations, no particles/loop; durability is already committed. */
export async function presentTreasureOpening(content, owner) {
  if (!owner.active) return false;
  const art = content.querySelector('.treasure-hero .treasure-art');
  const rewards = content.querySelector('.treasure-rewards');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || document.hidden) { art.classList.add('is-open'); return true; }
  const scope = createGameShellLifecycle();
  const release = owner.own(() => scope.dispose(), 'cleanup');
  scope.own(() => release.forget());
  const animations = [
    art.animate([{transform:'scale(1)'},{transform:'scale(.96)'},{transform:'scale(1)'}],{duration:120}),
    art.querySelector('.treasure-art__lid').animate([{transform:'translateY(0) rotate(0deg)'},{transform:'translateY(-15px) rotate(-13deg)'}],{duration:330,delay:120,fill:'forwards',easing:'cubic-bezier(.2,.8,.2,1)'}),
    art.querySelector('.treasure-art__glow').animate([{opacity:0},{opacity:1}],{duration:330,delay:120,fill:'forwards'}),
    rewards.animate([{opacity:0,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:400,delay:450,fill:'both',easing:'ease-out'}),
  ];
  animations.forEach(animation => scope.animation(animation));
  const finish = () => { for (const animation of animations) if (animation.playState !== 'idle') animation.finish(); };
  scope.listen(reduced,'change',event => { if(event.matches) finish(); });
  scope.listen(document,'visibilitychange',() => { if(document.hidden) finish(); });
  if (gameState.settings.sound && !document.hidden) {
    const audio = sounds.bonus.cloneNode(true);
    audio.volume = Math.min(1, Math.max(0, Number(gameState.settings.soundVolume) || 0)); audio.loop=false;
    const stop = scope.own(() => { audio.pause(); audio.removeAttribute('src'); },'cleanup');
    scope.listen(audio,'ended',stop,{once:true});scope.listen(audio,'error',stop,{once:true});
    scope.listen(document,'visibilitychange',() => { if(document.hidden) stop(); });
    void audio.play().catch(stop);
  }
  try {
    await Promise.all(animations.map(animation => animation.finished));
    if (!owner.active || !scope.active) return false;
    art.classList.add('is-open'); return true;
  } catch(error) {
    if (error.name !== 'AbortError') throw error;
    return false;
  } finally { for (const animation of animations) animation.cancel(); scope.dispose(); }
}
