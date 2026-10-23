import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { UI_SKIN_CHOICES, normalizeUiSkin, createUiSkinController } from '../../js/uiSkinController.js';
import { getUiSkinPack } from '../../js/uiSkinRegistry.js';
test('S1 five skins retain stable IDs and approved storybook bundles are bounded', async () => {
  assert.deepEqual(UI_SKIN_CHOICES.map(skin => skin.id), ['default', 'woodland', 'papercut', 'starship', 'storybook']);
  for (const { id } of UI_SKIN_CHOICES) assert.equal(normalizeUiSkin(id), id);
  assert.equal(normalizeUiSkin('future'), 'default');
  const pack = getUiSkinPack('storybook');
  assert.equal(pack.bundles.core.length, 5); assert.equal(pack.bundles.rewards.length, 8);
  let decoded = 0;
  for (const asset of Object.values(pack.assets)) {
    await fs.access(`public/${pack.base}${asset.file}`); decoded += asset.width * asset.height * 4;
  }
  assert(decoded < 24 * 1024 * 1024);
});
test('S1 storybook failed load/save and stale owner cannot replace selected skin', async () => {
  let owner = {}, applied = [], fail = 'load';
  const controller = createUiSkinController({ captureOwner: () => owner,
    load: async () => { if (fail === 'load') throw Error('load'); if (fail === 'owner') owner = {}; },
    save: async () => fail !== 'save', apply: value => applied.push(value) });
  for (const phase of ['load', 'save']) { fail = phase; assert.equal((await controller.select('storybook')).status, 'error'); }
  fail = 'owner'; assert.equal((await controller.select('storybook')).status, 'stale'); assert.deepEqual(applied, []);
  fail = ''; assert.equal((await controller.select('storybook')).status, 'applied');
  controller.dispose(); assert.equal((await controller.select('default')).status, 'stale'); assert.deepEqual(applied, ['storybook']);
});
