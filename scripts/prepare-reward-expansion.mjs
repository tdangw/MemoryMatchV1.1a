import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

// Offline art pipeline only. No runtime catalog, ownership or public assets writes.
const require = createRequire(import.meta.url);
const sharp = require(process.env.UI_SKIN_SHARP_MODULE || 'sharp');
const root = 'design/rewards-liveops';
const legacyRoot = 'docs/design/achievements/art-kit-v1';
const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const clear = (width, height) => sharp({ create: { width, height, channels: 4, background: '#00000000' } });
const catalog = await read(`${root}/catalog.source.json`);
const source = await read(`${root}/art-source.json`);
const legacy = await read(`${legacyRoot}/manifest.json`);
const [width, height] = legacy.canvas;
assert.deepEqual([width, height], [512, 512]);
const { avatarRect, frameInnerCircle } = legacy;

function bounds(data, w, h) {
  let left = w, top = h, right = -1, bottom = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 8) {
    left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
  }
  assert(right >= left, 'Empty source');
  assert(left >= 2 && top >= 2 && right < w - 2 && bottom < h - 2, 'Source touches canvas: redraw with margin');
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

function region(data, w, h, seed, enclosed = false) {
  const mask = new Uint8Array(w * h), queue = new Int32Array(w * h);
  assert(data[seed * 4 + 3] <= 8, 'Expected transparent seed');
  let head = 0, tail = 1, left = w, top = h, right = -1, bottom = -1;
  queue[0] = seed; mask[seed] = 1;
  while (head < tail) {
    const p = queue[head++], x = p % w, y = Math.floor(p / w);
    if (enclosed) assert(x > 0 && x < w - 1 && y > 0 && y < h - 1, 'Frame aperture leaks outside');
    left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
    const next = [];
    if (x > 0) next.push(p - 1); if (x < w - 1) next.push(p + 1);
    if (y > 0) next.push(p - w); if (y < h - 1) next.push(p + w);
    for (const n of next) if (!mask[n] && data[n * 4 + 3] <= 8) { mask[n] = 1; queue[tail++] = n; }
  }
  return { mask, bounds: { left, top, width: right - left + 1, height: bottom - top + 1 }, pixels: tail };
}

await fs.mkdir(`${root}/sprites`, { recursive: true });
await fs.mkdir(`${root}/review`, { recursive: true });
const manifest = { version: 1, status: 'representative-art-review', runtimeApproved: false,
  canvas: [width, height], pivot: legacy.pivot, avatarRect, frameInnerCircle, items: {} };
const ids = new Set();
for (const entry of source.items) {
  assert(!ids.has(entry.id), 'Duplicate artwork source'); ids.add(entry.id);
  const item = catalog.items.find(candidate => candidate.id === entry.id);
  assert(item, `Unknown approved brief ${entry.id}`);
  const input = await fs.readFile(`${root}/${entry.sourceFile}`);
  const metadata = await sharp(input).metadata();
  assert(metadata.hasAlpha, `${item.id}: native transparent alpha required`);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const p of [0, info.width - 1, (info.height - 1) * info.width, info.height * info.width - 1])
    assert.equal(data[p * 4 + 3], 0, `${item.id}: native corner must be clear`);
  const b = bounds(data, info.width, info.height);
  let scale, left, top, hole = null;
  if (item.type === 'frame') {
    const measured = region(data, info.width, info.height, Math.floor(info.height / 2) * info.width + Math.floor(info.width / 2), true);
    const hb = measured.bounds;
    assert(Math.abs(hb.width / hb.height - 1) <= .1, `Frame aperture must be circular: ${hb.width}x${hb.height}`);
    hole = { ...hb, radius: Math.min(hb.width, hb.height) / 2, pixels: measured.pixels };
    scale = frameInnerCircle.radius / hole.radius;
    left = Math.round(256 - (hb.left + (hb.width - 1) / 2 - b.left) * scale);
    top = Math.round(256 - (hb.top + (hb.height - 1) / 2 - b.top) * scale);
  } else if (item.type === 'avatar') {
    scale = Math.max(avatarRect.width / b.width, avatarRect.height / b.height);
    left = avatarRect.left; top = avatarRect.top;
  } else {
    scale = Math.min(400 / b.width, 400 / b.height);
    left = Math.round((width - b.width * scale) / 2); top = Math.round((height - b.height * scale) / 2);
  }
  assert(scale <= 1, `${item.id}: never upscale`);
  const targetWidth = item.type === 'avatar' ? avatarRect.width : Math.round(b.width * scale);
  const targetHeight = item.type === 'avatar' ? avatarRect.height : Math.round(b.height * scale);
  assert(left >= 8 && top >= 8 && left + targetWidth <= 504 && top + targetHeight <= 504, `${item.id}: ornament exceeds shared canvas`);
  const art = await sharp(input).extract(b).resize(targetWidth, targetHeight, { fit: 'cover', position: 'centre' }).png().toBuffer();
  const png = await clear(width, height).composite([{ input: art, left, top }]).png().toBuffer();
  await fs.writeFile(`${root}/sprites/${item.id}.png`, png);
  const exports = {};
  for (const size of [128, 256, 512]) {
    const bytes = await sharp(png).resize(size, size).webp({ quality: size === 512 ? 90 : 88, alphaQuality: 100, effort: 5 }).toBuffer();
    const file = `sprites/${item.id}-${size}.webp`;
    await fs.writeFile(`${root}/${file}`, bytes);
    exports[size] = { file, bytes: bytes.length, sha256: hash(bytes) };
  }
  manifest.items[item.id] = { id: item.id, name: item.name, type: item.type, gameId: item.gameId, level: item.level,
    canvas: [width, height], pivot: legacy.pivot, contentRect: { left, top, width: targetWidth, height: targetHeight },
    source: { file: entry.sourceFile, width: info.width, height: info.height, bounds: b, sha256: hash(input), aperture: hole },
    scale, nativeUpscaled: false, png: `sprites/${item.id}.png`, pngSha256: hash(png), exports };
}
await fs.writeFile(`${root}/art-manifest.json`, JSON.stringify(manifest, null, 2) + '\n');

