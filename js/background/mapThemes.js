// Map artwork and ambient envelopes share normalized 1024×1536 source coordinates.
const accents = color => [120, 440, 760, 1080, 1380].flatMap((y, i) => [
  { kind: 'leaf', x: i % 2 ? 620 : 260, y, width: 72, height: 130, color, detail: true, phase: i * 1700 },
  { kind: 'firefly', x: i % 2 ? 350 : 670, y: y + 65, width: 66, height: 70, detail: true, phase: i * 2100 },
  { kind: 'lamp', x: i % 2 ? 120 : 830, y: y - 20, width: 72, height: 72 },
]);
export const MAP_THEMES = Object.freeze({
  'memory-match': Object.freeze({source:'/assets/adventure/map-memory-match.webp',width:1024,height:1536,regions:accents('#b9dc58')}),
  'link-connect': Object.freeze({source:'/assets/adventure/map-link-connect.webp',width:1024,height:1536,regions:accents('#edbd66')}),
  'triple-connect': Object.freeze({source:'/assets/adventure/map-triple-connect.webp',width:1024,height:1536,regions:accents('#f1b0eb')}),
});
