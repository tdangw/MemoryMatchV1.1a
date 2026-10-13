import confetti from "canvas-confetti";
import { createGameShellLifecycle, getActiveGameScope } from './gameShell/gameShellLifecycle.js';
import { getAppPageScope } from './appPageLifecycle.js';
let activeConfetti = null;
import "../styles/victory-flower.css";
import { showVictoryFireworks } from "./fireworkEffect.js";
import { showVictoryCelebration } from "./victoryCelebration.js";

export const canShowFullVictoryCelebration = true;

export function showSummaryFireworks(options) {
  return showVictoryFireworks(options);
}

export function launchSummaryConfetti(owner = getActiveGameScope() || getAppPageScope()) {
  activeConfetti?.dispose();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || document.hidden || owner && !owner.active) return;
  const scope = createGameShellLifecycle(); activeConfetti = scope;
  const canvas = document.createElement('canvas'); canvas.className = 'summary-confetti'; canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '31000' });
  document.body.append(canvas);
  const fire = confetti.create(canvas, { resize: true, useWorker: false });
  const release = owner?.own(() => scope.dispose(), 'cleanup');
  scope.own(() => {
    fire.reset(); canvas.remove(); canvas.width = canvas.height = 0; release?.forget();
    if (activeConfetti === scope) activeConfetti = null;
  });
  scope.listen(document, 'visibilitychange', () => { if (document.hidden) scope.dispose(); });
  scope.listen(reduced, 'change', () => { if (reduced.matches) scope.dispose(); });
  const completion = fire({
    particleCount: 150, spread: 70, origin: { y: 0.6 },
    colors: ['#6366f1', '#a855f7', '#10b981'], disableForReducedMotion: true, zIndex: 31000,
  });
  completion.then(() => scope.dispose(), error => { console.warn('Summary confetti unavailable', error); scope.dispose(); });
  return scope;
}

export function showFullVictoryCelebration(completion) {
  showVictoryCelebration(completion);
}
