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
  const levelLabel = document.createElement('label'); levelLabel.textContent = 'Màn ';
  const level = document.createElement('input'); level.type = 'number'; level.min = '1'; level.max = String(MAX_ADVENTURE_LEVEL); level.setAttribute('aria-label', 'Màn chơi'); levelLabel.append(level);
  const refresh = button('Làm mới');
  const status = document.createElement('p'); status.className = 'leaderboard-status'; status.setAttribute('aria-live', 'polite');
  const results = document.createElement('div'); results.className = 'leaderboard-results'; results.tabIndex = 0; results.setAttribute('aria-label', 'Danh sách xếp hạng');
  const own = document.createElement('p'); own.className = 'leaderboard-own';
  const pager = document.createElement('nav'); pager.className = 'leaderboard-pager'; pager.setAttribute('aria-label', 'Trang xếp hạng');
  const previous = button('Trước'); const next = button('Sau');
  const pageLabel = document.createElement('span');
  const numbers = document.createElement('div'); numbers.className = 'leaderboard-page-numbers';
  pager.append(previous, pageLabel, numbers, next);
  filters.append(levelLabel, refresh); content.append(games, modes, filters, status, results, own, pager);
  const owner = surface.owner || getActiveGameScope() || getAppPageScope();
  const release = owner?.own(() => scope.dispose(), 'cleanup');
  const modal = openAppModal({ ...surface, id: 'rankings-modal', title: 'Bảng xếp hạng', icon: 'trophy', content, onDestroy: () => { generation++; scope.dispose(); release?.forget(); }, onClose });
  modal.panel.classList.add('leaderboard-panel');
  function frontier() {
    const progress = gameState.progress[getGameDefinition(selectedGame).progressKey];
    level.value = String(getSuggestedAdventureLevel(progress.bestByLevel, progress.adventure));
  }
  function updateFilters() {
    lastGame = selectedGame;
    for (const item of games.children) item.setAttribute('aria-pressed', String(item.dataset.rankGame === selectedGame));
    for (const item of modes.children) item.setAttribute('aria-pressed', String(item.dataset.rankMode === selectedMode));
    levelLabel.hidden = !NORMAL_MODE_IDS.includes(selectedMode);
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
    results.replaceChildren(); own.textContent = ''; status.textContent = 'Đang tải kỷ lục…'; results.setAttribute('aria-busy', 'true');
    if (normal && (!Number.isSafeInteger(board.level) || board.level < 1 || board.level > MAX_ADVENTURE_LEVEL)) { loading = false; results.removeAttribute('aria-busy'); status.textContent = 'Hãy nhập số màn hợp lệ.'; controls(); return; }
    currentKey = `${uid || ''}:${rankingBoardId(board)}`;
    try {
      const backend = await getFirebaseBackend();
      if (!scope.active || id !== generation || uid !== getAccountService()?.getIdentity()?.uid) return;
      if (!backend || !navigator.onLine) { status.textContent = 'Chưa có kết nối. Kỷ lục trên máy vẫn được giữ.'; return; }
      if (refreshRequested) await getLeaderboardService()?.flush();
      if (!scope.active || id !== generation) return;
      const data = await readLeaderboard({ database: backend.database, environment: backend.environment, board, uid, refresh: refreshRequested, page: requestedPage });
      if (!scope.active || id !== generation || uid !== getAccountService()?.getIdentity()?.uid) return;
      currentPage = data.page;
      const list = document.createElement('ol'); list.className = 'leaderboard-list'; list.start = (currentPage - 1) * 10 + 1;
      for (const [index, item] of data.top.entries()) {
        const rank = (currentPage - 1) * 10 + index + 1;
        const row = document.createElement('li');
        const place = document.createElement('span'); place.className = 'leaderboard-rank'; place.textContent = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : String(rank); place.setAttribute('aria-label', `Hạng ${rank}`);
        const avatar = document.createElement('span'); avatar.className = 'leaderboard-avatar'; avatar.append(createIcon('account')); avatar.setAttribute('aria-hidden', 'true');
        const name = document.createElement('span'); name.className = 'leaderboard-name'; name.textContent = item.playerName; name.title = item.playerName;
        const metric = document.createElement('strong'); metric.textContent = describe(item, board.kind);
        if (item.uid === uid) row.classList.add('is-self');
        row.append(place, avatar, name, metric); list.append(row);
      }
      if (data.top.length) results.append(list);
      else { const empty = document.createElement('p'); empty.textContent = 'Chưa có thành tích trên bảng này.'; results.append(empty); }
      own.textContent = data.own ? `Kỷ lục của bạn: ${describe(data.own, board.kind)}` : 'Kỷ lục của bạn: chưa có.';
      results.scrollTop = refreshRequested ? 0 : scrolls.get(`${currentKey}:${currentPage}`) || 0;
      status.textContent = currentPage === 100 && data.hasNext ? 'Hãy làm mới để xem từ trang đầu.' : data.cached ? 'Kỷ lục đã tải gần đây' : 'Đã cập nhật';
      loading = false; controls(data);
    } catch (error) {
      if (scope.active && id === generation) status.textContent = ['reset', 'stale'].includes(error.code) ? error.message : 'Chưa tải được bảng. Hãy thử lại khi có kết nối.';
    } finally {
      if (scope.active && id === generation) { loading = false; refresh.disabled = false; previous.disabled = currentPage === 1; results.removeAttribute('aria-busy'); }
    }
  }
  scope.listen(games, 'click', event => { const item = event.target.closest('[data-rank-game]'); if (!item) return; selectedGame = item.dataset.rankGame; frontier(); updateFilters(); void load(); });
  scope.listen(modes, 'click', event => { const item = event.target.closest('[data-rank-mode]'); if (!item) return; selectedMode = item.dataset.rankMode; updateFilters(); void load(); });
  scope.listen(level, 'change', () => { void load(); });
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
function describe(item, kind) { return kind === 'time' ? `${(item.durationMs / 1000).toFixed(2)} giây` : `Màn ${item.levelReached} · ${item.totalScore.toLocaleString('vi-VN')} điểm`; }
