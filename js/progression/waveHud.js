import '../../styles/progression.css';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';

const announcements = new WeakMap();
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const WAVE_PRESENTATION_TIMING = Object.freeze({
  exit: 140, noticeEnter: 260, noticeVisible: 1800, noticeExit: 220,
  boardEnter: 520, arrival: 700,
});

/** Fade the cleared board after the advance checkpoint is durable. Cancellation settles false. */
export async function presentWaveExit(refs, scope) {
  if (!scope?.active) return false;
  if (reducedMotion()) return true;
  const animation = refs.board.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.985)'}],
    {duration:WAVE_PRESENTATION_TIMING.exit,easing:'ease-in',fill:'forwards'});
  scope.animation(animation);
  try { await animation.finished; return scope.active; }
  catch (error) { if (error.name !== 'AbortError') throw error; return false; }
  finally { animation.cancel(); }
}

/** One board entrance and a bounded light sweep; never insert effect nodes into a game's tile tree. */
function presentWaveArrival(refs, owner) {
  const bounds = refs.board.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const scope = createGameShellLifecycle();
  const releaseOwner = owner.own(() => scope.dispose(), 'cleanup');
  scope.own(() => releaseOwner.forget());
  const scene = document.createElement('div'); scene.className = 'progression-wave-arrival';
  scene.setAttribute('aria-hidden', 'true');
  Object.assign(scene.style, { left:`${bounds.left}px`, top:`${bounds.top}px`, width:`${bounds.width}px`, height:`${bounds.height}px` });
  const light = document.createElement('div'); light.className = 'progression-wave-arrival__light';
  scene.append(light); document.body.append(scene);
  scope.own(() => scene.remove(), 'node');
  const animations = [
    refs.board.animate([
      {opacity:0,transform:'translateY(14px) scale(.96)'},
      {opacity:1,transform:'translateY(-2px) scale(1.006)',offset:.76},
      {opacity:1,transform:'translateY(0) scale(1)'},
    ], {duration:WAVE_PRESENTATION_TIMING.boardEnter,easing:'cubic-bezier(.2,.75,.25,1)'}),
    scene.animate([{opacity:0},{opacity:.65,offset:.28},{opacity:0}], {duration:WAVE_PRESENTATION_TIMING.arrival,easing:'ease-out'}),
    light.animate([{transform:'translateX(-120%)'},{transform:'translateX(340%)'}], {duration:WAVE_PRESENTATION_TIMING.arrival,easing:'ease-in-out'}),
  ];
  animations.forEach(animation => scope.animation(animation));
  scope.own(() => { for (const animation of animations) animation.cancel(); });
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  scope.listen(motion, 'change', event => { if (event.matches) scope.dispose(); });
  scope.listen(window, 'resize', () => scope.dispose());
  scope.listen(window, 'scroll', () => scope.dispose(), true);
  scope.listen(document, 'visibilitychange', () => { if (document.hidden) scope.dispose(); });
  Promise.all(animations.map(animation => animation.finished)).then(() => scope.dispose(), () => scope.dispose());
}

/** Nonblocking, finite notice; it cannot outlive its round or add another announcement on HUD ticks. */
export function announceWave(refs, scope, wave) {
  if (!scope?.active || !wave || announcements.get(scope) === `${wave.attemptId}:${wave.index}`) return;
  announcements.set(scope, `${wave.attemptId}:${wave.index}`);
  const notice = document.createElement('div'); notice.className = 'progression-wave-notice';
  notice.setAttribute('role','status'); notice.setAttribute('aria-live','polite');
  notice.textContent = `Wave ${wave.index}`;
  document.body.append(notice);
  const release = scope.own(() => notice.remove(), 'cleanup');
  if (!reducedMotion()) {
    scope.animation(notice.animate([{opacity:0,transform:'translate(-50%,-40%) scale(.94)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}],{duration:WAVE_PRESENTATION_TIMING.noticeEnter,easing:'ease-out'}));
    if (wave.index > 1) presentWaveArrival(refs, scope);
  }
  scope.timeout(() => {
    if (reducedMotion()) { release(); return; }
    const exit=notice.animate([{opacity:1},{opacity:0}],{duration:WAVE_PRESENTATION_TIMING.noticeExit,easing:'ease-in',fill:'forwards'});
    scope.animation(exit); exit.finished.then(() => { exit.cancel(); release(); }, release);
  },WAVE_PRESENTATION_TIMING.noticeVisible);
}

// The shell owns the node; remounts update the same badge and create no listeners.
export function renderWaveStatus(refs, wave) {
  if (!wave) return;
  let badge = refs.title.querySelector('.progression-wave-status');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'progression-wave-status';
    refs.title.append(badge);
  }
  badge.textContent = `Đợt ${wave.index}/${wave.count}`;
  refs.root.dataset.waveIndex = String(wave.index);
  refs.root.dataset.waveCount = String(wave.count);
}
