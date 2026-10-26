import { coverGeometry, placeRegion } from './geometry.js';
import { PILOT_PRESETS } from './pilotPresets.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const EXCLUSIONS = '.game-hud, .game-title, .game-selector__choice, .game-selector__controls, .adventure-dock, .adventure-header, .adventure-ad-slot, #grid-board-frame, .memory-special-hud';

/** G1 visual probe, explicitly mounted by the review harness, never by startup. */
export function mountPilotScene(doc, scene) {
  const view = doc.defaultView;
  const preset = PILOT_PRESETS[scene];
  if (!preset) throw new Error(`Unknown pilot scene: ${scene}`);
  if (doc.querySelector('.ambient-bg-pilot')) throw new Error('Dispose the previous pilot before mounting');
  const query = view.matchMedia('(prefers-reduced-motion: reduce)');
  let host = doc.createElement('div');
  host.className = 'ambient-bg-pilot'; host.setAttribute('aria-hidden', 'true');
  doc.body.prepend(host);
  let state = 'STATIC';
  let animationHandles = [];
  let pendingFrame = 0;
  let visibleKinds = [];
  let mountMs = 0;
  let generation = 0;
  let staticReason = null;
  const controller = new view.AbortController();

  function clear() {
    generation++;
    for (const handle of animationHandles) handle.cancel();
    animationHandles = []; host.replaceChildren(); visibleKinds = [];
  }
  function animate(node, frames, options) {
    const revision = generation;
    const animation = node.animate(frames, options);
    animationHandles.push(animation);
    void animation.finished.catch(error => {
      if (revision !== generation || state === 'DISPOSED') return;
      if (error.name !== 'AbortError') { console.error('Ambient pilot animation failed', error); clear(); state = 'STATIC'; }
    });
  }
  function render() {
    pendingFrame = 0;
    if (state === 'DISPOSED') return;
    clear();
    staticReason = null;
    if (query.matches || doc.hidden || typeof host.animate !== 'function') { state = 'STATIC'; return; }
    const home = doc.querySelector('.game-selector.adventure-page');
    if (scene === 'home' && home && view.getComputedStyle(home).backgroundImage.includes('url(')) {
      staticReason = 'home-source-covered'; state = 'STATIC'; return;
    }
    state = 'PREPARING';
    const started = view.performance.now();
    const viewport = { width: doc.documentElement.clientWidth, height: doc.documentElement.clientHeight };
    const descriptor = viewport.height >= viewport.width ? preset.portrait : preset.landscape;
    const computed = view.getComputedStyle(doc.body);
    if (!computed.backgroundImage.includes(descriptor.source)) { state = 'STATIC'; return; }
    // Read the complete geometry batch before any region writes.
    const exclusions = [...doc.querySelectorAll(EXCLUSIONS)].map(node => node.getBoundingClientRect()).filter(rect => rect.width && rect.height);
    const cover = coverGeometry(viewport.width, viewport.height, descriptor.width, descriptor.height);
    const placements = descriptor.regions.map(region => ({ region, rect: placeRegion(region, cover, viewport, exclusions) }));
    for (const { region, rect } of placements) {
      if (!rect) continue;
      const wrapper = doc.createElement('div'); wrapper.className = `ambient-bg-region ambient-bg-region--${region.kind}`;
      Object.assign(wrapper.style, { left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` });
      host.append(wrapper); visibleKinds.push(region.kind);
      if (region.kind === 'water') {
        for (let strip = 0; strip < 2; strip++) {
          const node = doc.createElement('div'); node.className = 'ambient-bg-water'; wrapper.append(node);
          node.style.left = `${strip * 50}%`;
          animate(node, [{ transform: 'translateY(-32px)' }, { transform: 'translateY(0)' }], { duration: 3200 + strip * 350, iterations: Infinity, easing: 'linear' });
        }
      } else {
        const node = region.kind === 'firefly' ? doc.createElement('div') : doc.createElementNS(SVG_NS, 'svg');
        node.classList.add(`ambient-bg-${region.kind}`);
        if (region.kind !== 'firefly') {
          node.setAttribute('viewBox', '0 0 32 20');
          const path = doc.createElementNS(SVG_NS, 'path');
          path.setAttribute('d', region.kind === 'fish' ? 'M3 10Q13 0 25 10Q13 20 3 10M24 10L31 4V16Z' : 'M2 17Q3 0 29 2Q29 17 2 17M3 16L23 5');
          node.append(path);
        }
        wrapper.append(node);
        const leaf = region.kind === 'leaf', fish = region.kind === 'fish';
        const end = leaf ? `translate(8px, ${Math.max(4, rect.height - 14)}px) rotate(55deg)` : fish ? `translate(${Math.max(4, rect.width - 22)}px, 3px) rotate(-4deg)` : 'translate(9px, 12px)';
        animate(node, [
          { transform: 'translate(0, 0)', opacity: 0, offset: 0 },
          { transform: 'translate(0, 0)', opacity: fish ? .24 : .34, offset: .02 },
          { transform: end, opacity: .22, offset: .36 },
          { transform: end, opacity: 0, offset: .4 },
          { transform: end, opacity: 0, offset: 1 },
        ], { duration: leaf ? 24000 : fish ? 24000 : 20000, iterations: Infinity, easing: 'linear' });
      }
    }
    mountMs = view.performance.now() - started;
    state = visibleKinds.length ? 'RUNNING' : 'STATIC';
  }
  function requestRender() {
    if (state !== 'DISPOSED' && !pendingFrame) pendingFrame = view.requestAnimationFrame(render);
  }
  function dispose() {
    if (state === 'DISPOSED') return;
    state = 'DISPOSED'; controller.abort();
    if (pendingFrame) view.cancelAnimationFrame(pendingFrame);
    pendingFrame = 0; clear(); host.remove(); host = null;
  }
  const options = { signal: controller.signal };
  view.addEventListener('resize', requestRender, options);
  view.addEventListener('pagehide', dispose, options);
  view.addEventListener('pageshow', requestRender, options);
  doc.addEventListener('visibilitychange', requestRender, options);
  query.addEventListener('change', requestRender, options);
  // Review-only safety: leave the candidate before any in-game navigation,
  // popup or control action. Product owner integration belongs to G2.
  doc.addEventListener('click', event => { if (event.target.closest('button')) dispose(); }, { ...options, capture: true });
  render();
  return {
    diagnostics() { return { state, scene, staticReason, nodes: host ? host.querySelectorAll('*').length + 1 : 0, handles: animationHandles.length, pendingFrames: pendingFrame ? 1 : 0, timers: 0, kinds: [...visibleKinds], mountMs }; },
    dispose,
  };
}
