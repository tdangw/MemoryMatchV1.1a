import { createIcon } from './icons.js';
import { openAppModal } from './modal.js';
import { readPublicCosmetics } from './progression/publicCosmeticStore.js';
import { cosmeticPortrait } from './progression/profileCosmetics.js';
import { GAME_DEFINITIONS } from './gameCatalog.js';
import { getRecentGameId } from './recentGame.js';
import { getFirebaseBackend } from './firebaseBackend.js';
import { getAccountService } from './accountService.js';
import { getLeaderboardService } from './leaderboardService.js';
import { readLeaderboard } from './leaderboardStore.js';
import { readCachedLeaderboard } from './leaderboardStore.js';
import { rankingBoardId } from './rankingResult.js';
import { adventureRankingEnabled } from './adventureRankingAvailability.js';
import { formatLeaderboardNumber, compactLeaderboardPages } from './leaderboardPresentation.js';
import { createGameShellLifecycle, getActiveGameScope } from './gameShell/gameShellLifecycle.js';
import { getAppPageScope } from './appPageLifecycle.js';
let lastGame = null;
const families = [['adventure', 'Hành trình'], ['challenge', 'Thử thách'], ['endless', 'Vô tận']];
let lastFamily = 'adventure';
let lastDifficulty = 'easy';
const difficulties = [['easy','C'],['normal','B'],['hard','A'],['superHard','S']];

