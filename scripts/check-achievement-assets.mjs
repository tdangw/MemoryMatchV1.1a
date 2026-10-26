import { readFileSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';
import { ACHIEVEMENT_ITEMS, PROFILE_COSMETIC_ITEMS } from '../js/progression/achievementModel.js';
import { STORYBOOK_CONTRACT } from '../design/storybook/contract.mjs';
import { STORYBOOK_UI_PACK } from '../js/storybook/skin.generated.js';
import { UI_ART_ICONS } from '../js/uiArtManifest.js';
import { createRequire } from 'node:module';
const sharp = createRequire(import.meta.url)(process.env.UI_SKIN_SHARP_MODULE || 'sharp');
const size = (item, resolution) => statSync(`public/${item.files[resolution].replace(/^\//, '')}`).size;
const budgets = STORYBOOK_CONTRACT.budgets;
// Approved surface policy: twelve mounted inventory thumbnails at 128px,
// ten-level collection pages. All original budgets remain unchanged.
const surfaces = [];
for (const type of ['avatar', 'frame', 'badge']) {
  const items = PROFILE_COSMETIC_ITEMS.filter(item => item.type === type);
  for (let start = 0; start < items.length; start += 12)
    surfaces.push(items.slice(start, start + 12).reduce((sum, item) => sum + size(item, 128), 0));
}
for (const game of ['memory-match', 'link-connect', 'triple-connect']) for (let block = 0; block < 3; block++)
  surfaces.push(ACHIEVEMENT_ITEMS.filter(item => item.gameId === game && item.level > block * 10 && item.level <= (block + 1) * 10)
    .reduce((sum, item) => sum + size(item, 128), 0));
const allRewards=[...new Map([...ACHIEVEMENT_ITEMS,...PROFILE_COSMETIC_ITEMS].map(item=>[item.id,item])).values()];
const maxHero = Math.max(...allRewards.map(item => size(item,512)));
const manifest = JSON.parse(readFileSync('design/storybook/packed/manifest.json','utf8'));
const icons = [...new Set(Object.values(UI_ART_ICONS))];
const iconMetadata = await Promise.all(icons.map(path=>sharp(`public${path}`).metadata()));
const iconBytes = icons.reduce((sum,path)=>sum+statSync(`public${path}`).size,0);
const iconDecoded = iconMetadata.reduce((sum,info)=>sum+info.width*info.height*4,0);
const rewardDecoded = STORYBOOK_UI_PACK.bundles.rewards.reduce((sum,id)=>sum+STORYBOOK_UI_PACK.assets[id].width*STORYBOOK_UI_PACK.assets[id].height*4,0);
const previewBytes = ['avatar','frame','badge'].reduce((sum,type)=>sum+Math.max(...PROFILE_COSMETIC_ITEMS.filter(item=>item.type===type).map(item=>size(item,256))),0);
const maxThumbnailSurface = Math.max(...surfaces)+previewBytes;
const liveDecoded = manifest.decodedBytes + iconDecoded + rewardDecoded + 12 * 128 * 128 * 4 + 3 * 256 * 256 * 4 + 3 * 128 * 128 * 4;
assert(manifest.totalBytes+iconBytes<=budgets.coreBytes);
assert(maxThumbnailSurface <= budgets.thumbnailBytesPerSurface); assert(maxHero <= budgets.heroBytes); assert(liveDecoded <= budgets.liveDecodedBytes);
console.log(JSON.stringify({ coreAndAllIconBytes:manifest.totalBytes+iconBytes, thumbnailListBytes:surfaces,maxThumbnailSurfaceBytes:maxThumbnailSurface,maxHeroBytes:maxHero,estimatedStorybookLiveDecodedBytes:liveDecoded, result:'PASS' }));
