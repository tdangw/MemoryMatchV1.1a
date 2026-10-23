import { readFileSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';
import { ACHIEVEMENT_ITEMS } from '../js/progression/achievementModel.js';
import { STORYBOOK_CONTRACT } from '../design/storybook/contract.mjs';
const size = (item, resolution) => statSync(`public/${item.files[resolution].replace(/^\//, '')}`).size;
const budgets = STORYBOOK_CONTRACT.budgets;
const surfaces = [
  ...['avatar','frame','badge'].map(type => ACHIEVEMENT_ITEMS.filter(item => item.type === type).reduce((sum,item) => sum + size(item,256),0)),
  ...['memory-match','link-connect','triple-connect'].map(game => ACHIEVEMENT_ITEMS.filter(item => item.gameId === game).reduce((sum,item) => sum + size(item,128),0)),
];
const maxHero = Math.max(...ACHIEVEMENT_ITEMS.map(item => size(item,512)));
const manifest = JSON.parse(readFileSync('design/storybook/packed/manifest.json','utf8'));
const liveDecoded = manifest.decodedBytes + (9 + 3) * 256 * 256 * 4 + 3 * 128 * 128 * 4;
assert(Math.max(...surfaces) <= budgets.thumbnailBytesPerSurface); assert(maxHero <= budgets.heroBytes); assert(liveDecoded <= budgets.liveDecodedBytes);
console.log(JSON.stringify({ thumbnailSurfaceBytes:surfaces,maxHeroBytes:maxHero,estimatedMaxLiveDecodedBytes:liveDecoded, result:'PASS' }));
