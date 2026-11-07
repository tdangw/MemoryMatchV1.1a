import { isAppActive } from './appVisibility.js';
/** Event-driven active-time measurement. Countdown bonuses and freezes never change this clock. */
import { getRankingOwner } from './rankingOwner.js';
import { clearShellInterval } from './gameShell/gameShellLifecycle.js';
export function createActivePlayClock({ elapsedMs = 0, now = () => performance.now(), onSegment = () => {} } = {}) {
  let elapsed = Number.isSafeInteger(elapsedMs) && elapsedMs >= 0 ? elapsedMs : 0;
  let startedAt = null;
  const pauses = new Set(["startup"]);
  let stopped = false;
  function checkpoint() {
    if (startedAt !== null) {
      const at = now(); const segment = Math.max(0, at - startedAt);
      elapsed += segment; startedAt = at;
      if (segment > 0) onSegment(segment);
    }
  }
  function pause(reason) {
    checkpoint(); startedAt = null;
    pauses.add(reason);
  }
  function resume(reason) {
    pauses.delete(reason);
    if (!stopped && !pauses.size && startedAt === null) startedAt = now();
  }
  function durationMs() { return Math.round(elapsed + (startedAt === null ? 0 : Math.max(0, now() - startedAt))); }
  function finish() { const duration = durationMs(); stopped = true; pause("finished"); return duration; }
  return Object.freeze({ pause, resume, durationMs, finish, checkpoint, get finished() { return stopped; } });
}

let activeMetrics = null;
let lastMetrics = null;
const segmentListeners = new Set();
const pendingSegments = [];
export function subscribeToPlaySegments(listener) {
  segmentListeners.add(listener);
  const buffered = pendingSegments.splice(0);
  for (const segment of buffered) {
    try { listener(segment); }
    catch (error) { console.warn('Buffered play telemetry unavailable', error.name); }
  }
  return () => segmentListeners.delete(listener);
}
export function beginPlayMetrics(scope, identity, metadata = null) {
  const record = {
    ...identity,
    owner: metadata?.owner || getRankingOwner(),
    clock: createActivePlayClock({ elapsedMs: metadata?.elapsedMs || 0, onSegment: durationMs => {
      const segment = { ...identity, owner: record.owner, durationMs };
      if (!segmentListeners.size) {
        pendingSegments.push(segment);
        if (pendingSegments.length > 32) pendingSegments.shift();
      }
      for (const listener of segmentListeners) {
        try { listener(segment); }
        catch (error) { console.warn('Play telemetry unavailable', error.name); }
      }
    } }),
    rankable: metadata === null || (metadata?.version === 1 && metadata.rankable !== false),
  };
  activeMetrics = record;
  function reconcileVisibility() {
    if (!isAppActive()) {
      record.clock.pause("hidden");
      clearShellInterval(record.checkpointTimer); record.checkpointTimer = null;
    } else {
      record.clock.resume("hidden");
      if (!record.clock.finished && record.checkpointTimer == null) record.checkpointTimer = scope.interval(() => record.clock.checkpoint(), 30000);
    }
  }
  scope.listen(document, "appvisibilitychange", reconcileVisibility);
  reconcileVisibility();
  scope.own(() => {
    record.clock.finish();
    if (activeMetrics === record) { lastMetrics = record; activeMetrics = null; }
  }, "cleanup");
  return record;
}
export function getActivePlayMetrics() { return activeMetrics; }
export function snapshotPlayMetrics(identity) {
  const record = activeMetrics || lastMetrics;
  if (!record || (identity && ["gameId", "mode", "level"].some(key => record[key] !== identity[key]))) return null;
  return { version: 1, elapsedMs: record.clock.durationMs(), rankable: record.rankable, ...(record.owner ? { owner: record.owner } : {}) };
}
export function pausePlayMetrics(reason) { activeMetrics?.clock.pause(reason); }
export function resumePlayMetrics(reason) { activeMetrics?.clock.resume(reason); }
export function finishPlayMetrics() {
  if (!activeMetrics) return null;
  clearShellInterval(activeMetrics.checkpointTimer);
  const durationMs = activeMetrics.clock.finish();
  return activeMetrics.rankable && durationMs > 0 ? durationMs : null;
}
export function normalizePlayMetrics(value) {
  return value?.version === 1 && Number.isSafeInteger(value.elapsedMs) && value.elapsedMs >= 0
    ? { version: 1, elapsedMs: value.elapsedMs, rankable: value.rankable !== false, ...(typeof value.owner?.profileId === 'string' && (value.owner.uid === null || typeof value.owner.uid === 'string') ? { owner: { ...value.owner } } : {}) } : null;
}
