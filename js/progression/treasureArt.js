import { treasureDefinition } from './treasureCatalog.js';
import '../../styles/treasure.css';
let serial = 0;
const ornaments = {
  C: '<path d="M90 101V80M90 90C72 91 73 76 76 75c13 0 14 10 14 15M90 84c0-12 9-16 15-16 3 11-6 18-15 16" fill="#91b880" stroke="#345749" stroke-width="2"/>',
  B: '<path d="M89 103C68 93 77 69 107 67c-1 22-5 32-18 36Z" fill="#b7dcdf" stroke="#e4f5fa" stroke-width="2"/><path d="m84 104 18-29m-14 21 12-1m-7-8-6-7" fill="none" stroke="#527c91" stroke-width="2"/>',
  A: '<g fill="#fff0b0" stroke="#be853e" stroke-width="1.5"><ellipse cx="90" cy="78" rx="8" ry="14"/><ellipse cx="90" cy="78" rx="8" ry="14" transform="rotate(72 90 88)"/><ellipse cx="90" cy="78" rx="8" ry="14" transform="rotate(144 90 88)"/><ellipse cx="90" cy="78" rx="8" ry="14" transform="rotate(216 90 88)"/><ellipse cx="90" cy="78" rx="8" ry="14" transform="rotate(288 90 88)"/><circle cx="90" cy="88" r="7" fill="#c48645"/></g>',
  S: '<path d="m90 65 7 14 16 2-12 12 3 16-14-8-14 8 3-16-12-12 16-2Z" fill="#e8ceff" stroke="#fff1bd" stroke-width="2"/><path d="m90 72 4 13 11-2-9 10 3 9-9-7-9 7 3-9-9-10 11 2Z" fill="#ae8fd3"/><path d="m90 81 5 7-5 10-5-10Z" fill="#fff6de"/>',
};
/** Native SVG is also the offline/failure fallback: no image decoding or external fetch. */
export function createTreasureArt(tier, opened = false) {
  const c = treasureDefinition(tier), id = `treasure-${++serial}`;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 180 145'); svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('treasure-art'); svg.classList.toggle('is-open', opened);
  svg.innerHTML = `<defs><linearGradient id="${id}-wood" x2="0" y2="1"><stop stop-color="${c.face}"/><stop offset="1" stop-color="${c.wood}"/></linearGradient><linearGradient id="${id}-metal" x2="0" y2="1"><stop stop-color="${c.light}"/><stop offset=".45" stop-color="${c.metal}"/><stop offset="1" stop-color="${c.wood}"/></linearGradient><radialGradient id="${id}-light"><stop stop-color="${c.light}" stop-opacity=".8"/><stop offset="1" stop-color="${c.light}" stop-opacity="0"/></radialGradient></defs>
  <ellipse cx="90" cy="130" rx="67" ry="9" fill="#000" opacity=".22"/>
  <ellipse class="treasure-art__glow" cx="90" cy="70" rx="76" ry="65" fill="url(#${id}-light)"/>
  <path d="m27 67 13-9h101l13 9v51l-13 10H40l-13-10Z" fill="${c.wood}" stroke="#172d32" stroke-width="3"/>
  <path d="M28 68h125v49H28Z" fill="url(#${id}-wood)" stroke="${c.metal}" stroke-width="2"/>
  <path d="M34 84h112M34 104h112" stroke="${c.wood}" opacity=".7"/>
  <path d="M39 68h10v49H39Zm92 0h10v49h-10Z" fill="url(#${id}-metal)"/>
  <path d="M28 113h125v7H28Z" fill="url(#${id}-metal)"/>
  <g class="treasure-art__lid"><path d="M27 66V52c0-20 19-30 63-30s64 10 64 30v14Z" fill="url(#${id}-wood)" stroke="#172d32" stroke-width="3"/>
  <path d="M29 53c0-17 19-27 61-27s62 10 62 27M29 63h123" fill="none" stroke="${c.metal}" stroke-width="3"/>
  <path d="M39 64V48c0-9 4-14 10-18v34Zm92 0V30c6 4 10 9 10 18v16Z" fill="url(#${id}-metal)"/>
  <path d="M56 47h68M57 54h65" stroke="${c.light}" opacity=".22"/>
  ${tier === 'S' ? '<path d="m67 27 8-11 15 7 15-7 8 11" fill="#d9c17e" stroke="#fff0b8" stroke-width="2"/>' : ''}</g>
  <path d="M72 70q18-11 36 0v29l-18 17-18-17Z" fill="url(#${id}-metal)" stroke="${c.wood}" stroke-width="2"/>${ornaments[tier]}
  ${['A','S'].includes(tier) ? `<path d="M33 75q8 2 2 12m111-12q-8 2-2 12M53 117q10-10 17-1m40 0q8-9 17 1" fill="none" stroke="${c.metal}" stroke-width="2"/>` : ''}
  <g fill="${c.light}"><circle cx="44" cy="73" r="2"/><circle cx="136" cy="73" r="2"/><circle cx="44" cy="111" r="2"/><circle cx="136" cy="111" r="2"/></g>`;
  return svg;
}
