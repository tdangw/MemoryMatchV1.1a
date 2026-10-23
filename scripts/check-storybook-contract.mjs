import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { STORYBOOK_CONTRACT as c } from '../design/storybook/contract.mjs';

assert.equal(c.skin.id, 'storybook');
assert.deepEqual(c.referenceViewport, [412, 915]);
assert.equal(c.layout.minHitTarget, 44);
const componentIds = new Set();
for (const component of c.components) {
  assert(!componentIds.has(component.id), `Duplicate component ${component.id}`);
  componentIds.add(component.id);
  assert(component.slots.length && component.preserve.length);
  for (const owner of component.owners) await fs.access(owner);
  for (const part of component.parts) assert(c.parts[part], `${component.id}: unknown part ${part}`);
}
for (const part of Object.values(c.parts)) {
  await fs.access(`design/storybook/masters/${part.source}.png`);
  assert(part.roles.length);
  assert(['nine-slice', 'tile-center', 'edge-strip', 'three-slice', 'fixed-frame'].includes(part.mode));
  if (part.capRatio) assert(part.capRatio > 0 && part.capRatio < .5);
}
const iconSource = await fs.readFile(c.icons.owner, 'utf8');
const iconBlock = iconSource.split('const ICON_PATHS = Object.freeze({')[1].split('\n});')[0];
const iconIds = [...iconBlock.matchAll(/^  (?:"([^"]+)"|'([^']+)'|([\w-]+)):/gm)].map(match => match[1] || match[2] || match[3]);
assert(iconIds.length >= 60, 'Inventory must cover the complete functional icon family');
for (const target of Object.values(c.icons.aliases)) assert(iconIds.includes(target));
const draft = JSON.parse(await fs.readFile('docs/design/achievements/layout-contract.draft.json', 'utf8'));
let slots = 0;
for (const component of Object.values(draft.components)) {
  if (!component.logicalSize) continue;
  const [width, height] = component.logicalSize;
  for (const [name, slot] of Object.entries(component.slots)) {
    const [x, y, w, h] = slot.rect;
    assert(x >= 0 && y >= 0 && x + w <= width && y + h <= height, name);
    slots++;
  }
}
assert.equal(c.review.goldenApproved, true, 'The owner approved the D2 golden on 2026-10-23');
console.log(JSON.stringify({ result: 'PASS', components: componentIds.size, parts: Object.keys(c.parts).length,
  functionalIcons: iconIds.length, draftSlotsInBounds: slots, publicCosmetics: c.cosmetics.publicScope }));
