import { openAppModal } from '../modal.js';
import { createIcon } from '../icons.js';
import { clearTooltip } from '../tooltips.js';
import { decorateStorybookSurface } from './surface.js';
import { createGameShellLifecycle } from '../gameShell/gameShellLifecycle.js';
import '../../styles/storybook-presentation.css';

const element = (tag, className, text) => {
  const node = document.createElement(tag); node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function picture(url, className, label = '') {
  const image = element('img', className);
  image.src = url; image.alt = label; image.decoding = 'async';
  image.width = image.height = 256;
  return image;
}

/** All three layers share the catalog's untrimmed 512px coordinate system. */
export function createCosmeticPortrait({ avatar, frame, badge, label = 'Ảnh đại diện' }) {
  const root = element('span', 'storybook-portrait');
  root.setAttribute('role', 'img'); root.setAttribute('aria-label', label);
  if (avatar) {
    const image = picture(avatar, 'storybook-portrait__avatar');
    image.addEventListener('error', () => { image.remove(); root.prepend(createIcon('account')); }, { once: true });
    root.append(image);
  }
  else root.append(createIcon('account'));
  for (const [slot, url] of [['frame', frame], ['badge', badge]]) if (url) {
    const image = picture(url, `storybook-portrait__${slot}`);
    image.addEventListener('error', () => image.remove(), { once: true }); root.append(image);
  }
  return root;
}

/** Pure presentation: callers supply a durable grant; this function cannot grant. */
export function createAchievementNoticeContent({ gameName, level, name, category, image, type = 'item', firstHint = '', storedIn }) {
  const content = element('div', 'storybook-achievement');
  const hero = element('div', 'storybook-achievement__hero'); hero.dataset.kind = type;
  hero.append(picture(image, 'storybook-achievement__hero-image', name));
  content.append(element('p', 'storybook-achievement__source', `${gameName} · Màn ${level}`),
    element('p', 'storybook-achievement__condition', 'Đã hoàn thành cả bốn độ khó'),
    hero,
    element('h3', 'storybook-achievement__name', name),
    element('p', 'storybook-achievement__category', category));
  const stored = element('p', 'storybook-achievement__stored');
  stored.append(createIcon('check'), document.createTextNode(storedIn)); content.append(stored);
  if (firstHint) content.append(element('p', 'storybook-achievement__hint', firstHint));
  return content;
}

/** Shared owner remains openAppModal, including focus, busy state and placement. */
export function openStorybookModal({ kind, ...options }) {
  const modal = openAppModal({ ...options, alignment: 'center' });
  decorateStorybookSurface(modal.panel, true);
  modal.panel.dataset.storybookComponent = kind;
  modal.panel.setAttribute('aria-label', options.title);
  modal.panel.focus({ preventScroll: true });
  // Dismiss the previous control's singleton tooltip at the surface boundary.
  clearTooltip();
  return modal;
}

const categoryNames = { avatar: 'Ảnh đại diện', frame: 'Khung viền', badge: 'Huy hiệu' };

/** Working selection stays here; durable save and public sync belong to caller. */
export function openCosmeticCustomization({ playerName, items, equipped, onSave, owner }) {
  const scope = createGameShellLifecycle();
  const draft = { ...equipped };
  let category = 'avatar';
  const pageSize = 12;
  let page = 0;
  const content = element('div', 'storybook-customization');
  const hero = element('div', 'storybook-customization__hero');
  const name = element('h3', 'storybook-customization__name', playerName);
  const tabs = element('div', 'storybook-tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Đồ hồ sơ');
  const grid = element('div', 'storybook-inventory'); grid.setAttribute('role', 'tabpanel'); grid.id = 'storybook-cosmetics-grid';
  const error = element('p', 'storybook-customization__error'); error.setAttribute('role', 'alert');
  const navigation = element('nav', 'storybook-inventory-navigation'); navigation.setAttribute('aria-label', 'Trang đồ hồ sơ');
  const previous = element('button', 'tab-button', 'Trang trước'), next = element('button', 'tab-button', 'Trang sau');
  previous.type = next.type = 'button';
  const pageLabel = element('span', 'storybook-inventory-page'); pageLabel.setAttribute('aria-live', 'polite');
  navigation.append(previous, pageLabel, next);
  content.append(hero, name, tabs, element('p','storybook-customization__hint','Chọn một món để trang bị; chọn lại để bỏ.'), grid, navigation, error);
  const tabButtons = [];
  function render() {
    const selected = slot => { const item = items.find(item => item.id === draft[slot]); return item?.previewImage || item?.image; };
    hero.replaceChildren(createCosmeticPortrait({ avatar: selected('avatar'), frame: selected('frame'), badge: selected('badge'), label: playerName }));
    for (const button of tabButtons) {
      const active = button.dataset.category === category;
      button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1;
    }
    grid.setAttribute('aria-labelledby', `storybook-tab-${category}`);
    // Item button events are delegated once to this owner, never added per render.
    const categoryItems = items.filter(item => item.type === category);
    const pages = Math.max(1, Math.ceil(categoryItems.length / pageSize));
    page = Math.min(page, pages - 1);
    previous.disabled = page === 0; next.disabled = page === pages - 1;
    navigation.hidden = pages === 1; pageLabel.textContent = `${page + 1}/${pages}`;
    grid.replaceChildren(...categoryItems.slice(page * pageSize, (page + 1) * pageSize).map(item => {
      const button = element('button', 'storybook-item'); button.type = 'button';
      button.dataset.itemId = item.id; button.disabled = !item.owned;
      button.setAttribute('aria-pressed', String(draft[category] === item.id));
      if (item.type === 'frame') button.append(createCosmeticPortrait({ avatar: selected('avatar'), frame: item.image }));
      else button.append(picture(item.image, 'storybook-item__image'));
      button.append(element('strong', 'storybook-item__name', item.name), element('small', 'storybook-item__source', Number.isSafeInteger(item.level) ? `${item.gameName} · Màn ${item.level}` : item.gameName));
      if (!item.owned) button.append(createIcon('lock'));
      else if (draft[category] === item.id) button.append(createIcon('check'));
      return button;
    }));
  }
  for (const [id, label] of Object.entries(categoryNames)) {
    const button = element('button', 'storybook-tab', label); button.type = 'button';
    button.dataset.category = id; button.id = `storybook-tab-${id}`;
    button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', grid.id);
    scope.listen(button, 'click', () => { category = id; page = 0; render(); });
    scope.listen(button, 'keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = tabButtons.indexOf(button), last = tabButtons.length - 1;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? last
        : (index + (event.key === 'ArrowRight' ? 1 : last)) % tabButtons.length;
      category = tabButtons[next].dataset.category; page = 0; render(); tabButtons[next].focus();
    });
    tabButtons.push(button); tabs.append(button);
  }
  let modal;
  scope.listen(previous, 'click', () => { if (!previous.disabled) { page--; render(); } });
  scope.listen(next, 'click', () => { if (!next.disabled) { page++; render(); } });
  scope.listen(grid, 'click', event => {
    const button = event.target.closest('button[data-item-id]');
    if (!button || !grid.contains(button) || button.disabled || modal.panel.getAttribute('aria-busy') === 'true') return;
    const item = items.find(candidate => candidate.id === button.dataset.itemId);
    if (!item || !item.owned || item.type !== category) return;
    draft[category] = draft[category] === item.id ? null : item.id;
    render();grid.querySelector(`[data-item-id="${item.id}"]`).focus({preventScroll:true});
  });
  render();
  modal = openAppModal({ id: 'profile-customization-modal', alignment: 'center',
    title: 'Trang trí hồ sơ', content, owner, onDestroy: () => scope.dispose(),
    actions: [{ label: 'Lưu thay đổi', variant: 'primary', onClick: async () => {
      error.textContent = '';
      if (!await onSave({ ...draft })) { error.textContent = 'Chưa lưu được thay đổi. Hãy thử lại.'; return false; }
      return undefined;
    } }],
  });
  modal.panel.focus({ preventScroll: true }); clearTooltip();
  return modal;
}

