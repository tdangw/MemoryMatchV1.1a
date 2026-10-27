import { boundedSpriteMotion } from './geometry.js';
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Native timelines, finite slots. Shared by the approved review and product scenes. */
export function createRegionRenderer({ document: doc, parent = doc.body, map = false, maxHandles, onError = console.error }) {
  let host = doc.createElement('div');
  host.className = `ambient-bg-host ${map ? 'ambient-bg-map' : 'ambient-bg-body'}`;
  host.setAttribute('aria-hidden', 'true');
  const attach = () => map ? parent.append(host) : parent.prepend(host);
  attach();
  let handles = [], kinds = [], generation = 0, signature = null;
  function clear() {
    generation++;
    for (const animation of handles) animation.cancel();
    handles = []; kinds = []; signature = null;
    if (host) host.replaceChildren();
  }
  function animate(node, frames, options) {
    const identity = generation, animation = node.animate(frames, options);
    handles.push(animation);
    void animation.finished.catch(error => {
      // Owned cancellation advances generation before cancelling. A rejection
      // in the live generation is unexpected, including AbortError.
      if (host && generation === identity) onError(error);
    });
  }
  return {
    get host() { return host; }, clear,
    render(placements, geometry = null) {
      if (!host) return;
      const selected = placements.slice(0, maxHandles);
      const next = JSON.stringify([selected, geometry]);
      if (signature === next && host.isConnected) return;
      clear(); signature = next;
      if (!host.isConnected) attach();
      if (geometry) Object.assign(host.style, { left: `${geometry.left || 0}px`, top: `${geometry.top}px`, width: `${geometry.width}px`, height: `${geometry.height}px` });
      for (const { region, rect } of selected) {
        const wrapper = doc.createElement('div'); wrapper.className = `ambient-bg-region ambient-bg-region--${region.kind}`;
        Object.assign(wrapper.style, { left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.width}px`, height: `${rect.height}px` });
        if (region.color) wrapper.style.setProperty('--ambient-bg-leaf-color', region.color);
        host.append(wrapper); kinds.push(region.kind);
        if (region.kind === 'water') {
          const water = doc.createElement('div'); water.className = 'ambient-bg-water'; wrapper.append(water);
          animate(water, [{ transform: 'translateY(-32px)' }, { transform: 'translateY(0)' }], { duration: 3400, iterations: Infinity, easing: 'linear' });
          continue;
        }
        const node = region.kind === 'firefly' ? doc.createElement('div') : doc.createElementNS(SVG_NS, 'svg');
        node.classList.add(`ambient-bg-${region.kind}`);
        const motion=boundedSpriteMotion(region.kind,rect,map);
        Object.assign(node.style,{width:`${motion.width}px`,height:`${motion.height}px`,left:`${motion.left}px`,top:`${motion.top}px`});
        if (region.kind !== 'firefly') {
          node.setAttribute('viewBox', '0 0 32 20'); node.setAttribute('focusable', 'false');
          const path = doc.createElementNS(SVG_NS, 'path');
          path.setAttribute('d', region.kind === 'fish' ? 'M3 10Q13 0 25 10Q13 20 3 10M24 10L31 4V16Z' : 'M2 17Q3 0 29 2Q29 17 2 17M3 16L23 5');
          if (region.kind === 'fish') path.setAttribute('transform', 'translate(32 0) scale(-1 1)');
          node.append(path);
        }
        wrapper.append(node);
        const leaf = region.kind === 'leaf', fish = region.kind === 'fish';
        const end = `translate(${motion.endX}px, ${motion.endY}px) rotate(${motion.rotation}deg)`;
        animate(node, [
          { transform: 'translate(0, 0)', opacity: 0, offset: 0 },
          { transform: 'translate(0, 0)', opacity: fish ? .24 : .34, offset: .02 },
          { transform: end, opacity: .22, offset: .36 },
          { transform: end, opacity: 0, offset: .4 },
          { transform: end, opacity: 0, offset: 1 },
        ], { duration: leaf || fish ? 24000 : 20000, delay: -(region.phase || 0), iterations: Infinity, easing: 'linear' });
      }
    },
    diagnostics() { return { nodes: host ? host.querySelectorAll('*').length + 1 : 0, handles: handles.length, kinds: [...kinds] }; },
    dispose() { if (!host) return; clear(); host.remove(); host = null; parent = null; },
  };
}
