import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { STORYBOOK_CONTRACT } from '../design/storybook/contract.mjs';
const sharp = createRequire(import.meta.url)(process.env.UI_SKIN_SHARP_MODULE || 'sharp');
const root = 'design/storybook';
const manifest = JSON.parse(await fs.readFile(`${root}/packed/manifest.json`, 'utf8'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
let bytes = 0, decodedBytes = 0;
for (const [name, asset] of Object.entries(manifest.assets)) {
  const source = await fs.readFile(`${root}/masters/${name}.png`);
  const packed = await fs.readFile(`${root}/packed/${asset.file}`);
  assert.equal(hash(source), asset.sourceSha256);
  assert.equal(hash(packed), asset.sha256);
  const metadata = await sharp(packed).metadata();
  assert(metadata.hasAlpha); assert.equal(metadata.width, asset.width); assert.equal(metadata.height, asset.height);
  assert(asset.width <= asset.sourceBounds.width && asset.height <= asset.sourceBounds.height);
  assert.deepEqual(asset.pivot, [.5, .5]);
  if (asset.cap) assert(asset.cap.x * 2 < asset.width && asset.cap.y * 2 < asset.height);
  bytes += packed.length; decodedBytes += asset.width * asset.height * 4;
}
for (const font of manifest.fonts) {
  const data = await fs.readFile(`${root}/packed/${font.file}`);
  assert.equal(data.toString('ascii', 0, 4), 'wOF2'); assert.equal(hash(data), font.sha256); bytes += data.length;
}
assert.equal(bytes, manifest.totalBytes); assert.equal(decodedBytes, manifest.decodedBytes);
assert(bytes <= manifest.budgets.coreBytes); assert(decodedBytes <= manifest.budgets.liveDecodedBytes);
assert.equal(manifest.goldenApproved, STORYBOOK_CONTRACT.review.goldenApproved);
assert.equal(manifest.reviewOnly, !STORYBOOK_CONTRACT.review.goldenApproved);
console.log(JSON.stringify({ result: 'PASS', assets: 5, fontSubsets: 3, bytes, decodedBytes, goldenApproved: manifest.goldenApproved }));
