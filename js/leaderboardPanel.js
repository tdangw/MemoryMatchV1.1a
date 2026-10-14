import { createIcon } from './icons.js';
import { openAppModal } from './modal.js';
import { GAME_DEFINITIONS, GAME_MODES, getGameDefinition } from './gameCatalog.js';
import { gameState } from './gameState.js';
import { NORMAL_MODE_IDS, MAX_ADVENTURE_LEVEL, getSuggestedAdventureLevel } from './adventureProgress.js';
import { getRecentGameId } from './recentGame.js';
import { getFirebaseBackend } from './firebaseBackend.js';
import { getAccountService } from './accountService.js';
import { getLeaderboardService } from './leaderboardService.js';
import { readLeaderboard } from './leaderboardStore.js';
import { rankingBoardId } from './rankingResult.js';
import { formatLeaderboardTime, formatLeaderboardNumber } from './leaderboardPresentation.js';
import { createGameShellLifecycle, getActiveGameScope } from './gameShell/gameShellLifecycle.js';
import { getAppPageScope } from './appPageLifecycle.js';
let lastGame = null;

export function openLeaderboards(gameId, onClose, surface = {}) {
  const scope = createGameShellLifecycle();
  let generation = 0;
  let selectedGame = gameId || lastGame || getRecentGameId();
  let selectedMode = NORMAL_MODE_IDS.includes(gameState.settings.mode) ? gameState.settings.mode : 'easy';
  let currentPage = 1;
  let currentKey = null;
  let loading = false;
  const scrolls = new Map();
  const content = document.createElement('div'); content.className = 'leaderboard-view';
  const games = tabs('Trò chơi', GAME_DEFINITIONS.map(item => [item.id, item.title]), 'game');
  const modes = tabs('Chế độ', [...GAME_MODES].sort((a, b) => (a.id === 'endless') - (b.id === 'endless')).map(item => [item.id, item.label]), 'mode');
  const filters = document.createElement('div'); filters.className = 'leaderboard-filters';
  const footer = document.createElement('div'); footer.className = 'leaderboard-footer';
  const context = document.createElement('p'); context.className = 'leaderboard-context';
  const levelLabel = document.createElement('label'); levelLabel.textContent = 'Màn ';
  const level = document.createElement('input'); level.type = 'number'; level.min = '1'; level.max = String(MAX_ADVENTURE_LEVEL); level.setAttribute('aria-label', 'Màn chơi'); levelLabel.append(level);
  const refresh = button('Làm mới');
  refresh.setAttribute('aria-label', 'Làm mới'); refresh.replaceChildren(createIcon('restart')); refresh.classList.add('leaderboard-refresh');
  const status = document.createElement('p'); status.className = 'leaderboard-status'; status.setAttribute('aria-live', 'polite');
  const results = document.createElement('div'); results.className = 'leaderboard-results'; results.tabIndex = 0; results.setAttribute('aria-label', 'Danh sách xếp hạng');
  const own = document.createElement('p'); own.className = 'leaderboard-own';
  const pager = document.createElement('nav'); pager.className = 'leaderboard-pager'; pager.setAttribute('aria-label', 'Trang xếp hạng');
  const previous = button('Trước'); const next = button('Sau');
  const pageLabel = document.createElement('span');
  const numbers = document.createElement('div'); numbers.className = 'leaderboard-page-numbers';
  pager.append(previous, pageLabel, numbers, next);
  filters.append(levelLabel); footer.append(filters, pager); results.append(status); content.append(games, modes, context, results, own, footer);
  const owner = surface.owner || getActiveGameScope() || getAppPageScope();
  const release = owner?.own(() => scope.dispose(), 'cleanup');
  const modal = openAppModal({ ...surface, id: 'rankings-modal', title: 'Bảng xếp hạng', icon: 'trophy', content, onDestroy: () => { generation++; scope.dispose(); release?.forget(); }, onClose });
  modal.panel.classList.add('leaderboard-panel');
  modal.panel.querySelector('.app-modal__header').append(refresh);
  function frontier() {
    const progress = gameState.progress[getGameDefinition(selectedGame).progressKey];
    level.value = String(getSuggestedAdventureLevel(progress.bestByLevel, progress.adventure));
  }
  function updateFilters() {
    lastGame = selectedGame;
    for (const item of games.children) item.setAttribute('aria-pressed', String(item.dataset.rankGame === selectedGame));
    for (const item of modes.children) item.setAttribute('aria-pressed', String(item.dataset.rankMode === selectedMode));
    levelLabel.hidden = !NORMAL_MODE_IDS.includes(selectedMode);
    context.textContent = NORMAL_MODE_IDS.includes(selectedMode) ? `Màn ${level.value}` : '';
    context.hidden = !NORMAL_MODE_IDS.includes(selectedMode);
  }
  function controls(data = null) {
    refresh.disabled = loading;
    previous.disabled = loading || currentPage === 1;
    next.disabled = loading || !data?.hasNext || currentPage >= 100;
    pageLabel.textContent = `Trang ${currentPage}`;
    numbers.replaceChildren();
    if (!data) return;
    const known = data.knownPages;
    for (const page of known.filter(value => value === 1 || Math.abs(value - currentPage) <= 2 || value === known.at(-1))) {
      const item = button(String(page)); item.dataset.page = String(page); item.disabled = loading;
      if (page === currentPage) item.setAttribute('aria-current', 'page');
      numbers.append(item);
    }
  }
  async function load(refreshRequested = false, requestedPage = 1) {
    const id = ++generation;
    const uid = getAccountService()?.getIdentity()?.uid;
    if (currentKey) { scrolls.delete(`${currentKey}:${currentPage}`); scrolls.set(`${currentKey}:${currentPage}`, results.scrollTop); while (scrolls.size > 60) scrolls.delete(scrolls.keys().next().value); }
    const normal = NORMAL_MODE_IDS.includes(selectedMode);
    const board = { gameId: selectedGame, mode: selectedMode, kind: normal ? 'time' : 'run', ...(normal ? { level: Number(level.value) } : { rulesVersion: 2 }) };
    loading = true; currentPage = requestedPage; controls();
    results.replaceChildren(status); own.textContent = ''; status.textContent = 'Đang tải…'; results.setAttribute('aria-busy', 'true');
    if (normal && (!Number.isSafeInteger(board.level) || board.level < 1 || board.level > MAX_ADVENTURE_LEVEL)) { loading = false; results.removeAttribute('aria-busy'); status.textContent = 'Hãy nhập số màn hợp lệ.'; controls(); return; }
    currentKey = `${uid || ''}:${rankingBoardId(board)}`;
    try {
      const backend = await getFirebaseBackend();
      if (!scope.active || id !== generation || uid !== getAccountService()?.getIdentity()?.uid) return;
      if (!backend || !navigator.onLine) { status.textContent = 'Chưa có kết nối.'; return; }
      if (refreshRequested) await getLeaderboardService()?.flush();
      if (!scope.active || id !== generation) return;
      const data = await readLeaderboard({ database: backend.database, environment: backend.environment, board, uid, refresh: refreshRequested, page: requestedPage });
      if (!scope.active || id !== generation || uid !== getAccountService()?.getIdentity()?.uid) return;
      currentPage = data.page;
      results.dataset.kind = board.kind;
      const heading = document.createElement('div'); heading.className = `leaderboard-heading leaderboard-heading--${board.kind}`;
      for (const text of board.kind === 'time' ? ['Hạng', 'Người chơi', 'Thời gian'] : ['Hạng', 'Người chơi', 'Màn', 'Điểm']) {
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
        if (board.kind === 'run') row.append(metric(formatLeaderboardNumber(item.levelReached), 'leaderboard-stage', 'Màn'));
        row.append(metric(board.kind === 'time' ? formatLeaderboardTime(item.durationMs) : formatLeaderboardNumber(item.totalScore), 'leaderboard-metric', board.kind === 'time' ? 'Thời gian' : 'Điểm')); list.append(row);
      }
      if (data.top.length) { status.textContent = ''; results.replaceChildren(status, heading, list); }
      else { status.textContent = 'Chưa có thành tích.'; }
      own.textContent = data.own && !data.top.some(item => item.uid === uid) ? `Thành tích của bạn: ${describe(data.own, board.kind)}` : '';
      results.scrollTop = refreshRequested ? 0 : scrolls.get(`${currentKey}:${currentPage}`) || 0;
      loading = false; controls(data);
    } catch (error) {
      if (scope.active && id === generation) status.textContent = ['reset', 'stale'].includes(error.code) ? 'Bảng đã thay đổi. Làm mới để xem tiếp.' : 'Chưa tải được bảng. Thử lại.';
    } finally {
      if (scope.active && id === generation) { loading = false; refresh.disabled = false; previous.disabled = currentPage === 1; results.removeAttribute('aria-busy'); }
    }
  }
  scope.listen(games, 'click', event => { const item = event.target.closest('[data-rank-game]'); if (!item) return; selectedGame = item.dataset.rankGame; frontier(); updateFilters(); void load(); });
  function revealMode(item) {
    const strip = modes.getBoundingClientRect(); const rect = item.getBoundingClientRect();
    if (rect.left < strip.left) modes.scrollLeft += rect.left - strip.left;
    else if (rect.right > strip.right) modes.scrollLeft += rect.right - strip.right;
  }
  scope.listen(modes, 'focusin', event => { const item = event.target.closest('[data-rank-mode]'); if (item) revealMode(item); });
  scope.listen(modes, 'wheel', event => { if (Math.abs(event.deltaY) > Math.abs(event.deltaX) && modes.scrollWidth > modes.clientWidth) { modes.scrollLeft += event.deltaY; event.preventDefault(); } }, { passive: false });
  scope.listen(modes, 'click', event => { const item = event.target.closest('[data-rank-mode]'); if (!item) return; selectedMode = item.dataset.rankMode; revealMode(item); updateFilters(); void load(); });
  scope.listen(level, 'change', () => { updateFilters(); void load(); });
  scope.listen(refresh, 'click', () => { void load(true); });
  scope.listen(previous, 'click', () => { void load(false, currentPage - 1); });
  scope.listen(next, 'click', () => { void load(false, currentPage + 1); });
  scope.listen(numbers, 'click', event => { const item = event.target.closest('[data-page]'); if (item) void load(false, Number(item.dataset.page)); });
  let previousUid = getAccountService()?.getIdentity()?.uid;
  if (getAccountService()) scope.own(getAccountService().subscribe(() => {
    const uid = getAccountService().getIdentity()?.uid;
    if (uid !== previousUid) { previousUid = uid; void load(); }
  }), 'listener');
  frontier(); updateFilters(); void load();
  return modal;
}
function button(text) { const element = document.createElement('button'); element.type = 'button'; element.className = 'app-button'; element.textContent = text; return element; }
function tabs(label, entries, kind) {
  const group = document.createElement('div'); group.className = `leaderboard-tabs leaderboard-tabs--${kind}`; group.setAttribute('role', 'group'); group.setAttribute('aria-label', label);
  for (const [value, text] of entries) { const item = button(text);
    if (kind === 'mode' && NORMAL_MODE_IDS.includes(value)) { const badge = document.createElement('span'); badge.textContent = { easy: 'C', normal: 'B', hard: 'A', superHard: 'S' }[value]; badge.className = 'leaderboard-grade'; badge.setAttribute('aria-hidden', 'true'); item.prepend(badge); }
    item.dataset[kind === 'game' ? 'rankGame' : 'rankMode'] = value; group.append(item); }
  return group;
}
function metric(text, className, label) { const cell = document.createElement('strong'); cell.className = className; cell.textContent = text; cell.title = text; cell.setAttribute('aria-label', `${label} ${text}`); return cell; }
function describe(item, kind) { return kind === 'time' ? formatLeaderboardTime(item.durationMs) : `${formatLeaderboardNumber(item.levelReached)} màn · ${formatLeaderboardNumber(item.totalScore)} điểm`; }
