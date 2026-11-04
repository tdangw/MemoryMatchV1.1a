import { loadProfileOwner, loadSyncMetadata, updateSyncMetadata, updateSyncMetadataPair } from './persistence.js';
import { setRankingOwner } from './rankingOwner.js';
import { subscribeToPlaySegments, getActivePlayMetrics } from './playMetrics.js';
import { normalizeProfileStats, profileDisplayTotal, adoptProfileStats } from './profileStatsModel.js';
import { createGameShellLifecycle } from './gameShell/gameShellLifecycle.js';
import { getFirebaseEnvironment } from './firebaseEnvironment.js';
import { getFirebaseBackend } from './firebaseBackend.js';
let instance = null;
export function getProfileStatsService() { return instance; }
export async function initializeProfileStatsService() {
  if (instance) return instance;
  const owner = await loadProfileOwner();
  if (!owner) return null;
  setRankingOwner(owner);
  const scope = createGameShellLifecycle(); const listeners = new Set();
  const pending = new Map();
  let account = null; let identity = null; let local = null; let generation = 0;
  let draining = null; let syncing = null; let scheduled = null; let backend = null;
  let phase = 'ready';
  let boundKey = null;
  const localKey = `profileStats:profile:${owner.id}`;
  const keyFor = identity => identity?.uid ? `profileStats:${identity.environment}:uid:${identity.uid}` : localKey;
  const keyForSegment = segment => segment.owner?.uid ? `profileStats:${getFirebaseEnvironment()}:uid:${segment.owner.uid}`
    : `profileStats:profile:${segment.owner?.profileId || owner.id}`;
  function notify() { for (const listener of listeners) listener(service.getState()); }
  function failure(error) { phase = 'error'; console.warn('Private profile statistics unavailable', error.code || error.name, error.message); notify(); }
  async function readLocal(key) { return normalizeProfileStats(await loadSyncMetadata(key)); }
  async function refresh(id = ++generation) {
    const key = keyFor(identity);
    const data = await updateSyncMetadata(key, value => { const record = normalizeProfileStats(value); return key === localKey && !record.profileCreatedAt && owner.createdAt ? { ...record, profileCreatedAt: owner.createdAt } : record; });
    if (!scope.active || id !== generation) return;
    local = data; phase = 'ready'; notify();
  }
  function drain() {
    if (draining) return draining;
    let succeeded = false;
    draining = (async () => {
      for (const [key, amount] of pending) {
        let saved; let target;
        for (let attempt = 0; attempt < 2; attempt++) {
          const original = key.startsWith('profileStats:profile:') ? await loadSyncMetadata(key) : null;
          target = original?.adoptedUid ? `profileStats:${original.adoptedEnvironment}:uid:${original.adoptedUid}` : key;
          try {
            saved = await updateSyncMetadata(target, value => {
              const record = normalizeProfileStats(value);
              if (target === key && record.adoptedUid) throw Object.assign(new Error('Local profile has been linked'), { code: 'stats-owner-moved' });
              const totalMs = record.totalMs + amount;
              if (!Number.isSafeInteger(totalMs)) throw new Error('Play time capacity reached');
              return { ...record, totalMs };
            });
            break;
          } catch (error) { if (error.code !== 'stats-owner-moved' || attempt === 1) throw error; }
        }
        const remainder = pending.get(key) - amount;
        if (remainder) pending.set(key, remainder); else pending.delete(key);
        if (target === keyFor(identity)) { local = saved; phase = 'ready'; notify(); }
      }
      succeeded = true;
    })().catch(failure).finally(() => { draining = null; if (succeeded && pending.size && scope.active) void drain().then(schedule); });
    return draining;
  }
  function schedule() {
    if (scheduled || !identity || !scope.active) return;
    scheduled = scope.timeout(() => { scheduled = null; void service.syncNow(); }, 15000);
  }
  async function syncNow() {
    if (syncing) return syncing;
    const callGeneration = generation;
    syncing = (async () => {
      await drain();
      if (generation !== callGeneration) return false;
      const current = identity; const id = generation;
      if (!current || !backend || !navigator.onLine || !scope.active) return false;
      const key = keyFor(current); const snapshot = await readLocal(key);
      const isCurrent = () => scope.active && generation === id && identity?.uid === current.uid && backend.auth.currentUser?.uid === current.uid;
      const { publishProfileCounter } = await import('./profileStatsStore.js');
      const remote = await publishProfileCounter({ database: backend.database, environment: current.environment, uid: current.uid, local: snapshot, isCurrent });
      if (!isCurrent()) return false;
      const saved = await updateSyncMetadata(key, value => { const record = normalizeProfileStats(value); return { ...record, acknowledgedMs: Math.max(record.acknowledgedMs, Math.min(record.totalMs, remote.counters[snapshot.counterId] || 0)), remoteTotalMs: Math.max(record.remoteTotalMs, remote.totalPlayMs), trackedSince: Math.min(record.trackedSince, remote.trackedSince) }; });
      if (!isCurrent()) return false;
      local = saved; phase = 'ready'; notify(); return true;
    })().catch(error => { if (scope.active && generation === callGeneration) failure(error); return false; }).finally(() => { syncing = null; });
    return syncing;
  }
  async function bindIdentity() {
    const next = account.getIdentity();
    if (!next) { if (identity) { identity = null; local = null; boundKey = null; generation++; notify(); } return false; }
    if (next.uid === identity?.uid && next.profileId === identity?.profileId && boundKey === `${next.uid}:${next.profileId}`) return false;
    identity = next;
    boundKey = null; local = null; const id = ++generation; notify();
    await drain();
    if (!scope.active || id !== generation) return;
    if (next.profileId === owner.id && next.firstUid === next.uid) {
      const orphan = await loadSyncMetadata(localKey);
      if (orphan && !orphan.adoptedUid) {
        const adoptedKey = `profileStats:${next.environment}:uid:${next.uid}`;
        await updateSyncMetadataPair([localKey, adoptedKey], ([source, value]) => adoptProfileStats(source, value, next.uid, next.environment), () => scope.active && generation === id && identity?.uid === next.uid);
      }
    }
    if (!scope.active || id !== generation) return;
    await refresh(id);
    if (!scope.active || generation !== id) return false;
    if (syncing) await syncing;
    if (scope.active && generation === id && identity?.uid === next.uid && identity.profileId === next.profileId) { boundKey = `${next.uid}:${next.profileId}`; return true; }
    return false;
  }
  const service = {
    getState: () => ({ phase, joinedAt: identity?.createdAt || local?.profileCreatedAt || null, trackedSince: local?.trackedSince || null, totalPlayMs: local ? profileDisplayTotal(local) : null, onlineAccount: Boolean(identity) }),
    subscribe(listener) { listeners.add(listener); listener(service.getState()); return () => listeners.delete(listener); },
    async bindAccount(value) { account = value; backend = await getFirebaseBackend(); if (!scope.active) return; scope.own(account.subscribe(() => { const task = bindIdentity(); const id = generation; void task.then(changed => changed ? syncNow() : false).catch(error => { if (scope.active && generation === id) failure(error); }); }), 'listener'); },
    async syncNow() { const uid = identity?.uid; let id = generation; try { if (account && identity && boundKey !== `${identity.uid}:${identity.profileId}`) { const binding = bindIdentity(); id = generation; await binding; } return await syncNow(); } catch (error) { if (scope.active && generation === id && identity?.uid === uid) failure(error); return false; } },
    flushLocal: drain,
    dispose() { scope.dispose(); listeners.clear(); if (instance === service) instance = null; },
  };
  instance = service;
  await refresh().catch(failure);
  scope.own(subscribeToPlaySegments(segment => {
    const amount = Math.round(segment.durationMs);
    if (!scope.active || amount <= 0 || !segment.owner) return;
    const key = keyForSegment(segment);
    pending.set(key, (pending.get(key) || 0) + amount);
    void drain().then(schedule);
  }), 'listener');
  scope.listen(window, 'online', () => { void service.syncNow(); });
  scope.listen(document, 'visibilitychange', () => { if (!document.hidden) void service.syncNow(); });
  scope.listen(window, 'pagehide', () => { getActivePlayMetrics()?.clock.checkpoint(); void drain(); });
  return service;
}
