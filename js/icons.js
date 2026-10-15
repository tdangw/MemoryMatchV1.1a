const SVG_NS = "http://www.w3.org/2000/svg";

const ICON_PATHS = Object.freeze({
  edit: '<path d="m4 16 11-11 4 4L8 20H4zM13 7l4 4M15 5l2-2 4 4-2 2"/>',
  missions: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 2h6v4H9zM8 11l2 2 5-5M8 17h8"/>',
  friends: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 5 5v2"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16"/>',
  infinity: '<path d="M12 12c-3-5-8-6-9-2-2 6 4 9 9 2s11-4 9 2c-1 4-6 3-9-2z"/>',
  account: '<circle cx="12" cy="7.5" r="3.5" fill="currentColor" stroke="none"/><path d="M5 20v-1a7 7 0 0 1 14 0v1z" fill="currentColor" stroke="none"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  home: '<path d="m3 11 9-7 9 7"/><path d="M5.5 9.5V20h13V9.5M9.5 20v-6h5v6"/>',
  restart: '<path d="M20 7v5h-5"/><path d="M19 12a7.5 7.5 0 1 0 .2 5"/>',
  wand: '<path d="m4 20 11-11 3 3L7 23z"/><path d="M6 4v4M4 6h4M17 2v4M15 4h4M20 16v4M18 18h4"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/>',
  shop: '<path d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 8H6"/><circle cx="9" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/>',
  eye: '<path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.7"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.2v.2"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
  book: '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 4H11v15H7.5A3.5 3.5 0 0 0 4 20.5zM20 5.5A3.5 3.5 0 0 0 16.5 4H13v15h3.5a3.5 3.5 0 0 1 3.5 1.5z"/>',
  collection:
    '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 4v16M4 9h16M13 13h3M14.5 11.5v3"/>',
  images: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m5 17 4.5-4 3 2.5 2.5-2 4 3.5"/>',
  paw: '<circle cx="7" cy="8" r="2"/><circle cx="12" cy="5.5" r="2"/><circle cx="17" cy="8" r="2"/><path d="M7.5 17c0-3 2-5 4.5-5s4.5 2 4.5 5c0 2-1.5 3-4.5 3s-4.5-1-4.5-3z"/>',
  bird: '<path d="M4 14c4-7 7-8 10-3 2-3 4-3 6-2-2 5-6 8-11 8-2 0-3.5-1-5-3z"/><path d="M14 11 18 6M18 6h3M18 6v3"/>',
  fish: '<path d="M4 12c3-4 8-5 12-2l4-3v10l-4-3c-4 3-9 2-12-2z"/><circle cx="11" cy="11" r=".8"/>',
  utensils: '<path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10M16 3v18M16 3c2.5 1.5 3.5 4 3.5 6.5H16"/>',
  apple: '<path d="M12 7c-3.8-4.2-7.5-1.4-7.5 4.2 0 5.8 3.3 9.3 7.5 9.3s7.5-3.5 7.5-9.3C19.5 5.6 15.8 2.8 12 7z"/><path d="M12 7c.2-2.2 1.6-3.5 3.8-3.5M12 7c-1.6-1.5-3.2-1.8-4.8-1"/>',
  carrot: '<path d="M7 8.5 17 18.5l-7.5 2.1L5 16z"/><path d="M8.5 9.5 5 6M10.5 8 9 4.5M12 9.5 15.5 6"/>',
  leaf: '<path d="M20 4C11 4 5 8 5 14c0 3 2 5 5 5 6 0 10-6 10-15zM5 20c3-4 6-6 11-9"/>',
  tree: '<path d="M12 21v-6M8 21h8M12 15 6 15l3-5H6l4-6h4l4 6h-3l3 5h-6"/>',
  flower: '<circle cx="12" cy="12" r="2.5"/><path d="M12 9.5C8 3 4.5 5.5 5.5 9.5M14.5 12C21 8 20 4.5 16 5.5M12 14.5C16 21 19.5 18.5 18.5 14.5M9.5 12C3 16 4.5 19.5 8.5 18.5"/>',
  shapes: '<circle cx="7" cy="7" r="3"/><rect x="12" y="4" width="7" height="7" rx="1"/><path d="m12 19 3.5-6 3.5 6z"/>',
  type: '<path d="M4 5h16M12 5v14M8 19h8"/>',
  hash: '<path d="M8 3 6 21M18 3l-2 18M4 9h16M3 15h16"/>',
  terminal: '<path d="m5 7 4 4-4 4M12 17h7"/><rect x="3" y="4" width="18" height="16" rx="2"/>',
  hanger: '<path d="M12 4a2.5 2.5 0 1 1-2.1 3.9"/><path d="m9.9 7.9-6.5 9.6h17.2l-6.5-9.6"/>',
  car: '<path d="m5 16 1.6-5h10.8l1.6 5"/><path d="M3.5 16h17v4h-2v-2h-13v2h-2z"/><circle cx="7" cy="16" r="1.5"/><circle cx="17" cy="16" r="1.5"/>',
  spyglass: '<path d="m6 5 5 2-3 7-5-2zM11 7l7 3-3 7-7-3z"/><path d="m14.8 16.3 2.8 4.7M12.3 17.2 10 21"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>',
  shovel: '<path d="m14 3 7 7-3 3-7-7zM11 10 4 21M3 21h3"/>',
  exit: '<path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10"/>',
  star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  energy: '<path d="m13.4 2-8 12h5.7l-.5 8 8-12h-5.7z"/>',
  moon: '<path d="M19.5 15.2A8.5 8.5 0 0 1 8.8 4.5 8.5 8.5 0 1 0 19.5 15.2z"/>',
  more: '<circle cx="6" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18" cy="12" r="1"/>',
  link: '<path d="M10 13.8a4 4 0 0 0 5.7.1l2-2a4 4 0 0 0-5.7-5.7l-1.1 1.1M14 10.2a4 4 0 0 0-5.7-.1l-2 2a4 4 0 0 0 5.7 5.7l1.1-1.1"/>',
  slash: '<path d="M5 19 19 5"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M14.5 9.5c-.5-.7-1.4-1.1-2.5-1.1-1.5 0-2.6.7-2.6 1.8 0 2.9 5.2 1.1 5.2 3.8 0 1.1-1.1 1.9-2.7 1.9-1.1 0-2.1-.4-2.7-1.2M12 7v10"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M9 3h6M12 5v2M12 9v4l3 2"/>',
  trophy:
    '<path d="M8 4h8v4a4 4 0 0 1-8 0zM10 12v4M14 12v4M8 20h8M9 16h6"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4"/>',
  puzzle:
    '<path d="M9 4h3a2.5 2.5 0 1 1 5 0h3v5h-2a2.5 2.5 0 1 0 0 5h2v6h-6v-2a2.5 2.5 0 1 0-5 0v2H4v-6h2a2.5 2.5 0 1 0 0-5H4V4z"/>',
  sliders:
    '<path d="M4 6h8M16 6h4M4 12h3M11 12h9M4 18h10M18 18h2"/><circle cx="14" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
  music:
    '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  hourglass:
    '<path d="M7 3h10M7 21h10M8 3c0 4 1.5 6 4 9-2.5 3-4 5-4 9M16 3c0 4-1.5 6-4 9 2.5 3 4 5 4 9"/>',
  celebrate:
    '<path d="m5 20 4-10 5 5zM14 4v3M20 10h-3M18.5 5.5l-2 2M7 4l1 3M3 10l3 1"/>',
  "arrow-right": '<path d="M5 12h14M14 7l5 5-5 5"/>',
  "status-easy": '<circle cx="12" cy="12" r="7"/>',
  "status-normal": '<circle cx="12" cy="12" r="7"/>',
  "status-hard": '<circle cx="12" cy="12" r="7"/>',
  "status-super-hard": '<circle cx="12" cy="12" r="7"/>',
});

export function createIcon(name) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.classList.add("ui-icon", `ui-icon--${name}`);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.innerHTML = ICON_PATHS[name] || ICON_PATHS.info;
  return svg;
}

export function decorateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((element) => {
    if (element.querySelector(":scope > .ui-icon")) return;
    element.prepend(createIcon(element.dataset.icon));
  });
}
