/** Event-driven active-time measurement. Countdown bonuses and freezes never change this clock. */
export function createActivePlayClock({ elapsedMs = 0, now = () => performance.now() } = {}) {
  let elapsed = Number.isSafeInteger(elapsedMs) && elapsedMs >= 0 ? elapsedMs : 0;
  let startedAt = null;
  const pauses = new Set(["startup"]);
  let stopped = false;
  function pause(reason) {
    if (startedAt !== null) { elapsed += Math.max(0, now() - startedAt); startedAt = null; }
    pauses.add(reason);
  }
  function resume(reason) {
    pauses.delete(reason);
    if (!stopped && !pauses.size && startedAt === null) startedAt = now();
  }
  function durationMs() { return Math.round(elapsed + (startedAt === null ? 0 : Math.max(0, now() - startedAt))); }
  function finish() { const duration = durationMs(); stopped = true; pause("finished"); return duration; }
  return Object.freeze({ pause, resume, durationMs, finish });
}

let activeMetrics = null;
let lastMetrics = null;
export function beginPlayMetrics(scope, identity, metadata = null) {
  const record = {
    ...identity,
    clock: createActivePlayClock({ elapsedMs: metadata?.elapsedMs || 0 }),
    rankable: metadata === null || (metadata?.version === 1 && metadata.rankable !== false),
  };
  activeMetrics = record;
  scope.listen(document, "visibilitychange", () => {
    if (document.hidden) record.clock.pause("hidden");
    else record.clock.resume("hidden");
  });
  if (document.hidden) record.clock.pause("hidden");
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
  return { version: 1, elapsedMs: record.clock.durationMs(), rankable: record.rankable };
}
export function pausePlayMetrics(reason) { activeMetrics?.clock.pause(reason); }
export function resumePlayMetrics(reason) { activeMetrics?.clock.resume(reason); }
export function finishPlayMetrics() {
  if (!activeMetrics) return null;
  const durationMs = activeMetrics.clock.finish();
  return activeMetrics.rankable && durationMs > 0 ? durationMs : null;
}
export function normalizePlayMetrics(value) {
  return value?.version === 1 && Number.isSafeInteger(value.elapsedMs) && value.elapsedMs >= 0
    ? { version: 1, elapsedMs: value.elapsedMs, rankable: value.rankable !== false } : null;
}
