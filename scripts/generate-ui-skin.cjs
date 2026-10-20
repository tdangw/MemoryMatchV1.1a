// Source artwork and crop metadata live in docs/design/advanced-ui, outside the bundle.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require(process.env.UI_SKIN_SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'docs/design/advanced-ui');
const output = path.join(root, 'public/assets/ui/woodland');
const crops = [
  ['nameplate', 39, 79, 695, 211, [48, 82, 48, 82]],
  ['paper-panel', 815, 55, 674, 251, [42, 42, 42, 42]],
  ['selected-tab', 221, 360, 325, 315, [64, 64, 90, 64]],
  ['icon-base', 1000, 367, 303, 309, null],
  ['notice', 41, 762, 693, 171, [32, 40, 32, 40]],
  ['slider-thumb', 1019, 710, 264, 267, null],
];
async function main() {
  const reference = JSON.parse(await fs.readFile(path.join(sourceRoot, 'woodland/manifest.json'), 'utf8'));
  const manifest = { version: 1, id: 'woodland', assets: {}, bundles: { core: [], rewards: [] } };
  await fs.mkdir(output, { recursive: true });
  async function write(id, image, meta, bundle) {
    const bytes = await image.webp({ quality: meta.quality || 88, alphaQuality: 100 }).toBuffer();
    const info = await sharp(bytes).metadata();
    const entry = { file: `${id}.webp`, width: info.width, height: info.height,
      bytes: bytes.length, pivot: { x: .5, y: .5 }, ...meta,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
    manifest.assets[id] = entry; manifest.bundles[bundle].push(id);
    if (process.argv.includes('--check')) {
      const actual = await fs.readFile(path.join(output, entry.file));
      if (!actual.equals(bytes)) throw new Error(`Out of date: ${entry.file}`);
    } else await fs.writeFile(path.join(output, entry.file), bytes);
  }
  for (const [id, meta] of Object.entries(reference.assets)) {
    if (['orange-normal', 'orange-pressed', 'green-normal', 'green-pressed'].includes(id)) continue;
    const image = sharp(path.join(sourceRoot, 'woodland', meta.file));
    if (id === 'ribbon') image.resize({ width: 1200 });
    await write(id, image, {
      source: `woodland/${meta.file}`, sourceBounds: meta.sourceBounds,
      quality: id === 'panel' ? 80 : 88,
      nineSlice: meta.nineSlice || null, maxCssWidth: id === 'panel' ? 600 : id === 'ribbon' ? 600 : id.includes('star') ? 64 : id.includes('normal') || id.includes('pressed') ? 224 : 64,
      dpr: id.includes('star') ? 3 : 2,
    }, ['panel', 'ribbon', 'star-earned', 'star-unearned'].includes(id) ? 'rewards' : 'core');
  }
  const buttonIds = ['orange-normal', 'orange-pressed', 'green-normal', 'green-pressed'];
  for (const [row, id] of buttonIds.entries()) {
    const crop = { left: 97, top: row * 256 + [41, 27, 20, 8][row], width: 1343, height: 206 };
    await write(id, sharp(path.join(sourceRoot, 'screens/sources/buttons-v2.png')).extract(crop).resize(1200, 184), {
      source: 'screens/sources/buttons-v2.png', sourceBounds: crop,
      nineSlice: { top: 30, right: 100, bottom: 30, left: 100 }, maxCssWidth: 400, dpr: 3,
      pairedState: id.replace(id.endsWith('pressed') ? 'pressed' : 'normal', id.endsWith('pressed') ? 'normal' : 'pressed'),
      contentInset: { top: 30, right: 100, bottom: 30, left: 100 },
    }, 'core');
  }
  for (const [id, left, top, width, height, slice] of crops) {
    await write(id, sharp(path.join(sourceRoot, 'screens/sources/core-materials-v1.png')).extract({ left, top, width, height }), {
      source: 'screens/sources/core-materials-v1.png', sourceBounds: { left, top, width, height },
      nineSlice: slice && { top: slice[0], right: slice[1], bottom: slice[2], left: slice[3] },
      maxCssWidth: id === 'selected-tab' ? 100 : id === 'icon-base' ? 80 : id === 'slider-thumb' ? 44 : 330,
      dpr: id === 'icon-base' || id === 'slider-thumb' || id === 'selected-tab' ? 3 : 2,
    }, 'core');
  }
  // Measure the actual islands: generated row gutters are not an exact grid.
  const chestSource = path.join(sourceRoot, 'screens/sources/chests-v2.png');
  const { data, info } = await sharp(chestSource).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const visited = new Uint8Array(info.width * info.height), queue = new Int32Array(visited.length), islands = [];
  for (let start = 0; start < visited.length; start++) {
    if (visited[start] || data[start * 4 + 3] <= 32) continue;
    let head = 0, tail = 1, left = info.width, top = info.height, right = 0, bottom = 0;
    queue[0] = start; visited[start] = 1;
    while (head < tail) {
      const index = queue[head++], x = index % info.width, y = Math.floor(index / info.width);
      left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
      for (const neighbor of [x ? index - 1 : -1, x + 1 < info.width ? index + 1 : -1, index - info.width, index + info.width]) {
        if (neighbor < 0 || neighbor >= visited.length || visited[neighbor] || data[neighbor * 4 + 3] <= 32) continue;
        visited[neighbor] = 1; queue[tail++] = neighbor;
      }
    }
    if (tail > 10000) islands.push({ left: left - 4, top: top - 4, width: right - left + 9, height: bottom - top + 9 });
  }
  if (islands.length !== 8) throw new Error(`Expected eight separate chests, found ${islands.length}`);
  islands.sort((a, b) => a.top - b.top);
  for (let row = 0; row < 4; row++) {
    const pair = islands.slice(row * 2, row * 2 + 2).sort((a, b) => a.left - b.left);
    for (const [column, crop] of pair.entries()) {
      if (crop.left < 0 || crop.top < 0 || crop.left + crop.width >= info.width || crop.top + crop.height >= info.height) throw new Error('Clipped chest');
      const tier = ['C', 'B', 'A', 'S'][row], state = column ? 'open' : 'closed';
      const bytes = await sharp(chestSource).extract(crop).png().toBuffer();
      const frame = sharp({ create: { width: 480, height: 400, channels: 4, background: '#00000000' } })
        .composite([{ input: bytes, left: Math.round((480 - crop.width) / 2), top: 370 - crop.height }]);
      await write(`chest-${tier}-${state}`, frame, {
        source: 'screens/sources/chests-v2.png', sourceBounds: crop,
        frame: { width: 480, height: 400 }, pivot: { x: .5, y: .925 }, nineSlice: null,
        maxCssWidth: 160, dpr: 3, pairedState: `chest-${tier}-${column ? 'closed' : 'open'}`,
      }, 'rewards');
    }
  }
  // Reuse the existing illustrated functional icon set; do not duplicate its files.
  const { pathToFileURL } = require('node:url');
  const { UI_ART_ICONS } = await import(pathToFileURL(path.join(root, 'js/uiArtManifest.js')));
  const iconRules = ['/* Generated by scripts/generate-ui-skin.cjs; illustrated skin modifiers only. */'];
  for (const name of ['shop', 'collection', 'map', 'trophy', 'settings', 'account', 'missions', 'events', 'info', 'play', 'restart', 'search', 'shuffle', 'snowflake', 'eye', 'undo', 'expand', 'wand', 'exit', 'book', 'energy']) {
    const file = UI_ART_ICONS[name], bytes = await fs.readFile(path.join(root, 'public', file));
    const info = await sharp(bytes).metadata();
    manifest.assets[`icon-${name}`] = { file: `../../${file.replace('/assets/', '')}`, width: info.width, height: info.height,
      bytes: bytes.length, source: file, pivot: { x: .5, y: .5 }, nineSlice: null, maxCssWidth: 40, dpr: 3,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
    manifest.bundles.core.push(`icon-${name}`);
    iconRules.push(`html[data-ui-skin="woodland"] .ui-icon--${name} { background: url('${file}') center / contain no-repeat; }`,
      `html[data-ui-skin="woodland"] .ui-icon--${name} > * { visibility: hidden; }`);
  }
  for (const [bundle, ids] of Object.entries(manifest.bundles)) {
    const bytes = ids.reduce((sum, id) => sum + manifest.assets[id].bytes, 0);
    if (bytes > (bundle === 'core' ? 600 : 400) * 1024) throw new Error(`${bundle} budget exceeded: ${bytes}`);
    console.log(`${bundle}: ${ids.length} assets, ${bytes} bytes`);
  }
  const json = JSON.stringify(manifest, null, 2) + '\n';
  if (process.argv.includes('--check')) {
    if (await fs.readFile(path.join(output, 'manifest.json'), 'utf8') !== json) throw new Error('Manifest out of date');
  } else await fs.writeFile(path.join(output, 'manifest.json'), json);
  const moduleText = '// Generated by scripts/generate-ui-skin.cjs.\nexport const UI_SKIN_ASSETS = ' + json.trim() + ';\n';
  const modulePath = path.join(root, 'js/uiSkinManifest.js');
  if (process.argv.includes('--check')) {
    if (await fs.readFile(modulePath, 'utf8') !== moduleText) throw new Error('Source manifest out of date');
  } else await fs.writeFile(modulePath, moduleText);
  const iconCss = iconRules.join('\n') + '\n', iconPath = path.join(root, 'styles/ui-skin-icons.css');
  if (process.argv.includes('--check')) {
    if (await fs.readFile(iconPath, 'utf8') !== iconCss) throw new Error('Icon stylesheet out of date');
  } else await fs.writeFile(iconPath, iconCss);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
