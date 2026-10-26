import { coverGeometry, placeRegion } from './geometry.js';
import { PILOT_PRESETS } from './pilotPresets.js';
import { createRegionRenderer } from './primitives.js';
import { AMBIENT_LIGHT } from './budgets.js';

const EXCLUSIONS = '.game-hud, .game-title, .game-selector__choice, .game-selector__controls, .adventure-dock, .adventure-header, .adventure-ad-slot, #grid-board-frame, .memory-special-hud';

/** Archived G1 review entry; product scenes use the same primitive renderer. */
export function mountPilotScene(doc, scene) {
  const view = doc.defaultView, preset = PILOT_PRESETS[scene];
  if (!preset) throw new Error(`Unknown pilot scene: ${scene}`);
  if (doc.querySelector('.ambient-bg-pilot')) throw new Error('Dispose the previous pilot before mounting');
  const query = view.matchMedia('(prefers-reduced-motion: reduce)');
  const controller = new view.AbortController();
  let state = 'STATIC', pendingFrame = 0, mountMs = 0, staticReason = null;
  const renderer = createRegionRenderer({ document: doc, maxHandles: AMBIENT_LIGHT.handles, onError(error) { console.error('Ambient review failed', error); renderer.clear(); state = 'STATIC'; } });
  renderer.host.classList.add('ambient-bg-pilot');
  function render() {
    pendingFrame = 0;
    if (state === 'DISPOSED') return;
    renderer.clear(); staticReason = null;
    if (query.matches || doc.hidden || typeof renderer.host.animate !== 'function') { state = 'STATIC'; return; }
    const home = doc.querySelector('.game-selector.adventure-page');
    if (scene === 'home' && home && view.getComputedStyle(home).backgroundImage.includes('url(')) {
      staticReason = 'home-source-covered'; state = 'STATIC'; return;
    }
    const started = view.performance.now();
    const viewport = { width: doc.documentElement.clientWidth, height: doc.documentElement.clientHeight };
    const descriptor = viewport.height >= viewport.width ? preset.portrait : preset.landscape;
    if (!view.getComputedStyle(doc.body).backgroundImage.includes(descriptor.source)) { state = 'STATIC'; return; }
    const exclusions = [...doc.querySelectorAll(EXCLUSIONS)].map(node => node.getBoundingClientRect()).filter(rect => rect.width && rect.height);
    const cover = coverGeometry(viewport.width, viewport.height, descriptor.width, descriptor.height);
    renderer.render(descriptor.regions.map(region => ({ region, rect: placeRegion(region, cover, viewport, exclusions) })).filter(entry => entry.rect));
    mountMs = view.performance.now() - started;
    state = renderer.diagnostics().handles ? 'RUNNING' : 'STATIC';
  }
  function requestRender() { if (state !== 'DISPOSED' && !pendingFrame) pendingFrame = view.requestAnimationFrame(render); }
  function dispose() {
    if (state === 'DISPOSED') return;
    state = 'DISPOSED'; controller.abort();
    if (pendingFrame) view.cancelAnimationFrame(pendingFrame);
    pendingFrame = 0; renderer.dispose();
  }
  const options = { signal: controller.signal };
  view.addEventListener('resize', requestRender, options); view.addEventListener('pagehide', dispose, options);
  doc.addEventListener('visibilitychange', requestRender, options); query.addEventListener('change', requestRender, options);
  doc.addEventListener('click', event => { if (event.target.closest('button')) dispose(); }, { ...options, capture: true });
  render();
  return { diagnostics: () => ({ ...renderer.diagnostics(), state, scene, staticReason, pendingFrames: pendingFrame ? 1 : 0, timers: 0, mountMs }), dispose };
}