// Compare actual alpha against every legacy portrait/frame as well as the new set.
const assets = [];
for (const item of Object.values(legacy.items).filter(item => ['avatar', 'frame', 'badge'].includes(item.type))) {
  const bytes = await fs.readFile(`${legacyRoot}/${item.png}`);
  assert.equal(hash(bytes), item.pngSha256, 'Legacy artwork changed');
  assets.push({ ...item, bytes });
}
for (const item of Object.values(manifest.items)) assets.push({ ...item, bytes: await fs.readFile(`${root}/${item.png}`) });
for (const item of assets) item.raw = await sharp(item.bytes).ensureAlpha().raw().toBuffer();
const avatars = assets.filter(item => item.type === 'avatar'), frames = assets.filter(item => item.type === 'frame');
const pairs = [];
for (const frame of frames) {
  const inside = region(frame.raw, width, height, 256 * width + 256, true).mask;
  const outside = region(frame.raw, width, height, 0).mask;
  for (const avatar of avatars) {
    let uncoveredHole = 0, outsideLeak = 0;
    for (let p = 0; p < width * height; p++) {
      if (inside[p] && avatar.raw[p * 4 + 3] < 240) uncoveredHole++;
      if (outside[p] && frame.raw[p * 4 + 3] === 0 && avatar.raw[p * 4 + 3] > 8) outsideLeak++;
    }
    pairs.push({ avatar: avatar.id, frame: frame.id, uncoveredHole, outsideLeak });
  }
}
const failedPairs = pairs.filter(pair => pair.uncoveredHole || pair.outsideLeak);
const report = { result: failedPairs.length ? 'FAIL' : 'PASS', generatedSprites: source.items.length,
  proposedSprites: catalog.items.length, avatarCount: avatars.length, frameCount: frames.length,
  checkedPairs: pairs.length, finalRequiredPairs: 1156, fullExpansionComplete: false, runtimeChanged: false, failedPairs, pairs };
await fs.writeFile(`${root}/review/alpha-validation.json`, JSON.stringify(report, null, 2) + '\n');
assert.equal(failedPairs.length, 0, JSON.stringify(failedPairs));

const text = (name, color, w, h = 40) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="${w / 2}" y="28" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="20" font-weight="600" fill="${color}">${name.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</text></svg>`);
for (const [name, background, ink] of [['light', '#f5e7cc', '#4a2c1a'], ['dark', '#0c1c30', '#f6e6c5']]) {
  const layers = [];
  for (const [i, item] of Object.values(manifest.items).entries()) {
    layers.push({ input: await sharp(`${root}/${item.png}`).resize(300, 300).png().toBuffer(), left: i * 320 + 10, top: 0 });
    layers.push({ input: text(item.name, ink, 320), left: i * 320, top: 300 });
  }
  await sharp({ create: { width: source.items.length * 320, height: 350, channels: 4, background } })
    .composite(layers).png().toFile(`${root}/review/representatives-${name}.png`);
}
// Every legacy avatar through the new frame, and the new avatar through every frame.
const newAvatar = avatars.find(item => ids.has(item.id)), newFrame = frames.find(item => ids.has(item.id));
const combinations = [...avatars.map(avatar => [avatar, newFrame]), ...frames.map(frame => [newAvatar, frame])];
const layers = [];
for (const [index, [avatar, frame]] of combinations.entries()) {
  const png = await clear(width, height).composite([{ input: avatar.bytes }, { input: frame.bytes }]).png().toBuffer();
  layers.push({ input: await sharp(png).resize(160, 160).png().toBuffer(), left: index % 10 * 160, top: Math.floor(index / 10) * 160 });
}
await sharp({ create: { width: 1600, height: Math.ceil(combinations.length / 10) * 160, channels: 4, background: '#0c1c30' } })
  .composite(layers).png().toFile(`${root}/review/legacy-compatibility.png`);
console.log(JSON.stringify({ ...report, pairs: undefined }));
