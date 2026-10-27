const SVG_NS = 'http://www.w3.org/2000/svg';
let nextWheelId = 0;

function svg(className, markup) {
  const root = document.createElementNS(SVG_NS, 'svg');
  root.setAttribute('viewBox', '0 0 400 400');
  root.setAttribute('width', '100%'); root.setAttribute('height', '100%');
  root.setAttribute('aria-hidden', 'true'); root.setAttribute('focusable', 'false');
  root.setAttribute('class', className); root.innerHTML = markup;
  return root;
}

/** Decorative metalwork only. Prize labels, pointer and motion belong to the page owner. */
export function createWheelArt() {
  const id = `liveops-wheel-${++nextWheelId}`;
  const paint = name => `url(#${id}-${name})`;
  const wedges = Array.from({ length: 8 }, (_, index) =>
    `<use href="#${id}-wedge" transform="rotate(${index * 45} 200 200)" fill="${paint(index % 2 ? 'sector-b' : 'sector-a')}"/>`).join('');
  const coins = Array.from({ length: 8 }, (_, index) =>
    `<use href="#${id}-coins" x="177" y="68" width="46" height="52" transform="rotate(${index * 45} 200 200)"/>`).join('');
  const medallions = [0, 90, 180, 270].map(angle =>
    `<use href="#${id}-medallion" transform="rotate(${angle} 200 200)"/>`).join('');
  const rivets = [45, 135, 225, 315].map(angle =>
    `<use href="#${id}-rivet" transform="rotate(${angle} 200 200)"/>`).join('');

  const rotor = svg('liveops__wheel-art liveops__wheel-art--rotor', `
    <defs>
      <radialGradient id="${id}-sector-a" cx="50%" cy="12%" r="95%">
        <stop offset="0" stop-color="var(--liveops-wheel-light, #fff0a3)"/>
        <stop offset=".32" stop-color="var(--liveops-wheel-sector-a, #dcac43)"/>
        <stop offset=".72" stop-color="#a96a20"/>
        <stop offset="1" stop-color="var(--liveops-wheel-dark, #573514)"/>
      </radialGradient>
      <radialGradient id="${id}-sector-b" cx="50%" cy="16%" r="94%">
        <stop offset="0" stop-color="#ebc76b"/>
        <stop offset=".36" stop-color="var(--liveops-wheel-sector-b, #b77e2b)"/>
        <stop offset="1" stop-color="var(--liveops-wheel-dark, #573514)"/>
      </radialGradient>
      <linearGradient id="${id}-coin" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="var(--liveops-wheel-light, #fff0a3)"/>
        <stop offset=".48" stop-color="#f7ce61"/>
        <stop offset="1" stop-color="#b7731a"/>
      </linearGradient>
      <path id="${id}-wedge" d="M200 200 134.56 42.01A171 171 0 0 1 265.44 42.01Z"/>
      <symbol id="${id}-coins" viewBox="0 0 46 52">
        <path d="M4 18v22c0 7 27 7 27 0V18Z" fill="#d79626" stroke="#704312" stroke-width="1.2"/>
        <path d="M4 24c0 7 27 7 27 0M4 30c0 7 27 7 27 0M4 36c0 7 27 7 27 0M4 41c0 7 27 7 27 0" fill="none" stroke="#ffdf77" stroke-width="1.5"/>
        <ellipse cx="17.5" cy="18" rx="13.5" ry="6.5" fill="${paint('coin')}" stroke="#fff0a3" stroke-width="1.3"/>
        <ellipse cx="17.5" cy="18" rx="9.5" ry="3.7" fill="none" stroke="#a36a1c" stroke-width=".9"/>
        <path d="m17.5 14.8 1.3 2.1 3.2.6-2.3 1.5.4 2.2-2.6-1-2.6 1 .4-2.2-2.3-1.5 3.2-.6Z" fill="#fff2ac" stroke="#ab751e" stroke-width=".55"/>
        <ellipse cx="33" cy="38" rx="10" ry="7.3" transform="rotate(-27 33 38)" fill="${paint('coin')}" stroke="#ffdf77" stroke-width="1.5"/>
        <ellipse cx="33" cy="38" rx="6.7" ry="4.6" transform="rotate(-27 33 38)" fill="none" stroke="#a36a1c" stroke-width="1"/>
      </symbol>
    </defs>
    <circle cx="200" cy="200" r="174" fill="var(--liveops-wheel-dark, #573514)"/>
    <g stroke="#f9da85" stroke-width="2" stroke-linejoin="round">${wedges}</g>
    <circle cx="200" cy="200" r="169" fill="none" stroke="#714415" stroke-width="3"/>
    <circle cx="200" cy="200" r="166.5" fill="none" stroke="#f3d486" stroke-width="1"/>
    ${coins}`);

  const rim = svg('liveops__wheel-art liveops__wheel-art--rim', `
    <defs>
      <linearGradient id="${id}-metal" x1="0" y1="0" x2=".7" y2="1">
        <stop stop-color="var(--liveops-wheel-light, #fff0a3)"/>
        <stop offset=".26" stop-color="#f5d783"/>
        <stop offset=".5" stop-color="#b77c2a"/>
        <stop offset=".72" stop-color="#f5d783"/>
        <stop offset="1" stop-color="#9b611e"/>
      </linearGradient>
      <radialGradient id="${id}-hub" cx="38%" cy="30%" r="72%">
        <stop stop-color="var(--liveops-wheel-light, #fff0a3)"/>
        <stop offset=".45" stop-color="#e1b655"/>
        <stop offset="1" stop-color="#85501a"/>
      </radialGradient>
      <g id="${id}-medallion" stroke-linejoin="round">
        <path d="m200 1 14 17-14 21-14-21Z" fill="${paint('metal')}" stroke="#70481e" stroke-width="2"/>
        <path d="m200 5 10 13-10 15-10-15Z" fill="none" stroke="#fff0ac" stroke-width="1.4"/>
        <path d="m200 10 6 8-6 9-6-9Z" fill="var(--liveops-wheel-gem, #277d66)" stroke="#c8e9a4" stroke-width="1"/>
      </g>
      <g id="${id}-rivet" stroke-linejoin="round">
        <path d="m200 5 11 13-11 13-11-13Z" fill="${paint('metal')}" stroke="#734a20" stroke-width="1.5"/>
        <path d="m200 11 6 7-6 7-6-7Z" fill="#f7d77e" stroke="#fff0a3" stroke-width="1"/>
      </g>
    </defs>
    <circle cx="200" cy="202" r="185" fill="none" stroke="var(--liveops-wheel-dark, #573514)" stroke-width="21"/>
    <circle cx="200" cy="200" r="184" fill="none" stroke="${paint('metal')}" stroke-width="20"/>
    <circle cx="200" cy="200" r="193" fill="none" stroke="#fff0ac" stroke-width="1.5"/>
    <circle cx="200" cy="200" r="175" fill="none" stroke="#70481e" stroke-width="3"/>
    <circle cx="200" cy="200" r="172" fill="none" stroke="#f9dc93" stroke-width="2"/>
    ${rivets}${medallions}
    <circle cx="200" cy="202" r="41" fill="#6a4018" stroke="#9c6b2a" stroke-width="2"/>
    <circle cx="200" cy="200" r="39" fill="${paint('metal')}" stroke="#fff0a3" stroke-width="1.5"/>
    <path d="M200 157c10 12 10 19 22 23 12 4 18 12 18 20s-6 16-18 20c-12 4-12 11-22 23-10-12-10-19-22-23-12-4-18-12-18-20s6-16 18-20c12-4 12-11 22-23Z" fill="${paint('metal')}" stroke="#69431a" stroke-width="1.8"/>
    <path d="M200 168c8 11 9 17 19 20 8 3 11 7 11 12s-3 9-11 12c-10 3-11 9-19 20-8-11-9-17-19-20-8-3-11-7-11-12s3-9 11-12c10-3 11-9 19-20Z" fill="${paint('hub')}" stroke="#ffe5a0" stroke-width="2"/>
  `);
  return { rotor, rim };
}
