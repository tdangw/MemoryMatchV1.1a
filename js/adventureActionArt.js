// Map-only illustrations share material tokens; functional icons elsewhere stay unchanged.
let serial = 0;
const shapes = Object.freeze({
  gift: '<path d="M5 13h24v18H5Z" fill="url(#ID-body)"/><path d="M14 11h6v20h-6Z" fill="url(#ID-metal)"/><path d="M9 20v7h3m10 0h3v-7" fill="none" stroke="var(--map-art-body-light)"/><path d="m17 19 3 3-3 3-3-3Z" fill="var(--map-art-light)"/><g class="hourly-gift__lid"><path d="M3 10h28v7H3Z" fill="url(#ID-metal)"/><path d="M17 10C5 12 6 1 11 3c4 1 6 7 6 7Zm0 0C29 12 28 1 23 3c-4 1-6 7-6 7Z" fill="url(#ID-metal)"/></g>',
  collection: '<path d="M7 4 27 2l2 27-21 2Z" fill="url(#ID-metal)"/><path d="m10 6 14-1 2 21-15 2Z" fill="url(#ID-body)"/><path d="M8 5 6 6l1 24 3 1M12 29l15-2" fill="none" stroke="var(--map-art-light)"/><path d="m17 10 2 4 4 1-3 3 .5 4-3.5-2-3.5 2 .5-4-3-3 4-1Z" fill="url(#ID-metal)"/>',
  missions: '<rect x="5" y="5" width="23" height="26" rx="3" fill="url(#ID-body)"/><rect x="8" y="7" width="17" height="21" rx="1.5" fill="url(#ID-paper)"/><path d="M12 3h3a2 2 0 0 1 4 0h3v6H12Z" fill="url(#ID-metal)"/><path d="m11 15 3 3 6-6" fill="none" stroke="var(--map-art-body)" stroke-width="2.5"/><path d="M12 23h9" stroke="var(--map-art-dark)" stroke-width="1.4"/>',
  events: '<path d="M5 7h23v23H5Z" fill="url(#ID-metal)"/><path d="M7 13h19v14H7Z" fill="url(#ID-paper)"/><path d="M5 7h23v7H5Z" fill="url(#ID-body)"/><path d="M11 4v6m11-6v6" stroke="var(--map-art-light)" stroke-width="2.5"/><path d="m17 16 1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5-2.5-2.5 3.5-.5Z" fill="url(#ID-metal)"/>',
  infinity: '<path d="M16.5 17C7 2-3 22 8 25c6 2 10-10 16-10 8 0 8 13 0 12-4 0-7-5-11-10" fill="none" stroke="var(--map-art-dark)" stroke-width="7"/><path d="M16.5 16C7 1-3 21 8 24c6 2 10-10 16-10 8 0 8 13 0 12-4 0-7-5-11-10" fill="none" stroke="url(#ID-metal)" stroke-width="4.5"/><path d="M3 16q2-5 6-1m14 0q5-1 5 4" fill="none" stroke="var(--map-art-light)" stroke-width="1"/>',
  energy: '<path d="m20 2-15 18h10l-2 12L29 13H18Z" fill="var(--map-art-dark)" transform="translate(0 1)"/><path d="m20 1-15 18h10l-2 12L29 12H18Z" fill="url(#ID-metal)"/><path d="m19 5-9 11h7l-1 8 9-10h-9Z" fill="var(--map-art-light)" stroke="none"/>',
});

export function createAdventureActionArt(name) {
  if (!Object.hasOwn(shapes, name)) throw new Error(`Unknown map action art: ${name}`);
  const id = `map-action-${++serial}`;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('adventure-action-art');
  svg.setAttribute('viewBox', '0 0 34 34');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = `<defs>
    <linearGradient id="${id}-metal" x2=".3" y2="1"><stop stop-color="var(--map-art-light)"/><stop offset=".45" stop-color="var(--map-art-gold)"/><stop offset="1" stop-color="var(--map-art-dark)"/></linearGradient>
    <linearGradient id="${id}-body" x2=".2" y2="1"><stop stop-color="var(--map-art-body-light)"/><stop offset="1" stop-color="var(--map-art-body)"/></linearGradient>
    <linearGradient id="${id}-paper" x2="0" y2="1"><stop stop-color="#fff5cf"/><stop offset="1" stop-color="#d9bc7f"/></linearGradient>
  </defs><g stroke="var(--map-art-dark)" stroke-width="1" stroke-linejoin="round" stroke-linecap="round">${shapes[name].replaceAll('ID-', `${id}-`)}</g>`;
  return svg;
}
