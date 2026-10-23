const svgNamespace = 'http://www.w3.org/2000/svg';
import { getUiSkinAsset, uiSkinAssetUrl } from '../uiSkinRegistry.js';

/** Presentation only. Native children remain available without decoded skin art. */
export function decorateTreasureSkin(art) {
  const skin = document.documentElement.dataset.uiSkin;
  if (document.documentElement.dataset.uiRewards !== 'ready') return;
  const tier = art.dataset.treasureArtTier;
  if (!['C', 'B', 'A', 'S'].includes(tier) || art.querySelector('.treasure-skin-image')) return;
  art.classList.add('has-skin-art');
  for (const state of ['closed', 'open']) {
    const id = `chest-${skin === 'woodland' ? tier : tier.toLowerCase()}-${state}`;
    const asset = getUiSkinAsset(skin, id);
    if (!asset) throw new Error('Missing skin chest ' + id);
    const image = document.createElementNS(svgNamespace, 'image');
    image.classList.add('treasure-skin-image', `treasure-skin-image--${state}`);
    const width = 145 * asset.width / asset.height;
    image.setAttribute('x', String((180 - width) / 2)); image.setAttribute('y', '0');
    image.setAttribute('width', String(width)); image.setAttribute('height', '145');
    image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    image.setAttribute('href', uiSkinAssetUrl(skin, id));
    art.append(image);
  }
}

export function clearTreasureSkins() {
  for (const image of document.querySelectorAll('.treasure-skin-image')) {
    image.parentElement.classList.remove('has-skin-art');
    image.removeAttribute('href'); image.remove();
  }
}

