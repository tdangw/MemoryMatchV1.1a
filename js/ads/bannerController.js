// One serialized owner for the native banner, independent of game rules/DOM.
export function createBannerController({ service, render, report = console.warn }) {
  let desired = null, banner = null, revision = 0, handled = 0, blocked = -1;
  let disposed = false, task = null, phase = 'idle';

  function current(entry) { return banner === entry && !entry.invalidated && desired === entry.target && !disposed; }
  async function remove() {
    const entry = banner;
    entry.invalidated = true;
    render(entry.target, 0);
    if (entry.started) { await service.remove(); entry.started = false; }
    // Retain any failed handle for an explicit subsequent cleanup attempt.
    const results = await Promise.allSettled(entry.handles.map(handle => handle.remove()));
    entry.handles = entry.handles.filter((_, index) => results[index].status === 'rejected');
    if (entry.handles.length) throw new Error('AdMob listener cleanup incomplete');
    banner = null;
  }
  async function run() {
    while (handled !== revision) {
      handled = revision;
      const requested = handled;
      const target = disposed ? null : desired;
      if (banner && (banner.target !== target || banner.failed || banner.invalidated)) await remove();
      if (!target || blocked === requested || !service.supported) { phase = 'idle'; continue; }
      if (banner) continue;
      phase = 'preparing';
      const ready = await service.prepare();
      if (requested !== revision) continue;
      if (!ready) { phase = 'unavailable'; continue; }
      const entry = { target, handles: [], started: false, failed: false, invalidated: false };
      banner = entry;
      entry.handles.push(await service.listen('bannerAdSizeChanged', size => {
        if (!current(entry)) return;
        if (!Number.isFinite(size.height) || size.height < 0) { report('Invalid AdMob banner height', size); return; }
        render(entry.target, size.height);
        phase = size.height > 0 ? 'visible' : 'loading';
      }));
      entry.handles.push(await service.listen('bannerAdFailedToLoad', error => {
        if (!current(entry)) return;
        report('AdMob banner unavailable', error);
        render(entry.target, 0);
        entry.failed = true;
        blocked = ++revision;
        void kick();
      }));
      if (requested !== revision) continue;
      phase = 'loading';
      entry.started = true; // A rejected bridge call may still have created a view.
      try { await service.show(); }
      catch (error) {
        report('AdMob banner show unavailable', error);
        entry.failed = true;
        if (requested === revision) blocked = ++revision;
        else revision++;
      }
    }
  }
  function kick() {
    if (!task) task = run().catch(async error => {
      phase = 'error';
      if (banner) {
        banner.invalidated = true;
        try { await remove(); }
        catch (cleanupError) { report('AdMob banner cleanup requires retry', cleanupError); }
      }
      handled = revision; // Retry only on the next explicit event, never a spin loop.
      report('AdMob banner transition unavailable', error);
    }).finally(() => {
      task = null;
      if (handled !== revision) void kick();
    });
    return task;
  }
  return {
    setTarget(target) {
      if (disposed) return;
      if (desired && desired !== target) render(desired, 0);
      if (target && desired !== target) render(target, 0);
      desired = target;
      revision++;
      return kick();
    },
    refresh() {
      if (disposed) return;
      if (banner) banner.invalidated = true;
      revision++;
      return kick();
    },
    async idle() { while (task) await task; },
    async dispose() {
      disposed = true; desired = null; revision++;
      await kick();
    },
    diagnostics() { return { phase, bannerCount: banner ? 1 : 0, listenerCount: banner?.handles.length || 0, disposed }; },
  };
}
