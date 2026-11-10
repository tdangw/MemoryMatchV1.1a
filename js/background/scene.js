import '../../styles/ambient-background.css';
import { coverGeometry, placeRegion, visibleMapTiles } from './geometry.js';
import { createRegionRenderer } from './primitives.js';
import { MAP_SCENE, SCENE_PRESETS } from './presets.js';
import { MAP_DETAILS } from './mapDetails.js';

const EXCLUSIONS = '[data-shell-region="frame"], [data-shell-region="title"], [data-shell-region="hud"], [data-shell-region="milestones"], .adventure-dock, .adventure-ad-slot';
const overlapsView = (rect, height) => rect.bottom > -120 && rect.top < height + 120;

export function createAmbientScene({ document: doc, kind, root, trail, scroll, prepareSource, initialSource, requestRefresh, onError, maxHandles, mapDetails = false, mapScene = MAP_SCENE }) {
  const view = doc.defaultView, map = kind === 'map';
  if (typeof view.Element.prototype.animate !== 'function' || typeof view.ResizeObserver !== 'function') {
    return { refresh() {}, dispose() {}, diagnostics: () => ({ nodes: 0, handles: 0, observers: 0, kinds: [], reason: 'unsupported', tileSlots: 0, mountMs: 0, motionAssetBytes: 0, decodedMotionBytes: 0 }) };
  }
  let alive = true, revision = 0, readySource = initialSource, pendingSource = null, activeSource = null;
  const failedSources = new Set(); // At most the two authored orientations.
  let mountMs = 0, tileSlots = 0, reason = null;
  const renderer = createRegionRenderer({ document: doc, parent: map ? scroll : doc.body, map, onError, maxHandles });
  let observer = null;

  function refresh() {
    if (!alive) return;
    const started = view.performance.now();
    reason = null;
    if (map) refreshMap(); else refreshBody();
    mountMs = view.performance.now() - started;
  }
  function refreshBody() {
    const portrait = view.matchMedia('(orientation: portrait)').matches;
    const descriptor = SCENE_PRESETS[kind][portrait ? 'portrait' : 'landscape'];
    if (activeSource !== descriptor.source) { activeSource = descriptor.source; revision++; pendingSource = null; }
    if (!readySource.endsWith(descriptor.source)) {
      renderer.clear(); reason = failedSources.has(descriptor.source) ? 'source-unavailable' : 'source-preparing';
      if (pendingSource === descriptor.source || failedSources.has(descriptor.source)) return;
      const id = ++revision; pendingSource = descriptor.source;
      void prepareSource().then(loaded => {
        if (!alive || id !== revision) return;
        pendingSource = null;
        if (view.matchMedia('(orientation: portrait)').matches !== portrait) { requestRefresh(); return; }
        if (loaded) readySource = descriptor.source;
        else { failedSources.add(descriptor.source); onError(new Error('Ambient source unavailable')); }
        requestRefresh();
      }).catch(error => { if (alive && id === revision) { pendingSource = null; failedSources.add(descriptor.source); onError(error); } });
      return;
    }
    const style = view.getComputedStyle(doc.body), body = doc.body.getBoundingClientRect();
    const viewport = style.backgroundAttachment === 'scroll' ? { width: body.width, height: body.height } : { width: doc.documentElement.clientWidth, height: doc.documentElement.clientHeight };
    if (!style.backgroundImage.includes(descriptor.source)) { renderer.clear(); reason = 'source-mismatch'; return; }
    const exclusions = [...root.querySelectorAll(EXCLUSIONS)].map(node => node.getBoundingClientRect()).filter(rect => rect.width && rect.height);
    const cover = coverGeometry(viewport.width, viewport.height, descriptor.width, descriptor.height);
    const placements = descriptor.regions.map(region => ({ region, rect: placeRegion(region, cover, viewport, exclusions) })).filter(entry => entry.rect);
    renderer.render(placements); if (!placements.length) reason = 'no-safe-region';
  }
  function refreshMap() {
    if (root.dataset.mapReady !== 'true') { renderer.clear(); reason = 'map-preparing'; return; }
    const box = trail.getBoundingClientRect(), height = scroll.clientHeight, width = trail.clientWidth;
    const style = view.getComputedStyle(trail), size = style.backgroundSize.split(',')[0].trim().split(/\s+/).map(Number.parseFloat);
    if (!style.backgroundImage.includes(mapScene.source)) { renderer.clear(); reason = 'map-source-mismatch'; return; }
    const textureWidth = size[0], textureHeight = size[1], positionY = Number.parseFloat(style.backgroundPositionY) || 0;
    if (!(textureWidth > 0 && textureHeight > 0) || Math.abs(textureWidth / mapScene.width - textureHeight / mapScene.height) > .0001) { renderer.clear(); reason = 'map-texture-mismatch'; return; }
    const scrollBox = scroll.getBoundingClientRect();
    const origin = { left: box.left, top: scrollBox.top + scroll.clientTop }, viewport = { width, height };
    const themed = mapScene !== MAP_SCENE;
    const cells = themed ? [] : [...trail.querySelectorAll('.adventure-map-cell, .adventure-map-decoration')].map(node => node.getBoundingClientRect())
      .map(rect => ({ left: rect.left - origin.left - 5, right: rect.right - origin.left + 5, top: rect.top - origin.top - 5, bottom: rect.bottom - origin.top + 5 })).filter(rect => overlapsView(rect, height));
    for (const node of root.querySelectorAll('.adventure-special-modes, .adventure-map-shortcuts, .adventure-map-wallet')) {
      const rect = node.getBoundingClientRect();
      cells.push({left:rect.left-origin.left-5,right:rect.right-origin.left+5,top:rect.top-origin.top-5,bottom:rect.bottom-origin.top+5});
    }
    const points = [...trail.querySelectorAll('.adventure-map-node--level')].map(node => node.getBoundingClientRect())
      .map(rect => ({ x: rect.left + rect.width / 2 - origin.left, y: rect.top + rect.height / 2 - origin.top })).filter(point => point.y > -120 && point.y < height + 120).sort((a,b) => a.y-b.y);
    for (let index = 1; !themed && index < points.length; index++) cells.push({ left: Math.min(points[index-1].x, points[index].x)-14, right: Math.max(points[index-1].x, points[index].x)+14, top: points[index-1].y, bottom: points[index].y });
    const tiles = visibleMapTiles({ scrollTop: scroll.scrollTop, positionY, tileHeight: textureHeight, viewportHeight: height }); tileSlots = tiles.length;
    const candidates = [];
    for (const tile of tiles) {
      const transform = { x: (width - textureWidth) / 2, y: positionY + tile * textureHeight - scroll.scrollTop, scale: textureWidth / mapScene.width };
      for (const sourceRegion of mapDetails && !themed ? [...mapScene.regions, ...MAP_DETAILS] : mapScene.regions) {
        const region = mapDetails && sourceRegion.kind === 'firefly' ? {...sourceRegion,detail:true} : sourceRegion;
        const rect = placeRegion(region, transform, viewport, cells);
        if (rect) candidates.push({ region, rect });
      }
    }
    const selected = [];
    const pond = !themed && mapDetails && candidates.find(entry => entry.region.kind === 'pond');
    // A pond uses two timelines and a small static lily backing layer. Reserve
    // one slot so pond + fly + lamp + lily + clip stays within six layers.
    const composition = themed ? [['leaf',2],['firefly',2],['lamp',1]] : pond ? [['firefly',1],['lamp',1]] : mapDetails ? [['lamp',1],['firefly',1],['water',1],['fish',1],['leaf',1]] : [['water',1],['fish',2],['firefly',1],['leaf',1]];
    if (pond) selected.push(pond);
    for (const [kind, count] of composition) selected.push(...candidates.filter(entry => entry.region.kind === kind).slice(0,count));
    // Small themed accents may cross the route; fixed controls stay excluded.
    // Pointer events remain disabled on the entire native ambient layer.
    renderer.render(selected, { left:box.left-scrollBox.left-scroll.clientLeft, top: scroll.scrollTop, width, height });
    if (!selected.length) reason = 'no-safe-region';
  }
  try {
    observer = new view.ResizeObserver(() => { if (alive) requestRefresh(); });
    observer.observe(root);
    if (map) { observer.observe(trail); observer.observe(scroll); }
    else { const board = root.querySelector('[data-shell-region="frame"]'); if (board) observer.observe(board); }
    refresh();
  } catch (error) { alive = false; if (observer) observer.disconnect(); renderer.dispose(); throw error; }
  return {
    refresh,
    diagnostics() { return { ...renderer.diagnostics(), observers: alive ? 1 : 0, mountMs, tileSlots, reason, motionAssetBytes: 0, decodedMotionBytes: 0 }; },
    dispose() { if (!alive) return; alive = false; revision++; observer.disconnect(); renderer.dispose(); root = trail = scroll = prepareSource = null; },
  };
}
