// A stable visual identity follows the reward category across skins and surfaces.
const TYPES = new Set(['c','avatar','frame','badge','coins','mystery','cosmetic','flip','theme','path','exit','support']);
export function chestArtUrl(type, state='closed') {
  if (!TYPES.has(type) || !['closed','open'].includes(state)) throw new TypeError('Unknown chest artwork');
  return `${import.meta.env.BASE_URL}assets/rewards/chests/${type}-${state}.webp`;
}
export function createChestArt(type, state='closed') {
  const image=document.createElement('img');image.className='liveops__chest-art';image.src=chestArtUrl(type,state);
  image.dataset.chestType=type;image.alt='';image.width=image.height=64;image.decoding='async';image.draggable=false;
  return image;
}
