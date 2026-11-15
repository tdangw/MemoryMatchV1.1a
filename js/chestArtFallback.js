// One vector source for image failures and the shared 24px icon registry.
const SIZE = 64;
const COLORS = Object.freeze({avatar:'#24b8af',frame:'#a784df',badge:'#dc7280'});
function chestPaths(type,state){
  if(!['closed','open'].includes(state))throw new TypeError('Unknown chest artwork state');
  const open=state==='open',color=COLORS[type]||'#cb994c';
  const lid=open?'M8 20V8c0-7 48-7 48 0v12Z':'M8 27v-5c0-13 48-13 48 0v5Z';
  const bands=open?'M18 5v15M46 5v15M18 27v27M46 27v27M8 28h48':'M18 15v39M46 15v39M8 28h48';
  return `<path d="${lid}" fill="${color}" stroke="#714a25" stroke-width="4" stroke-linejoin="round"/>${open?'<path d="M8 27l6-7h36l6 7Z" fill="#50341e" stroke="#714a25" stroke-width="3"/>':''}<path d="M8 27h48v27H8Z" fill="${color}" stroke="#714a25" stroke-width="4" stroke-linejoin="round"/><path d="${bands}" fill="none" stroke="#f6d887" stroke-width="5"/><rect x="26" y="25" width="12" height="15" rx="3" fill="#f6d887" stroke="#714a25" stroke-width="2"/>`;
}
export function chestFallbackSvg(type,state='closed'){
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">${chestPaths(type,state)}</svg>`;
}
export function chestFallbackIconPaths(state='closed'){
  return `<g transform="scale(${24/SIZE})">${chestPaths('c',state)}</g>`;
}
