/** Original vector art: three moonlit blooms, rendered once and animated as groups. */
export function createVictoryFlowerSceneMarkup() {
  const flower = (x, y, scale, tilt) => `<g transform="translate(${x} ${y}) rotate(${tilt}) scale(${scale})"><g class="victory-flower-bloom">
    <path d="M0 330 C-18 220 16 115 0 0" fill="none" stroke="url(#victory-stem)" stroke-width="8"/>
    <path d="M-3 150 C-85 144 -105 92 -87 80 C-31 76 -11 117 -3 150Z" fill="url(#victory-leaf)"/>
    <path d="M2 211 C95 189 111 139 92 128 C42 134 15 171 2 211Z" fill="url(#victory-leaf)"/>
    ${Array.from({ length: 8 }, (_, index) => `<path d="M0 12 C-35 -2 -34 -59 0 -70 C34 -59 35 -2 0 12Z" transform="rotate(${index * 45})" fill="url(#victory-petal)" stroke="#c4eadc" stroke-width=".65"/>`).join("")}
    ${Array.from({ length: 8 }, (_, index) => `<path d="M0 6 C-27 -6 -19 -42 0 -49 C19 -42 27 -6 0 6Z" transform="rotate(${index * 45 + 22.5}) scale(.74)" fill="url(#victory-heart-petal)" stroke="#fff0b9" stroke-width=".5"/>`).join("")}
    <circle r="12" fill="#f5d17f"/><circle r="7" fill="#fff0c0"/>
  </g></g>`;
  return `<svg class="victory-flower-scene" viewBox="0 0 600 720" role="img" aria-label="Ba bông hoa ánh trăng bên hồ yên tĩnh">
    <defs>
      <linearGradient id="victory-petal" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#edf6de"/><stop offset=".45" stop-color="#97d4c3"/><stop offset="1" stop-color="#2d8c99"/></linearGradient>
      <linearGradient id="victory-heart-petal"><stop stop-color="#e9ac80"/><stop offset=".65" stop-color="#f6dec0"/><stop offset="1" stop-color="#fff1cc"/></linearGradient>
      <linearGradient id="victory-stem"><stop stop-color="#265e67"/><stop offset=".5" stop-color="#92c2a7"/><stop offset="1" stop-color="#143d54"/></linearGradient>
      <linearGradient id="victory-leaf" x2="1" y2="1"><stop stop-color="#76b8a0"/><stop offset="1" stop-color="#19434e"/></linearGradient>
      <radialGradient id="victory-moon"><stop stop-color="#fff2cf"/><stop offset="1" stop-color="#c7d8da"/></radialGradient>
    </defs>
    <circle cx="448" cy="117" r="45" fill="url(#victory-moon)" opacity=".72"/>
    <circle cx="438" cy="110" r="8" fill="#779ba4" opacity=".15"/>
    <path d="M0 565 Q150 540 300 570 T600 565" fill="none" stroke="#5d9ba1" opacity=".08"/>
    <ellipse cx="300" cy="606" rx="226" ry="20" fill="#83c0be" opacity=".07"/>
    <ellipse cx="300" cy="643" rx="180" ry="7" fill="#bfd6bd" opacity=".08"/>
    ${flower(170, 347, .7, -12)}${flower(428, 325, .77, 13)}${flower(300, 269, 1.04, 0)}
    <path d="M45 610 Q290 581 555 610 M110 629 Q300 614 490 629" stroke="#9dc1b6" stroke-width="1.4" opacity=".22" fill="none"/>
  </svg>`;
}
