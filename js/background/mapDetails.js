// Map-only review composition. Coordinates belong to moonlit-garden.webp.
export const MAP_DETAILS = Object.freeze([
  { kind: 'pond', x: 330, y: 760, width: 180, height: 135 },
  { kind: 'pond', x: 530, y: 660, width: 180, height: 135 },
  { kind: 'pond', x: 350, y: 1100, width: 180, height: 135 },
  { kind: 'pond', x: 500, y: 1250, width: 180, height: 135 },
  { kind: 'pond', x: 380, y: 300, width: 180, height: 135 },
  { kind: 'pond', x: 510, y: 50, width: 180, height: 135 },
  { kind: 'pond', x: 650, y: 750, width: 130, height: 110 },
  { kind: 'pond', x: 270, y: 1040, width: 130, height: 110 },
  { kind: 'lamp', x: 94, y: 246, width: 58, height: 72 },
  { kind: 'lamp', x: 866, y: 110, width: 52, height: 64 },
  { kind: 'lamp', x: 917, y: 902, width: 62, height: 78 },
  { kind: 'lamp', x: 45, y: 1170, width: 70, height: 85 },
]);

const SVG_NS = 'http://www.w3.org/2000/svg';
export const POND_DURATION = 28000;

function svg(doc, className, paths) {
  const node = doc.createElementNS(SVG_NS, 'svg');
  node.setAttribute('viewBox', '0 0 40 30');
  node.setAttribute('focusable', 'false'); node.classList.add(className);
  for (const [tag, attributes] of paths) {
    const child = doc.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attributes)) child.setAttribute(key, value);
    node.append(child);
  }
  return node;
}

/** Two native timelines share one clock; no callbacks at splash/loop boundaries. */
export function renderPond(doc, wrapper, rect, animate) {
  const scale = Math.min(1, rect.width / 100, rect.height / 67);
  const width = 18 * scale, height = 14 * scale;
  const pad = svg(doc, 'ambient-bg-lily', [
    ['path', { d: 'M20 15L34 6C12-5-8 12 6 23C16 32 40 23 39 12Z', fill: '#47745c', stroke: '#789278', 'stroke-width': '1' }],
    ['path', { d: 'M20 15L8 20M20 15L12 6M20 15L31 22', fill: 'none', stroke: '#8ba47c', 'stroke-opacity': '.5' }],
  ]);
  Object.assign(pad.style, { left: '12%', top: '37%', width: `${29 * scale}px`, height: `${21 * scale}px` });
  const frog = svg(doc, 'ambient-bg-frog', [
    ['path', { d: 'M9 15Q0 19 5 25L15 23Q20 27 25 23L35 25Q40 19 31 15Q31 4 20 6Q9 4 9 15Z', fill: '#748e57', stroke: '#314e40', 'stroke-width': '1.2' }],
    ['path', { d: 'M13 18Q20 13 27 18L26 23Q20 26 14 23Z', fill: '#b1b581' }],
    ['path', { d: 'M12 11a3 3 0 1 0 0-.1M28 11a3 3 0 1 0 0-.1', fill: '#d0c78e' }],
    ['path', { d: 'M12 10v2M28 10v2', stroke: '#1b3830', 'stroke-width': '2' }],
  ]);
  Object.assign(frog.style, { left: '17%', top: '32%', width: `${width}px`, height: `${height}px` });
  const ripple = doc.createElement('div'); ripple.className = 'ambient-bg-ripple';
  Object.assign(ripple.style, { left: '50%', top: '60%', width: `${26 * scale}px`, height: `${9 * scale}px` });
  wrapper.append(pad, ripple, frog);
  const pose = (x, y, rotation = 0, size = 1) => `translate(${rect.width * x}px, ${rect.height * y}px) rotate(${rotation}deg) scale(${size})`;
  animate(frog, [
    { offset: 0, transform: pose(0, 0), opacity: .92 },
    { offset: .35, transform: pose(0, 0), opacity: .92 },
    { offset: .37, transform: pose(0, .015, 0, .88), opacity: .92 },
    { offset: .40, transform: pose(.18, -.19, 12), opacity: .92 },
    { offset: .43, transform: pose(.34, .24, 35, .8), opacity: .55 },
    { offset: .48, transform: pose(.40, .27, 55, .78), opacity: .5 },
    { offset: .58, transform: pose(.56, .20, -20, .78), opacity: .5 },
    { offset: .66, transform: pose(.44, .08, -55, .78), opacity: .5 },
    { offset: .70, transform: pose(.25, -.20, -15), opacity: .92 },
    { offset: .74, transform: pose(0, 0), opacity: .92 },
    { offset: 1, transform: pose(0, 0), opacity: .92 },
  ], { duration: POND_DURATION, iterations: Infinity, easing: 'linear' });
  animate(ripple, [
    { offset: 0, transform: 'scale(.25)', opacity: 0 },
    { offset: .425, transform: 'scale(.25)', opacity: 0 },
    { offset: .435, transform: 'scale(.4)', opacity: .48 },
    { offset: .49, transform: 'scale(1.6)', opacity: 0 },
    { offset: .8, transform: 'scale(.25)', opacity: 0 },
    { offset: .81, transform: 'scale(.4)', opacity: .24 },
    { offset: .94, transform: 'scale(1.6)', opacity: 0 },
    { offset: 1, transform: 'scale(1.6)', opacity: 0 },
  ], { duration: POND_DURATION, iterations: Infinity, easing: 'linear' });
}
