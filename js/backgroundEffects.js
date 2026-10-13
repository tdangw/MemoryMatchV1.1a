const meteorQuery = typeof window === 'undefined' ? null : window.matchMedia('(prefers-reduced-motion: reduce)');
let container = null;
let nodes = [];
let meteorTimer;
let enabled = true;
let eligible = false;
function canAnimate() { return container && enabled && eligible && !document.hidden && !meteorQuery.matches; }
function idle(node) { node.dataset.state = 'IDLE'; node.style.animationName = 'none'; }
function ended(event) {
  const node = event.target;
  if (!nodes.includes(node) || node.dataset.state !== 'ACTIVE' || event.animationName !== node.style.animationName) return;
  if (node.getAnimations().some(animation => animation.playState === 'running')) return;
  idle(node);
}
function isIdle(node) { return node.dataset.state === 'IDLE'; }
function tick() {
  meteorTimer = undefined;
  if (!canAnimate()) return;
  const node = nodes.find(isIdle);
  if (node) {
    const bright = Math.random() < .12;
    node.classList.toggle('is-bright', bright);
    node.style.left = `${Math.random() * window.innerWidth}px`;
    node.style.height = `${bright ? 150 : 72 + Math.random() * 68}px`;
    node.style.opacity = String(bright ? .92 : .45 + Math.random() * .3);
    node.style.animationDuration = `${1.2 + Math.random() * 1.3}s`;
    node.dataset.state = 'ACTIVE';
    node.style.animationName = 'shooting';
  }
  schedule();
}
function schedule() {
  clearTimeout(meteorTimer); meteorTimer = undefined;
  if (canAnimate()) meteorTimer = setTimeout(tick, 3500 + Math.random() * 3500);
}
function reconcile() {
  if (container) container.hidden = !canAnimate();
  if (!canAnimate()) for (const node of nodes) idle(node);
  schedule();
}
export function setMeteorSceneEligible(value) { eligible = Boolean(value); reconcile(); }
export function setMeteorEffectsEnabled(value) {
  enabled = Boolean(value);
  document.body.classList.toggle('meteor-effects-disabled', !enabled);
  reconcile();
}
export function initializeMeteorEffects(value = true) {
  if (!container) {
    container = document.createElement('div'); container.className = 'meteor-layer'; container.setAttribute('aria-hidden', 'true');
    nodes = Array.from({ length: 2 }, () => { const node = document.createElement('div'); node.className = 'shooting-star'; idle(node); return node; });
    container.append(...nodes); document.body.append(container);
    container.addEventListener('animationend', ended); container.addEventListener('animationcancel', ended);
    document.addEventListener('visibilitychange', reconcile); meteorQuery.addEventListener('change', reconcile);
  }
  setMeteorEffectsEnabled(value);
}
export function disposeMeteorEffects() {
  clearTimeout(meteorTimer); meteorTimer = undefined;
  document.removeEventListener('visibilitychange', reconcile); meteorQuery.removeEventListener('change', reconcile);
  if (container) { container.removeEventListener('animationend', ended); container.removeEventListener('animationcancel', ended); container.remove(); }
  container = null; nodes = []; eligible = false;
}
export function getMeteorDiagnostics() { return { nodes: nodes.length, active: nodes.filter(node => node.dataset.state === 'ACTIVE').length, timers: meteorTimer === undefined ? 0 : 1, eligible: Boolean(canAnimate()) }; }
