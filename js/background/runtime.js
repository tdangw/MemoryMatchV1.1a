import { AMBIENT_LIGHT } from './budgets.js';
/** One app owner. The caller supplies scene preparation; no page/game imports. */
export function createBackgroundRuntime({ view, document: doc, meteor, report = console.warn }) {
  const query = view.matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new view.AbortController();
  const blockers = new Set();
  let state = 'STATIC', enabled = true, eligible = false, frozen = false;
  let current = null, scene = null, timer, frame, timerRole = null;
  let revision = 0, actorRevision = 0;
  let lastError = null;
  const limit = AMBIENT_LIGHT.handles; // No device-name promotion.

  function clearTimer() { view.clearTimeout(timer); timer = undefined; timerRole = null; }
  function clearFrame() { if (frame !== undefined) view.cancelAnimationFrame(frame); frame = undefined; }
  function stopMotion(preserveIdle = false) {
    actorRevision++;
    if (current && current.status === 'PREPARING') {
      current.id = ++revision; current.status = 'WAITING'; current.abort.abort(); current.abort = new view.AbortController();
    }
    if (!preserveIdle || timerRole !== 'IDLE') clearTimer();
    clearFrame(); meteor.cancel();
    if (scene) { const previous = scene; scene = null; previous.dispose(); }
  }
  function baseAllowed() { return state !== 'DISPOSED' && enabled && !query.matches; }
  function suspended() {
    return doc.hidden || frozen || blockers.size || current && (current.paused || !current.scope.active || current.root.hidden
      || current.scope.startup && current.scope.startup.status !== 'ready');
  }
  function meteorAllowed() {
    return baseAllowed() && eligible && !suspended() && (!current || current.meteorsVisible !== false);
  }
  function schedule() {
    if (timerRole === 'IDLE') return;
    clearTimer();
    const handles = scene ? scene.diagnostics().handles : 0;
    if (meteorAllowed() && handles <= limit - 2) { timerRole = 'METEOR'; timer = view.setTimeout(tick, 3500 + Math.random() * 3500); }
  }
  function tick() {
    timer = undefined; timerRole = null;
    if (!meteorAllowed()) return;
    const handles = scene ? scene.diagnostics().handles : 0;
    if (handles + meteor.diagnostics().active < limit) meteor.spawn();
    schedule();
  }
  function fail(request, error) {
    if (current !== request || request.abort.signal.aborted || state === 'DISPOSED') return;
    request.status = 'FAILED'; lastError = error && error.message ? `${error.name}: ${error.message}` : String(error);
    report('Ambient background kept static', lastError);
    reconcile();
  }
  function prepare(request) {
    request.status = 'PREPARING'; state = 'PREPARING';
    const identity = request.id, abort = request.abort;
    // A returned prepared factory must not create DOM before the owner check.
    void Promise.resolve().then(() => {
      if (current !== request || request.id !== identity || abort.signal.aborted || !request.scope.active) return null;
      if (!baseAllowed() || suspended()) { request.status = 'WAITING'; return null; }
      return request.prepare(abort.signal);
    }).then(factory => {
      if (current !== request || request.id !== identity || request.abort.signal.aborted || !request.scope.active || state === 'DISPOSED') return;
      if (request.status === 'WAITING') return;
      if (typeof factory !== 'function') throw new Error('Ambient source unavailable');
      request.factory = factory; request.status = 'READY'; reconcile();
    }).catch(error => { if (request.id === identity && !abort.signal.aborted) fail(request, error); });
  }
  function reconcile() {
    if (state === 'DISPOSED') return;
    if (current && (!baseAllowed() || doc.hidden || frozen || current.root.hidden) && current.onInactive) current.onInactive();
    if (!meteorAllowed()) { meteor.cancel(); if (timerRole !== 'IDLE') clearTimer(); }
    if (!baseAllowed()) { stopMotion(); state = 'STATIC'; return; }
    if (suspended()) { stopMotion(true); state = 'SUSPENDED'; return; }
    if (current) {
      if (current.status === 'FAILED' || current.static) { stopMotion(); state = 'STATIC'; return; }
      if (current.status === 'WAITING') { prepare(current); return; }
      if (current.status === 'PREPARING') { state = 'PREPARING'; return; }
      if (!scene) {
        const owner = current;
        const actor = ++actorRevision;
        try { scene = current.factory({ requestRefresh: () => { if (current === owner && actor === actorRevision) requestRefresh(owner.scope); }, onError: error => { if (actor === actorRevision) fail(owner, error); }, maxHandles: limit }); }
        catch (error) { fail(current, error); return; }
      }
      const data = scene.diagnostics();
      if (![data.handles, data.nodes].every(value => Number.isInteger(value) && value >= 0)
        || data.handles > limit || data.nodes > AMBIENT_LIGHT.nodes) { fail(current, new Error('Ambient Light budget exceeded')); return; }
      if (data.handles + meteor.diagnostics().active > limit) meteor.cancel();
      state = data.handles ? 'RUNNING' : 'STATIC';
    } else state = meteorAllowed() ? 'RUNNING' : 'STATIC';
    meteor.setVisible(meteorAllowed()); schedule();
  }
  function requestRefresh(scope) {
    if (state === 'DISPOSED' || scope && (!current || current.scope !== scope)) return;
    if (!baseAllowed() || suspended() || !scene) { reconcile(); return; }
    if (frame !== undefined) return;
    frame = view.requestAnimationFrame(() => {
      frame = undefined;
      if (!baseAllowed() || suspended()) { reconcile(); return; }
      if (scene) {
        // A new layout may use every slot. Release meteors before allocating
        // replacements so even the reconcile batch stays within Light.
        meteor.cancel();
        try { scene.refresh(); } catch (error) { fail(current, error); return; }
      }
      reconcile();
    });
  }
  function discard() {
    revision++;
    const previous = current; current = null;
    if (previous) {
      previous.abort.abort(); previous.factory = null;
      if (previous.release) previous.release.forget();
      if (previous.onDispose) previous.onDispose();
      previous.onInactive = previous.onDispose = previous.release = previous.prepare = previous.root = previous.scope = null;
    }
    stopMotion();
  }
  function mount(options) {
    if (state === 'DISPOSED') throw new Error('Initialize the background owner before mounting');
    if (!options.scope.active) throw new Error('Ambient scene requires an active owner');
    discard();
    lastError = null;
    const request = { ...options, id: revision, status: 'WAITING', paused: false, abort: new view.AbortController(), factory: null, release: null };
    current = request;
    const control = {
      refresh: () => { if (current === request) requestRefresh(); },
      setPaused(value) { if (current === request && request.paused !== Boolean(value)) { request.paused = Boolean(value); reconcile(); } },
      dispose() { if (current !== request) return; discard(); reconcile(); },
    };
    request.release = request.scope.own(control.dispose, 'cleanup');
    reconcile(); return control;
  }
  function suspend() {
    const token = {}; blockers.add(token); reconcile(); let released = false;
    return () => { if (released) return; released = true; blockers.delete(token); reconcile(); };
  }
  const options = { signal: listeners.signal };
  doc.addEventListener('visibilitychange', reconcile, options);
  query.addEventListener('change', reconcile, options);
  view.addEventListener('resize', () => requestRefresh(), options);
  if (view.visualViewport) {
    view.visualViewport.addEventListener('resize', () => requestRefresh(), options);
    view.visualViewport.addEventListener('scroll', () => requestRefresh(), options);
  }
  view.addEventListener('pagehide', () => { frozen = true; reconcile(); }, options);
  doc.addEventListener('freeze', () => { frozen = true; reconcile(); }, options);
  view.addEventListener('pageshow', () => { frozen = false; reconcile(); }, options);
  doc.addEventListener('resume', () => { frozen = false; reconcile(); }, options);
  return {
    mount, suspend, refresh: requestRefresh,
    idle(callback, delay) {
      clearTimer();
      timerRole = 'IDLE';
      const handle = view.setTimeout(() => { timer = undefined; timerRole = null; callback(); }, delay); timer = handle;
      return () => { if (timer === handle) clearTimer(); };
    },
    setEnabled(value) { enabled = Boolean(value); reconcile(); },
    setMeteorEligible(value) { eligible = Boolean(value); reconcile(); },
    meteorDiagnostics() { return { ...meteor.diagnostics(), timers: timer === undefined ? 0 : 1, eligible: Boolean(meteorAllowed()) }; },
    diagnostics() {
      const data = scene ? scene.diagnostics() : { nodes: 0, handles: 0, observers: 0 }, meteors = meteor.diagnostics();
      return { ...data, state, quality: 'light', scenes: scene && data.handles ? 1 : 0, sceneInstances: scene ? 1 : 0, scene: current ? current.kind : null,
        sceneHandles: data.handles, handles: data.handles + meteors.active, timers: timer === undefined ? 0 : 1,
        listeners: (state === 'DISPOSED' ? 0 : view.visualViewport ? 9 : 7) + (current && current.bindingListeners || 0),
        pendingFrames: frame === undefined ? 0 : 1, blockers: blockers.size, preparing: current?.status === 'PREPARING' ? 1 : 0,
        revision, lastError, meteor: meteors };
    },
    dispose() { if (state === 'DISPOSED') return; discard(); state = 'DISPOSED'; blockers.clear(); listeners.abort(); },
  };
}
