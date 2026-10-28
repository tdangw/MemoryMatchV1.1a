import { revealTab } from '../tabVisibility.js';
export function node(tag, className = '', text) {
  const element = document.createElement(tag); element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
export function action(label, run, disabled = false, key = label) {
  const element = node('button', 'tab-button', label);
  element.type = 'button'; element.disabled = disabled; element.dataset.focusKey = key;
  element.onclick = run; return element;
}
/** One active panel; keyboard selection and focus use stable IDs, never positions. */
export function createTabs(id, items, initial, render) {
  const root = node('div', 'liveops__tabs'); root.setAttribute('role', 'tablist');
  const panel = node('div', 'liveops__panel'); panel.id = `${id}-panel`; panel.setAttribute('role', 'tabpanel');
  let selected = initial;
  const buttons = items.map(([key, label]) => {
    const button = action(label, () => select(key), false, `${id}-${key}`);
    button.id = `${id}-${key}`; button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', panel.id);
    root.append(button); return button;
  });
  function select(key, focus = true) {
    selected = key;
    items.forEach(([value], index) => {
      const current = value === key; buttons[index].tabIndex = current ? 0 : -1;
      buttons[index].setAttribute('aria-selected', String(current));
      if (current) { panel.setAttribute('aria-labelledby', buttons[index].id); if (focus) buttons[index].focus({preventScroll:true}); }
    });
    render(key, panel);
    revealTab(root, buttons[items.findIndex(([value]) => value === key)]);
  }
  root.onkeydown = event => {
    const focused = buttons.indexOf(document.activeElement);
    const index = focused >= 0 ? focused : items.findIndex(([key]) => key === selected);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
      : event.key === 'ArrowRight' ? (index + 1) % items.length : event.key === 'ArrowLeft' ? (index + items.length - 1) % items.length : -1;
    if (next < 0) return; event.preventDefault(); select(items[next][0]);
  };
  return { root, panel, select, get selected() { return selected; } };
}
