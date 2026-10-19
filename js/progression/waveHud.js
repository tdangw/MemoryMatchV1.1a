import '../../styles/progression.css';
const announcements = new WeakMap();
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fade the cleared board after the advance checkpoint is durable. Cancellation settles false. */
export async function presentWaveExit(refs, scope) {
  if (!scope?.active) return false;
  if (reducedMotion()) return true;
  const animation = refs.board.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.985)'}],
    {duration:140,easing:'ease-in',fill:'forwards'});
  scope.animation(animation);
  try { await animation.finished; return scope.active; }
  catch (error) { if (error.name !== 'AbortError') throw error; return false; }
  finally { animation.cancel(); }
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
    scope.animation(notice.animate([{opacity:0,transform:'translate(-50%,-40%) scale(.96)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}],{duration:220,easing:'ease-out'}));
    if (wave.index > 1) scope.animation(refs.board.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'ease-out'}));
  }
  scope.timeout(() => {
    if (reducedMotion()) { release(); return; }
    const exit=notice.animate([{opacity:1},{opacity:0}],{duration:180,easing:'ease-in',fill:'forwards'});
    scope.animation(exit); exit.finished.then(release,release);
  },900);
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