export function openLeaderboards(gameId, onClose, surface = {}) {
  const scope = createGameShellLifecycle();
  let generation = 0;
  let selectedGame = gameId || lastGame || getRecentGameId();
  let selectedFamily = lastFamily;
  let selectedDifficulty = lastDifficulty;
  const enhanced = adventureRankingEnabled();
  let currentPage = 1;
  let currentKey = null;
  let loading = false;
  let dropdown = null;
  let loadedPages = [1];
  const compactPager = window.matchMedia('(max-width: 700px)');
  const scrolls = new Map();
  const content = document.createElement('div'); content.className = enhanced ? 'leaderboard-view leaderboard-view--records' : 'leaderboard-view';
  const games = tabs('Trò chơi', GAME_DEFINITIONS.map(item => [item.id, item.title]), 'game');
  const familyPicker = button(''); familyPicker.className = 'leaderboard-family-picker';
  familyPicker.setAttribute('aria-haspopup', 'menu'); familyPicker.setAttribute('aria-expanded', 'false');
  const difficultyPicker = document.createElement('div'); difficultyPicker.className = 'leaderboard-difficulties';
  difficultyPicker.setAttribute('role', 'group'); difficultyPicker.setAttribute('aria-label', 'Độ khó');
  for (const [mode, label] of difficulties) { const control = button(label); control.dataset.rankDifficulty = mode; control.setAttribute('aria-label', `Độ khó ${label}`); difficultyPicker.append(control); }
  const footer = document.createElement('div'); footer.className = 'leaderboard-footer';
  const status = document.createElement('p'); status.className = 'leaderboard-status'; status.setAttribute('aria-live', 'polite');
  const retry = button('Thử lại'); retry.classList.add('leaderboard-retry'); retry.hidden = true;
  const results = document.createElement('div'); results.className = 'leaderboard-results'; results.tabIndex = 0; results.setAttribute('aria-label', 'Danh sách xếp hạng');
  const own = document.createElement('div'); own.className = 'leaderboard-own'; own.setAttribute('aria-label', 'Thứ hạng của bạn'); own.setAttribute('role', 'group');
  const pager = document.createElement('nav'); pager.className = 'leaderboard-pager'; pager.tabIndex = -1; pager.setAttribute('aria-label', 'Trang xếp hạng');
  const previous = button('Trước'); const next = button('Sau');
  previous.setAttribute('aria-label', 'Trước'); previous.textContent = '‹';
  next.setAttribute('aria-label', 'Sau'); next.textContent = '›';
  const pageNumbers = document.createElement('span'); pageNumbers.className = 'leaderboard-page-numbers';
  pager.append(previous, pageNumbers, next);
  const heading = createHeading();
  footer.append(pager); results.append(heading, status); content.append(games, results, footer, own);
  const owner = surface.owner || getActiveGameScope() || getAppPageScope();
  const release = owner?.own(() => scope.dispose(), 'cleanup');
  const modal = openAppModal({ ...surface, id: 'rankings-modal', title: 'Bảng xếp hạng', icon: 'trophy', content, onDestroy: () => { generation++; scope.dispose(); release?.forget(); }, onClose });
  modal.panel.classList.add('leaderboard-panel');
  function updateFilters() {
    lastGame = selectedGame;
    difficultyPicker.hidden = !enhanced || selectedFamily !== 'adventure';
    for (const control of difficultyPicker.children) control.setAttribute('aria-pressed', String(control.dataset.rankDifficulty === selectedDifficulty));
    for (const item of games.children) {
      const selected = item.dataset.rankGame === selectedGame;
      item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1;
    }
    const familyLabel = families.find(([id]) => id === selectedFamily)[1];
    familyPicker.replaceChildren(document.createTextNode(familyLabel), createIcon('chevron-down'));
    familyPicker.setAttribute('aria-label', `Loại bảng xếp hạng: ${familyLabel}`);
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
    menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', 'Loại bảng xếp hạng');
    const choices = families.map(([family, label]) => {
      const choice = button(label); choice.dataset.rankFamily = family;
      choice.setAttribute('role', 'menuitemradio'); choice.setAttribute('aria-checked', String(family === selectedFamily));
      menu.append(choice); return choice;
    });
    document.body.append(menu); dropdown = { anchor, lifecycle, menu }; anchor.setAttribute('aria-expanded', 'true');
    const position = () => {
      const rect = anchor.getBoundingClientRect(); const width = menu.getBoundingClientRect().width; const height = menu.offsetHeight;
      menu.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - width - 8))}px`;
      const down = innerHeight - rect.bottom >= height + 8;
      menu.dataset.direction = down ? 'down' : 'up';
      menu.style.top = `${Math.max(8, Math.min(down ? rect.bottom + 5 : rect.top - height - 5, innerHeight - height - 8))}px`;
    };
    position(); choices.find(choice => choice.dataset.rankFamily === selectedFamily).focus();
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
      const family = item.dataset.rankFamily;
      closeDropdown(true);
      if (family === selectedFamily) return;
      selectedFamily = lastFamily = family; updateFilters(); void load();
    });
  }
  function controls(data = null) {
    if (data) loadedPages = data.loadedPages;
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
  function createHeading() {
    const heading = document.createElement('div'); heading.className = 'leaderboard-heading leaderboard-heading--progress';
    if (enhanced) { heading.classList.add('leaderboard-heading--filters'); heading.append(familyPicker, difficultyPicker); return heading; }
    const rank = document.createElement('span'); rank.textContent = 'Hạng';
    const player = document.createElement('span'); player.className = 'leaderboard-heading-player';
    const label = document.createElement('span'); label.textContent = 'Người chơi';
    player.append(label);
    const level = document.createElement('span'); level.textContent = 'Màn';
    heading.append(rank, player, familyPicker, level); return heading;
  }
  function renderResults(...nodes) {
    // Keep the filter mounted while loading or paginating so its focus/menu owner survives.
    for (const child of [...results.children]) if (child !== heading) child.remove();
    results.append(...nodes);
  }
  async function load(refreshRequested = false, requestedPage = 1, recovered = false) {
    const id = ++generation;
    const uid = getAccountService()?.getIdentity()?.uid;
    if (currentKey) { scrolls.delete(`${currentKey}:${currentPage}`); scrolls.set(`${currentKey}:${currentPage}`, results.scrollTop); while (scrolls.size > 60) scrolls.delete(scrolls.keys().next().value); }
    const board = enhanced && selectedFamily === 'adventure'
      ? { gameId: selectedGame, family: 'adventure', mode: selectedDifficulty, kind: 'adventure', rulesVersion: 4 }
      : { gameId: selectedGame, family: selectedFamily, kind: 'progress', rulesVersion: 3 };
    const nextKey = `${uid || ''}:${rankingBoardId(board)}`;
    if (nextKey !== currentKey) loadedPages = [1];
    loading = true; currentPage = requestedPage; controls();
    retry.hidden = true; renderResults(status, retry); own.textContent = ''; status.textContent = 'Đang tải…'; results.setAttribute('aria-busy', 'true');
    currentKey = nextKey;
    try {
      const backend = await getFirebaseBackend();
      if (!scope.active || id !== generation || uid !== getAccountService()?.getIdentity()?.uid) return;
      if (!backend) { status.textContent = 'Chưa có kết nối.'; return; }
      if (refreshRequested && navigator.onLine) await getLeaderboardService()?.flush();
      if (!scope.active || id !== generation) return;
      const offline = !navigator.onLine;
      const data = offline ? readCachedLeaderboard({ environment: backend.environment, board, uid, page: requestedPage })
        : await readLeaderboard({ database: backend.database, environment: backend.environment, board, uid, refresh: refreshRequested, forceRefresh: refreshRequested, page: requestedPage });
      if (!scope.active || id !== generation || uid !== getAccountService()?.getIdentity()?.uid) return;
      if (!data) { status.textContent = 'Chưa có kết nối.'; return; }
      const cosmetics = await readPublicCosmetics({ database: backend.database, environment: backend.environment,
        uids: [...new Set([...data.top.map(row => row.uid), ...(data.own && uid ? [uid] : [])])], refresh: refreshRequested, offline });
      if (!scope.active || id !== generation || uid !== getAccountService()?.getIdentity()?.uid) return;
      currentPage = data.page;
      results.dataset.kind = board.kind;
      const list = document.createElement('ol'); list.className = 'leaderboard-list'; list.start = (currentPage - 1) * 10 + 1;
      for (const [index, item] of data.top.entries()) {
        const rank = (currentPage - 1) * 10 + index + 1;
        const row = document.createElement('li');
        fillRankingRow(row, item, rank, cosmetics.selections.get(item.uid), item.uid === uid, enhanced, board.kind === 'adventure');
        list.append(row);
      }
      results.dataset.offline = String(offline);
      if (data.top.length) { status.textContent = offline ? 'Chưa có kết nối.' : cosmetics.available ? '' : 'Chưa cập nhật được ảnh hồ sơ.'; renderResults(status, retry, list); }
      else { status.textContent = 'Chưa có thành tích.'; }
      if (data.own && uid) {
        const rowIndex = data.top.findIndex(item => item.uid === uid);
        const ownRank = data.ownRank || (rowIndex >= 0 ? (currentPage - 1) * 10 + rowIndex + 1 : null);
        fillRankingRow(own, data.own, ownRank, cosmetics.selections.get(uid), true, enhanced, board.kind === 'adventure', true);
      } else own.textContent = uid ? 'Bạn chưa có thành tích ở bảng này.' : '';
      results.scrollTop = refreshRequested ? 0 : scrolls.get(`${currentKey}:${currentPage}`) || 0;
      loading = false; controls(data);
    } catch (error) {
      if (scope.active && id === generation) {
        if (['reset', 'stale'].includes(error.code) && !recovered) return await load(true, 1, true);
        status.textContent = 'Chưa tải được bảng.'; retry.hidden = false;
      }
    } finally {
      if (scope.active && id === generation) { loading = false; previous.disabled = currentPage === 1; renderPages(); results.removeAttribute('aria-busy'); }
    }
  }
  function selectGame(item) {
    if (!item || item.dataset.rankGame === selectedGame) return;
    closeDropdown(); selectedGame = item.dataset.rankGame; updateFilters(); void load();
  }
  scope.listen(games, 'click', event => selectGame(event.target.closest('[data-rank-game]')));
  scope.listen(games, 'keydown', event => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    const items = [...games.children], index = items.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length;
    selectGame(items[next]); items[next].focus();
  });
  scope.listen(familyPicker, 'click', () => openDropdown(familyPicker));
  scope.listen(difficultyPicker, 'click', event => {
    const control = event.target.closest('[data-rank-difficulty]');
    if (!control || control.dataset.rankDifficulty === selectedDifficulty) return;
    selectedDifficulty = lastDifficulty = control.dataset.rankDifficulty; updateFilters(); void load();
  });
  scope.listen(retry, 'click', () => { if (!loading) void load(true); });
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
    if (uid !== previousUid) { previousUid = uid; void load(true); }
  }), 'listener');
  updateFilters(); void load(true);
  return modal;
}
function fillRankingRow(row, item, rank, cosmetic, self, enhanced, adventure, pinned = false) {
  const place = rankMarker(rank);
  const avatar = document.createElement('span'); avatar.className = 'leaderboard-avatar';
  avatar.append(cosmeticPortrait(cosmetic, { label: item.playerName || 'Bạn' }));
  const name = document.createElement('span'); name.className = 'leaderboard-name'; name.textContent = item.playerName || 'Bạn'; name.title = name.textContent;
  row.classList.toggle('is-self', self);
  if (self) name.setAttribute('aria-label', `${name.textContent}, bạn`);
  row.classList.toggle('leaderboard-card', enhanced);
  row.classList.toggle('leaderboard-card--adventure', enhanced && adventure);
  const identity = document.createElement('div'); identity.className = 'leaderboard-own-identity';
  if (pinned) { const label = document.createElement('small'); label.textContent = 'Bạn'; identity.append(label); }
  identity.append(name);
  const level = metric(formatLeaderboardNumber(item.levelReached), 'leaderboard-metric', 'Màn');
  if (!enhanced) { row.replaceChildren(place, avatar, pinned ? identity : name, level); return; }
  identity.classList.add('leaderboard-card-name');
  if (adventure) {
    level.textContent = `Màn ${formatLeaderboardNumber(item.levelReached)}`; level.classList.add('leaderboard-card-level');
    const stats = document.createElement('div'); stats.className = 'leaderboard-card-stats';
    for (const [key, label] of [['moves','Lượt'],['misses','Sai'],['score','Điểm']]) {
      const cell = document.createElement('div'), caption = document.createElement('small'); caption.textContent = label;
      const value = item.metricsComplete === true ? formatLeaderboardNumber(item[key]) : '—';
      cell.append(caption, metric(value, `leaderboard-card-stat leaderboard-card-stat--${key}`, label)); stats.append(cell);
    }
    row.replaceChildren(identity, level, place, avatar, stats);
  } else {
    const progress = document.createElement('div'); progress.className = 'leaderboard-card-progress';
    const caption = document.createElement('small'); caption.textContent = 'Màn'; progress.append(caption, level);
    row.replaceChildren(identity, place, avatar, progress);
  }
}

function rankMarker(rank) {
  const place = document.createElement('span'); place.className = 'leaderboard-rank';
  place.textContent = rank ? formatLeaderboardNumber(rank) : '—';
  place.setAttribute('aria-label', rank ? `Hạng ${rank}` : 'Chưa cập nhật hạng');
  if (rank >= 1 && rank <= 3) {
    place.classList.add(`leaderboard-rank--${rank}`); place.setAttribute('role', 'img');
    const number = document.createElement('span'); number.className = 'leaderboard-medal-number'; number.textContent = String(rank); number.setAttribute('aria-hidden', 'true');
    place.replaceChildren(createIcon('rank-medal'), number);
  }
  return place;
}
function button(text) { const element = document.createElement('button'); element.type = 'button'; element.className = 'app-button'; element.textContent = text; return element; }
function tabs(label, entries, kind) {
  const group = document.createElement('div'); group.className = `leaderboard-tabs leaderboard-tabs--${kind}`; group.setAttribute('role', 'tablist'); group.setAttribute('aria-label', label);
  for (const [value, text] of entries) { const item = button(text);
    item.dataset[kind === 'game' ? 'rankGame' : 'rankMode'] = value; item.setAttribute('role', 'tab'); group.append(item); }
  return group;
}
function metric(text, className, label) { const cell = document.createElement('strong'); cell.className = className; cell.textContent = text; cell.title = text; cell.setAttribute('aria-label', `${label} ${text}`); return cell; }
