import { boundedSpriteMotion } from './geometry.js';
import { renderPond } from './mapDetails.js';
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
      const selected = []; let cost = 0;
      for (const placement of placements) {
        const needed = placement.region.kind === 'pond' ? 3 : 1; // two timelines + one static backing slot
        if (cost + needed > maxHandles) continue;
        selected.push(placement); cost += needed;
      }
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
        if (region.kind === 'pond') { renderPond(doc, wrapper, rect, animate); continue; }
        if (region.kind === 'lamp') {
          const glow = doc.createElement('div'); glow.className = 'ambient-bg-lamp'; wrapper.append(glow);
          animate(glow, [{ opacity: .12 }, { opacity: .46, offset: .45 }, { opacity: .19, offset: .7 }, { opacity: .12 }], { duration: 9000, iterations: Infinity, easing: 'ease-in-out' });
          continue;
        }
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
        if (map && region.detail && region.kind === 'firefly') {
          animate(node, [{ transform:'translate(0,0)',opacity:.2 },{transform:`translate(${motion.endX}px,${motion.endY}px)`,opacity:.8,offset:.45},{transform:'translate(0,0)',opacity:.2}], {duration:7000,delay:-(region.phase||0),iterations:Infinity,easing:'ease-in-out'});
          continue;
        }
        if (map && region.detail && region.kind === 'leaf') {
          animate(node, [{transform:'translate(0,0) rotate(-12deg)',opacity:0},
            {transform:'translate(0,0) rotate(-12deg)',opacity:.65,offset:.08},
            {transform:`translate(${motion.endX}px,${motion.endY}px) rotate(${motion.rotation}deg)`,opacity:.55,offset:.85},
            {transform:`translate(${motion.endX}px,${motion.endY}px) rotate(${motion.rotation}deg)`,opacity:0}],
          {duration:10000,delay:-(region.phase||0),iterations:Infinity,easing:'ease-in-out'});
          continue;
        }
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
    diagnostics() { return { nodes: host ? host.querySelectorAll('*').length + 1 : 0, handles: handles.length, reservedSlots: kinds.includes('pond') ? 1 : 0, kinds: [...kinds] }; },
    dispose() { if (!host) return; clear(); host.remove(); host = null; parent = null; },
  };
}
