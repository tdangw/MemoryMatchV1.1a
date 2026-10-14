import { openAppModal } from './modal.js';
import { createGameShellLifecycle } from './gameShell/gameShellLifecycle.js';
import { MAX_ADVENTURE_LEVEL } from './adventureProgress.js';

const ROW_HEIGHT = 44;
const WINDOW_SIZE = 40;
const VISIBLE_ROWS = 10;

export function openLeaderboardStagePicker({ anchor, value, owner, onSelect, onDestroy }) {
  const lifecycle = createGameShellLifecycle();
  const list = document.createElement('div');
  list.className = 'leaderboard-stage-list'; list.tabIndex = 0;
  list.setAttribute('role', 'listbox'); list.setAttribute('aria-label', 'Màn chơi');
  let active = value;
  let start = Math.max(1, Math.min(value - 15, MAX_ADVENTURE_LEVEL - WINDOW_SIZE + 1));
  const modal = openAppModal({ id: 'leaderboard-stage-picker', title: 'Chọn màn', showHeader: false,
    content: list, owner, onDestroy: () => { lifecycle.dispose(); anchor.setAttribute('aria-expanded', 'false'); onDestroy(); } });
  modal.overlay.classList.add('leaderboard-stage-overlay');
  modal.panel.classList.add('leaderboard-stage-dialog'); modal.panel.setAttribute('aria-label', 'Chọn màn');
  anchor.setAttribute('aria-expanded', 'true');
  function render() {
    const fragment = document.createDocumentFragment();
    for (let n = start; n < start + WINDOW_SIZE && n <= MAX_ADVENTURE_LEVEL; n++) {
      const option = document.createElement('div'); option.className = 'leaderboard-stage-option';
      option.id = `leaderboard-stage-${n}`; option.dataset.level = String(n);
      option.setAttribute('role', 'option'); option.setAttribute('aria-selected', String(n === value));
      option.classList.toggle('is-active', n === active); option.textContent = `Màn ${n}`;
      option.title = option.textContent;
      fragment.append(option);
    }
    list.replaceChildren(fragment);
    list.setAttribute('aria-activedescendant', `leaderboard-stage-${active}`);
  }
  function position() {
    const rect = anchor.getBoundingClientRect();
    const above = rect.top - 12; const below = innerHeight - rect.bottom - 12;
    const upwards = above >= below;
    const available = Math.max(ROW_HEIGHT, (upwards ? above : below) - 8);
    list.style.height = `${Math.min(VISIBLE_ROWS * ROW_HEIGHT, Math.floor(available / ROW_HEIGHT) * ROW_HEIGHT)}px`;
    const width = Math.min(180, innerWidth - 24);
    modal.panel.style.width = `${width}px`;
    modal.panel.style.left = `${Math.max(12, Math.min(rect.left, innerWidth - width - 12))}px`;
    modal.panel.style.top = upwards ? 'auto' : `${rect.bottom + 6}px`;
    modal.panel.style.bottom = upwards ? `${innerHeight - rect.top + 6}px` : 'auto';
    modal.panel.dataset.direction = upwards ? 'up' : 'down';
  }
  function move(next) {
    active = Math.max(1, Math.min(MAX_ADVENTURE_LEVEL, next));
    if (active < start || active >= start + WINDOW_SIZE) start = Math.max(1, Math.min(active - 15, MAX_ADVENTURE_LEVEL - WINDOW_SIZE + 1));
    render();
    const y = (active - start) * ROW_HEIGHT;
    if (y < list.scrollTop) list.scrollTop = y;
    else if (y + ROW_HEIGHT > list.scrollTop + list.clientHeight) list.scrollTop = y + ROW_HEIGHT - list.clientHeight;
  }
  function choose(n) { modal.destroy(); onSelect(n); }
  lifecycle.listen(list, 'click', event => {
    const option = event.target.closest('[data-level]'); if (option) choose(Number(option.dataset.level));
  });
  lifecycle.listen(list, 'keydown', event => {
    const steps = { ArrowDown: 1, ArrowUp: -1, PageDown: VISIBLE_ROWS, PageUp: -VISIBLE_ROWS };
    if (event.key in steps) { event.preventDefault(); move(active + steps[event.key]); }
    else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); move(event.key === 'Home' ? 1 : MAX_ADVENTURE_LEVEL); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(active); }
  });
  lifecycle.listen(list, 'scroll', () => {
    const offset = list.scrollTop;
    const first = Math.floor(offset / ROW_HEIGHT);
    const nextStart = first < 5 && start > 1 ? Math.max(1, start - 10)
      : first >= WINDOW_SIZE - VISIBLE_ROWS - 5 ? Math.min(MAX_ADVENTURE_LEVEL - WINDOW_SIZE + 1, start + 10) : start;
    if (nextStart === start) return;
    const shift = start - nextStart;
    start = nextStart;
    // Keep the focused option inside the bounded window while browsing by touch.
    active = Math.max(start, Math.min(start + WINDOW_SIZE - 1, active));
    render(); list.scrollTop = offset + shift * ROW_HEIGHT;
  });
  lifecycle.listen(window, 'resize', position);
  render(); position(); list.scrollTop = Math.max(0, (value - start - 4) * ROW_HEIGHT); list.focus();
  return modal;
}
