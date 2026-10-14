import { createIcon } from './icons.js';
import { openAppModal } from './modal.js';
import { GAME_DEFINITIONS } from './gameCatalog.js';
import { getRecentGameId } from './recentGame.js';
import { getFirebaseBackend } from './firebaseBackend.js';
import { getAccountService } from './accountService.js';
import { getLeaderboardService } from './leaderboardService.js';
import { readLeaderboard } from './leaderboardStore.js';
import { readCachedLeaderboard } from './leaderboardStore.js';
import { rankingBoardId } from './rankingResult.js';
import { formatLeaderboardNumber, compactLeaderboardPages } from './leaderboardPresentation.js';
import { createGameShellLifecycle, getActiveGameScope } from './gameShell/gameShellLifecycle.js';
import { getAppPageScope } from './appPageLifecycle.js';
let lastGame = null;
const families = [['adventure', 'Hành trình'], ['challenge', 'Thử thách'], ['endless', 'Vô tận']];
const rememberedFamilies = new Map();

export function openLeaderboards(gameId, onClose, surface = {}) {
  const scope = createGameShellLifecycle();
  let generation = 0;
  let selectedGame = gameId || lastGame || getRecentGameId();
  let selectedFamily = rememberedFamilies.get(selectedGame) || 'adventure';
  let currentPage = 1;
  let currentKey = null;
  let loading = false;
  let dropdown = null;
  let loadedPages = [1];
  const compactPager = window.matchMedia('(max-width: 700px)');
  const scrolls = new Map();
  const content = document.createElement('div'); content.className = 'leaderboard-view';
  const games = tabs('Trò chơi', GAME_DEFINITIONS.map(item => [item.id, item.title]), 'game');
  const footer = document.createElement('div'); footer.className = 'leaderboard-footer';
  const refresh = button('Làm mới');
  refresh.setAttribute('aria-label', 'Làm mới'); refresh.replaceChildren(createIcon('restart')); refresh.classList.add('leaderboard-refresh');
  const status = document.createElement('p'); status.className = 'leaderboard-status'; status.setAttribute('aria-live', 'polite');
  const results = document.createElement('div'); results.className = 'leaderboard-results'; results.tabIndex = 0; results.setAttribute('aria-label', 'Danh sách xếp hạng');
  const own = document.createElement('p'); own.className = 'leaderboard-own';
  const pager = document.createElement('nav'); pager.className = 'leaderboard-pager'; pager.tabIndex = -1; pager.setAttribute('aria-label', 'Trang xếp hạng');
  const previous = button('Trước'); const next = button('Sau');
  previous.setAttribute('aria-label', 'Trước'); previous.textContent = '‹';
  next.setAttribute('aria-label', 'Sau'); next.textContent = '›';
  const pageNumbers = document.createElement('span'); pageNumbers.className = 'leaderboard-page-numbers';
  pager.append(previous, pageNumbers, next);
  footer.append(pager); results.append(status); content.append(games, results, own, footer);
  const owner = surface.owner || getActiveGameScope() || getAppPageScope();
  const release = owner?.own(() => scope.dispose(), 'cleanup');
  const modal = openAppModal({ ...surface, id: 'rankings-modal', title: 'Bảng xếp hạng', icon: 'trophy', content, onDestroy: () => { generation++; scope.dispose(); release?.forget(); }, onClose });
  modal.panel.classList.add('leaderboard-panel');
  modal.panel.querySelector('.app-modal__header').append(refresh);
  function updateFilters() {
    lastGame = selectedGame;
    for (const item of games.children) {
      const selected = item.dataset.rankGame === selectedGame;
      item.setAttribute('aria-pressed', String(selected));
      item.setAttribute('aria-haspopup', 'menu'); item.setAttribute('aria-expanded', String(dropdown?.anchor === item));
      const title = GAME_DEFINITIONS.find(game => game.id === item.dataset.rankGame).title;
      item.replaceChildren(document.createTextNode(`${title} ▾`));
      if (selected) { const label = document.createElement('small'); label.textContent = families.find(([id]) => id === selectedFamily)[1]; item.append(label); }
    }
  }
  function closeDropdown(restoreFocus = false) {
    if (!dropdown) return;
    const { anchor, lifecycle, menu } = dropdown; dropdown = null;
    lifecycle.dispose(); menu.remove(); anchor.setAttribute('aria-expanded', 'false');
    if (restoreFocus && anchor.isConnected) anchor.focus({ preventScroll: true });
  }
  scope.own(() => closeDropdown(), 'cleanup');
  function openDropdown(anchor) {
    if (dropdown?.anchor === anchor) { closeDropdown(true); return; }
    closeDropdown();
    const lifecycle = createGameShellLifecycle();
    const menu = document.createElement('div'); menu.className = 'leaderboard-family-menu';
    menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', anchor.textContent);
    const choices = families.map(([family, label]) => {
      const choice = button(label); choice.dataset.rankFamily = family;
      choice.setAttribute('role', 'menuitemradio'); choice.setAttribute('aria-checked', String(anchor.dataset.rankGame === selectedGame && family === selectedFamily));
      menu.append(choice); return choice;
    });
    document.body.append(menu); dropdown = { anchor, lifecycle, menu }; anchor.setAttribute('aria-expanded', 'true');
    const position = () => {
      const rect = anchor.getBoundingClientRect(); const width = Math.min(200, innerWidth - 16); const height = menu.offsetHeight;
      menu.style.width = `${width}px`; menu.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - width - 8))}px`;
      const down = innerHeight - rect.bottom >= height + 8;
      menu.dataset.direction = down ? 'down' : 'up';
      menu.style.top = `${Math.max(8, Math.min(down ? rect.bottom + 5 : rect.top - height - 5, innerHeight - height - 8))}px`;
    };
    position(); choices.find(choice => choice.dataset.rankFamily === (rememberedFamilies.get(anchor.dataset.rankGame) || 'adventure')).focus();
    lifecycle.listen(window, 'resize', position);
    lifecycle.listen(document, 'pointerdown', event => { if (!menu.contains(event.target) && !anchor.contains(event.target)) closeDropdown(); }, true);
    lifecycle.listen(menu, 'keydown', event => {
      const index = choices.indexOf(document.activeElement);
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeDropdown(true); }
      else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault(); choices[event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowDown' ? 1 : 2)) % 3].focus();
      } else if (event.key === 'Tab') closeDropdown(true);
    });
    lifecycle.listen(menu, 'click', event => {
      const item = event.target.closest('[data-rank-family]'); if (!item) return;
      selectedGame = anchor.dataset.rankGame; selectedFamily = item.dataset.rankFamily;
      rememberedFamilies.set(selectedGame, selectedFamily); closeDropdown(true); updateFilters(); void load();
    });
  }
  function controls(data = null) {
    if (data) loadedPages = data.loadedPages;
    refresh.disabled = loading;
    previous.disabled = loading || currentPage === 1;
    next.disabled = loading || !data?.hasNext || currentPage >= 100;
    renderPages();
  }
  function renderPages() {
    const focusedPage = pageNumbers.contains(document.activeElement) ? document.activeElement.dataset.page : null;
    const restoreFocus = focusedPage !== null || document.activeElement === pager;
    const fragment = document.createDocumentFragment();
    for (const item of compactLeaderboardPages(loadedPages, currentPage, compactPager.matches)) {
      if (item === 'ellipsis') {
        const gap = document.createElement('span'); gap.className = 'leaderboard-page-gap'; gap.textContent = '…'; gap.setAttribute('aria-hidden', 'true'); fragment.append(gap);
      } else {
        const control = button(String(item)); control.dataset.page = String(item); control.setAttribute('aria-label', `Trang ${item}`);
        if (item === currentPage) control.setAttribute('aria-current', 'page');
        control.disabled = loading; fragment.append(control);
      }
    }
    pageNumbers.replaceChildren(fragment);
    if (restoreFocus) {
      const target = loading ? pager : pageNumbers.querySelector(`[data-page="${focusedPage || currentPage}"]`) || pageNumbers.querySelector('[aria-current="page"]') || pager;
      target.focus({ preventScroll: true });
    }
  }
  async function load(refreshRequested = false, requestedPage = 1) {
    const id = ++generation;
    const uid = getAccountService()?.getIdentity()?.uid;
    if (currentKey) { scrolls.delete(`${currentKey}:${currentPage}`); scrolls.set(`${currentKey}:${currentPage}`, results.scrollTop); while (scrolls.size > 60) scrolls.delete(scrolls.keys().next().value); }
    const board = { gameId: selectedGame, family: selectedFamily, kind: 'progress', rulesVersion: 3 };
    const nextKey = `${uid || ''}:${rankingBoardId(board)}`;
    if (nextKey !== currentKey) loadedPages = [1];
    loading = true; currentPage = requestedPage; controls();
    results.replaceChildren(status); own.textContent = ''; status.textContent = 'Đang tải…'; results.setAttribute('aria-busy', 'true');
    currentKey = nextKey;
    try {
      const backend = await getFirebaseBackend();
      if (!scope.active || id !== generation || uid !== getAccountService()?.getIdentity()?.uid) return;
      if (!backend) { status.textContent = 'Chưa có kết nối.'; return; }
      if (refreshRequested && navigator.onLine) await getLeaderboardService()?.flush();
      if (!scope.active || id !== generation) return;
      const offline = !navigator.onLine;
      const data = offline ? readCachedLeaderboard({ environment: backend.environment, board, uid, page: requestedPage })
        : await readLeaderboard({ database: backend.database, environment: backend.environment, board, uid, refresh: refreshRequested, page: requestedPage });
      if (!scope.active || id !== generation || uid !== getAccountService()?.getIdentity()?.uid) return;
      if (!data) { status.textContent = 'Chưa có kết nối.'; return; }
      currentPage = data.page;
      results.dataset.kind = board.kind;
      const heading = document.createElement('div'); heading.className = `leaderboard-heading leaderboard-heading--${board.kind}`;
      for (const text of ['Hạng', 'Người chơi', 'Màn']) {
        const cell = document.createElement('span'); cell.textContent = text; heading.append(cell);
      }
      const list = document.createElement('ol'); list.className = 'leaderboard-list'; list.start = (currentPage - 1) * 10 + 1;
      for (const [index, item] of data.top.entries()) {
        const rank = (currentPage - 1) * 10 + index + 1;
        const row = document.createElement('li');
        const place = document.createElement('span'); place.className = `leaderboard-rank${rank <= 3 ? ` leaderboard-rank--${rank}` : ''}`; place.textContent = String(rank); place.setAttribute('aria-label', `Hạng ${rank}`);
        const avatar = document.createElement('span'); avatar.className = 'leaderboard-avatar'; avatar.textContent = Array.from(item.playerName.trim()).slice(0, 1).join('').toLocaleUpperCase('vi-VN') || '•'; avatar.setAttribute('aria-hidden', 'true');
        const name = document.createElement('span'); name.className = 'leaderboard-name'; name.textContent = item.playerName; name.title = item.playerName;
        if (item.uid === uid) { row.classList.add('is-self'); name.setAttribute('aria-label', `${item.playerName}, bạn`); }
        row.append(place, avatar, name);
        row.append(metric(formatLeaderboardNumber(item.levelReached), 'leaderboard-metric', 'Màn')); list.append(row);
      }
      results.dataset.offline = String(offline);
      if (data.top.length) { status.textContent = offline ? 'Chưa có kết nối.' : ''; results.replaceChildren(status, heading, list); }
      else { status.textContent = 'Chưa có thành tích.'; }
      own.textContent = data.own && !data.top.some(item => item.uid === uid) ? `Thành tích của bạn: ${describe(data.own, board.kind)}` : '';
      results.scrollTop = refreshRequested ? 0 : scrolls.get(`${currentKey}:${currentPage}`) || 0;
      loading = false; controls(data);
    } catch (error) {
      if (scope.active && id === generation) status.textContent = ['reset', 'stale'].includes(error.code) ? 'Bảng đã thay đổi. Làm mới để xem tiếp.' : 'Chưa tải được bảng. Thử lại.';
    } finally {
      if (scope.active && id === generation) { loading = false; refresh.disabled = false; previous.disabled = currentPage === 1; renderPages(); results.removeAttribute('aria-busy'); }
    }
  }
  scope.listen(games, 'click', event => { const item = event.target.closest('[data-rank-game]'); if (item) openDropdown(item); });
  scope.listen(refresh, 'click', () => { void load(true); });
  scope.listen(previous, 'click', () => { if (!loading && currentPage > 1) void load(false, currentPage - 1); });
  scope.listen(next, 'click', () => { if (!loading && !next.disabled) void load(false, currentPage + 1); });
  scope.listen(pageNumbers, 'click', event => {
    const item = event.target.closest('[data-page]');
    if (item && !loading && !item.disabled && Number(item.dataset.page) !== currentPage && loadedPages.includes(Number(item.dataset.page))) void load(false, Number(item.dataset.page));
  });
  scope.listen(compactPager, 'change', renderPages);
  let previousUid = getAccountService()?.getIdentity()?.uid;
  if (getAccountService()) scope.own(getAccountService().subscribe(() => {
    const uid = getAccountService().getIdentity()?.uid;
    if (uid !== previousUid) { previousUid = uid; void load(); }
  }), 'listener');
  updateFilters(); void load();
  return modal;
}
function button(text) { const element = document.createElement('button'); element.type = 'button'; element.className = 'app-button'; element.textContent = text; return element; }
function tabs(label, entries, kind) {
  const group = document.createElement('div'); group.className = `leaderboard-tabs leaderboard-tabs--${kind}`; group.setAttribute('role', 'group'); group.setAttribute('aria-label', label);
  for (const [value, text] of entries) { const item = button(text);
    item.dataset[kind === 'game' ? 'rankGame' : 'rankMode'] = value; group.append(item); }
  return group;
}
function metric(text, className, label) { const cell = document.createElement('strong'); cell.className = className; cell.textContent = text; cell.title = text; cell.setAttribute('aria-label', `${label} ${text}`); return cell; }
function describe(item) { return `Màn ${formatLeaderboardNumber(item.levelReached)}`; }
