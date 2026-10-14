export const PROFILE_STATS_VERSION = 1;
export const MAX_PROFILE_COUNTERS = 128;
export function normalizeProfileStats(value, now = Date.now()) {
  if (value == null) return { version: 1, counterId: crypto.randomUUID(), totalMs: 0, acknowledgedMs: 0, remoteTotalMs: 0, trackedSince: now, profileCreatedAt: null };
  if (value.version !== 1 || !/^[a-f0-9-]{36}$/.test(value.counterId) || !['totalMs', 'acknowledgedMs', 'remoteTotalMs', 'trackedSince'].every(key => Number.isSafeInteger(value[key]) && value[key] >= 0) || value.profileCreatedAt !== null && (!Number.isSafeInteger(value.profileCreatedAt) || value.profileCreatedAt <= 0) || value.acknowledgedMs > value.totalMs) throw new Error('Invalid private play statistics');
  if (value.trackedSince <= 0 || value.trackedSince > 8640000000000000 || value.profileCreatedAt > 8640000000000000) throw new Error('Invalid profile date');
  if (value.adoptedUid !== undefined && (typeof value.adoptedUid !== 'string' || !value.adoptedUid.length || !['production', 'beta', 'test', 'local'].includes(value.adoptedEnvironment))) throw new Error('Invalid linked profile owner');
  return { ...value };
}
export function adoptProfileStats(source, target, uid, environment) {
  const original = normalizeProfileStats(source); const record = normalizeProfileStats(target);
  if (original.adoptedUid) return [original, record];
  const totalMs = record.totalMs + original.totalMs;
  if (!Number.isSafeInteger(totalMs)) throw new Error('Play time capacity reached');
  return [{ ...original, adoptedUid: uid, adoptedEnvironment: environment }, { ...record, totalMs, trackedSince: Math.min(record.trackedSince, original.trackedSince) }];
}
export function mergeProfileCounter(previous, counterId, totalMs, trackedSince) {
  if (!/^[a-f0-9-]{36}$/.test(counterId) || !Number.isSafeInteger(totalMs) || totalMs < 0 || !Number.isSafeInteger(trackedSince) || trackedSince <= 0) throw new Error('Invalid play counter');
  const counters = { ...(previous?.counters || {}) };
  if (!(counterId in counters) && Object.keys(counters).length >= MAX_PROFILE_COUNTERS) throw new Error('Profile counter capacity reached');
  const old = counters[counterId] || 0;
  counters[counterId] = Math.max(old, totalMs);
  const totalPlayMs = (previous?.totalPlayMs || 0) + counters[counterId] - old;
  if (!Number.isSafeInteger(totalPlayMs)) throw new Error('Play time capacity reached');
  return { version: 1, counters, totalPlayMs, trackedSince: Math.min(previous?.trackedSince || trackedSince, trackedSince) };
}
export function profileDisplayTotal(local) { return local.remoteTotalMs + local.totalMs - local.acknowledgedMs; }
export function formatProfilePlaytime(ms) {
  const minutes = Math.floor(Math.max(0, ms) / 60000);
  return `${Math.floor(minutes / 60).toLocaleString('vi-VN')} giờ ${minutes % 60} phút`;
}
