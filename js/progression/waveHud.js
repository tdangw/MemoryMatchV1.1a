import '../../styles/progression.css';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';

const announcements = new WeakMap();
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const WAVE_PRESENTATION_TIMING = Object.freeze({
  exit: 140, noticeEnter: 260, noticeVisible: 1800, noticeExit: 220,
  cardEnter: 340, layerSpread: 560,
});

/** Fade the cleared board after the advance checkpoint is durable. Cancellation settles false. */
export async function presentWaveExit(refs, scope) {
  if (!scope?.active) return false;
  if (reducedMotion()) return true;
  const animation = refs.board.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.985)'}],
    {duration:WAVE_PRESENTATION_TIMING.exit,easing:'ease-in',fill:'forwards'});
  scope.animation(animation);
  const release = scope.own(() => animation.cancel());
  try { await animation.finished; return scope.active; }
  catch (error) { if (error.name !== 'AbortError') throw error; return false; }
  finally { if (!scope.active || animation.playState !== "finished") release(); }
}

const pendingArrivals = new WeakMap();

/** Hide newly rendered cards until decoding and checkpointing have completed. */
export function prepareWaveArrival(refs, owner) {
  const previous = refs.board.style.visibility;
  refs.board.style.visibility = 'hidden';
  const release = owner.own(() => { refs.board.style.visibility = previous; });
  pendingArrivals.set(owner, release);
}

/** Reveal real cards in spatial layers; no sweep, replacement art or whole-board flash. */
function presentWaveArrival(refs, owner) {
  const scope = createGameShellLifecycle();
  const releaseOwner = owner.own(() => scope.dispose(), 'cleanup');
  scope.own(() => releaseOwner.forget());
  const direction = Math.floor(Math.random() * 4);
  const horizontal = direction < 2, reverse = direction % 2 === 1;
  const nodes = [...refs.board.querySelectorAll('.tile:not(.matched), .link-tile, .triple-connect__tile')];
  // Hand off any finite card entrance already started by the renderer while
  // the board was hidden; it must not compete with this wave's reveal.
  for (const node of nodes) for (const animation of node.getAnimations()) {
    if (animation.effect.getTiming().iterations !== Infinity) animation.finish();
  }
  // Read geometry in one batch before creating any animations. Each visible
  // card has exactly one finite animation, bounded by the current board size.
  const cards = nodes
    .map(node => {
      const rect = node.getBoundingClientRect();
      return { node, coordinate: Math.round((horizontal ? rect.left : rect.top) / 4) * 4,
        opacity: getComputedStyle(node).opacity };
    });
  const layers = [...new Set(cards.map(card => card.coordinate))].sort((a,b) => reverse ? b-a : a-b);
  const animations = cards.map(({node,coordinate,opacity}) => node.animate([
    {opacity:0}, {opacity},
  ], {duration:WAVE_PRESENTATION_TIMING.cardEnter,
    delay:layers.indexOf(coordinate) / Math.max(1,layers.length-1) * WAVE_PRESENTATION_TIMING.layerSpread,
    easing:'cubic-bezier(.2,.7,.3,1)',fill:'both'}));
  animations.forEach(animation => scope.animation(animation));
  const wasInert = refs.board.inert;
  refs.board.inert = true;
  refs.board.dataset.waveArrival = ['left','right','top','bottom'][direction];
  scope.own(() => {
    for (const animation of animations) animation.cancel();
    refs.board.inert = wasInert;
    delete refs.board.dataset.waveArrival;
  });
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  scope.listen(motion, 'change', event => { if (event.matches) scope.dispose(); });
  scope.listen(window, 'resize', () => scope.dispose());
  scope.listen(document, 'visibilitychange', () => { if (document.hidden) scope.dispose(); });
  return Promise.all(animations.map(animation => animation.finished)).then(
    () => { scope.dispose(); return owner.active; },
    () => { scope.dispose(); return owner.active; });
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
  let arrival = Promise.resolve(scope.active);
  if (!reducedMotion() && !document.hidden) {
    scope.animation(notice.animate([{opacity:0,transform:'translate(-50%,-40%) scale(.94)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}],{duration:WAVE_PRESENTATION_TIMING.noticeEnter,easing:'ease-out'}));
    if (wave.index > 1) arrival = presentWaveArrival(refs, scope);
  }
  pendingArrivals.get(scope)?.();
  pendingArrivals.delete(scope);
  scope.timeout(() => {
    if (reducedMotion()) { release(); return; }
    const exit=notice.animate([{opacity:1},{opacity:0}],{duration:WAVE_PRESENTATION_TIMING.noticeExit,easing:'ease-in',fill:'forwards'});
    scope.animation(exit); exit.finished.then(() => { exit.cancel(); release(); }, release);
  },WAVE_PRESENTATION_TIMING.noticeVisible);
  return arrival;
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
