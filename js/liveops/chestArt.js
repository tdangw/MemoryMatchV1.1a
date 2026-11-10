// A stable visual identity follows the reward category across skins and surfaces.
const TYPES = new Set(['c','avatar','frame','badge','coins','mystery','cosmetic','flip','theme','path','exit','support']);
export function chestArtUrl(type, state='closed') {
  if (!TYPES.has(type) || !['closed','open'].includes(state)) throw new TypeError('Unknown chest artwork');
  return `${import.meta.env.BASE_URL}assets/rewards/chests/${type}-${state}.webp`;
}
export function createChestArt(type, state='closed') {
  const image=document.createElement('img');image.className='liveops__chest-art';image.src=chestArtUrl(type,state);
  image.onerror=()=>{
    image.onerror=null;
    const color=({avatar:'#24b8af',frame:'#a784df',badge:'#dc7280'})[type]||'#cb994c';
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M8 27v-5c0-13 48-13 48 0v5M8 27h48v27H8Z" fill="${color}" stroke="#714a25" stroke-width="4" stroke-linejoin="round"/><path d="M18 15v39M46 15v39M8 28h48" fill="none" stroke="#f6d887" stroke-width="5"/><rect x="26" y="25" width="12" height="15" rx="3" fill="#f6d887" stroke="#714a25" stroke-width="2"/></svg>`;
    image.src=`data:image/svg+xml,${encodeURIComponent(svg)}`;
  };
  image.dataset.chestType=type;image.alt='';image.width=image.height=64;image.decoding='async';image.draggable=false;
  return image;
}
