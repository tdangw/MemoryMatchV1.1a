import { UI_SKIN_ASSETS } from './uiSkinManifest.js';
import { UI_STYLE_PACKS } from './uiStylePacks.generated.js';
import { STORYBOOK_UI_PACK } from './storybook/skin.generated.js';
const woodland = { id: 'woodland', name: 'Nâng cao', base: 'assets/ui/woodland/',
  assets: UI_SKIN_ASSETS.assets, bundles: UI_SKIN_ASSETS.bundles };
export function getUiSkinPack(skin) { return skin === 'storybook' ? STORYBOOK_UI_PACK : skin === 'woodland' ? woodland : UI_STYLE_PACKS[skin]; }
export function getUiSkinAsset(skin, id) {
  const pack = getUiSkinPack(skin);
  if (!pack) return null;
  const resolved = pack.aliases?.[id] || id;
  return pack.assets[id] || pack.assets[resolved] || pack.assets['vector-' + resolved] || null;
}
export function uiSkinAssetUrl(skin, id) {
  const asset = getUiSkinAsset(skin, id), pack = getUiSkinPack(skin);
  return asset ? `${import.meta.env?.BASE_URL || '/'}${pack.base}${asset.file}` : null;
}
