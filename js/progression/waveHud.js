import { isAppActive } from '../appVisibility.js';
import '../../styles/progression.css';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import { showContextGuide } from '../tutorial/contextGuide.js';
import { suspendAmbientBackground } from '../backgroundEffects.js';

const announcements = new WeakMap();
const WAVE_NOTICE_VIEWPORT_INSET = 8;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const WAVE_PRESENTATION_TIMING = Object.freeze({
  exit: 140, noticeEnter: 260, noticeVisible: 1800, noticeExit: 500,
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
  scope.listen(document, 'appvisibilitychange', () => { if (!isAppActive()) scope.dispose(); });
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
  notice.textContent = `Màn ${wave.level}-${wave.index}`;
  document.body.append(notice);
  const noticeScope = createGameShellLifecycle();
  noticeScope.own(suspendAmbientBackground());
  const releaseOwner = scope.own(() => noticeScope.dispose(), 'cleanup');
  noticeScope.own(() => releaseOwner.forget());
  noticeScope.own(() => notice.remove(), 'node');
  positionWaveNotice(notice, refs, noticeScope);
  const release = () => {
    noticeScope.dispose();
    if (scope.active) showContextGuide(`wave:${wave.gameId}`,refs.title,scope);
  };
  let arrival = Promise.resolve(scope.active);
  if (!reducedMotion() && isAppActive()) {
    noticeScope.animation(notice.animate([{opacity:0,transform:'translate(-50%,0) scale(.86)'},{opacity:1,transform:'translate(-50%,0) scale(1)'}],{duration:WAVE_PRESENTATION_TIMING.noticeEnter,easing:'ease-out'}));
    if (wave.index > 1) arrival = presentWaveArrival(refs, scope);
  }
  pendingArrivals.get(scope)?.();
  pendingArrivals.delete(scope);
  noticeScope.timeout(() => {
    if (reducedMotion()) { release(); return; }
    const rect=notice.getBoundingClientRect(),viewport=window.visualViewport,inset=WAVE_NOTICE_VIEWPORT_INSET;
    const left=viewport?.offsetLeft||0,top=viewport?.offsetTop||0,center=rect.left+rect.width/2;
    const fitX=2*Math.min(center-left-inset,left+(viewport?.width||innerWidth)-inset-center)/rect.width;
    const fitY=(top+(viewport?.height||innerHeight)-inset-rect.top)/rect.height;
    const zoom=Math.max(1,Math.min(1.5,fitX,fitY));
    const exit=notice.animate([{opacity:1,transform:'translate(-50%,0) scale(1)'},{opacity:1,transform:`translate(-50%,0) scale(${Math.min(1.12,zoom)})`,offset:.3},{opacity:0,transform:`translate(-50%,0) scale(${zoom})`}],{duration:WAVE_PRESENTATION_TIMING.noticeExit,easing:'ease-in',fill:'forwards'});
    noticeScope.animation(exit); exit.finished.then(() => { exit.cancel(); release(); }, release);
  },WAVE_PRESENTATION_TIMING.noticeVisible);
  return arrival;
}

function positionWaveNotice(notice, refs, scope) {
  const viewport = window.visualViewport;
  let pending = false;
  function update() {
    pending = false;
    if (!scope.active || !notice.isConnected || !refs.board.isConnected) return;
    const board = refs.board.getBoundingClientRect();
    const bounds = notice.getBoundingClientRect();
    const inset = WAVE_NOTICE_VIEWPORT_INSET;
    const left = (viewport?.offsetLeft || 0) + inset;
    const top = (viewport?.offsetTop || 0) + inset;
    const right = left + (viewport?.width || innerWidth) - inset * 2;
    const bottom = top + (viewport?.height || innerHeight) - inset * 2;
    notice.style.left = `${Math.max(left + bounds.width / 2, Math.min(board.left + board.width / 2, right - bounds.width / 2))}px`;
    notice.style.top = `${Math.max(top, Math.min(board.top, bottom - bounds.height))}px`;
  }
  function schedule() {
    if (pending || !scope.active) return;
    pending = true;
    scope.frame(update);
  }
  scope.listen(window, 'resize', schedule);
  scope.listen(window, 'scroll', schedule, true);
  if (viewport) {
    scope.listen(viewport, 'resize', schedule);
    scope.listen(viewport, 'scroll', schedule);
  }
  const observer = new ResizeObserver(schedule);
  observer.observe(refs.board);
  observer.observe(refs.root);
  scope.own(() => observer.disconnect());
  update();
}

export function formatWaveLevel(level,wave) {
  return wave?.level===level ? `${level}-${wave.index}` : String(level);
}

// Wave metadata remains on the shell; the compact HUD owns the visible label.
export function renderWaveStatus(refs, wave) {
  if (!wave) return;
  refs.title.querySelector('.progression-wave-status')?.remove();
  const level=refs.hud.querySelector('.stat-level');
  const label=`Màn ${wave.level}-${wave.index}`;
  if(level&&level.getAttribute('aria-label')!==label)level.setAttribute('aria-label',label);
  if(refs.root.dataset.waveIndex!==String(wave.index))refs.root.dataset.waveIndex=String(wave.index);
  if(refs.root.dataset.waveCount!==String(wave.count))refs.root.dataset.waveCount=String(wave.count);
}