export function createAchievementListContent({ gameName, levels }) {
  const content = element('div', 'storybook-collection');
  content.append(element('p', 'storybook-collection__game', gameName), element('h3', 'storybook-collection__heading', 'Làm chủ từng màn'));
  for (const level of levels) {
    const row = element('article', 'storybook-achievement-row');
    const details = element('div', 'storybook-achievement-row__details');
    details.append(element('h4', '', `Màn ${level.level}`));
    const difficulties = element('div', 'storybook-difficulties');
    ['Dễ', 'TB', 'Khó', 'S.Khó'].forEach((label, index) => {
      const badge = element('span', 'storybook-difficulty');
      badge.dataset.complete = String(Boolean(level.completed[index]));
      badge.append(createIcon(level.completed[index] ? 'check' : 'lock'), element('small', '', label));
      difficulties.append(badge);
    });
    details.append(difficulties, element('p', '', level.completed.every(Boolean) ? 'Đã hoàn thành' : `${level.completed.filter(Boolean).length}/4 độ khó`));
    const reward = element('div', 'storybook-achievement-row__reward');
    reward.append(picture(level.image, '', level.name), element('small', '', level.name));
    row.append(details, reward); content.append(row);
  }
  content.append(element('p', 'storybook-collection__note', 'Mỗi màn nhận thưởng một lần.'));
  return content;
}
