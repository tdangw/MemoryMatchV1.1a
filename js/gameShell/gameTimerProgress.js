// One cadence and lifecycle contract for HUD-only progress. Game controllers
// retain their business clock; this owner only samples elapsed display time.
export const HUD_PROGRESS_TICK_MS = 250;

export function createHudTimerScheduler({
  now = () => performance.now(),
  schedule = (callback) => globalThis.setTimeout(callback, HUD_PROGRESS_TICK_MS),
  cancel = globalThis.clearTimeout,
} = {}) {
  let handle = null;
  let active = false;
  let lastAt = 0;
  let onTick = null;
  const stop = () => {
    if (handle !== null) cancel(handle);
    handle = null;
    active = false;
  };
  const tick = () => {
    handle = null;
    if (!active || !onTick) return;
    const current = now();
    const elapsed = Math.max(0, current - lastAt);
    lastAt = current;
    if (onTick(elapsed) !== false && active) handle = schedule(tick);
  };
  return {
    start(callback) {
      stop();
      onTick = callback;
      active = true;
      lastAt = now();
      handle = schedule(tick);
    },
    rebase() { lastAt = now(); },
    pause() { stop(); },
    resume(callback = onTick) { if (callback) this.start(callback); },
    stop,
    get active() { return active; },
  };
}

// Compatibility exports remain while each game migrates its adapter to the
// scheduler above; they do not own state and are removed with that migration.
export function scheduleHudProgress(callback, { schedule = globalThis.setTimeout } = {}) {
  return schedule(callback, HUD_PROGRESS_TICK_MS);
}

export function cancelHudProgress(handle, { cancel = globalThis.clearTimeout } = {}) {
  if (handle !== null && handle !== undefined) cancel(handle);
}
