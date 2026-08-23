const SVG_NS = 'http://www.w3.org/2000/svg';

const ICON_PATHS = Object.freeze({
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  home: '<path d="m3 11 9-7 9 7"/><path d="M5.5 9.5V20h13V9.5M9.5 20v-6h5v6"/>',
  restart: '<path d="M20 7v5h-5"/><path d="M19 12a7.5 7.5 0 1 0 .2 5"/>',
  wand: '<path d="m4 20 11-11 3 3L7 23z"/><path d="M6 4v4M4 6h4M17 2v4M15 4h4M20 16v4M18 18h4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/>',
  shop: '<path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 8H6"/><circle cx="9" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.2v.2"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
  book: '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 4H11v15H7.5A3.5 3.5 0 0 0 4 20.5zM20 5.5A3.5 3.5 0 0 0 16.5 4H13v15h3.5a3.5 3.5 0 0 1 3.5 1.5z"/>',
  exit: '<path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10"/>',
  star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M9 3h6M12 5v2M12 9v4l3 2"/>',
  trophy: '<path d="M8 4h8v4a4 4 0 0 1-8 0zM10 12v4M14 12v4M8 20h8M9 16h6"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4"/>',
  puzzle: '<path d="M9 4h3a2.5 2.5 0 1 1 5 0h3v5h-2a2.5 2.5 0 1 0 0 5h2v6h-6v-2a2.5 2.5 0 1 0-5 0v2H4v-6h2a2.5 2.5 0 1 0 0-5H4V4z"/>',
  sliders: '<path d="M4 6h8M16 6h4M4 12h3M11 12h9M4 18h10M18 18h2"/><circle cx="14" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
  music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  hourglass: '<path d="M7 3h10M7 21h10M8 3c0 4 1.5 6 4 9-2.5 3-4 5-4 9M16 3c0 4-1.5 6-4 9 2.5 3 4 5 4 9"/>',
  celebrate: '<path d="m5 20 4-10 5 5zM14 4v3M20 10h-3M18.5 5.5l-2 2M7 4l1 3M3 10l3 1"/>',
  'arrow-right': '<path d="M5 12h14M14 7l5 5-5 5"/>',
  'status-easy': '<circle cx="12" cy="12" r="7"/>',
  'status-normal': '<circle cx="12" cy="12" r="7"/>',
  'status-hard': '<circle cx="12" cy="12" r="7"/>',
});

export function createIcon(name) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('ui-icon', `ui-icon--${name}`);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = ICON_PATHS[name] || ICON_PATHS.info;
  return svg;
}

export function decorateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((element) => {
    if (element.querySelector(':scope > .ui-icon')) return;
    element.prepend(createIcon(element.dataset.icon));
  });
}
