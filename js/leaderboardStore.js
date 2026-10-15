import { doc, collection, getDocFromServer, getDocsFromServer, query, orderBy, documentId, limit, startAfter, runTransaction, serverTimestamp } from 'firebase/firestore';
import { rankingBoardId, validateRankingResult, comparePublicResults } from './rankingResult.js';
const cache = new Map();
const CACHE_LIMIT = 12;
const CACHE_TTL_MS = 120000;
const REFRESH_INTERVAL_MS = 15000;
function entries(database, environment, boardId) { return collection(database, 'gamespaces', environment, 'leaderboards', boardId, 'entries'); }
export async function submitRankingResult({ database, environment, uid, playerName, result, isCurrent = () => true }) {
  if (!validateRankingResult(result)) throw new Error('Thành tích không hợp lệ.');
  const boardId = rankingBoardId(result);
  const ref = doc(entries(database, environment, boardId), uid);
  const next = result.kind === 'progress' ? { rulesVersion: 3, resultId: result.id, gameId: result.gameId, family: result.family, kind: 'progress', playerName, reachedAt: serverTimestamp(), levelReached: result.levelReached }
    : { rulesVersion: result.rulesVersion, resultId: result.id, gameId: result.gameId, mode: result.mode, kind: result.kind, playerName, updatedAt: serverTimestamp(),
    ...(result.kind === 'time' ? { level: result.level, durationMs: result.durationMs, score: result.score, stars: result.stars } : { levelReached: result.levelReached, totalScore: result.totalScore, outcome: result.outcome }) };
  let reads = 0;
  const commit = () => runTransaction(database, async transaction => {
    if (!isCurrent()) throw new Error('Tài khoản đã thay đổi.');
    const previous = await transaction.get(ref); reads++;
    if (!isCurrent()) throw new Error('Tài khoản đã thay đổi.');
    if (previous.exists() && comparePublicResults(next, previous.data(), result.kind) >= 0) return false;
    transaction.set(ref, next); return true;
  });
  let written;
  // Rules may reject a racing worse write before the backend reports its stale precondition.
  // Re-read in a new bounded transaction so it becomes a no-op against the winning best.
  for (let attempt = 0; attempt < 3; attempt++) {
    try { written = await commit(); break; }
    catch (error) { if (error.code !== 'permission-denied' || attempt === 2 || !isCurrent()) throw error; }
  }
  if (written) for (const key of cache.keys()) if (key.startsWith(`${environment}:${boardId}:`)) cache.delete(key);
  return { reads, writes: written ? 1 : 0 };
}
export async function readLeaderboard({ database, environment, board, uid = null, refresh = false, forceRefresh = false, page = 1 }) {
  if (!Number.isSafeInteger(page) || page < 1 || page > 100) throw pageError('reset');
  const boardId = rankingBoardId(board);
  const key = `${environment}:${boardId}:${uid || ''}`;
  let state = cache.get(key);
  const now = Date.now();
  if (state && (forceRefresh || refresh && now - state.refreshedAt >= REFRESH_INTERVAL_MS)) { cache.delete(key); state = null; page = 1; }
  if (state && now - state.fetchedAt >= CACHE_TTL_MS) { cache.delete(key); state = null; }
  if (!state) {
    if (page !== 1) throw pageError('reset');
    state = { pages: new Map(), cursors: new Map([[1, null]]), ownTask: null, own: null, seenPages: new Map(), fetchedAt: now, refreshedAt: now };
    cache.set(key, state);
    while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
  } else { cache.delete(key); cache.set(key, state); }
  const cached = state.pages.get(page);
  if (cached) { state.pages.delete(page); state.pages.set(page, cached); return { ...cached, knownPages: [...state.cursors.keys()], loadedPages: [...state.seenPages.keys()], cached: true }; }
  if (!state.cursors.has(page)) throw pageError('reset');
  const ref = entries(database, environment, boardId);
  const ordering = board.kind === 'progress' ? [orderBy('levelReached', 'desc'), orderBy('reachedAt', 'asc')]
    : board.kind === 'time' ? [orderBy('durationMs', 'asc')] : [orderBy('levelReached', 'desc'), orderBy('totalScore', 'desc')];
  const ownReads = !state.ownTask && uid ? 1 : 0;
  if (!state.ownTask) state.ownTask = (uid ? getDocFromServer(doc(ref, uid)) : Promise.resolve(null)).then(own => {
    state.own = own?.exists() ? { uid: own.id, ...own.data() } : null;
  }).catch(error => { state.ownTask = null; throw error; });
  const cursor = state.cursors.get(page);
  const [top] = await Promise.all([
    getDocsFromServer(query(ref, ...ordering, orderBy(documentId(), 'asc'), ...(cursor ? [startAfter(...cursor)] : []), limit(11))),
    state.ownTask,
  ]);
  const rows = top.docs.slice(0, 10).map(item => ({ uid: item.id, ...item.data() }));
  assertOrderedPage(rows, board.kind, cursor, state.pages, page);
  const seen = new Set();
  for (const [number, ids] of state.seenPages) if (number !== page) for (const id of ids) seen.add(id);
  if (rows.some(row => seen.has(row.uid))) throw pageError('stale');
  state.seenPages.set(page, rows.map(row => row.uid));
  const hasNext = top.size > 10;
  if (hasNext && page < 100) state.cursors.set(page + 1, rankingCursor(rows[9], board.kind));
  const result = { top: rows, own: state.own, page, hasNext, knownPages: [...state.cursors.keys()], loadedPages: [...state.seenPages.keys()], fetchedAt: Date.now(), reads: top.size + ownReads, cached: false };
  if (cache.get(key) === state) {
    state.pages.set(page, result);
    while (state.pages.size > 5) state.pages.delete(state.pages.keys().next().value);
  }
  return result;
}
export function rankingCursor(row, kind) { return kind === 'progress' ? [row.levelReached, row.reachedAt, row.uid] : kind === 'time' ? [row.durationMs, row.uid] : [row.levelReached, row.totalScore, row.uid]; }
export function assertOrderedPage(rows, kind, cursor = null, pages = new Map(), page = 1) {
  const compare = (a, b) => comparePublicResults(a, b, kind)
    || (kind === 'progress' ? a.reachedAt.seconds - b.reachedAt.seconds || a.reachedAt.nanoseconds - b.reachedAt.nanoseconds : 0)
    || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0);
  const seen = new Set();
  for (const [number, cached] of pages) if (number !== page) for (const item of cached.top) seen.add(item.uid);
  let previous = cursor ? (kind === 'time' ? { durationMs: cursor[0], uid: cursor[1] } : kind === 'progress' ? { levelReached: cursor[0], reachedAt: cursor[1], uid: cursor[2] } : { levelReached: cursor[0], totalScore: cursor[1], uid: cursor[2] }) : null;
  for (const row of rows) {
    if (seen.has(row.uid) || previous && compare(previous, row) >= 0) throw pageError('stale');
    seen.add(row.uid); previous = row;
  }
}
function pageError(code) { const error = new Error(code === 'stale' ? 'Bảng đã thay đổi. Hãy làm mới.' : 'Hãy về trang đầu và làm mới.'); error.code = code; return error; }
export function clearLeaderboardCache() { cache.clear(); }
export function readCachedLeaderboard({ environment, board, uid = null, page = 1 }) {
  const state = cache.get(`${environment}:${rankingBoardId(board)}:${uid || ''}`);
  if (!state || Date.now() - state.fetchedAt >= CACHE_TTL_MS) return null;
  const data = state.pages.get(page);
  return data ? { ...data, knownPages: [...state.cursors.keys()], loadedPages: [...state.seenPages.keys()], cached: true } : null;
}
export function getLeaderboardCacheDiagnostics() { return { boards: cache.size, pages: [...cache.values()].map(state => state.pages.size), cursors: [...cache.values()].map(state => state.cursors.size) }; }
