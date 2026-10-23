/** Decoration belongs to the existing panel subtree; no timers or observers. */
export function decorateStorybookSurface(panel, enabled) {
  panel.classList.toggle('storybook-surface', enabled);
  const existing = panel.querySelector(':scope > .storybook-corner-leaves');
  if (!enabled) { existing?.remove(); return; }
  if (!existing) {
    const leaves = document.createElement('div'); leaves.className = 'storybook-corner-leaves';
    leaves.setAttribute('aria-hidden', 'true'); panel.prepend(leaves);
  }
}
