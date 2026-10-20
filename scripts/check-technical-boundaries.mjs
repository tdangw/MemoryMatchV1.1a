import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { previewMemoryLevel, previewLinkLevel, previewTripleLevel } from '../js/adventurePreview.js';
import { GAME_MODES } from '../js/gameCatalog.js';

// Explicit owner list: keep rule/model dependencies independent of presentation,
// persistence and native SDKs without imposing that restriction on adapters.
for (const file of ['config.js', 'sessionTiming.js', 'memoryMatch/memoryBoard.js', 'linkConnect/linkTurn.js', 'linkConnect/pathfinder.js', 'linkConnect/linkConfig.js', 'tripleConnect/tripleRules.js', 'tripleConnect/tripleState.js', 'tripleConnect/tripleBoard.js', 'tripleConnect/tripleSolver.js']) {
  const source = readFileSync(new URL(`../js/${file}`, import.meta.url), 'utf8');
  const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(match => match[1]);
  assert.ok(imports.every(path => !/(?:Renderer|Presentation|sound|persistence|Storage|nativeAdapter|@capacitor)/i.test(path)), `${file}: rule boundary`);
  assert.doesNotMatch(source, /\b(?:document|localStorage|Audio)\s*[.(]/, `${file}: side effects`);
}
const profile = { items: { hint: 3 }, startedLevels: {}, trayExpansionSlots: 0 };
const before = structuredClone(profile);
const random = Math.random;
Math.random = () => { throw new Error('Preview consumed RNG'); };
try {
  for (const { id } of GAME_MODES) for (const level of [1, 7, 8, 30, 101, 100000]) {
    for (const preview of [previewMemoryLevel, previewLinkLevel, previewTripleLevel]) {
      assert.deepEqual(preview(id, level, profile), preview(id, level, profile));
    }
  }
} finally { Math.random = random; }
assert.deepEqual(profile, before);
console.log('Rule dependency boundaries and RNG-free six-mode/level preview matrix passed.');
