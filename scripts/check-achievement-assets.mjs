import { readFileSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';
import { ACHIEVEMENT_ITEMS } from '../js/progression/achievementModel.js';
import { STORYBOOK_CONTRACT } from '../design/storybook/contract.mjs';
import { STORYBOOK_UI_PACK } from '../js/storybook/skin.generated.js';
import { UI_ART_ICONS } from '../js/uiArtManifest.js';
import { createRequire } from 'node:module';
const sharp = createRequire(import.meta.url)(process.env.UI_SKIN_SHARP_MODULE || 'sharp');
const size = (item, resolution) => statSync(`public/${item.files[resolution].replace(/^\//, '')}`).size;
const budgets = STORYBOOK_CONTRACT.budgets;
const surfaces = [
  ...['avatar','frame','badge'].map(type => ACHIEVEMENT_ITEMS.filter(item => item.type === type).reduce((sum,item) => sum + size(item,256),0)),
  ...['memory-match','link-connect','triple-connect'].map(game => ACHIEVEMENT_ITEMS.filter(item => item.gameId === game).reduce((sum,item) => sum + size(item,128),0)),
];
const maxHero = Math.max(...ACHIEVEMENT_ITEMS.map(item => size(item,512)));
const manifest = JSON.parse(readFileSync('design/storybook/packed/manifest.json','utf8'));
const icons = [...new Set(Object.values(UI_ART_ICONS))];
const iconMetadata = await Promise.all(icons.map(path=>sharp(`public${path}`).metadata()));
const iconBytes = icons.reduce((sum,path)=>sum+statSync(`public${path}`).size,0);
const iconDecoded = iconMetadata.reduce((sum,info)=>sum+info.width*info.height*4,0);
const rewardDecoded = STORYBOOK_UI_PACK.bundles.rewards.reduce((sum,id)=>sum+STORYBOOK_UI_PACK.assets[id].width*STORYBOOK_UI_PACK.assets[id].height*4,0);
const previewBytes = ['avatar','frame','badge'].reduce((sum,type)=>sum+Math.max(...ACHIEVEMENT_ITEMS.filter(item=>item.type===type).map(item=>size(item,256))),0);
const maxThumbnailSurface = Math.max(...surfaces)+previewBytes;
const liveDecoded = manifest.decodedBytes + iconDecoded + rewardDecoded + (9 + 3) * 256 * 256 * 4 + 3 * 128 * 128 * 4;
assert(manifest.totalBytes+iconBytes<=budgets.coreBytes);
assert(maxThumbnailSurface <= budgets.thumbnailBytesPerSurface); assert(maxHero <= budgets.heroBytes); assert(liveDecoded <= budgets.liveDecodedBytes);
console.log(JSON.stringify({ coreAndAllIconBytes:manifest.totalBytes+iconBytes, thumbnailListBytes:surfaces,maxThumbnailSurfaceBytes:maxThumbnailSurface,maxHeroBytes:maxHero,estimatedStorybookLiveDecodedBytes:liveDecoded, result:'PASS' }));
