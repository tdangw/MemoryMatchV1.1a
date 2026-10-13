import { exportPersistentSnapshot, loadSyncMetadata, updateSyncMetadata, subscribeToLocalCommit } from './persistence.js';
import { collectRankingResults, rankingBoardId, comparePublicResults } from './rankingResult.js';
import { getFirebaseBackend } from './firebaseBackend.js';
import { getAccountService } from './accountService.js';
import { submitRankingResult } from './leaderboardStore.js';
import { createGameShellLifecycle } from './gameShell/gameShellLifecycle.js';
const QUEUE_LIMIT = 2000;
let instance = null;
export function initializeLeaderboardService() {
  if (instance) return instance;
  const scope = createGameShellLifecycle();
  let task = null;
  let timer = null;
  let scanning = Promise.resolve();
  let retries = 0;
  let message = 'Thành tích được gửi khi có kết nối.';
  let operations = null;
  let backend = null;
  let nextAllowedAt = 0;
  const key = owner => `ranking:${backend.environment}:${owner.uid ? `uid:${owner.uid}` : `profile:${owner.profileId}`}`;
  const ownerKey = result => `${result.owner.uid || result.owner.profileId}:${rankingBoardId(result)}`;
  const schedule = (delay = 0) => {
    if (!scope.active || timer !== null || retries >= 5) return;
    timer = scope.timeout(() => { timer = null; void service.flush(); }, Math.max(delay, nextAllowedAt - Date.now(), 0));
  };
  function recover() {
    scanning = scanning.catch(() => {}).then(async () => {
      if (!scope.active || !backend) return;
      const results = collectRankingResults(await exportPersistentSnapshot());
      const groups = new Map();
      for (const result of results) {
        const groupKey = key(result.owner);
        if (!groups.has(groupKey)) groups.set(groupKey, []);
        groups.get(groupKey).push(result);
      }
      for (const [groupKey, group] of groups) await updateSyncMetadata(groupKey, previous => {
        const next = previous || { queue: {}, receipts: {} };
        let size = Object.keys(next.queue).length;
        next.deferred = false;
        for (const result of group) {
          const id = ownerKey(result);
          if (next.receipts[id] === result.id) continue;
          if (!next.queue[id] && size >= QUEUE_LIMIT) { next.deferred = true; continue; }
          if (!next.queue[id] || comparePublicResults(result, next.queue[id], result.kind) < 0) {
            if (!next.queue[id]) size++;
            next.queue[id] = result;
          }
        }
        return next;
      }, () => scope.active);
      schedule();
    }).catch(error => { message = `Hàng đợi chưa cập nhật được (${error.code || error.name}); kỷ lục vẫn ở bản máy.`; });
    return scanning;
  }
  async function flush() {
    if (task) return task;
    if (Date.now() < nextAllowedAt) { schedule(nextAllowedAt - Date.now()); return false; }
    const identity = getAccountService()?.getIdentity();
    if (!backend || !identity || getAccountService().getState().conflict || !navigator.onLine) return false;
    const current = () => scope.active && getAccountService()?.getIdentity()?.uid === identity.uid && backend.auth.currentUser?.uid === identity.uid;
    task = (async () => {
      await scanning;
      const groupKeys = [key({ uid: identity.uid })];
      if (identity.firstUid === identity.uid) groupKeys.push(key({ profileId: identity.profileId, uid: null }));
      let submitted = 0;
      for (const groupKey of groupKeys) {
      const pending = await loadSyncMetadata(groupKey);
      for (const [id, result] of Object.entries(pending?.queue || {})) {
        if (!current()) return false;
        if (result.owner.uid ? result.owner.uid !== identity.uid : result.owner.profileId !== identity.profileId || identity.firstUid !== identity.uid) continue;
        // Bind a pre-login result once, before making its first network request.
        const bound = { ...result, owner: { ...result.owner, uid: identity.uid } };
        await updateSyncMetadata(groupKey, previous => {
          if (previous.queue[id]?.id === result.id) previous.queue[id] = bound;
          return previous;
        }, current);
        if (!current()) return false;
        operations = await submitRankingResult({ database: backend.database, environment: backend.environment, uid: identity.uid, playerName: identity.playerName, result: bound, isCurrent: current });
        if (!current()) return false;
        await updateSyncMetadata(groupKey, previous => {
          previous.receipts[id] = result.id;
          if (previous.queue[id]?.id === result.id) delete previous.queue[id];
          return previous;
        }, current);
        submitted++;
        if (submitted >= 20) { nextAllowedAt = Date.now() + 15000; message = 'Đang gửi lần lượt kỷ lục đã lưu trên máy.'; schedule(15000); return true; }
      }
      if (pending?.deferred) { await recover(); schedule(15000); }
      }
      retries = 0; message = 'Kỷ lục đã đồng bộ.'; return true;
    })().catch(error => {
      if (current()) { retries++; message = `Chưa gửi được (${error.code || error.name}); sẽ gửi lại khi có mạng.`; schedule(Math.min(900000, 15000 * 2 ** retries)); }
      return false;
    }).finally(() => { task = null; });
    return task;
  }
  const service = { recover, flush, getState: () => ({ message, operations }), dispose() { scope.dispose(); if (instance === service) instance = null; } };
  instance = service;
  service.ready = getFirebaseBackend().then(value => {
    backend = value;
    if (!backend || !scope.active) return;
    scope.own(subscribeToLocalCommit(() => { void recover(); }), 'listener');
    scope.own(getAccountService().subscribe(state => { if (state.bound && !state.conflict) schedule(); }), 'listener');
    scope.listen(window, 'online', () => { retries = 0; schedule(); });
    scope.listen(window, 'pagehide', event => { if (!event.persisted) service.dispose(); });
    return recover();
  });
  return service;
}
export function getLeaderboardService() { return instance; }
