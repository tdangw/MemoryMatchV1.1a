import { createBackgroundRuntime } from './background/runtime.js';
let container = null;
let nodes = [];
let runtime = null;
let enabled = true, eligible = false;
function idle(node) { node.dataset.state = 'IDLE'; node.style.animationName = 'none'; }
function ended(event) {
  const node = event.target;
  if (!nodes.includes(node) || node.dataset.state !== 'ACTIVE' || event.animationName !== node.style.animationName) return;
  if (node.getAnimations().some(animation => animation.playState === 'running')) return;
  idle(node);
}
function isIdle(node) { return node.dataset.state === 'IDLE'; }
function spawn() {
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
}
export function setMeteorSceneEligible(value) { eligible = Boolean(value); if (runtime) runtime.setMeteorEligible(eligible); }
export function setMeteorEffectsEnabled(value) {
  enabled = Boolean(value);
  document.body.classList.toggle('meteor-effects-disabled', !enabled);
  if (runtime) runtime.setEnabled(enabled);
}
export function initializeMeteorEffects(value = true) {
  if (!container) {
    container = document.createElement('div'); container.className = 'meteor-layer'; container.setAttribute('aria-hidden', 'true');
    nodes = Array.from({ length: 2 }, () => { const node = document.createElement('div'); node.className = 'shooting-star'; idle(node); return node; });
    container.append(...nodes); document.body.append(container);
    container.addEventListener('animationend', ended); container.addEventListener('animationcancel', ended);
    runtime = createBackgroundRuntime({ view: window, document, meteor: {
      spawn,
      cancel() { for (const node of nodes) idle(node); container.hidden = true; },
      setVisible(value) { container.hidden = !value; },
      diagnostics() { return { nodes: nodes.length, active: nodes.filter(node => node.dataset.state === 'ACTIVE').length }; },
    } });
    runtime.setMeteorEligible(eligible);
  }
  setMeteorEffectsEnabled(value);
}
export function disposeMeteorEffects() {
  if (runtime) runtime.dispose(); runtime = null;
  if (container) { container.removeEventListener('animationend', ended); container.removeEventListener('animationcancel', ended); container.remove(); }
  container = null; nodes = []; eligible = false;
}
export function getMeteorDiagnostics() { return runtime ? runtime.meteorDiagnostics() : { nodes: 0, active: 0, timers: 0, eligible: false }; }
export function mountAmbientBackground(options) {
  if (!runtime) initializeMeteorEffects(enabled);
  return runtime.mount(options);
}
export function suspendAmbientBackground() {
  if (!runtime) initializeMeteorEffects(enabled);
  return runtime.suspend();
}
export function refreshAmbientBackground(scope) { if (runtime) runtime.refresh(scope); }
export function scheduleAmbientIdle(callback, delay) { if (!runtime) throw new Error('Missing ambient owner'); return runtime.idle(callback, delay); }
export function getAmbientDiagnostics() { return runtime ? runtime.diagnostics() : { state: 'DISPOSED', scenes: 0, sceneInstances: 0, nodes: 0, handles: 0, timers: 0, pendingFrames: 0, listeners: 0, observers: 0, blockers: 0, preparing: 0 }; }
