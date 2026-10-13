import { doc, collection, getDocFromServer, getDocsFromServer, query, orderBy, documentId, limit, runTransaction, serverTimestamp } from 'firebase/firestore';
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
  const next = { rulesVersion: 1, resultId: result.id, gameId: result.gameId, mode: result.mode, kind: result.kind, playerName, updatedAt: serverTimestamp(),
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
export async function readLeaderboard({ database, environment, board, uid = null, refresh = false }) {
  const boardId = rankingBoardId(board);
  const key = `${environment}:${boardId}:${uid || ''}`;
  const previous = cache.get(key);
  const age = previous ? Date.now() - previous.fetchedAt : Infinity;
  if (previous && age < (refresh ? REFRESH_INTERVAL_MS : CACHE_TTL_MS)) return { ...previous, cached: true };
  const ref = entries(database, environment, boardId);
  const ordering = board.kind === 'time' ? [orderBy('durationMs', 'asc')] : [orderBy('levelReached', 'desc'), orderBy('totalScore', 'desc')];
  const [top, own] = await Promise.all([
    getDocsFromServer(query(ref, ...ordering, orderBy(documentId(), 'asc'), limit(20))),
    uid ? getDocFromServer(doc(ref, uid)) : Promise.resolve(null),
  ]);
  const result = { top: top.docs.map(item => ({ uid: item.id, ...item.data() })), own: own?.exists() ? { uid: own.id, ...own.data() } : null, fetchedAt: Date.now(), reads: top.size + (uid ? 1 : 0), cached: false };
  cache.delete(key); cache.set(key, result);
  while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
  return result;
}
export function clearLeaderboardCache() { cache.clear(); }
