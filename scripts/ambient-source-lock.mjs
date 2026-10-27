import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { SCENE_PRESETS, MAP_SCENE } from '../js/background/presets.js';
import { MAP_DETAILS } from '../js/background/mapDetails.js';

const sources = [...Object.values(SCENE_PRESETS).flatMap(preset => [preset.portrait, preset.landscape]),
  { ...MAP_SCENE, regions: [...MAP_SCENE.regions, ...MAP_DETAILS] }];
const manifest = sources.map(({ source, width, height, regions }) => ({ source, width, height, regions,
  sha256: createHash('sha256').update(readFileSync(`public${source}`)).digest('hex') }));
const output = 'design/animated-backgrounds/source-lock.json', content = JSON.stringify(manifest, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (readFileSync(output, 'utf8').replaceAll('\r\n', '\n') !== content) throw new Error('Background source or region metadata changed; re-anchor/review before regenerating the source lock');
  console.log('Seven background sources and region metadata match the approved source lock.');
} else {
  mkdirSync('design/animated-backgrounds', { recursive: true }); writeFileSync(output, content);
}
