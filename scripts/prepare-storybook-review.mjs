import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const sharp = createRequire(import.meta.url)(process.env.UI_SKIN_SHARP_MODULE || 'sharp');
const input = 'docs/design/achievements/runtime/qa';
const output = 'design/storybook/review';
await fs.mkdir(output, { recursive: true });
const manifest = { status: 'awaiting-owner-visual-approval', goldenApproved: false,
  renderer: 'Chrome, DPR1, 412x915, Storybook Nunito ready, reduced motion',
  scope: 'real app map + real openAppModal, fixture data, presentation only; not grant/equip/public sync acceptance',
  screenshots: [], anchors: {} };
for (const kind of ['reward', 'profile', 'collection']) {
  const file = `reference-${kind}.png`, bytes = await fs.readFile(`${input}/${file}`);
  await fs.writeFile(`${output}/${file}`, bytes);
  manifest.screenshots.push({ kind, file, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
  manifest.anchors[kind] = JSON.parse(await fs.readFile(`${input}/reference-${kind}.json`, 'utf8'));
}
await sharp({ create: { width: 1236, height: 915, channels: 4, background: '#081b22' } })
  .composite(manifest.screenshots.map((entry, index) => ({ input: `${output}/${entry.file}`, left: index * 412, top: 0 })))
  .webp({ quality: 92 }).toFile(`${output}/overview.webp`);
await fs.writeFile(`${output}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log('Prepared three real-app reference screenshots and measured anchors; golden approval is pending.');
