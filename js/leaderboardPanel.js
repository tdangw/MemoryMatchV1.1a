import { openAppModal } from './modal.js';
import { GAME_DEFINITIONS, GAME_MODES } from './gameCatalog.js';
import { NORMAL_MODE_IDS, MAX_ADVENTURE_LEVEL } from './adventureProgress.js';
import { getRecentGameId } from './recentGame.js';
import { getFirebaseBackend } from './firebaseBackend.js';
import { getAccountService } from './accountService.js';
import { getLeaderboardService } from './leaderboardService.js';
import { readLeaderboard } from './leaderboardStore.js';
import { createGameShellLifecycle, getActiveGameScope } from './gameShell/gameShellLifecycle.js';
import { getAppPageScope } from './appPageLifecycle.js';

export function openLeaderboards(gameId = getRecentGameId(), onClose, surface = {}) {
  const scope = createGameShellLifecycle();
  let generation = 0;
  const content = document.createElement('div'); content.className = 'leaderboard-view';
  const filters = document.createElement('div'); filters.className = 'leaderboard-filters';
  const game = select('Trò chơi', GAME_DEFINITIONS.map(item => [item.id, item.title])); game.value = gameId || getRecentGameId();
  const mode = select('Chế độ', []);
  const level = document.createElement('input'); level.type = 'number'; level.min = '1'; level.max = String(MAX_ADVENTURE_LEVEL); level.value = '1'; level.setAttribute('aria-label', 'Màn chơi');
  const refresh = document.createElement('button'); refresh.type = 'button'; refresh.className = 'app-button'; refresh.textContent = 'Làm mới';
  const status = document.createElement('p'); status.setAttribute('aria-live', 'polite');
  const results = document.createElement('div');
  const note = document.createElement('p'); note.className = 'account-explanation'; note.textContent = 'Kỷ lục mọi thời gian · Có thể dùng hỗ trợ. Thành tích do ứng dụng gửi, chưa xác minh toàn bộ ván chơi trên máy chủ.';
  filters.append(game, mode, level, refresh); content.append(filters, status, results, note);
  const owner = surface.owner || getActiveGameScope() || getAppPageScope();
  const release = owner?.own(() => scope.dispose(), 'cleanup');
  const modal = openAppModal({ ...surface, id: 'rankings-modal', title: 'Bảng xếp hạng', icon: 'trophy', content, onDestroy: () => { scope.dispose(); release?.forget(); }, onClose });
  function updateModes() {
    const previous = mode.value;
    mode.replaceChildren(...GAME_MODES.filter(item => NORMAL_MODE_IDS.includes(item.id) || item.id === 'challenge' || item.id === 'endless' && game.value === 'triple-connect').map(item => new Option(item.label, item.id)));
    if ([...mode.options].some(option => option.value === previous)) mode.value = previous;
    level.hidden = !NORMAL_MODE_IDS.includes(mode.value);
  }
  async function load(refreshRequested = false) {
    const id = ++generation;
    refresh.disabled = true;
    status.textContent = 'Đang tải kỷ lục…';
    const normal = NORMAL_MODE_IDS.includes(mode.value);
    const board = { gameId: game.value, mode: mode.value, kind: normal ? 'time' : 'run', ...(normal ? { level: Number(level.value) } : {}) };
    if (normal && (!Number.isSafeInteger(board.level) || board.level < 1 || board.level > MAX_ADVENTURE_LEVEL)) { status.textContent = 'Hãy nhập số màn hợp lệ.'; refresh.disabled = false; return; }
    try {
      const backend = await getFirebaseBackend();
      if (!scope.active || id !== generation) return;
      const identity = getAccountService()?.getIdentity();
      if (!backend) { status.textContent = 'Cloud đang tắt trong môi trường kiểm tra.'; return; }
      if (refreshRequested) await getLeaderboardService()?.flush();
      if (!scope.active || id !== generation) return;
      const data = await readLeaderboard({ database: backend.database, environment: backend.environment, board, uid: identity?.uid, refresh: refreshRequested });
      if (!scope.active || id !== generation || identity?.uid !== getAccountService()?.getIdentity()?.uid) return;
      results.replaceChildren();
      const list = document.createElement('ol'); list.className = 'leaderboard-list';
      for (const item of data.top) {
        const row = document.createElement('li');
        const name = document.createElement('span'); name.textContent = item.playerName;
        const metric = document.createElement('strong'); metric.textContent = describe(item, board.kind);
        if (item.uid === identity?.uid) row.classList.add('is-self');
        row.append(name, metric); list.append(row);
      }
      if (data.top.length) results.append(list);
      else { const empty = document.createElement('p'); empty.textContent = 'Chưa có thành tích trên bảng này.'; results.append(empty); }
      const own = document.createElement('p'); own.className = 'leaderboard-own';
      own.textContent = data.own ? `Kỷ lục của bạn: ${describe(data.own, board.kind)}` : 'Kỷ lục của bạn: chưa có. Chơi một ván mới để ghi thành tích.';
      results.append(own);
      status.textContent = `${data.cached ? 'Bản đã tải gần đây' : 'Đã cập nhật'}${getLeaderboardService() ? ` · ${getLeaderboardService().getState().message}` : ''}`;
    } catch (error) { if (scope.active && id === generation) status.textContent = `Chưa tải được bảng (${error.code || error.name}). Kỷ lục trên máy vẫn được giữ.`; }
    finally { if (scope.active && id === generation) refresh.disabled = false; }
  }
  scope.listen(game, 'change', () => { updateModes(); void load(); });
  scope.listen(mode, 'change', () => { level.hidden = !NORMAL_MODE_IDS.includes(mode.value); void load(); });
  scope.listen(level, 'change', () => { void load(); });
  scope.listen(refresh, 'click', () => { void load(true); });
  let previousUid = getAccountService()?.getIdentity()?.uid;
  if (getAccountService()) scope.own(getAccountService().subscribe(() => {
    const uid = getAccountService().getIdentity()?.uid;
    if (uid !== previousUid) { previousUid = uid; void load(); }
  }), 'listener');
  updateModes(); void load();
  return modal;
}
function select(label, options) {
  const element = document.createElement('select'); element.setAttribute('aria-label', label);
  element.append(...options.map(([value, text]) => new Option(text, value)));
  return element;
}
function describe(item, kind) { return kind === 'time' ? `${(item.durationMs / 1000).toFixed(2)} giây` : `Màn ${item.levelReached} · ${item.totalScore.toLocaleString('vi-VN')} điểm`; }
