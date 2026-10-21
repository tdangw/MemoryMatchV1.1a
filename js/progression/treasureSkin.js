const svgNamespace = 'http://www.w3.org/2000/svg';
const base = `${import.meta.env.BASE_URL}assets/ui/woodland/`;

/** Presentation only. Native children remain available without decoded skin art. */
export function decorateTreasureSkin(art) {
  if (document.documentElement.dataset.uiSkin !== 'woodland' || document.documentElement.dataset.uiRewards !== 'ready') return;
  const tier = art.dataset.treasureArtTier;
  if (!['C', 'B', 'A', 'S'].includes(tier) || art.querySelector('.treasure-skin-image')) return;
  art.classList.add('has-skin-art');
  for (const state of ['closed', 'open']) {
    const image = document.createElementNS(svgNamespace, 'image');
    image.classList.add('treasure-skin-image', `treasure-skin-image--${state}`);
    image.setAttribute('x', '3'); image.setAttribute('y', '0');
    image.setAttribute('width', '174'); image.setAttribute('height', '145');
    image.setAttribute('href', `${base}chest-${tier}-${state}.webp`);
    art.append(image);
  }
}

export function clearTreasureSkins() {
  for (const image of document.querySelectorAll('.treasure-skin-image')) {
    image.parentElement.classList.remove('has-skin-art');
    image.removeAttribute('href'); image.remove();
  }
}

